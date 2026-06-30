import importlib.util
import json
import os
import sys

import schedule

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVER_PATH = os.path.join(ROOT_DIR, "lifewood-hr-mcp", "server.py")


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
    print("Running scheduled task: generating Excel report from Supabase...")
    try:
        server = _load_server()
        result = server.export_to_excel()
        print(result)
    except Exception as exc:
        print(f"Error during report generation: {exc}")


schedule.every().day.at(os.getenv("SYNC_TIME", "08:00")).do(sync_emails_task)
schedule.every().day.at(os.getenv("REPORT_TIME", "17:00")).do(generate_report_task)


if __name__ == "__main__":
    run_once = os.getenv("RUN_ONCE", "true").lower() == "true"
    if run_once:
        sync_emails_task()
        generate_report_task()
    else:
        print("Scheduler is running. Press Ctrl+C to stop.")
        while True:
            schedule.run_pending()
