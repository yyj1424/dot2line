'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 그룹 관련 상태 (personal: 개인, create: 그룹 생성, join: 기존 그룹 참여)
  const [groupMode, setGroupMode] = useState<'personal' | 'create' | 'join'>('personal');
  const [orgName, setOrgName] = useState(''); // 신규 그룹명
  const [orgCode, setOrgCode] = useState(''); // 기존 그룹코드 입력

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    try {
      let targetOrgId: string | null = null;

      // 1. [신규 그룹 생성] 모드일 경우
      if (groupMode === 'create') {
        if (!orgName.trim()) throw new Error('회사/그룹명을 입력해 주세요.');
        
        // 6자리 난수 그룹코드 생성 (예: D2L-83A1)
        const generatedCode = 'D2L-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({ org_name: orgName, org_code: generatedCode })
          .select()
          .single();

        if (orgError) throw orgError;
        targetOrgId = orgData.id;
      } 
      // 2. [기존 그룹 참여] 모드일 경우
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

      // 3. Supabase Auth 회원가입 진행 (user_metadata에 org_id 함께 전달)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            org_id: targetOrgId,
            role: groupMode === 'create' ? 'owner' : 'member',
          },
        },
      });

      // handleSignUp 내부
      if (authError) {
        setError(authError.message);
        setLoading(false);
      } else {
        setLoading(false);
        // 단순히 완료되었다는 문구 대신, 사용자가 해야 할 다음 행동(Action Item)을 명확히 전달
        setMessage(`[${email}] 주소로 인증 메일을 발송했습니다.\n이메일함에서 인증 링크를 클릭하셔야 로그인이 완료됩니다.`);
      }

      // 4. profiles 테이블에 프로필 레코드 생성
      if (authData.user) {
        await supabase.from('profiles').insert({
          id: authData.user.id,
          email: authData.user.email,
          org_id: targetOrgId,
          role: groupMode === 'create' ? 'owner' : 'member',
        });
      }

      setMessage('회원가입 요청이 완료되었습니다.');
    } catch (err: any) {
      setError(err.message || '가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 text-slate-100 py-12">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">회원가입</h2>
        <p className="text-slate-400 text-center mb-6">DOT2LINE 통합 물류 시스템</p>

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* 가입 유형 선택 */}
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

          {/* 기본 계정 정보 */}
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
          {/* 가입 완료 안내 카드 */}
          {message && (
            <div className="p-4 bg-indigo-950/60 border border-indigo-500/50 rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">📩</span>
                <div>
                  <h4 className="text-sm font-bold text-indigo-200">인증 이메일이 발송되었습니다</h4>
                  <p className="text-xs text-indigo-300/80 mt-1 whitespace-pre-line leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>
              
              <div className="pt-2 border-t border-indigo-900/60 flex justify-between items-center text-xs">
                <span className="text-slate-400">메일이 오지 않았나요?</span>
                <span className="text-slate-500">스팸함 확인 또는 잠시 후 재시도</span>
              </div>

              <Link
                href="/login"
                className="block w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-center text-xs rounded-lg transition"
              >
                인증 후 로그인하러 가기 →
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition disabled:opacity-50 mt-2"
          >
            {loading ? '처리 중...' : '계정 만들기'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400 text-sm">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-indigo-400 hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}