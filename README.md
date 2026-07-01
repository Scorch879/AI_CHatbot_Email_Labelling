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

- Do not upload `.env` to GitHub.
- Use a Gmail app password, not your normal Gmail password.
- Use a Supabase service-role key only on the backend/server, never in frontend code.
- The original SQLite storage has been replaced with Supabase.

---

## 7. Frontend Architecture & Email Authentication Guide (For Developers)

To protect sensitive HR data, the Lifemail frontend uses a bespoke **Invite-Only Authentication Architecture**. Public sign-ups are strictly disabled.

### 🔐 How Email Authentication Works
1. **No Public Registration:** Users cannot create their own accounts via the UI.
2. **Admin Provisioning:** Developers and HR Administrators must provision accounts using the backend Admin API.
3. **Forced Password Reset:** When a user is created via our CLI, they are assigned a temporary 10-character password and flagged with `force_password_reset: true` in Supabase `user_metadata`.
4. **Auth Guard Middleware:** The `<ProtectedRoute>` React component intercepts all route transitions. When a user logs in for the first time, they are mathematically blocked from accessing `/dashboard` and are routed to `/reset-password` to establish a private password.

### 🧑‍💻 How to Create Users (Local Development & Seeding)
To create a new employee or test user, open your terminal inside the `frontend/` directory and execute the built-in NPM script:

```bash
cd frontend
npm run create-user employee@lifewood.com "Employee Name"
```

The CLI will communicate with the Supabase Admin API, generate the user, build their public profile, and output their temporary 10-character password to your console.

### 📚 Further Documentation
For complete architectural details and onboarding templates, reference:
- [Authentication Flow Architecture](file:///d:/VS%20Code/AI_CHatbot_Email_Labelling/docs/authentication_flow.md)
- [Employee Onboarding Guide & Email Template](file:///d:/VS%20Code/AI_CHatbot_Email_Labelling/docs/employee_onboarding_guide.md)
