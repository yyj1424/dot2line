import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

/**
 * 로그인(서버 경유). 5회 실패 시 30분 잠금(supabase/login_lockout.sql).
 * 브라우저가 Supabase 로 직접 로그인하면 실패 횟수를 셀 수 없어서 로그인 화면은 이 경로만 쓴다.
 * 응답: 200 {ok:true} | 401 {code:'invalid', remaining} | 423 {code:'locked', retryAfterSec} | 403 {code:'email_not_confirmed'}
 */
export async function POST(request: Request) {
  let email = '';
  let password = '';
  try {
    const body = await request.json();
    email = String(body.email ?? '').trim();
    password = String(body.password ?? '');
  } catch {
    return NextResponse.json({ code: 'bad_request', message: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }
  if (!email || !password) {
    return NextResponse.json({ code: 'bad_request', message: '이메일과 비밀번호를 입력해 주세요.' }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // 1) 잠금 확인 — 잠겨 있으면 비밀번호가 맞아도 시도하지 않는다.
  //    (잠금 함수가 아직 없으면 error 가 나므로 잠금 없이 진행한다: supabase/login_lockout.sql 적용 전)
  const pre = await supabase.rpc('login_precheck', { p_email: email });
  if (!pre.error && pre.data?.locked) {
    return NextResponse.json({ code: 'locked', retryAfterSec: pre.data.retryAfterSec }, { status: 423 });
  }

  // 2) 로그인
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return NextResponse.json({ code: 'email_not_confirmed' }, { status: 403 });
    }
    if (error.message.includes('Invalid login credentials')) {
      const fail = await supabase.rpc('login_record_failure', { p_email: email });
      if (!fail.error && fail.data?.locked) {
        return NextResponse.json({ code: 'locked', retryAfterSec: fail.data.retryAfterSec }, { status: 423 });
      }
      return NextResponse.json({ code: 'invalid', remaining: fail.data?.remaining ?? null }, { status: 401 });
    }
    return NextResponse.json({ code: 'error', message: error.message }, { status: 400 });
  }

  // 3) 성공 — 실패 기록 초기화(본인 세션으로만 호출 가능)
  await supabase.rpc('login_record_success');
  return NextResponse.json({ ok: true });
}
