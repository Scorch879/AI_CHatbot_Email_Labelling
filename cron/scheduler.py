import schedule
import time
import os
import sys

# Add parent directory to path to import mcp tools logic if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# For this script, we can either directly call the python logic 
# or interact with the agent via OpenClaw API.
# Assuming we can just run the python logic directly for the cron job:

def sync_emails_task():
    print("Running scheduled task: Syncing HR Emails...")
    try:
        import importlib.util
        import sys
        
        server_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "lifewood-hr-mcp", "server.py")
        spec = importlib.util.spec_from_file_location("server", server_path)
        server = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(server)
        import json
        
        # Simulating the extraction & storage
        emails_json = server.fetch_hr_emails(limit=5)
        emails = json.loads(emails_json)
        
        for email_data in emails:
            name = email_data.get('from', '').split('@')[0].replace('.', ' ').title()
            email = email_data.get('from', '')
            position = "Unknown Position"
            if 'software' in email_data.get('subject', '').lower():
                position = "Software Engineer"
            elif 'data' in email_data.get('subject', '').lower():
                position = "Data Analyst"
            notes = email_data.get('body', '')
            
            res = server.store_applicant_data(name=name, email=email, position=position, notes=notes)
            print(res)
            
        print("Sync complete.")
    except Exception as e:
        print(f"Error during sync task: {e}")

def generate_report_task():
    print("Running scheduled task: Generating Excel Report...")
    try:
        import importlib.util
        import sys
        
        server_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "lifewood-hr-mcp", "server.py")
        spec = importlib.util.spec_from_file_location("server", server_path)
        server = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(server)
        
        res = server.export_to_excel()
        print(res)
    except Exception as e:
        print(f"Error during report generation: {e}")

# Schedule the tasks
schedule.every().day.at("08:00").do(sync_emails_task)
schedule.every().day.at("17:00").do(generate_report_task)

# For testing purposes, we run them once immediately
print("Running initial test execution...")
sync_emails_task()
generate_report_task()

if __name__ == "__main__":
    print("Cron scheduler executed initial test run.")
