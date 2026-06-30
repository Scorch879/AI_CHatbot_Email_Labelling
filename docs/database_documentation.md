# Database Documentation

This module handles the storage and retrieval of HR applicant data.

## Files Created

### 1. `database/schema.sql`
- **Purpose**: Defines the initial structure of the SQLite database.
- **Table Definition (`applicants`)**:
  - `id`: Unique Identifier (Primary Key).
  - `name`: Full name of the applicant.
  - `email`: Applicant's email address.
  - `position`: The role they are applying for.
  - `status`: Current stage of the applicant (Defaults to 'New').
  - `date_applied`: Auto-populated timestamp of when the record is created.
  - `resume_path`: Optional file path linking to an attached resume.
  - `source`: Where the application came from (Defaults to 'Email').
  - `notes`: Relevant excerpts extracted from the email body.

### 2. `database/db_handler.py`
- **Purpose**: Provides Python functions to securely interact with the SQLite database.
- **Key Functions**:
  - `init_db()`: Initializes the database by executing `schema.sql` if the schema is not yet applied.
  - `insert_applicant(name, email, position, notes)`: Safely inserts a new applicant record using parameterized queries to prevent SQL injection.
  - `get_all_applicants()`: Retrieves all records as a list of dictionaries, making it easy to convert to a Pandas DataFrame later.
