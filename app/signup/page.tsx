'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  
  const [groupMode, setGroupMode] = useState<'personal' | 'create' | 'join'>('personal');
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false); // 이메일 발송 완료 여부
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!userName.trim()) {
      setError('사용자 이름을 입력해 주세요.');
      setLoading(false);
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    let createdOrgId: string | null = null;

    try {
      let targetOrgId: string | null = null;

      // 1. 그룹 생성 처리
      if (groupMode === 'create') {
        if (!orgName.trim()) throw new Error('회사/그룹명을 입력해 주세요.');
        
        const generatedCode = 'D2L-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({ org_name: orgName, org_code: generatedCode })
          .select()
          .single();

        if (orgError) throw orgError;
        targetOrgId = orgData.id;
        createdOrgId = orgData.id; // 가입 실패 시 롤백용
      } 
      // 2. 그룹 참가 처리
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

      // 3. Supabase Auth 회원가입 진행 (user_metadata 전달)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
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
        // 가입 실패 시 방금 생성한 그룹이 있다면 롤백 삭제
        if (createdOrgId) {
          await supabase.from('organizations').delete().eq('id', createdOrgId);
        }
        throw authError;
      }

      // 가입 성공 -> 메일 발송 안내 모드로 전환
      setIsSent(true);

    // catch 구문 내부
    } catch (err: any) {
      console.error('상세 에러 내용:', {
        message: err.message,
        status: err.status,
        name: err.name,
        raw: err
      });
      setError(err.message || JSON.stringify(err));
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
          /* 이메일 발송 완료 상태 화면 */
          <div className="p-6 bg-indigo-950/60 border border-indigo-500/50 rounded-xl text-center space-y-4">
            <div className="text-4xl">📩</div>
            <h3 className="text-lg font-bold text-indigo-200">인증 이메일이 발송되었습니다!</h3>
            <p className="text-sm text-indigo-300/80 leading-relaxed">
              <span className="font-semibold text-white">{email}</span> 주소로 확인 링크를 보내드렸습니다.<br />
              이메일함에서 인증 링크를 클릭하신 후 로그인해 주세요.
            </p>
            <div className="pt-2 text-xs text-slate-400">
              * 메일이 오지 않았다면 스팸 메일함을 확인해 보세요.
            </div>
            <Link
              href="/login"
              className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg transition mt-4"
            >
              로그인 페이지로 이동
            </Link>
          </div>
        ) : (
          /* 회원가입 폼 */
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
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

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