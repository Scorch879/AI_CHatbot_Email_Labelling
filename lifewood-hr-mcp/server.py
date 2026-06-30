from __future__ import annotations
import io
from pathlib import Path
from pypdf import PdfReader
from docx import Document
import email
import imaplib
import json
import os
import re
import sys
from datetime import datetime
from email.header import decode_header
from email.message import Message
from email.utils import parsedate_to_datetime
from typing import Any, Dict, List, Optional

import pandas as pd
import requests
from dotenv import load_dotenv

# Allow imports from the project root when this file is launched by MCP.
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT_DIR)

load_dotenv(os.path.join(ROOT_DIR, ".env"))
load_dotenv(os.path.join(ROOT_DIR, "lifewood-hr-mcp", ".env"))

from database.db_handler import get_all_applicants, insert_applicant

try:
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("lifewood-hr-tools")
except ImportError:
    # Allows direct local testing even before mcp is installed.
    class _FallbackMCP:
        def tool(self):
            def decorator(func):
                return func
            return decorator

        def run(self, *args, **kwargs):
            print("MCP is not installed. Run: pip install -r requirements.txt")

    mcp = _FallbackMCP()


def _decode_mime_words(value: Optional[str]) -> str:
    if not value:
        return ""
    decoded_parts = decode_header(value)
    output = ""
    for text, charset in decoded_parts:
        if isinstance(text, bytes):
            output += text.decode(charset or "utf-8", errors="replace")
        else:
            output += text
    return output


def _extract_text_body(msg: Message) -> str:
    """Return a readable plain-text body from an email message."""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = str(part.get("Content-Disposition", "")).lower()

            if content_type == "text/plain" and "attachment" not in disposition:
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    return payload.decode(charset, errors="replace").strip()

        # Fallback to HTML if no plain text is available.
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    html = payload.decode(charset, errors="replace")
                    return re.sub(r"<[^>]+>", " ", html).strip()
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            return payload.decode(charset, errors="replace").strip()

    return ""

def _safe_filename(filename: str) -> str:
    filename = filename or "attachment"
    return re.sub(r"[^a-zA-Z0-9._-]", "_", filename)


def _extract_text_from_attachment(filename: str, content_type: str, data: bytes) -> str:
    filename_lower = filename.lower()

    try:
        if filename_lower.endswith(".pdf") or content_type == "application/pdf":
            reader = PdfReader(io.BytesIO(data))
            pages = []
            for page in reader.pages:
                pages.append(page.extract_text() or "")
            return "\n".join(pages).strip()

        if filename_lower.endswith(".docx"):
            doc = Document(io.BytesIO(data))
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()

        if filename_lower.endswith(".txt") or content_type.startswith("text/"):
            return data.decode("utf-8", errors="replace").strip()

    except Exception as exc:
        return f"[Could not extract text from {filename}: {exc}]"

    return ""


def _extract_attachments(msg: Message, email_message_id: str) -> List[Dict[str, Any]]:
    attachments = []

    attachments_dir = Path(ROOT_DIR) / "attachments"
    attachments_dir.mkdir(exist_ok=True)

    safe_email_id = _safe_filename(email_message_id.replace("<", "").replace(">", ""))
    email_dir = attachments_dir / safe_email_id
    email_dir.mkdir(exist_ok=True)

    for part in msg.walk():
        filename = part.get_filename()
        disposition = str(part.get("Content-Disposition", "")).lower()

        if not filename and "attachment" not in disposition:
            continue

        filename = _decode_mime_words(filename or "attachment")
        safe_name = _safe_filename(filename)
        content_type = part.get_content_type()

        payload = part.get_payload(decode=True)
        if not payload:
            continue

        file_path = email_dir / safe_name
        with open(file_path, "wb") as f:
            f.write(payload)

        extracted_text = _extract_text_from_attachment(
            filename=safe_name,
            content_type=content_type,
            data=payload,
        )

        attachments.append(
            {
                "filename": safe_name,
                "content_type": content_type,
                "path": str(file_path),
                "size_bytes": len(payload),
                "text": extracted_text,
            }
        )

    return attachments


def _parse_email_date(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).isoformat()
    except Exception:
        return None


def _demo_emails() -> List[Dict[str, Any]]:
    return [
        {
            "email_message_id": "demo-001",
            "subject": "Application for Software Engineer",
            "from": "john.doe@example.com",
            "date": datetime.now().isoformat(),
            "body": "Hi, I'm John Doe. I am applying for the Software Engineer position. I have 5 years of Python, Django, and SQL experience.",
        },
        {
            "email_message_id": "demo-002",
            "subject": "Data Analyst Application",
            "from": "jane.smith@example.com",
            "date": datetime.now().isoformat(),
            "body": "Dear HR, my name is Jane Smith. I want to apply for the Data Analyst role. I know SQL, Excel, Power BI, and dashboard reporting.",
        },
    ]


@mcp.tool()
def fetch_hr_emails(limit: int = 100, unread_only: bool = False) -> str:
    """
    Fetch applicant emails from the HR inbox using IMAP.

    Required .env values:
    HR_EMAIL_ADDRESS, HR_EMAIL_PASSWORD, IMAP_SERVER, IMAP_PORT

    Set DEMO_MODE=true to return sample emails without connecting to an inbox.
    """
    if os.getenv("DEMO_MODE", "false").lower() == "true":
        return json.dumps(_demo_emails()[:limit], indent=2)

    address = os.getenv("HR_EMAIL_ADDRESS")
    password = os.getenv("HR_EMAIL_PASSWORD")
    imap_server = os.getenv("IMAP_SERVER", "imap.gmail.com")
    imap_port = int(os.getenv("IMAP_PORT", "993"))
    mailbox = os.getenv("IMAP_MAILBOX", "INBOX")

    if not address or not password:
        return json.dumps(
            {"error": "Missing HR_EMAIL_ADDRESS or HR_EMAIL_PASSWORD in .env."},
            indent=2,
        )

    results: List[Dict[str, Any]] = []

    try:
        with imaplib.IMAP4_SSL(imap_server, imap_port) as mail:
            mail.login(address, password)
            mail.select(mailbox)

            search_filter = "UNSEEN" if unread_only else "ALL"
            status, data = mail.search(None, search_filter)
            if status != "OK":
                return json.dumps({"error": "Unable to search inbox."}, indent=2)

            message_ids = data[0].split()[-limit:]
            for message_id in reversed(message_ids):
                status, msg_data = mail.fetch(message_id, "(RFC822)")
                if status != "OK" or not msg_data:
                    continue

                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)
                email_message_id = msg.get("Message-ID") or message_id.decode()
                attachments = _extract_attachments(msg,email_message_id)

                results.append(
                    {
                        "email_message_id": msg.get("Message-ID") or message_id.decode(),
                        "subject": _decode_mime_words(msg.get("Subject")),
                        "from": _decode_mime_words(msg.get("From")),
                        "date": _parse_email_date(msg.get("Date")),
                        "body": _extract_text_body(msg),
                        "attachments": attachments,
                    }
                )

        return json.dumps(results, indent=2)
    except Exception as exc:
        return json.dumps({"error": f"Email fetch failed: {exc}"}, indent=2)


def _ollama_generate_json(prompt: str) -> Dict[str, Any]:
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

    response = requests.post(
        f"{ollama_url}/api/generate",
        json={
            "model": model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        },
        timeout=int(os.getenv("OLLAMA_TIMEOUT", "120")),
    )
    response.raise_for_status()
    payload = response.json()
    raw = payload.get("response", "{}").strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise ValueError(f"Ollama did not return valid JSON: {raw[:300]}")


@mcp.tool()
def extract_applicant_with_ollama(email_json: str) -> str:
    """
    Extract applicant details and category from an email using local Ollama.

    Input should be one email object as JSON string with subject, from, date, and body.
    """
    try:
        email_data = json.loads(email_json) if isinstance(email_json, str) else email_json
    except json.JSONDecodeError as exc:
        return json.dumps({"error": f"Invalid email_json: {exc}"}, indent=2)

    attachments = email_data.get("attachments", [])
    attachment_text = "\n\n".join([
        f"File: {att.get('filename')}\n{att.get('text', '')}"
        for att in attachments
        if att.get("text")
        ]
    )
    attachment_files = [att.get("filename") for att in attachments if att.get("path")]
    prompt = f"""
You are an HR applicant email extraction assistant.
Extract applicant details from the email below and return ONLY valid JSON.

Required JSON keys:
- name: applicant full name or null
- email: applicant email address or null
- phone: phone number or null
- position: job position applied for or null
- status: use "New"
- category: one of ["Software/IT", "Data", "Operations", "Admin", "Internship", "Other"]
- skills: array of important skills mentioned
- experience_years: number or null
- education: education/course/school if mentioned, else null
- notes: short HR-friendly summary
- ai_confidence: number from 0 to 1
- resume_summary: short summary of resume/attachment if available, else null
- attachment_summary: short summary of all attachments if available, else null

Email metadata:
Subject: {email_data.get('subject', '')}
From: {email_data.get('from', '')}
Date: {email_data.get('date', '')}

Email body:
Attachment text:
attachment_text = attachment_text[:int(os.getenv("ATTACHMENT_TEXT_LIMIT", "12000"))]
{attachment_text}
{email_data.get('body', '')}
""".strip()

    try:
        extracted = _ollama_generate_json(prompt)

        # Fallback email from header if the model cannot find it.
        if not extracted.get("email"):
            match = re.search(r"[\w.\-+]+@[\w\-]+(?:\.[\w\-]+)+", email_data.get("from", ""))
            if match:
                extracted["email"] = match.group(0)

        extracted["email_message_id"] = email_data.get("email_message_id")
        extracted["email_subject"] = email_data.get("subject")
        extracted["email_date"] = email_data.get("date")
        extracted["raw_email"] = email_data.get("body")
        extracted["attachment_files"] = attachment_files
        extracted["resume_text"] = attachment_text[:10000] if attachment_text else None
        extracted["resume_summary"] = extracted.get("resume_summary")
        extracted["attachment_summary"] = extracted.get("attachment_summary")
        extracted["source"] = "Email"
        extracted.setdefault("status", "New")

        return json.dumps(extracted, indent=2)
    except Exception as exc:
        return json.dumps({"error": f"Ollama extraction failed: {exc}"}, indent=2)


@mcp.tool()
def store_applicant_data(applicant_json: str = "", name: str = "", email: str = "", position: str = "", notes: str = "") -> str:
    """
    Store applicant data into Supabase.

    Preferred input: applicant_json from extract_applicant_with_ollama.
    Legacy input is also supported: name, email, position, notes.
    """
    try:
        if applicant_json:
            applicant = json.loads(applicant_json)
        else:
            applicant = {
                "name": name,
                "email": email,
                "position": position,
                "notes": notes,
                "status": "New",
                "source": "Email",
            }

        if applicant.get("error"):
            return f"Skipped applicant because extraction failed: {applicant['error']}"

        applicant_id = insert_applicant(applicant)
        applicant_name = applicant.get("name") or applicant.get("email") or "Applicant"
        return f"Successfully stored {applicant_name} in Supabase with ID {applicant_id}."
    except Exception as exc:
        return f"Error storing applicant in Supabase: {exc}"


@mcp.tool()
def _is_application_email(email_data: dict) -> bool:
    keywords = os.getenv(
        "APPLICATION_KEYWORDS",
        "application,applying,apply,resume,cv,curriculum vitae,job application,internship,position,hiring"
    )

    keyword_list = [k.strip().lower() for k in keywords.split(",") if k.strip()]

    text = f"""
    {email_data.get("subject", "")}
    {email_data.get("from", "")}
    {email_data.get("body", "")}
    """.lower()

    return any(keyword in text for keyword in keyword_list)

@mcp.tool()
def process_new_applicant_emails(limit: int = 100) -> str:
    """
    End-to-end workflow: fetch unread HR application emails, extract with Ollama, and save to Supabase.
    """
    try:
        fetched = json.loads(fetch_hr_emails(limit=limit, unread_only=False))
        if isinstance(fetched, dict) and fetched.get("error"):
            return json.dumps(fetched, indent=2)

        summary = []
        skipped = []

        for email_data in fetched:
            if not _is_application_email(email_data):
                skipped.append({
                    "subject": email_data.get("subject"),
                    "result": "Skipped: not an application email"
                })
                continue

            extracted_json = extract_applicant_with_ollama(json.dumps(email_data))
            extracted = json.loads(extracted_json)
            store_result = store_applicant_data(applicant_json=extracted_json)

            summary.append({
                "subject": email_data.get("subject"),
                "applicant": extracted.get("name") or extracted.get("email"),
                "position": extracted.get("position"),
                "category": extracted.get("category"),
                "result": store_result,
            })

        return json.dumps(
            {
                "processed_count": len(summary),
                "skipped_count": len(skipped),
                "items": summary,
                "skipped": skipped,
            },
            indent=2,
        )

    except Exception as exc:
        return json.dumps({"error": f"Workflow failed: {exc}"}, indent=2)

@mcp.tool()
def export_to_excel() -> str:
    """Export applicant data from Supabase to an Excel file."""
    try:
        applicants = get_all_applicants()
        if not applicants:
            return "No applicants found in Supabase to export."

        df = pd.DataFrame(applicants)
        export_path = os.getenv(
            "EXCEL_OUTPUT_PATH",
            os.path.join(ROOT_DIR, "exports", "applicant_report.xlsx"),
        )
        if not os.path.isabs(export_path):
            export_path = os.path.join(ROOT_DIR, export_path)

        os.makedirs(os.path.dirname(export_path), exist_ok=True)
        df.to_excel(export_path, index=False)
        return f"Successfully exported applicant data to {export_path}"
    except Exception as exc:
        return f"Error exporting to Excel: {exc}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
