import importlib.util
import os
import sys
import time

import schedule
from dotenv import load_dotenv

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVER_PATH = os.path.join(ROOT_DIR, "lifewood-hr-mcp", "server.py")
load_dotenv(os.path.join(ROOT_DIR, ".env"))
load_dotenv(os.path.join(ROOT_DIR, "lifewood-hr-mcp", ".env"))


def _env_bool(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "y", "on"}


def _load_server():
    spec = importlib.util.spec_from_file_location("lifewood_hr_server", SERVER_PATH)
    server = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(server)
    return server


def sync_emails_task():
    print("Running scheduled task: IMAP -> Ollama -> Supabase...")
    try:
        server = _load_server()
        result = server.process_new_applicant_emails(limit=int(os.getenv("SYNC_EMAIL_LIMIT", "10")))
        print(result)
    except Exception as exc:
        print(f"Error during sync task: {exc}")


def generate_report_task():
    """
    Optional report task.

    This is intentionally NOT scheduled by default because Excel reports should
    be generated only when HR requests them through the report/export command.
    Set ENABLE_SCHEDULED_REPORT=true only if you want an automatic daily report.
    """
    print("Running scheduled task: generating Excel report from Supabase...")
    try:
        server = _load_server()
        result = server.export_to_excel()
        print(result)
    except Exception as exc:
        print(f"Error during report generation: {exc}")


ENABLE_SCHEDULED_REPORT = _env_bool("ENABLE_SCHEDULED_REPORT", "false")

SYNC_INTERVAL_MINUTES = int(os.getenv("SYNC_INTERVAL_MINUTES", "5"))
schedule.every(SYNC_INTERVAL_MINUTES).minutes.do(sync_emails_task)

if ENABLE_SCHEDULED_REPORT:
    schedule.every().day.at(os.getenv("REPORT_TIME", "17:00")).do(generate_report_task)


if __name__ == "__main__":
    run_once = _env_bool("RUN_ONCE", "false")

    if run_once:
        sync_emails_task()

        if ENABLE_SCHEDULED_REPORT and _env_bool("RUN_REPORT_ONCE", "false"):
            generate_report_task()
        else:
            print(
                "Excel report generation skipped. "
                "Reports are now generated only when the report/export command is requested."
            )
    else:
       if ENABLE_SCHEDULED_REPORT:
        print(f"Scheduler is running: email sync every {SYNC_INTERVAL_MINUTES} minute(s) + scheduled Excel report. Press Ctrl+C to stop.")
       else:
        print(f"Scheduler is running: email sync every {SYNC_INTERVAL_MINUTES} minute(s) only. Excel reports are manual only. Press Ctrl+C to stop.")

    sync_emails_task()
    print("Scheduler is still running. Leave this terminal open.")

    while True:
        schedule.run_pending()
        time.sleep(1)
