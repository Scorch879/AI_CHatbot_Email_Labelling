# HR Email Automation AI Chatbot

An AI-powered MCP agent that automates the Lifewood HR applicant workflow:

1. Reads applicant emails from the HR inbox through IMAP.
2. Uses local Ollama to extract and categorize applicant details.
3. Stores applicant records in Supabase.
4. Exports organized applicant data to Excel.
5. Exposes the workflow as MCP tools for OpenClaw / chatbot use.

## Main Workflow

```text
HR inbox -> IMAP -> MCP server -> Ollama extraction -> Supabase -> Excel report
```

## Tools Included

- `fetch_hr_emails` - reads unread applicant emails from the HR inbox.
- `extract_applicant_with_ollama` - extracts name, email, position, skills, category, and notes using Ollama.
- `store_applicant_data` - saves extracted applicant data to Supabase.
- `process_new_applicant_emails` - full end-to-end workflow.
- `export_to_excel` - exports Supabase applicant data to Excel.

## Setup

### 1. Create and activate a virtual environment

```powershell
python -m venv lifewood-hr-mcp/venv
lifewood-hr-mcp/venv/Scripts/activate
pip install -r requirements.txt
```

### 2. Create the environment file

Copy the sample file:

```powershell
copy lifewood-hr-mcp/.env.example lifewood-hr-mcp/.env
```

Then fill in your real values:

```env
DEMO_MODE=true
HR_EMAIL_ADDRESS=hr@lifewood.com
HR_EMAIL_PASSWORD=your_email_app_password
IMAP_SERVER=imap.gmail.com
IMAP_PORT=993

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_key
SUPABASE_APPLICANTS_TABLE=applicants

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
EXCEL_OUTPUT_PATH=exports/applicant_report.xlsx
```

Start with `DEMO_MODE=true` for testing. Change it to `false` when you are ready to connect the real HR inbox.

### 3. Prepare Supabase

Open Supabase SQL Editor and run:

```text
database/schema.sql
```

This creates the `applicants` table used by the MCP tools.

### 4. Prepare Ollama

Install Ollama, then pull a model:

```powershell
ollama pull llama3.2:3b
ollama run llama3.2:3b
```

Keep Ollama running locally. The MCP server will call:

```text
http://localhost:11434/api/generate
```

### 5. Run MCP server manually

```powershell
python lifewood-hr-mcp/server.py
```

### 6. Run the scheduled workflow manually

```powershell
python cron/scheduler.py
```

By default, `RUN_ONCE=true`, so it runs one sync and one report export immediately.

## Notes

- Do not upload `.env` to GitHub.
- Use a Gmail app password, not your normal Gmail password.
- Use a Supabase service-role key only on the backend/server, never in frontend code.
- The original SQLite storage has been replaced with Supabase.
