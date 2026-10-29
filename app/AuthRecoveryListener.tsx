'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { clearRecoveryPending, isRecoveryPending, markRecoveryPending } from '@/utils/recoveryFlag';

/**
 * 비밀번호 재설정 이메일 링크를 누르면 Supabase 는 비밀번호를 바꾸기 전에 이미 로그인 세션을 만든다
 * (복구 링크 = 임시 로그인). 그 세션은 같은 브라우저의 다른 탭에도 공유되어, 다른 탭이 그대로 대시보드로
 * 들어가 버릴 수 있다. 그래서
 *   1) PASSWORD_RECOVERY 이벤트가 오면 '복구 중' 표시를 localStorage(탭 공유)에 남기고 변경 화면으로 보내고,
 *   2) 표시가 있는 동안에는 어느 탭이든 비밀번호 변경 화면 밖으로 나가지 못하게 되돌린다.
 * 표시는 비밀번호를 바꾸거나 로그아웃하면 지워지고, 1시간이 지나면 저절로 사라진다.
 * (링크가 어느 페이지로 떨어지든 PKCE code 를 감지해 PASSWORD_RECOVERY 가 발생하므로 전역에서 처리한다.)
 */
export default function AuthRecoveryListener() {
  const router = useRouter();
  const pathname = usePathname();

  // 복구 표시가 있고 실제로 로그인 세션이 있을 때만 되돌린다(세션이 없으면 표시는 낡은 것이므로 지운다 —
  // 그러지 않으면 링크를 그냥 닫아 버린 사용자가 1시간 동안 어느 화면에서도 변경 화면으로 끌려간다).
  const bounceIfRecovering = async () => {
    if (window.location.pathname === '/update-password' || !isRecoveryPending()) return;
    const { data } = await createClient().auth.getSession();
    if (data.session) router.replace('/update-password?reason=recovery');
    else clearRecoveryPending();
  };

  // 다른 탭에서 복구 링크를 처리했거나, 이 탭이 복구 상태에서 다른 화면으로 이동한 경우 되돌린다.
  useEffect(() => {
    void bounceIfRecovering();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        markRecoveryPending();
        router.replace('/update-password?reason=recovery');
      } else if (event === 'SIGNED_IN') {
        // 다른 탭의 복구 세션이 이 탭에 로그인 상태로 전파된 경우
        void bounceIfRecovering();
      }
    });

    const onStorage = () => { void bounceIfRecovering(); };
    window.addEventListener('storage', onStorage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, [router]);

  return null;
}
