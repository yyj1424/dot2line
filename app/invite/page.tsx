'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

/**
 * 고객사 담당자 전용 가입 화면 — 일반 회원가입 화면(/signup)과 달리 링크에 없다("숨어있는" 화면,
 * [사용자 확정 2026-08-22]). transys2의 "고객사 담당자 초대" 메일이 그룹코드/고객사코드/고객사명/
 * 이메일/사용자명을 쿼리스트링으로 실어서 이 페이지 링크를 보내주고, 담당자는 비밀번호만 입력하면
 * 가입이 끝난다 — 나머지 정보는 전부 읽기 전용으로 보여주기만 한다.
 */
export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InviteSignupForm />
    </Suspense>
  );
}

function InviteSignupForm() {
  const searchParams = useSearchParams();
  const orgCode = searchParams.get('orgCode') || '';
  const clientMasterCd = searchParams.get('clientMasterCd') || '';
  const clientMasterNm = searchParams.get('clientMasterNm') || '';
  const email = searchParams.get('email') || '';
  const userName = searchParams.get('userName') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const supabase = createClient();

  const missingParams = !orgCode || !clientMasterCd || !email || !userName;

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

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다. 다시 확인해 주세요.');
      setLoading(false);
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (existingUser) {
        throw new Error('이미 등록된 이메일(아이디)입니다. 로그인해 주세요.');
      }

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('org_code', orgCode.trim().toUpperCase())
        .single();

      if (orgError || !orgData) {
        throw new Error('초대 링크의 그룹코드를 확인할 수 없습니다. 초대 메일을 다시 보내달라고 요청해 주세요.');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            user_name: userName.trim(),
            org_id: orgData.id,
            role: 'client',
            client_master_cd: clientMasterCd.trim(),
            client_master_nm: clientMasterNm.trim(),
          },
        },
      });

      if (authError) throw authError;

      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        throw new Error('이미 등록된 이메일(아이디)입니다. 로그인해 주세요.');
      }

      setIsSent(true);
    } catch (err: any) {
      console.error('고객사 담당자 가입 에러 상세:', err);
      setError(err.message || '가입 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 text-slate-100 py-12">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">고객사 담당자 가입</h2>
        <p className="text-slate-400 text-center mb-6">DOT2LINE 통합 물류 시스템</p>

        {missingParams ? (
          <p className="text-red-400 text-sm bg-red-950/50 p-4 rounded-lg border border-red-800 text-center">
            잘못된 초대 링크입니다. 초대 메일의 링크를 다시 확인하시거나, 담당자에게 재발송을 요청해 주세요.
          </p>
        ) : isSent ? (
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
            <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-lg space-y-2">
              <InfoRow label="이름" value={userName} />
              <InfoRow label="이메일" value={email} />
              <InfoRow label="소속 고객사" value={clientMasterNm} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">비밀번호</label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-indigo-500 text-sm"
                placeholder="••••••••"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                영문, 숫자를 포함하여 8자 이상 입력하세요.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">비밀번호 확인</label>
              <input
                type="password"
                autoComplete="new-password"
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
              {loading ? '처리 중...' : '가입 완료'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
