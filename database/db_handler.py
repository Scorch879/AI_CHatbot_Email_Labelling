"""Supabase database helper for the HR Email Automation MCP server."""

from __future__ import annotations
import os
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

# Load both root .env and lifewood-hr-mcp/.env when the server is run directly.
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(ROOT_DIR, ".env"))
load_dotenv(os.path.join(ROOT_DIR, "lifewood-hr-mcp", ".env"))


class SupabaseConfigError(RuntimeError):
    """Raised when Supabase credentials are missing."""


def _get_supabase_client():
    """
    Create a Supabase client only when needed.

    Keep this lazy so importing the MCP server still works even before the user
    has installed dependencies or filled in .env values.
    """
    try:
        from supabase import create_client
    except ImportError as exc:
        raise SupabaseConfigError(
            "The 'supabase' package is not installed. Run: pip install -r requirements.txt"
        ) from exc

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise SupabaseConfigError(
            "Missing Supabase credentials. Add SUPABASE_URL and SUPABASE_KEY to your .env file."
        )

    return create_client(supabase_url, supabase_key)


def _table_name() -> str:
    return os.getenv("SUPABASE_APPLICANTS_TABLE", "applicants")


def normalize_priority(priority: Any) -> str:
    allowed_priorities = {
        "urgent": "urgent",
        "high": "urgent",

        "important": "important",
        "medium": "important",

        "follow_up": "follow_up",
        "follow-up": "follow_up",
        "follow up": "follow_up",

        "low": "not_important",
        "normal": "not_important",
        "muted": "not_important",
        "not important": "not_important",
        "not_important": "not_important",
    }

    return allowed_priorities.get(
        str(priority or "").lower().strip(),
        "not_important"
    )


def normalize_status(status: Any) -> str:
    allowed_statuses = {
        "new": "new",
        "screening": "screening",
        "interview": "interview",
        "offer": "offer",
        "rejected": "rejected",
    }

    return allowed_statuses.get(
        str(status or "").lower().strip(),
        "new"
    )

def insert_applicant(applicant: Dict[str, Any]) -> Any:
    """
    Insert one applicant into Supabase.

    If email_message_id is present, upsert is used so the same inbox email is not
    duplicated when the scheduler runs again.
    """
    client = _get_supabase_client()
    table = _table_name()

    cleaned = {key: value for key, value in applicant.items() if value not in (None, "")}
    cleaned["priority"] = normalize_priority(cleaned.get("priority"))
    cleaned["status"] = normalize_status(cleaned.get("status"))


    if cleaned.get("email_message_id"):
        response = (
            client.table(table)
            .upsert(cleaned, on_conflict="email_message_id")
            .execute()
        )
    else:
        response = client.table(table).insert(cleaned).execute()

    data = getattr(response, "data", None) or []
    if data and isinstance(data, list):
        return data[0].get("id", "saved")
    return "saved"

def insert_applicant_email(applicant_id: int, email_data: Dict[str, Any]) -> Any:
    client = _get_supabase_client()

    payload = {
        "applicant_id": applicant_id,
        "message_id": email_data.get("message_id"),
        "email_from": email_data.get("from"),
        "email_to": email_data.get("to"),
        "subject": email_data.get("subject"),
        "raw_body": email_data.get("body"),
        "received_at": email_data.get("date"),
    }

    cleaned = {k: v for k, v in payload.items() if v not in (None, "")}

    if cleaned.get("message_id"):
        return (
            client
            .table("applicant_emails")
            .upsert(cleaned, on_conflict="message_id")
            .execute()
        )

    return client.table("applicant_emails").insert(cleaned).execute()


def insert_applicant_document(applicant_id: int, document_data: Dict[str, Any]) -> Any:
    client = _get_supabase_client()

    payload = {
        "applicant_id": applicant_id,
        "file_name": document_data.get("file_name"),
        "file_type": document_data.get("file_type"),
        "extracted_text": document_data.get("extracted_text"),
        "ai_summary": document_data.get("ai_summary"),
        "confidence_score": document_data.get("confidence_score"),
    }

    cleaned = {k: v for k, v in payload.items() if v not in (None, "")}

    return client.table("applicant_documents").insert(cleaned).execute()


def insert_applicant_note(applicant_id: int, note: str, author_id: str | None = None) -> Any:
    client = _get_supabase_client()

    payload = {
        "applicant_id": applicant_id,
        "author_id": author_id,
        "note": note,
    }

    cleaned = {k: v for k, v in payload.items() if v not in (None, "")}

    return client.table("applicant_notes").insert(cleaned).execute()


def get_all_applicants(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """Fetch applicants from Supabase for reporting."""
    client = _get_supabase_client()
    table = _table_name()

    query = client.table(table).select("*").order("created_at", desc=True)
    if limit:
        query = query.limit(limit)

    response = query.execute()
    return getattr(response, "data", None) or []



def init_db() -> str:
    """
    Supabase tables are created through SQL in database/schema.sql.

    This function remains for compatibility with older scripts that called
    init_db(), but it does not create tables automatically.
    """
    return "Supabase is configured through database/schema.sql. Run that SQL in Supabase SQL Editor."


if __name__ == "__main__":
    print(init_db())
