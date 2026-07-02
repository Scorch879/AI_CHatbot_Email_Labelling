-- Maintenance-only rollback helper.
-- Do not run this during normal setup; it disables automatic profile creation.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user cascade;
