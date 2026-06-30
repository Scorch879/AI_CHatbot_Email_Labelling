# MCP Server Documentation

This module exposes our Python functions as standardized tools that an AI agent can execute using the Model Context Protocol (MCP).

## Files Created

### 1. `lifewood-hr-mcp/server.py`
- **Purpose**: Initializes the `FastMCP` server, making Python methods callable via standard I/O (stdio) for OpenClaw.
- **Dependencies**: `mcp`, `pandas`, `json`
- **Exposed Tools**:
  - `@mcp.tool() fetch_hr_emails(limit: int)`: 
    Connects to the inbox (currently simulated) to extract raw applicant data from unread emails. It returns a JSON string containing the sender email, subject, and body.
  - `@mcp.tool() store_applicant_data(name, email, position, notes)`:
    Takes the extracted elements parsed by the AI and saves them permanently using our database module.
  - `@mcp.tool() export_to_excel()`:
    Reads all applicants from the database, converts them to a `pandas` DataFrame, and writes them to `applicant_report.xlsx` in the root folder.

**Note**: To use this with OpenClaw, the absolute path of this Python script must be registered in OpenClaw's `config.yaml` file pointing to the virtual environment's Python executable.
