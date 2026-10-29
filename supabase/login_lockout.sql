-- 로그인 5회 실패 시 30분 잠금. Supabase SQL Editor 에서 한 번 실행한다(여러 번 실행해도 안전).
--
-- 흐름: 로그인 화면 → 서버 경로 /api/auth/login → (1) login_precheck 로 잠금 확인
--       (2) 서버에서 Supabase 로그인 (3) 실패면 login_record_failure, 성공이면 login_record_success.
-- 한계: Supabase 주소로 직접 비밀번호를 시도하는 요청은 이 카운트를 거치지 않는다.
--       완전히 막으려면 Supabase Auth Hook(Password verification) 이 필요하다(상위 요금제).
--       그래서 transys2 /sso/login 이 login_lock_status() 로 잠긴 계정의 접속도 막는다.
-- 잠금 시간·횟수를 바꾸려면 아래 login_lock_limits() 만 고치면 된다.

create table if not exists public.login_attempts (
  email text primary key,
  failed_count int not null default 0,
  last_failed_at timestamptz,
  locked_until timestamptz
);
alter table public.login_attempts enable row level security;   -- 정책을 만들지 않는다 → 아래 함수로만 접근
revoke all on public.login_attempts from public, anon, authenticated;

create or replace function public.login_lock_limits(out max_failures int, out lock_minutes int)
language sql immutable as $$ select 5, 30 $$;

-- 로그인 전 확인(비로그인 상태에서 호출). 잠겨 있으면 남은 시간을 돌려준다.
create or replace function public.login_precheck(p_email text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.login_attempts;
begin
  select * into r from public.login_attempts where email = lower(trim(p_email));
  if found and r.locked_until is not null and r.locked_until > now() then
    return jsonb_build_object('locked', true, 'retryAfterSec', ceil(extract(epoch from (r.locked_until - now())))::int);
  end if;
  return jsonb_build_object('locked', false);
end $$;

-- 비밀번호가 틀렸을 때. 실패 횟수를 올리고, 한도에 닿으면 잠근다. 잠금이 끝난 뒤의 실패는 1회부터 다시 센다.
create or replace function public.login_record_failure(p_email text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  e text := lower(trim(p_email));
  lim record; r public.login_attempts; n int;
begin
  if e is null or e = '' or length(e) > 320 then return jsonb_build_object('locked', false); end if;
  select * into lim from public.login_lock_limits();
  insert into public.login_attempts(email, failed_count, last_failed_at) values (e, 0, now()) on conflict (email) do nothing;
  select * into r from public.login_attempts where email = e for update;

  if r.locked_until is not null and r.locked_until > now() then   -- 이미 잠김: 더 세지 않는다
    return jsonb_build_object('locked', true, 'retryAfterSec', ceil(extract(epoch from (r.locked_until - now())))::int, 'remaining', 0);
  end if;

  n := case when r.locked_until is not null then 1 else r.failed_count + 1 end;   -- 잠금이 풀린 뒤 첫 실패는 1회
  if n >= lim.max_failures then
    update public.login_attempts set failed_count = n, last_failed_at = now(), locked_until = now() + make_interval(mins => lim.lock_minutes) where email = e;
    return jsonb_build_object('locked', true, 'retryAfterSec', lim.lock_minutes * 60, 'remaining', 0);
  end if;
  update public.login_attempts set failed_count = n, last_failed_at = now(), locked_until = null where email = e;
  return jsonb_build_object('locked', false, 'remaining', lim.max_failures - n);
end $$;

-- 로그인에 성공한 사용자 본인만 자기 실패 기록을 지울 수 있다(비로그인 호출로 카운트를 리셋하지 못하게).
create or replace function public.login_record_success() returns void
language plpgsql security definer set search_path = public as $$
declare e text;
begin
  select lower(email) into e from auth.users where id = auth.uid();
  if e is not null then delete from public.login_attempts where email = e; end if;
end $$;

-- transys2 가 사용자 토큰으로 호출: 이 계정이 지금 잠겨 있는가.
create or replace function public.login_lock_status() returns jsonb
language plpgsql security definer set search_path = public as $$
declare e text; r public.login_attempts;
begin
  select lower(email) into e from auth.users where id = auth.uid();
  select * into r from public.login_attempts where email = e;
  if found and r.locked_until is not null and r.locked_until > now() then
    return jsonb_build_object('locked', true, 'retryAfterSec', ceil(extract(epoch from (r.locked_until - now())))::int);
  end if;
  return jsonb_build_object('locked', false);
end $$;

-- 관리자 수동 해제: Supabase SQL Editor 에서  select public.admin_unlock_login('user@company.com');
create or replace function public.admin_unlock_login(p_email text) returns void
language sql security definer set search_path = public as $$
  delete from public.login_attempts where email = lower(trim(p_email));
$$;

revoke all on function public.login_precheck(text), public.login_record_failure(text), public.login_record_success(),
  public.login_lock_status(), public.admin_unlock_login(text) from public, anon, authenticated;
grant execute on function public.login_precheck(text), public.login_record_failure(text) to anon, authenticated;
grant execute on function public.login_record_success(), public.login_lock_status() to authenticated;
-- admin_unlock_login 은 아무에게도 열지 않는다(SQL Editor/service role 에서만).
