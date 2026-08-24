'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    // Supabase Auth 비밀번호 재설정 이메일 발송
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      // PKCE 인증 코드를 서버 콜백에서 세션으로 교환한 뒤 비밀번호 변경 화면으로 이동
      redirectTo: `${origin}/auth/callback?next=/update-password`,
    });

    if (error) {
      setError(error.message || '이메일 발송 중 오류가 발생했습니다.');
      setLoading(false);
    } else {
      setIsSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">비밀번호 재설정</h2>
        <p className="text-slate-400 text-center mb-8">
          가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보냅니다.
        </p>

        {isSent ? (
          <div className="p-6 bg-indigo-950/60 border border-indigo-500/50 rounded-xl text-center space-y-4">
            <div className="text-4xl">📩</div>
            <h3 className="text-lg font-bold text-indigo-200">재설정 이메일이 발송되었습니다!</h3>
            <p className="text-sm text-indigo-300/80 leading-relaxed">
              <span className="font-semibold text-white">{email}</span> 주소로 비밀번호 변경 링크를 보내드렸습니다.<br />
              이메일을 확인해 주세요.
            </p>
            <Link
              href="/login"
              className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg transition mt-4"
            >
              로그인 페이지로 돌아가기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">이메일 주소</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm"
                placeholder="name@company.com"
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
              {loading ? '발송 중...' : '재설정 이메일 받기'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-slate-400 text-sm">
          비밀번호가 생각나셨나요?{' '}
          <Link href="/login" className="text-indigo-400 hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}
