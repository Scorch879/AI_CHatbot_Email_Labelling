create extension if not exists pgcrypto;

do $$
begin
    create type priority_status as enum (
        'urgent',
        'important',
        'follow_up',
        'not_important'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type applicant_status as enum (
        'new',
        'screening',
        'interview',
        'offer',
        'rejected'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    role text default 'recruiter',
    created_at timestamptz default now()
);

alter table public.applicants
add column if not exists applicant_uuid uuid default gen_random_uuid(),
add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
add column if not exists updated_at timestamptz default now();

alter table public.applicants
alter column priority drop default;

alter table public.applicants
alter column priority type priority_status
using (
    case lower(coalesce(priority::text, ''))
        when 'urgent' then 'urgent'::priority_status
        when 'high' then 'urgent'::priority_status
        when 'important' then 'important'::priority_status
        when 'medium' then 'important'::priority_status
        when 'follow_up' then 'follow_up'::priority_status
        when 'follow-up' then 'follow_up'::priority_status
        when 'follow up' then 'follow_up'::priority_status
        when 'low' then 'not_important'::priority_status
        when 'normal' then 'not_important'::priority_status
        when 'muted' then 'not_important'::priority_status
        when 'not important' then 'not_important'::priority_status
        when 'not_important' then 'not_important'::priority_status
        else 'not_important'::priority_status
    end
);

alter table public.applicants
alter column priority set default 'not_important'::priority_status;

alter table public.applicants
alter column status drop default;

alter table public.applicants
alter column status type applicant_status
using (
    case lower(coalesce(status::text, ''))
        when 'new' then 'new'::applicant_status
        when 'screening' then 'screening'::applicant_status
        when 'interview' then 'interview'::applicant_status
        when 'offer' then 'offer'::applicant_status
        when 'rejected' then 'rejected'::applicant_status
        else 'new'::applicant_status
    end
);

alter table public.applicants
alter column status set default 'new'::applicant_status;

create table if not exists public.applicant_emails (
    id uuid primary key default gen_random_uuid(),
    applicant_id bigint references public.applicants(id) on delete cascade,
    message_id text unique,
    email_from text,
    email_to text,
    subject text,
    raw_body text,
    received_at timestamptz,
    created_at timestamptz default now()
);

create table if not exists public.applicant_documents (
    id uuid primary key default gen_random_uuid(),
    applicant_id bigint references public.applicants(id) on delete cascade,
    file_name text,
    file_type text,
    extracted_text text,
    ai_summary text,
    confidence_score numeric,
    created_at timestamptz default now()
);

create table if not exists public.applicant_notes (
    id uuid primary key default gen_random_uuid(),
    applicant_id bigint references public.applicants(id) on delete cascade,
    author_id uuid references public.profiles(id) on delete set null,
    note text not null,
    created_at timestamptz default now()
);

create index if not exists idx_applicants_priority
on public.applicants(priority);

create index if not exists idx_applicants_status
on public.applicants(status);

create index if not exists idx_applicants_assigned_to
on public.applicants(assigned_to);

create index if not exists idx_applicant_emails_applicant_id
on public.applicant_emails(applicant_id);

create index if not exists idx_applicant_documents_applicant_id
on public.applicant_documents(applicant_id);

create index if not exists idx_applicant_notes_applicant_id
on public.applicant_notes(applicant_id);