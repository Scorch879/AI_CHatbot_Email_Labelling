-- Authentication support schema for invite-only Lifemail users.
-- Safe to rerun: this file avoids dropping profile data in deployed environments.

create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text,
    avatar_url text,
    role text not null default 'hr',
    must_reset_password boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists full_name text,
add column if not exists avatar_url text,
add column if not exists role text not null default 'hr',
add column if not exists must_reset_password boolean not null default true,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

alter table public.profiles enable row level security;

revoke all on public.profiles from anon;
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url, updated_at) on public.profiles to authenticated;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Profiles are readable by owner." on public.profiles;
create policy "Profiles are readable by owner." on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Users can update own basic profile." on public.profiles;
create policy "Users can update own basic profile." on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    avatar_url,
    role,
    must_reset_password
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    coalesce(new.raw_app_meta_data->>'role', 'hr'),
    coalesce(
      nullif(new.raw_app_meta_data->>'must_reset_password', '')::boolean,
      nullif(new.raw_user_meta_data->>'force_password_reset', '')::boolean,
      true
    )
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        avatar_url = excluded.avatar_url,
        role = excluded.role,
        must_reset_password = excluded.must_reset_password,
        updated_at = now();

  return new;
exception
  when others then
    raise notice 'Error creating profile: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.complete_password_reset()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles
  set must_reset_password = false,
      updated_at = now()
  where id = auth.uid();

  if not found then
    insert into public.profiles (id, must_reset_password)
    values (auth.uid(), false)
    on conflict (id) do update
      set must_reset_password = false,
          updated_at = now();
  end if;
end;
$$;

revoke all on function public.complete_password_reset() from public;
grant execute on function public.complete_password_reset() to authenticated;

create or replace function public.is_hr_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('hr', 'admin')
      and must_reset_password = false
  );
$$;

revoke all on function public.is_hr_user() from public;
grant execute on function public.is_hr_user() to authenticated;
