'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

const COOLDOWN_SECONDS = 60;

// 인증 메일이 오지 않았을 때 가입 인증 메일을 다시 보내는 버튼.
// Supabase는 같은 주소로 짧은 시간에 반복 발송하지 못하게 제한하므로 화면에서도 60초 대기를 둔다.
export default function ResendVerificationButton({ email }: { email: string }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [remain, setRemain] = useState(0);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (remain <= 0) return;
    const timer = setTimeout(() => setRemain((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remain]);

  const toKorean = (raw: string) => {
    const msg = raw.toLowerCase();
    if (msg.includes('already confirmed') || msg.includes('already registered')) {
      return '이미 인증이 완료된 계정입니다. 로그인해 주세요.';
    }
    if (msg.includes('security purposes') || msg.includes('rate limit') || msg.includes('too many')) {
      return '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.';
    }
    if (msg.includes('not authorized') || msg.includes('error sending')) {
      return '메일을 보내지 못했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.';
    }
    return '인증 메일을 다시 보내지 못했습니다. 잠시 후 다시 시도해 주세요.';
  };

  const handleResend = async () => {
    const target = email.trim();
    if (!target) {
      setMessage({ type: 'error', text: '이메일을 먼저 입력해 주세요.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: target,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: toKorean(error.message) });
      // 발송 제한에 걸린 경우에도 연타하지 못하게 대기시킨다.
      setRemain(COOLDOWN_SECONDS);
      return;
    }
    setMessage({
      type: 'ok',
      text: `${target} 주소로 인증 메일을 다시 보냈습니다. 스팸함도 확인해 주세요.`,
    });
    setRemain(COOLDOWN_SECONDS);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleResend}
        disabled={loading || remain > 0}
        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-semibold text-sm rounded-lg transition disabled:opacity-50"
      >
        {loading ? '발송 중...' : remain > 0 ? `인증 메일 다시 보내기 (${remain}초 후 가능)` : '인증 메일 다시 보내기'}
      </button>
      {message && (
        <p
          className={
            message.type === 'ok'
              ? 'text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800 rounded-lg p-2'
              : 'text-xs text-red-300 bg-red-950/40 border border-red-800 rounded-lg p-2'
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
