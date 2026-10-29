-- 비밀번호 변경 주기(60일) + "나중에" 30일 유예.
-- Supabase 대시보드 → SQL Editor 에서 한 번 실행한다(여러 번 실행해도 안전).
--
-- 상태(state)
--   ok        : 마지막 변경 후 60일 이내
--   due       : 60일이 지났고 아직 "나중에"를 쓰지 않음 → 변경 안내(지금 변경 / 나중에)
--   postponed : "나중에"를 눌러 30일 유예 중
--   blocked   : 유예까지 끝남 → 비밀번호를 바꾸기 전에는 사용 불가
-- 변경일을 한 번도 기록한 적 없는 기존 사용자(password_changed_at 이 NULL)는 처음부터 due 로 본다.

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
