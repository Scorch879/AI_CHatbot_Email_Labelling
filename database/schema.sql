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
add column if not exists resume_summary text;