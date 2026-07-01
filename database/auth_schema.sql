-- Create profiles table linked to Supabase auth
drop table if exists public.profiles cascade;
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text,
    avatar_url text,
    created_at timestamptz default now()
);

-- Turn on RLS for profiles
alter table public.profiles enable row level security;

-- Create basic RLS policies for profiles
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user signups and create a profile automatically
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', ''), 
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
exception
  when others then
    -- If the profile creation fails (e.g. missing columns, type mismatch),
    -- do not fail the whole signup transaction. Just return new.
    raise notice 'Error creating profile: %', sqlerrm;
    return new;
end;
$$;

-- Trigger to call the function when a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
