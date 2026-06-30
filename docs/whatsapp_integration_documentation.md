# WhatsApp Integration Documentation

This module defines how OpenClaw interacts with our MCP Server based on user input from WhatsApp.

## Files Created

### 1. `skills/hr_email_assistant.yaml`
- **Purpose**: A ClawHub Skill configuration file that tells OpenClaw how to act when receiving commands.
- **Components**:
  - `name & description`: Meta-information for OpenClaw to register the skill.
  - `system_prompt`: Instructs the AI (Gemini) on its persona (Lifewood HR Email Assistant) and outlines the step-by-step logic it must follow when parsing natural language into tool calls.
  - `tools`: An explicit list of MCP tools (`fetch_hr_emails`, `store_applicant_data`, `export_to_excel`) that the agent is permitted to execute.

When a WhatsApp message is received, OpenClaw injects this system prompt and gives the model access to these tools, effectively creating an autonomous HR pipeline on demand.
