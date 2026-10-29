import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** 서버 경로(route handler)용 Supabase 클라이언트. 로그인 성공 시 세션 쿠키를 응답에 심는다. */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component 에서 호출된 경우 무시(route handler 에서는 정상 동작)
          }
        },
      },
    }
  );
}
