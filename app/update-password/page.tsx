'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { validatePassword, PASSWORD_HINT } from '@/utils/passwordPolicy';
import { clearRecoveryPending } from '@/utils/recoveryFlag';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [expiredNotice, setExpiredNotice] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState(false);
  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('reason');
    setExpiredNotice(reason === 'expired');
    setRecoveryNotice(reason === 'recovery');
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkRecoverySession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!mounted) return;

      setHasRecoverySession(Boolean(data.session) && !sessionError);
      if (sessionError || !data.session) {
        setError('비밀번호 재설정 링크가 만료되었거나 올바르지 않습니다. 새 링크를 요청해 주세요.');
      }
      setCheckingSession(false);
    };

    void checkRecoverySession();
    return () => {
      mounted = false;
    };
  }, [supabase.auth]);


  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. 비밀번호 유효성 검사
    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      setLoading(false);
      return;
    }

    // 2. 비밀번호 확인 일치 검사
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    try {
      // 3. Supabase 비밀번호 변경 API 호출
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // 변경일 기록(60일 주기 계산용). 기록 함수가 아직 없어도(supabase/password_expiry.sql 적용 전) 변경 자체는 성공 처리한다.
      const { error: markError } = await supabase.rpc('mark_password_changed');
      if (markError) console.warn('비밀번호 변경일 기록 실패:', markError.message);

      clearRecoveryPending();
      await supabase.auth.signOut();
      setIsSuccess(true);
    } catch (err: any) {
      console.error('비밀번호 변경 실패:', err);
      if (err.message?.includes('same password')) {
        setError('기존 비밀번호와 동일합니다. 새로운 비밀번호를 입력해 주세요.');
      } else {
        setError(err.message || '비밀번호 변경 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">새 비밀번호 설정</h2>
        <p className="text-slate-400 text-center mb-8">
          새롭게 사용할 비밀번호를 입력해 주세요.
        </p>
        {recoveryNotice && (
          <p className="mb-6 -mt-4 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-center text-xs text-amber-200">
            비밀번호를 새로 설정해야 다른 화면을 이용할 수 있습니다.
          </p>
        )}
        {expiredNotice && (
          <p className="mb-6 -mt-4 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-center text-xs text-amber-200">
            비밀번호 변경 주기(60일)가 지났습니다. 새 비밀번호로 변경해 주세요.
          </p>
        )}

        {checkingSession ? (
          <div className="py-8 text-center text-slate-300">재설정 링크를 확인하고 있습니다...</div>
        ) : !hasRecoverySession ? (
          <div className="p-6 bg-red-950/50 border border-red-800 rounded-xl text-center space-y-4">
            <p className="text-sm text-red-300 leading-relaxed">{error}</p>
            <Link
              href="/reset-password"
              className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg transition"
            >
              새 재설정 링크 받기
            </Link>
          </div>
        ) : isSuccess ? (
          <div className="p-6 bg-indigo-950/60 border border-indigo-500/50 rounded-xl text-center space-y-4">
            <div className="text-4xl">🎉</div>
            <h3 className="text-lg font-bold text-indigo-200">비밀번호가 변경되었습니다!</h3>
            <p className="text-sm text-indigo-300/80 leading-relaxed">
              새로운 비밀번호로 로그인하실 수 있습니다.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg transition mt-4"
            >
              로그인하러 가기
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* 새 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">새 비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm"
                placeholder="••••••••"
                required
              />
              <p className="mt-1 text-xs text-slate-500">{PASSWORD_HINT}</p>
            </div>

            {/* 새 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">새 비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm"
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
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition disabled:opacity-50"
            >
              {loading ? '변경 중...' : '비밀번호 변경 완료'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-slate-400 text-sm">
          <button
            type="button"
            className="text-indigo-400 hover:underline"
            onClick={async () => {
              // 비밀번호를 바꾸지 않고 나가려면 복구 로그인 세션을 끊는다(남겨 두면 비밀번호 없이 들어간 상태가 된다).
              clearRecoveryPending();
              await supabase.auth.signOut();
              router.push('/login');
            }}
          >
            로그인 페이지로 돌아가기
          </button>
        </p>
      </div>
    </div>
  );
}
