# Database Documentation

This project now uses Supabase instead of SQLite.

## Table

The main table is:

```text
public.applicants
```

## Important columns

- `email_message_id`: unique email identifier used to prevent duplicate records.
- `name`: applicant name.
- `email`: applicant email address.
- `phone`: applicant phone number.
- `position`: applied position.
- `category`: AI-generated applicant category.
- `skills`: extracted skills.
- `experience_years`: extracted years of experience.
- `notes`: HR-friendly summary.
- `ai_confidence`: model confidence score from 0 to 1.
- `created_at`: record creation timestamp.

## Setup

Run the SQL in:

```text
database/schema.sql
```

inside Supabase SQL Editor.
