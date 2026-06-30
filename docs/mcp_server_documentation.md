# MCP Server Documentation

The MCP server is located at:

```text
lifewood-hr-mcp/server.py
```

## Available MCP tools

### `fetch_hr_emails(limit: int = 10, unread_only: bool = True)`
Reads applicant emails from the HR inbox using IMAP. If `DEMO_MODE=true`, it returns sample emails.

### `extract_applicant_with_ollama(email_json: str)`
Sends one email to local Ollama and returns structured JSON containing applicant details.

### `store_applicant_data(applicant_json: str)`
Stores extracted applicant information in Supabase.

### `process_new_applicant_emails(limit: int = 10)`
Runs the full workflow:

```text
fetch emails -> extract with Ollama -> save to Supabase
```

### `export_to_excel()`
Reads all applicant records from Supabase and exports them to an Excel file.

## Required services

- IMAP email access for reading applicant messages.
- Ollama running locally for AI extraction.
- Supabase database for applicant storage.
