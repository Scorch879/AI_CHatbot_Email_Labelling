# Automation Cron Documentation

This module manages scheduled email syncing. Excel report generation is intentionally disabled by default so the backend does not create a new report every run.

## Files Created

### 1. `cron/scheduler.py`
- **Purpose**: A standalone python script that leverages the `schedule` library to trigger automated workflows.
- **Key Functions**:
  - `sync_emails_task()`: Invokes the MCP server logic to fetch emails, parse them, and store the applicant data directly into the database.
  - `generate_report_task()`: Optional report task. It is disabled by default and should only run automatically when `ENABLE_SCHEDULED_REPORT=true`.
- **Schedule Configuration**:
  - Syncing emails happens daily at `08:00 AM`.
  - Report generation is manual by default through the report/export command. If `ENABLE_SCHEDULED_REPORT=true`, reports can be generated daily at `05:00 PM (17:00)`.

**Note**: To run this continuously, this script should be launched via the virtual environment python interpreter (e.g., `lifewood-hr-mcp\venv\Scripts\python.exe cron\scheduler.py`), ideally registered as a Windows Background Task or a systemd service.
