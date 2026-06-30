import os
import sys
import pandas as pd
from typing import List, Dict, Any, Optional

# Adding the root folder to sys.path to import our db_handler
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db_handler import insert_applicant, get_all_applicants

try:
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("lifewood-hr-tools")
except ImportError:
    print("Warning: mcp.server.fastmcp not found, attempting generic mcp implementation if needed.")
    # Assuming mcp library provides FastMCP, which is standard in recent versions
    pass

@mcp.tool()
def fetch_hr_emails(limit: int = 10) -> str:
    """
    Simulates fetching unread applicant emails from the HR inbox.
    In a full production environment, this would connect via IMAP.
    For this demo, it returns a simulated JSON list of emails.
    """
    import json
    dummy_emails = [
        {"subject": "Application for Software Engineer", "from": "john.doe@example.com", "body": "Hi, I'm John Doe. I am applying for the Software Engineer position. I have 5 years of Python experience."},
        {"subject": "Data Analyst Application", "from": "jane.smith@example.com", "body": "Dear HR, my name is Jane Smith. I want to apply for the Data Analyst role. I know SQL and PowerBI."}
    ]
    return json.dumps(dummy_emails)

@mcp.tool()
def store_applicant_data(name: str, email: str, position: str, notes: str = "") -> str:
    """
    Stores extracted applicant data into the SQLite database.
    """
    try:
        applicant_id = insert_applicant(name, email, position, notes)
        return f"Successfully stored applicant {name} with ID {applicant_id}."
    except Exception as e:
        return f"Error storing applicant: {str(e)}"

@mcp.tool()
def export_to_excel() -> str:
    """
    Exports all applicant data from the database to an Excel file.
    """
    try:
        applicants = get_all_applicants()
        if not applicants:
            return "No applicants found in the database to export."
        
        df = pd.DataFrame(applicants)
        export_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "applicant_report.xlsx")
        df.to_excel(export_path, index=False)
        return f"Successfully exported data to {export_path}"
    except Exception as e:
        return f"Error exporting to Excel: {str(e)}"

if __name__ == "__main__":
    # Start the MCP server reading/writing over stdio
    mcp.run(transport='stdio')
