-- database/schema.sql

CREATE TABLE IF NOT EXISTS applicants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    position TEXT,
    status TEXT DEFAULT 'New',
    date_applied DATETIME DEFAULT CURRENT_TIMESTAMP,
    resume_path TEXT,
    source TEXT DEFAULT 'Email',
    notes TEXT
);
