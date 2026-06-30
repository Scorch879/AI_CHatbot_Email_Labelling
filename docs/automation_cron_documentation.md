# Automation Cron Documentation

This module manages the scheduled execution of tasks, running entirely independently from user interactions in WhatsApp.

## Files Created

### 1. `cron/scheduler.py`
- **Purpose**: A standalone python script that leverages the `schedule` library to trigger automated workflows.
- **Key Functions**:
  - `sync_emails_task()`: Invokes the MCP server logic to fetch emails, parse them, and store the applicant data directly into the database.
  - `generate_report_task()`: Invokes the MCP server logic to dump the current database state into a fresh `applicant_report.xlsx` file.
- **Schedule Configuration**:
  - Syncing emails happens daily at `08:00 AM`.
  - Generating reports happens daily at `05:00 PM (17:00)`.

**Note**: To run this continuously, this script should be launched via the virtual environment python interpreter (e.g., `lifewood-hr-mcp\venv\Scripts\python.exe cron\scheduler.py`), ideally registered as a Windows Background Task or a systemd service.
