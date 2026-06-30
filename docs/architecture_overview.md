# Architecture Overview

This project implements an AI-powered HR Email Automation Chatbot using the Model Context Protocol (MCP), OpenClaw, ClawHub Skills, and WhatsApp.

## Key Components

1. **Database Layer** (`database/`): 
   A local SQLite database designed to securely store and structure the applicant data parsed from HR emails.
2. **MCP Server** (`lifewood-hr-mcp/`): 
   A Python-based MCP server providing standardized tools that the AI (Gemini) can invoke. These tools perform the actual logic of extracting emails, storing data, and exporting Excel reports.
3. **ClawHub Skills** (`skills/`): 
   YAML definitions mapping WhatsApp chatbot user prompts to the MCP server tools, bridging the AI's natural language understanding with the underlying python logic.
4. **Cron Automation** (`cron/`): 
   A scheduler script to run specific data synchronization and reporting tasks without manual intervention.

## System Flow

- **Manual Trigger**: The user texts the WhatsApp bot -> OpenClaw processes the message -> Evaluates `hr_email_assistant.yaml` -> Invokes the corresponding MCP Tool in `server.py` -> Returns the result to the user.
- **Automated Trigger**: The cron script runs -> Directly invokes the MCP server methods -> Syncs data or produces an Excel file at scheduled intervals.
