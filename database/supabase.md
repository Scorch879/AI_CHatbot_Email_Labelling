# Supabase Setup

1. Open your Supabase project.
2. Go to SQL Editor.
3. Copy and run `database/schema.sql`.
4. Add your Supabase credentials to `lifewood-hr-mcp/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_key
SUPABASE_APPLICANTS_TABLE=applicants
```