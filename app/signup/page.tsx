'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userName, setUserName] = useState('');
  
  const [groupMode, setGroupMode] = useState<'personal' | 'create' | 'join'>('personal');
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const supabase = createClient();

  // 비밀번호 유효성 검사 (영문 + 숫자 포함, 최소 8자)
  const validatePassword = (pwd: string) => {
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const isLongEnough = pwd.length >= 8;

    if (!isLongEnough) return '비밀번호는 최소 8자 이상이어야 합니다.';
    if (!hasLetter || !hasNumber) return '비밀번호는 영문과 숫자를 모두 포함해야 합니다.';
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. 사용자 이름 검사
    if (!userName.trim()) {
      setError('사용자 이름을 입력해 주세요.');
      setLoading(false);
      return;
    }

    // 2. 비밀번호 규칙 검사
    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      setLoading(false);
      return;
    }

    // 3. 비밀번호 확인 일치 여부 검사
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다. 다시 확인해 주세요.');
      setLoading(false);
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    let createdOrgId: string | null = null;

    try {
      // 4. 이메일 중복 체크 (profiles 테이블 조회)
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (existingUser) {
        throw new Error('이미 등록된 이메일(아이디)입니다. 로그인하거나 다른 이메일을 사용해 주세요.');
      }

      let targetOrgId: string | null = null;

      // 5-A. 신규 그룹 생성 모드일 때 (기업명 중복 체크)
      if (groupMode === 'create') {
        const trimmedOrgName = orgName.trim();
        if (!trimmedOrgName) throw new Error('회사/그룹명을 입력해 주세요.');

        // 동일한 기업명이 등록되어 있는지 확인
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('org_name', trimmedOrgName)
          .maybeSingle();

        if (existingOrg) {
          throw new Error('이미 존재하거나 가입되어 있는 기업명입니다. 다른 이름이나 [그룹 참가]를 선택해 주세요.');
        }

        // 중복이 없으면 신규 그룹 생성 (코드 생성)
        const generatedCode = 'D2L-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({ org_name: trimmedOrgName, org_code: generatedCode })
          .select()
          .single();

        if (orgError) {
          throw new Error(`그룹 생성 실패: ${orgError.message}`);
        }
        targetOrgId = orgData.id;
        createdOrgId = orgData.id; // 가입 실패 시 롤백용
      } 
      // 5-B. 기존 그룹 참가 모드일 때
      else if (groupMode === 'join') {
        if (!orgCode.trim()) throw new Error('그룹코드를 입력해 주세요.');

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('org_code', orgCode.trim().toUpperCase())
          .single();

        if (orgError || !orgData) throw new Error('존재하지 않는 그룹코드입니다.');
        targetOrgId = orgData.id;
      }

     // 6. Supabase Auth 가입 진행
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            user_name: userName.trim(),
            org_id: targetOrgId,
            role: groupMode === 'create' ? 'owner' : 'member',
          },
        },
      });

      if (authError) {
        // 회원가입 실패 시 방금 생성한 그룹이 있다면 삭제(롤백)
        if (createdOrgId) {
          await supabase.from('organizations').delete().eq('id', createdOrgId);
        }
        throw authError;
      }

      // ★ [핵심 해결 로직] 이미 등록된 이메일인 경우 identities가 [] (빈 배열)로 들어옵니다.
      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        if (createdOrgId) {
          await supabase.from('organizations').delete().eq('id', createdOrgId);
        }
        throw new Error('이미 등록된 이메일(아이디)입니다. 로그인하거나 다른 이메일을 사용해 주세요.');
      }

      setIsSent(true);

      if (authError) {
        // 회원가입 실패 시 방금 생성한 그룹이 있다면 삭제(롤백)
        if (createdOrgId) {
          await supabase.from('organizations').delete().eq('id', createdOrgId);
        }
        throw authError;
      }

      setIsSent(true);

    } catch (err: any) {
      console.error('회원가입 에러 상세:', err);
      setError(err.message || '가입 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 text-slate-100 py-12">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">회원가입</h2>
        <p className="text-slate-400 text-center mb-6">DOT2LINE 통합 물류 시스템</p>

        {isSent ? (
          <div className="p-6 bg-indigo-950/60 border border-indigo-500/50 rounded-xl text-center space-y-4">
            <div className="text-4xl">📩</div>
            <h3 className="text-lg font-bold text-indigo-200">인증 이메일이 발송되었습니다!</h3>
            <p className="text-sm text-indigo-300/80 leading-relaxed">
              <span className="font-semibold text-white">{email}</span> 주소로 확인 링크를 보내드렸습니다.<br />
              이메일함에서 인증 링크를 클릭하신 후 로그인해 주세요.
            </p>
            <Link
              href="/login"
              className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg transition mt-4"
            >
              로그인 페이지로 이동
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* 계정 유형 선택 */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">계정 유형 선택</label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-800 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setGroupMode('personal')}
                  className={`py-2 rounded-md transition ${groupMode === 'personal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  개인
                </button>
                <button
                  type="button"
                  onClick={() => setGroupMode('create')}
                  className={`py-2 rounded-md transition ${groupMode === 'create' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  그룹 생성
                </button>
                <button
                  type="button"
                  onClick={() => setGroupMode('join')}
                  className={`py-2 rounded-md transition ${groupMode === 'join' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  그룹 참가
                </button>
              </div>
            </div>

            {/* 그룹 생성 선택 시 */}
            {groupMode === 'create' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">신규 회사/그룹명</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-indigo-500 text-sm"
                  placeholder="예: (주)라인물류"
                  required
                />
              </div>
            )}

            {/* 그룹 참가 선택 시 */}
            {groupMode === 'join' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">그룹코드 입력</label>
                <input
                  type="text"
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white uppercase outline-none focus:border-indigo-500 text-sm font-mono"
                  placeholder="예: D2L-83A1"
                  required
                />
              </div>
            )}

            {/* 사용자 이름 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">사용자 이름</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-indigo-500 text-sm"
                placeholder="홍길동"
                required
              />
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-indigo-500 text-sm"
                placeholder="name@company.com"
                required
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-indigo-500 text-sm"
                placeholder="••••••••"
                required
              />
              <p className="mt-1 text-xs text-slate-500">영문, 숫자를 포함하여 8자 이상 입력하세요.</p>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-indigo-500 text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-950/50 p-3 rounded-lg border border-red-800">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition disabled:opacity-50 mt-2"
            >
              {loading ? '처리 중...' : '계정 만들기'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-slate-400 text-sm">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-indigo-400 hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}