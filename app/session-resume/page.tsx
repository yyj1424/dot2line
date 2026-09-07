'use client';

import { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

/** app 서비스(transys2)에서 세션이 만료되면 이 페이지로 들어온다.
 * 메인 서비스(dot2line) 세션이 아직 살아있으면 로그인 폼 없이 /sso/login으로 바로 넘겨서
 * app 세션을 재발급받고, 원래 가려던 페이지(returnTo)로 되돌려보낸다.
 * 메인 서비스 세션도 죽어있으면 /login으로 보낸다. */
function SessionResumeInner() {
  const [message, setMessage] = useState('세션을 확인하고 있습니다...');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const returnTo = searchParams.get('returnTo') || '/index';

    (async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.replace('/login');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          user_name,
          role,
          client_master_cd,
          client_master_nm,
          organizations:org_id (
            org_name,
            org_code
          )
        `)
        .eq('id', user.id)
        .single();

      const rawOrg = profile?.organizations;
      const orgData = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg;
      const fallbackName = user.email ? user.email.split('@')[0] : '사용자';

      let userName: string;
      let orgCode: string;
      let orgName: string;
      let role: string;
      let clientMasterCd: string | null | undefined;

      if (profile && orgData && orgData.org_code) {
        userName = profile.user_name || fallbackName;
        orgName = orgData.org_name;
        orgCode = orgData.org_code;
        role = profile.role || 'user';
        clientMasterCd = profile.client_master_cd || null;
      } else {
        const emailPrefix = user.email ? user.email.split('@')[0].toUpperCase() : 'USER';
        userName = profile?.user_name || fallbackName;
        orgName = '개인 워크스페이스';
        orgCode = `PERSONAL_${emailPrefix}`;
        role = profile?.role || 'individual';
        clientMasterCd = null;
      }

      setMessage('로그인 상태를 확인했습니다. 이동 중입니다...');

      const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';
      let targetUrl = `${springApiUrl}/sso/login?token=${encodeURIComponent(session.access_token)}&userName=${encodeURIComponent(userName)}&orgName=${encodeURIComponent(orgName)}&orgCode=${encodeURIComponent(orgCode)}&role=${encodeURIComponent(role)}&redirect=${encodeURIComponent(returnTo)}`;
      if (clientMasterCd) {
        targetUrl += `&clientMasterCd=${encodeURIComponent(clientMasterCd)}`;
      }

      window.location.href = targetUrl;
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

export default function SessionResumePage() {
  return (
    <Suspense fallback={null}>
      <SessionResumeInner />
    </Suspense>
  );
}
