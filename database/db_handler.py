import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'hr_data.db')
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), 'schema.sql')

def get_connection():
    return sqlite3.connect(DB_PATH)

def init_db():
    if not os.path.exists(SCHEMA_PATH):
        print("Schema file not found.")
        return
    with get_connection() as conn:
        with open(SCHEMA_PATH, 'r') as f:
            conn.executescript(f.read())
        conn.commit()

def insert_applicant(name, email, position, notes=""):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO applicants (name, email, position, notes) VALUES (?, ?, ?, ?)",
            (name, email, position, notes)
        )
        conn.commit()
        return cursor.lastrowid

def get_all_applicants():
    with get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM applicants")
        return [dict(row) for row in cursor.fetchall()]

if __name__ == '__main__':
    init_db()
    print("Database initialized.")
