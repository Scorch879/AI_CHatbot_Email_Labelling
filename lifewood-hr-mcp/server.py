from __future__ import annotations

import email
import imaplib
import io
import json
import os
import re
import sys
import threading
import time
import uuid
from datetime import datetime
from email.header import decode_header
from email.message import Message
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
import requests
from docx import Document
from dotenv import load_dotenv
from pypdf import PdfReader


# Allow imports from the project root when this file is launched by MCP.
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT_DIR)

load_dotenv(os.path.join(ROOT_DIR, ".env"))
load_dotenv(os.path.join(ROOT_DIR, "lifewood-hr-mcp", ".env"))

from database.db_handler import (
    get_all_applicants,
    insert_applicant,
    insert_applicant_email,
    insert_applicant_document,
    normalize_priority,
    normalize_status,
)


JOBS: Dict[str, Dict[str, Any]] = {}
JOBS_LOCK = threading.Lock()


def _set_job(job_id: str, **updates: Any) -> None:
    with JOBS_LOCK:
        JOBS.setdefault(job_id, {})
        JOBS[job_id].update(updates)


def _get_job(job_id: str) -> Optional[Dict[str, Any]]:
    with JOBS_LOCK:
        if job_id == "latest" and JOBS:
            latest_id = max(JOBS, key=lambda jid: JOBS[jid].get("started_at", 0))
            return {"job_id": latest_id, **JOBS[latest_id]}

        job = JOBS.get(job_id)
        return {"job_id": job_id, **job} if job else None


try:
    from mcp.server.fastmcp import FastMCP

    mcp = FastMCP("lifewood-hr-tools")

except ImportError:
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
    """
    Return a readable plain-text body from an email message.
    """
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = str(part.get("Content-Disposition", "")).lower()

            if content_type == "text/plain" and "attachment" not in disposition:
                payload = part.get_payload(decode=True)

                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    return payload.decode(charset, errors="replace").strip()

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
            return "\n".join(
                paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip()
            ).strip()

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

        with open(file_path, "wb") as file:
            file.write(payload)

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
            "body": (
                "Hi, I'm John Doe. I am applying for the Software Engineer position. "
                "I have 5 years of Python, Django, and SQL experience."
            ),
            "attachments": [],
        },
        {
            "email_message_id": "demo-002",
            "subject": "Data Analyst Application",
            "from": "jane.smith@example.com",
            "date": datetime.now().isoformat(),
            "body": (
                "Dear HR, my name is Jane Smith. I want to apply for the Data Analyst role. "
                "I know SQL, Excel, Power BI, and dashboard reporting."
            ),
            "attachments": [],
        },
    ]


@mcp.tool()
def fetch_hr_emails(limit: int = 2, unread_only: bool = False) -> str:
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
                # BODY.PEEK[] prevents marking emails as read.
                status, msg_data = mail.fetch(message_id, "(BODY.PEEK[])")

                if status != "OK" or not msg_data:
                    continue

                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)

                email_message_id = msg.get("Message-ID") or message_id.decode()
                attachments = _extract_attachments(msg, email_message_id)

                results.append(
                    {
                        "email_message_id": email_message_id,
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
            "keep_alive": "30m",
            "options": {
                "temperature": 0,
                "num_predict": 300,
            },
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


def _build_attachment_summary(
    attachments: List[Dict[str, Any]],
    ai_summary: Optional[str] = None,
) -> Optional[str]:
    if not attachments:
        return None

    bad_summaries = {
        "summary of attachments",
        "attachment summary",
        "resume attached",
        "attachment text:",
        "file attached",
    }

    lines = []

    if ai_summary and ai_summary.strip().lower() not in bad_summaries:
        lines.append(ai_summary.strip())

    for attachment in attachments:
        filename = attachment.get("filename") or "attachment"
        text = " ".join((attachment.get("text") or "").split())

        if text:
            lines.append(f"{filename}: {text[:500]}")
        else:
            lines.append(f"{filename}: file attached, but no readable text was extracted")

    return "\n".join(lines)


@mcp.tool()
def extract_applicant_with_ollama(email_json: str) -> str:
    """
    Extract applicant details and category from an email using local Ollama.

    Input should be one email object as JSON string with subject, from, date, body, and attachments.
    """
    try:
        email_data = json.loads(email_json) if isinstance(email_json, str) else email_json

    except json.JSONDecodeError as exc:
        return json.dumps({"error": f"Invalid email_json: {exc}"}, indent=2)

    attachments = email_data.get("attachments", [])

    attachment_text_parts = []
    attachment_files = []

    for attachment in attachments:
        filename = attachment.get("filename")
        text = (attachment.get("text") or "").strip()

        if filename:
            attachment_files.append(filename)

        if text:
            attachment_text_parts.append(f"File: {filename}\n{text}")

    attachment_text = "\n\n".join(attachment_text_parts)
    attachment_text = attachment_text[: int(os.getenv("ATTACHMENT_TEXT_LIMIT", "10000"))]

    prompt = f"""
You are an HR applicant email extraction assistant.
Extract applicant details from the email below and return ONLY valid JSON.

Required JSON keys:
- name: applicant full name or null
- email: applicant email address or null
- phone: phone number or null
- position: job position applied for or null
- status: exactly one of ["new", "screening", "interview", "offer", "rejected"]
- priority: exactly one of ["urgent", "important", "follow_up", "not_important"]
- category: one of ["Software/IT", "Data", "Operations", "Admin", "Internship", "Other"]
- skills: array of important skills mentioned
- experience_years: number or null
- education: education/course/school if mentioned, else null
- notes: short HR-friendly summary
- ai_confidence: number from 0 to 1
- resume_summary: short summary of resume/attachment if available, else null
- attachment_summary: short summary of all attachments if available, else null

Priority guide:
- urgent: strong/high-priority applicant, urgent hiring, interview-ready, highly qualified
- important: relevant applicant with good skills/experience
- follow_up: needs follow-up, missing details, unclear application, needs review
- not_important: unrelated, weak match, spam-like, or not urgent

Email metadata:
Subject: {email_data.get("subject", "")}
From: {email_data.get("from", "")}
Date: {email_data.get("date", "")}

Email body:
{email_data.get("body", "")}

Attachment text:
{attachment_text}
""".strip()

    try:
        extracted = _ollama_generate_json(prompt)

        # Fallback email from header if the model cannot find it.
        if not extracted.get("email"):
            match = re.search(
                r"[\w.\-+]+@[\w\-]+(?:\.[\w\-]+)+",
                email_data.get("from", ""),
            )

            if match:
                extracted["email"] = match.group(0)

        extracted["email_message_id"] = email_data.get("email_message_id")
        extracted["email_subject"] = email_data.get("subject")
        extracted["email_date"] = email_data.get("date")
        extracted["email_from"] = email_data.get("from")
        extracted["raw_email"] = email_data.get("body")

        extracted["attachment_files"] = attachment_files if attachment_files else None
        extracted["_attachments"] = attachments

        extracted["resume_text"] = attachment_text[:10000] if attachment_text else None

        extracted["resume_summary"] = (
            extracted.get("resume_summary")
            or (attachment_text[:700] if attachment_text else None)
        )

        extracted["attachment_summary"] = _build_attachment_summary(
            attachments,
            extracted.get("attachment_summary"),
        )

        extracted["source"] = "Email"
        extracted["priority"] = normalize_priority(extracted.get("priority"))
        extracted["status"] = normalize_status(extracted.get("status"))

        return json.dumps(extracted, indent=2)

    except Exception as exc:
        return json.dumps({"error": f"Ollama extraction failed: {exc}"}, indent=2)


@mcp.tool()
def store_applicant_data(
    applicant_json: str = "",
    name: str = "",
    email: str = "",
    position: str = "",
    notes: str = "",
) -> str:
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
                "status": "new",
                "source": "Email",
                "priority": "not_important",
            }

        if applicant.get("error"):
            return f"Skipped applicant because extraction failed: {applicant['error']}"

        attachments = applicant.pop("_attachments", [])

        applicant["priority"] = normalize_priority(applicant.get("priority"))
        applicant["status"] = normalize_status(applicant.get("status"))

        applicant_id = insert_applicant(applicant)

        if applicant_id and applicant_id != "saved":
            insert_applicant_email(
                applicant_id,
                {
                    "message_id": applicant.get("email_message_id"),
                    "from": applicant.get("email_from") or applicant.get("email"),
                    "to": None,
                    "subject": applicant.get("email_subject"),
                    "body": applicant.get("raw_email"),
                    "date": applicant.get("email_date"),
                },
            )

            if attachments:
                for attachment in attachments:
                    insert_applicant_document(
                        applicant_id,
                        {
                            "file_name": attachment.get("filename"),
                            "file_type": attachment.get("content_type"),
                            "extracted_text": attachment.get("text"),
                            "ai_summary": applicant.get("resume_summary")
                            or applicant.get("attachment_summary"),
                            "confidence_score": applicant.get("ai_confidence")
                            or applicant.get("confidence_score"),
                        },
                    )

            else:
                attachment_files = applicant.get("attachment_files") or []

                if isinstance(attachment_files, str):
                    attachment_files = [attachment_files]

                for filename in attachment_files:
                    insert_applicant_document(
                        applicant_id,
                        {
                            "file_name": filename,
                            "file_type": None,
                            "extracted_text": applicant.get("resume_text"),
                            "ai_summary": applicant.get("resume_summary")
                            or applicant.get("attachment_summary"),
                            "confidence_score": applicant.get("ai_confidence")
                            or applicant.get("confidence_score"),
                        },
                    )

        applicant_name = applicant.get("name") or applicant.get("email") or "Applicant"
        return f"Successfully stored {applicant_name} in Supabase with ID {applicant_id}."

    except Exception as exc:
        return f"Could not store applicant in Supabase. Error: {exc}"


def _is_application_email(email_data: Dict[str, Any]) -> bool:
    keywords = os.getenv(
        "APPLICATION_KEYWORDS",
        "application,applying,apply,resume,cv,curriculum vitae,job application,internship,position,hiring",
    )

    keyword_list = [keyword.strip().lower() for keyword in keywords.split(",") if keyword.strip()]

    text = f"""
    {email_data.get("subject", "")}
    {email_data.get("from", "")}
    {email_data.get("body", "")}
    """.lower()

    return any(keyword in text for keyword in keyword_list)


def _process_new_applicant_emails_sync(limit: int = 2) -> Dict[str, Any]:
    """
    Actual heavy workflow. This runs in the background.
    """
    limit = min(max(int(limit or 2), 1), 5)

    # unread_only=False means it checks latest emails, not only unread emails.
    fetched = json.loads(fetch_hr_emails(limit=limit, unread_only=False))

    if isinstance(fetched, dict) and fetched.get("error"):
        return fetched

    summary = []
    skipped = []

    for email_data in fetched:
        if not _is_application_email(email_data):
            skipped.append(
                {
                    "subject": email_data.get("subject"),
                    "result": "Skipped: not an application email",
                }
            )
            continue

        extracted_json = extract_applicant_with_ollama(json.dumps(email_data))
        extracted = json.loads(extracted_json)

        if extracted.get("error"):
            skipped.append(
                {
                    "subject": email_data.get("subject"),
                    "result": extracted.get("error"),
                }
            )
            continue

        store_result = store_applicant_data(applicant_json=extracted_json)

        summary.append(
            {
                "subject": email_data.get("subject"),
                "applicant": extracted.get("name") or extracted.get("email") or "Unknown applicant",
                "position": extracted.get("position") or "Not specified",
                "category": extracted.get("category") or "Uncategorized",
                "priority": extracted.get("priority") or "not_important",
                "result": store_result,
            }
        )

    return {
        "processed_count": len(summary),
        "skipped_count": len(skipped),
        "items": summary,
        "skipped": skipped,
    }


def _clean_value(value: Any, fallback: str = "Not specified") -> str:
    if value is None:
        return fallback

    value = str(value).strip()

    if not value or value.lower() == "null":
        return fallback

    return value


def _format_processing_result(result: Dict[str, Any]) -> str:
    if result.get("error"):
        return f"Sorry, I couldn’t complete the applicant email check. Error: {result['error']}"

    items = result.get("items", [])
    applicant_lines = []

    for idx, item in enumerate(items, start=1):
        name = _clean_value(item.get("applicant"), "Unknown applicant")
        position = _clean_value(item.get("position"))
        category = _clean_value(item.get("category"), "Uncategorized")
        priority = _clean_value(item.get("priority"), "not_important")

        applicant_lines.append(f"{idx}. {name} — {position} — {category} — {priority}")

    if applicant_lines:
        applicants_text = "\n".join(applicant_lines)
    else:
        applicants_text = "No new applicant records were found."

    return f"""
Done. I checked the applicant emails.

Result:
- New applicants saved: {result.get("processed_count", 0)}
- Emails skipped: {result.get("skipped_count", 0)}

Applicants:
{applicants_text}

Send 'report' if you want to generate the Excel file.
""".strip()


def _run_applicant_job(job_id: str, limit: int) -> None:
    try:
        _set_job(job_id, status="running", message="Processing applicant emails...")

        result = _process_new_applicant_emails_sync(limit=limit)

        _set_job(
            job_id,
            status="done",
            finished_at=time.time(),
            result=result,
            summary=_format_processing_result(result),
        )

    except Exception as exc:
        _set_job(
            job_id,
            status="failed",
            finished_at=time.time(),
            error=str(exc),
        )


@mcp.tool()
def start_applicant_processing(limit: int = 2) -> str:
    """
    Start applicant email processing in the background and return immediately.
    """
    limit = min(max(int(limit or 2), 1), 5)
    job_id = str(uuid.uuid4())[:8]

    _set_job(
        job_id,
        status="queued",
        started_at=time.time(),
        limit=limit,
        message="Queued applicant email processing.",
    )

    thread = threading.Thread(
        target=_run_applicant_job,
        args=(job_id, limit),
        daemon=True,
    )
    thread.start()

    return (
        f"I started checking the latest {limit} applicant email(s). "
        f"I’ll save any applicant records I find. "
        f"Send 'status' to check the progress, or 'report' when you want an Excel file."
    )


@mcp.tool()
def get_processing_status(job_id: str = "latest") -> str:
    """
    Check status of the latest or specific applicant processing job.
    """
    job = _get_job(job_id)

    if not job:
        return "No processing job found yet."

    status = job.get("status")

    if status == "done":
        return job.get("summary", "Done. The applicant email check is complete.")

    if status == "failed":
        return (
            "Sorry, I couldn’t finish checking the applicant emails. "
            f"Error: {job.get('error', 'Unknown error')}"
        )

    return "I’m still checking the applicant emails. Please send 'status' again in a moment."


@mcp.tool()
def process_new_applicant_emails(limit: int = 2) -> str:
    """
    WhatsApp-friendly version: starts processing in the background instead of waiting.
    """
    return start_applicant_processing(limit=limit)


@mcp.tool()
def get_latest_applicant_summary(limit: int = 5) -> str:
    """
    Quickly summarize latest applicants already saved in Supabase.
    """
    try:
        limit = min(max(int(limit or 5), 1), 10)
        applicants = get_all_applicants(limit=limit)

        if not applicants:
            return "No applicants found in Supabase yet."

        lines = []

        for idx, applicant in enumerate(applicants, start=1):
            name = _clean_value(
                applicant.get("name") or applicant.get("email"),
                "Unknown applicant",
            )
            position = _clean_value(applicant.get("position"))
            category = _clean_value(applicant.get("category"), "Uncategorized")
            status = _clean_value(applicant.get("status"), "new")
            priority = _clean_value(applicant.get("priority"), "not_important")

            lines.append(f"{idx}. {name} — {position} — {category} — {status} — {priority}")

        return f"""
Latest {len(applicants)} applicant record(s):

{chr(10).join(lines)}
""".strip()

    except Exception as exc:
        return f"Could not fetch latest applicants. Error: {exc}"


def _whatsapp_token() -> str:
    """
    Return the configured WhatsApp Cloud API token.

    WHATSAPP_CLOUD_TOKEN is kept for compatibility with the existing project.
    WHATSAPP_ACCESS_TOKEN and WA_ACCESS_TOKEN are accepted as common aliases.
    """
    return (
        os.getenv("WHATSAPP_CLOUD_TOKEN")
        or os.getenv("WHATSAPP_ACCESS_TOKEN")
        or os.getenv("WA_ACCESS_TOKEN")
        or ""
    ).strip()


def _send_whatsapp_document(
    file_path: str,
    to_number: str,
    caption: str = "Applicant Excel report",
) -> str:
    """
    Send a local file as a WhatsApp document using WhatsApp Cloud API.
    """
    token = _whatsapp_token()
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()
    graph_api_version = os.getenv("WHATSAPP_GRAPH_API_VERSION", "v20.0").strip() or "v20.0"

    if not os.path.exists(file_path):
        return "WhatsApp sending skipped because the Excel file does not exist."

    if not token or not phone_number_id:
        return (
            "WhatsApp sending skipped because it is not fully configured. "
            "Check WHATSAPP_CLOUD_TOKEN or WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID."
        )

    to_number = str(to_number).replace("+", "").replace(" ", "").strip()

    if not to_number:
        return "WhatsApp sending skipped because no recipient number was provided."

    filename = os.path.basename(file_path)
    mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    headers = {
        "Authorization": f"Bearer {token}",
    }

    media_url = f"https://graph.facebook.com/{graph_api_version}/{phone_number_id}/media"

    with open(file_path, "rb") as file_data:
        upload_response = requests.post(
            media_url,
            headers=headers,
            data={
                "messaging_product": "whatsapp",
                "type": mime_type,
            },
            files={
                "file": (filename, file_data, mime_type),
            },
            timeout=60,
        )

    if upload_response.status_code >= 400:
        return (
            "WhatsApp upload failed. The Excel file is still saved locally. "
            f"Details: {upload_response.text}"
        )

    media_id = upload_response.json().get("id")

    if not media_id:
        return (
            "WhatsApp upload failed because no media ID was returned. "
            "The Excel file is still saved locally."
        )

    message_url = f"https://graph.facebook.com/{graph_api_version}/{phone_number_id}/messages"

    send_response = requests.post(
        message_url,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "document",
            "document": {
                "id": media_id,
                "filename": filename,
                "caption": caption,
            },
        },
        timeout=60,
    )

    if send_response.status_code >= 400:
        return (
            "WhatsApp sending failed. The Excel file is still saved locally. "
            f"Details: {send_response.text}"
        )

    return "The applicant Excel report was sent to WhatsApp."


@mcp.tool()
def export_to_excel(to_number: str = "", send_to_whatsapp: bool = True) -> str:
    """
    Manually export applicant data from Supabase to an Excel file.

    This tool should be called only when the HR user asks for a report/export.
    It is intentionally separate from the email ingestion workflow so the backend
    does not create a new Excel file every time it runs.
    """
    try:
        applicants = get_all_applicants()

        if not applicants:
            return "No applicant records are available to export."

        df = pd.DataFrame(applicants)

        export_path = os.getenv(
            "EXCEL_OUTPUT_PATH",
            os.path.join(ROOT_DIR, "exports", "applicant_report.xlsx"),
        )

        if not os.path.isabs(export_path):
            export_path = os.path.join(ROOT_DIR, export_path)

        os.makedirs(os.path.dirname(export_path), exist_ok=True)
        df.to_excel(export_path, index=False)

        message_lines = [
            "The applicant Excel report was created successfully.",
            f"Saved file: {export_path}",
        ]

        recipient = to_number or os.getenv("WHATSAPP_DEFAULT_RECIPIENT", "")

        if send_to_whatsapp and recipient:
            send_result = _send_whatsapp_document(
                file_path=export_path,
                to_number=recipient,
                caption="Applicant Excel report",
            )
            message_lines.append(send_result)

        elif send_to_whatsapp and not recipient:
            message_lines.append(
                "WhatsApp sending skipped because no recipient number was provided."
            )

        else:
            message_lines.append("WhatsApp sending skipped by request.")

        return "\n".join(message_lines)

    except Exception as exc:
        return f"Sorry, I couldn’t create the applicant Excel report. Error: {exc}"


if __name__ == "__main__":
    mcp.run(transport="stdio")