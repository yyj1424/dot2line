'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

type PasswordStatus = {
  state: 'ok' | 'due' | 'postponed' | 'blocked';
  daysLeft?: number;
};

/**
 * 비밀번호 변경 주기 안내(대시보드 상단). 상태는 Supabase 함수 password_status() 가 정한다
 * (supabase/password_expiry.sql). 함수가 아직 없으면 조용히 아무것도 보이지 않는다.
 *   due       → "지금 변경 / 나중에(30일 유예)" 안내창
 *   postponed → 남은 유예 기간 안내
 *   blocked   → 변경 화면으로 이동(변경 전에는 사용 불가)
 * 서버 쪽 강제는 transys2 /sso/login 이 같은 함수를 확인해서 한다.
 */
export default function PasswordExpiryNotice() {
  const supabase = createClient();
  const router = useRouter();
  const [status, setStatus] = useState<PasswordStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('password_status');
      if (cancelled || error || !data) return;
      const s = data as PasswordStatus;
      if (s.state === 'blocked') {
        router.replace('/update-password?reason=expired');
        return;
      }
      setStatus(s);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const postpone = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc('postpone_password_change');
    setBusy(false);
    if (!error && data) setStatus(data as PasswordStatus);
  };

  if (!status || status.state === 'ok') return null;

  if (status.state === 'postponed') {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
        <span>비밀번호 변경이 유예 중입니다. {status.daysLeft}일 뒤에는 비밀번호를 바꿔야 이용할 수 있습니다.</span>
        <button onClick={() => router.push('/update-password?reason=expired')} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-900 hover:bg-amber-400">
          지금 변경
        </button>
      </div>
    );
  }

  // due
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7">
        <h3 className="mb-2 text-xl font-bold text-white">비밀번호를 변경해 주세요</h3>
        <p className="mb-6 text-sm leading-relaxed text-slate-300">
          비밀번호를 변경한 지 60일이 지났습니다. 보안을 위해 새 비밀번호로 바꿔 주세요.
          지금 바꾸지 않으면 30일 동안만 더 사용할 수 있고, 그 뒤에는 변경 전까지 이용할 수 없습니다.
        </p>
        <div className="flex gap-3">
          <button onClick={() => router.push('/update-password?reason=expired')} className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500">
            지금 변경
          </button>
          <button onClick={postpone} disabled={busy} className="flex-1 rounded-lg border border-slate-600 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-50">
            {busy ? '처리 중…' : '나중에 (30일 유예)'}
          </button>
        </div>
      </div>
    </div>
  );
}
