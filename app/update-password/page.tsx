'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
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

  // 비밀번호 유효성 검사 (영문 + 숫자 조합, 최소 8자)
  const validatePassword = (pwd: string) => {
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const isLongEnough = pwd.length >= 8;

    if (!isLongEnough) return '비밀번호는 최소 8자 이상이어야 합니다.';
    if (!hasLetter || !hasNumber) return '비밀번호는 영문과 숫자를 모두 포함해야 합니다.';
    return null;
  };

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
              <p className="mt-1 text-xs text-slate-500">영문, 숫자를 포함하여 8자 이상 입력하세요.</p>
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
          <Link href="/login" className="text-indigo-400 hover:underline">로그인 페이지로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}
