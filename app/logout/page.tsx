'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

/** app 서비스(transys2)의 로그아웃도 여기로 들어온다 — 메인 서비스 세션까지 같이 끊어야
 * "로그아웃했는데 메인 세션이 살아있어서 /session-resume이 바로 재로그인시켜버리는" 문제가 없다. */
export default function LogoutPage() {
  const [message, setMessage] = useState('로그아웃하고 있습니다...');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      await supabase.auth.signOut();
      setMessage('로그아웃되었습니다.');
      router.replace('/login');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-300">{message}</p>
      </div>
    </div>
  );
}
