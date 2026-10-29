-- ============================================================================
-- dot2line 로그인 보안 (Supabase SQL Editor 에서 이 파일 전체를 한 번 실행한다)
--
--  [1] 비밀번호 변경 주기: 60일 경과 안내 + "나중에" 선택 시 30일 유예, 유예 후에는 변경 전 사용 불가
--  [2] 로그인 5회 실패 시 30분 잠금(자동 해제), 관리자 수동 해제 함수
--
-- · 여러 번 실행해도 안전하다(이미 있으면 덮어쓰거나 건너뜀). 하나라도 실패하면 전체가 취소된다(트랜잭션).
-- · 실행이 끝나면 맨 아래 확인 쿼리의 결과가 표로 나온다 — 함수 10개가 보이면 정상.
-- · 로그인 화면(/api/auth/login)과 transys2 /sso/login 이 이 함수들을 부른다. 이 SQL 이 없으면 두 기능 모두 꺼진 채로(막지 않고) 동작한다.
-- · 한계: Supabase 주소로 직접 비밀번호를 시도하는 요청은 [2]의 횟수를 거치지 않는다
--         (완전 차단은 Supabase Auth Hook 필요). 대신 transys2 /sso/login 이 잠긴 계정의 접속을 막는다.
-- · 관리자 수동 잠금 해제:  select public.admin_unlock_login('user@company.com');
-- · 변경 주기·잠금 횟수/시간을 바꾸려면 아래 해당 함수(password_status / login_lock_limits)만 고친다.
-- ============================================================================

begin;

-- ───────────────────────── [1] 비밀번호 변경 주기 ─────────────────────────
alter table public.profiles add column if not exists password_changed_at timestamptz;
alter table public.profiles add column if not exists password_postponed_until timestamptz;
-- 새 가입자는 가입 시점이 변경일. (이미 있는 행은 NULL 그대로 → due)
alter table public.profiles alter column password_changed_at set default now();

-- 화면(authenticated 역할)이 이 두 컬럼을 직접 고치지 못하게 한다. 아래 함수(security definer)만 바꿀 수 있다.
create or replace function public.guard_password_columns() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.password_changed_at is distinct from old.password_changed_at
          or new.password_postponed_until is distinct from old.password_postponed_until) then
    raise exception '비밀번호 변경 기록은 직접 수정할 수 없습니다.';
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_password_columns on public.profiles;
create trigger trg_guard_password_columns before update on public.profiles
  for each row execute function public.guard_password_columns();

create or replace function public.password_status() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  p record;
  due_at timestamptz;
  st text;
begin
  select password_changed_at, password_postponed_until into p from public.profiles where id = auth.uid();
  if not found then return jsonb_build_object('state', 'ok'); end if;

  if p.password_changed_at is null then due_at := now() - interval '1 second';   -- 기록 없음 = 이미 기한 경과
  else due_at := p.password_changed_at + interval '60 days'; end if;

  if now() < due_at then st := 'ok';
  elsif p.password_postponed_until is null then st := 'due';
  elsif now() < p.password_postponed_until then st := 'postponed';
  else st := 'blocked'; end if;

  return jsonb_build_object(
    'state', st,
    'changedAt', p.password_changed_at,
    'expiresAt', case when p.password_changed_at is null then null else due_at end,
    'postponedUntil', p.password_postponed_until,
    'daysLeft', case when st = 'ok' then ceil(extract(epoch from (due_at - now())) / 86400)
                     when st = 'postponed' then ceil(extract(epoch from (p.password_postponed_until - now())) / 86400)
                     else 0 end);
end $$;

-- 비밀번호를 바꾼 직후 화면이 부른다. 변경일을 지금으로 하고 유예를 지운다.
create or replace function public.mark_password_changed() returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set password_changed_at = now(), password_postponed_until = null where id = auth.uid();
end $$;

-- "나중에" — 기한이 지난 사용자가 주기당 한 번만 30일 유예를 받는다.
create or replace function public.postpone_password_change() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
     set password_postponed_until = now() + interval '30 days'
   where id = auth.uid()
     and password_postponed_until is null
     and (password_changed_at is null or now() >= password_changed_at + interval '60 days');
  return public.password_status();
end $$;

revoke all on function public.password_status() from public, anon;
revoke all on function public.mark_password_changed() from public, anon;
revoke all on function public.postpone_password_change() from public, anon;
grant execute on function public.password_status() to authenticated;
grant execute on function public.mark_password_changed() to authenticated;
grant execute on function public.postpone_password_change() to authenticated;

-- ───────────────────────── [2] 로그인 5회 실패 잠금 ─────────────────────────
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

commit;

-- ───────────────────────── 설치 확인 (함수 10개가 나와야 한다) ─────────────────────────
select proname as function_name, prosecdef as security_definer
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and proname in ('guard_password_columns','password_status','mark_password_changed','postpone_password_change',
                   'login_lock_limits','login_precheck','login_record_failure','login_record_success','login_lock_status','admin_unlock_login')
 order by proname;
