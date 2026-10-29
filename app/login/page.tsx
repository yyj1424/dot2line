'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ResendVerificationButton from '../ResendVerificationButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsConfirm(false);

    // 로그인은 서버 경로를 거친다 — 5회 실패 시 30분 잠금(서버가 실패 횟수를 센다).
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));

      if (res.ok) {
        // 로그인 성공 시 물류 시스템 메인 대시보드로 이동
        router.push('/dashboard');
        return;
      }
      if (body.code === 'locked') {
        const minutes = Math.max(1, Math.ceil((body.retryAfterSec ?? 1800) / 60));
        setError(`로그인 실패가 5회 누적되어 계정이 잠겼습니다. 약 ${minutes}분 뒤에 다시 시도해 주세요. (급하면 관리자에게 잠금 해제를 요청하세요.)`);
      } else if (body.code === 'invalid') {
        setError(
          typeof body.remaining === 'number'
            ? `이메일 또는 비밀번호가 올바르지 않습니다. (${body.remaining}회 더 틀리면 30분간 잠깁니다.)`
            : '이메일 또는 비밀번호가 올바르지 않습니다.'
        );
      } else if (body.code === 'email_not_confirmed') {
        setError('이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.');
        setNeedsConfirm(true);
      } else {
        setError(body.message || '로그인 중 오류가 발생했습니다.');
      }
    } catch {
      setError('서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">로그인</h2>
        <p className="text-slate-400 text-center mb-8">DOT2LINE 통합 물류 시스템</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white"
              placeholder="name@company.com"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-300">비밀번호</label>
              {/* 비밀번호 재설정 링크 */}
              <Link
                href="/reset-password"
                className="text-xs text-indigo-400 hover:underline"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/50 p-3 rounded-lg border border-red-800">
              {error}
            </p>
          )}

          {needsConfirm && <ResendVerificationButton email={email} />}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400 text-sm">
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="text-indigo-400 hover:underline">무료 가입</Link>
        </p>
      </div>
    </div>
  );
}