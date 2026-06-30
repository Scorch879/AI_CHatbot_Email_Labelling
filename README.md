# HR Email Automation AI Chatbot

An AI-powered agent (via Model Context Protocol) that automates the Lifewood HR applicant workflow. It extracts applicant data from emails, stores it in a SQLite database, and generates Excel reports, all accessible via a WhatsApp chatbot (powered by OpenClaw and ClawHub Skills).

## Features
- **MCP Server**: Provides python-based tools to fetch emails, save data, and generate Excel reports.
- **WhatsApp Integration**: Allows interacting with the system remotely.
- **Cron Tasks**: Automated daily syncing and reporting.

## Setup Instructions
1. Clone the repository.
2. Setup the python virtual environment:
   ```powershell
   python -m venv lifewood-hr-mcp/venv
   lifewood-hr-mcp/venv/Scripts\activate
   pip install -r requirements.txt
   ```
3. Create a `.env` file based on your credentials (refer to `environment_setup_guide.md` in the docs).
4. Run the OpenClaw service with the included `config.yaml` and load the `skills/hr_email_assistant.yaml` skill.

Please read the `docs/` folder for comprehensive documentation on the architecture and components.