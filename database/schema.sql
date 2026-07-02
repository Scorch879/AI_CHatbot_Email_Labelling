create table if not exists public.applicants (
    id bigint generated always as identity primary key,

    email_message_id text,
    name text,
    email text,
    phone text,
    position text,
    status text default 'New',
    category text,
    skills text[],
    experience_years numeric,
    education text,

    date_applied timestamptz default now(),
    source text default 'Email',
    resume_path text,

    email_subject text,
    email_date timestamptz,
    raw_email text,
    notes text,
    ai_confidence numeric,

    created_at timestamptz default now()
);

alter table public.applicants
add column if not exists email_message_id text,
add column if not exists phone text,
add column if not exists category text,
add column if not exists skills text[],
add column if not exists experience_years numeric,
add column if not exists education text,
add column if not exists email_subject text,
add column if not exists email_date timestamptz,
add column if not exists raw_email text,
add column if not exists ai_confidence numeric;

create unique index if not exists idx_applicants_email_message_id
on public.applicants(email_message_id)
where email_message_id is not null;

create index if not exists idx_applicants_email
on public.applicants(email);

create index if not exists idx_applicants_position
on public.applicants(position);

create index if not exists idx_applicants_status
on public.applicants(status);

create index if not exists idx_applicants_created_at
on public.applicants(created_at desc);

drop index if exists public.idx_applicants_email_message_id;

alter table public.applicants
drop constraint if exists applicants_email_message_id_unique;

alter table public.applicants
add constraint applicants_email_message_id_unique unique (email_message_id);

alter table public.applicants
add column if not exists attachment_files text[],
add column if not exists attachment_summary text,
add column if not exists resume_text text,
add column if not exists resume_summary text,
add column if not exists country text,
add column if not exists type text default 'regular',
add column if not exists urgent boolean default false,
add column if not exists match_score integer,
add column if not exists summary text,
add column if not exists message text,
add column if not exists cover_letter text,
add column if not exists resume_name text,
add column if not exists resume_size text,
add column if not exists replies jsonb default '[]'::jsonb;

alter table public.applicants enable row level security;

revoke all on public.applicants from anon;
grant select, insert, update, delete on public.applicants to authenticated;

drop policy if exists "Authenticated users can read applicants." on public.applicants;
create policy "Authenticated users can read applicants." on public.applicants
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can insert applicants." on public.applicants;
create policy "Authenticated users can insert applicants." on public.applicants
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update applicants." on public.applicants;
create policy "Authenticated users can update applicants." on public.applicants
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete applicants." on public.applicants;
create policy "Authenticated users can delete applicants." on public.applicants
  for delete
  to authenticated
  using (true);

create table if not exists public.internal_mail (
    id text primary key,
    initials text,
    sender text,
    role text,
    subject text,
    preview text,
    time text,
    badge text,
    badge_type text,
    color text,
    unread boolean default true,
    starred boolean default false,
    body text[],
    replies jsonb default '[]'::jsonb,
    created_at timestamptz default now()
);

alter table public.internal_mail enable row level security;

revoke all on public.internal_mail from anon;
grant select, insert, update, delete on public.internal_mail to authenticated;

drop policy if exists "Authenticated users can read internal_mail." on public.internal_mail;
create policy "Authenticated users can read internal_mail." on public.internal_mail
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can insert internal_mail." on public.internal_mail;
create policy "Authenticated users can insert internal_mail." on public.internal_mail
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update internal_mail." on public.internal_mail;
create policy "Authenticated users can update internal_mail." on public.internal_mail
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete internal_mail." on public.internal_mail;
create policy "Authenticated users can delete internal_mail." on public.internal_mail
  for delete
  to authenticated
  using (true);

