# Environment Setup Guide

Create this file:

```text
lifewood-hr-mcp/.env
```

Use this structure:

```env
DEMO_MODE=true

HR_EMAIL_ADDRESS=hr@lifewood.com
HR_EMAIL_PASSWORD=your_email_app_password
IMAP_SERVER=imap.gmail.com
IMAP_PORT=993
IMAP_MAILBOX=INBOX

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_anon_or_service_role_key
SUPABASE_APPLICANTS_TABLE=applicants

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_TIMEOUT=120

EXCEL_OUTPUT_PATH=exports/applicant_report.xlsx

SYNC_EMAIL_LIMIT=10
SYNC_TIME=08:00
REPORT_TIME=17:00
RUN_ONCE=true
```

## What each part does

- `HR_EMAIL_ADDRESS` and `HR_EMAIL_PASSWORD`: used by IMAP to read the HR inbox.
- `IMAP_SERVER` and `IMAP_PORT`: email server settings.
- `SUPABASE_URL` and `SUPABASE_KEY`: used to save and read applicant records.
- `OLLAMA_BASE_URL` and `OLLAMA_MODEL`: used for local AI extraction.
- `EXCEL_OUTPUT_PATH`: where the Excel export will be saved.
- `DEMO_MODE=true`: uses sample emails instead of connecting to the real inbox.
