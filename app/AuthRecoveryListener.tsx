'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

/**
 * 비밀번호 재설정 이메일 링크는 Supabase 대시보드의 Redirect URL 허용목록 설정에 따라
 * /auth/callback이 아니라 사이트 루트 등 다른 경로로 code가 떨어질 수 있다.
 * 어느 페이지에 떨어지든 Supabase 클라이언트가 PKCE code를 자동 감지/교환하면서
 * 발생시키는 PASSWORD_RECOVERY 이벤트를 전역에서 감지해 안전하게 /update-password로 보낸다.
 */
export default function AuthRecoveryListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/update-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
