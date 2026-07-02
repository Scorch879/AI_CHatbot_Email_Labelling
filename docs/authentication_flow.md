# Authentication & User Provisioning Architecture

This document outlines the bespoke authentication architecture implemented for the Lifemail platform. 

## 1. Invite-Only Provisioning
To maximize security, public sign-ups are **disabled**. Only HR administrators can create accounts for employees. 

Users are provisioned via a secure Node.js Admin script (`frontend/scripts/create_user.js`). This script uses the official Supabase Admin API with the backend-only service role key.

When a user is created:
1. They are registered with their work email.
2. The system auto-generates a 16-character temporary password with uppercase, lowercase, digit, and symbol coverage.
3. Their profile is automatically instantiated or upserted.
4. They are flagged with `profiles.must_reset_password = true`.

## 2. First-Time Password Reset (Security Policy)
When an employee logs in for the very first time using their temporary password, the frontend auth provider validates the Supabase session with `getUser()`, reads their profile, and detects `profiles.must_reset_password`.

Instead of routing them to the dashboard, the application actively intercepts the routing flow and redirects them to a highly secure `/reset-password` portal. 

They must choose a personal, private password with a minimum length of 12 characters. Once Supabase updates the password, the app calls the `complete_password_reset()` database function, clears the reset flag, refreshes cached auth state, and routes them to the HR workspace.

## 3. Auth Guard & Session Cache
The React app wraps routes in `AuthProvider`, which centralizes:
- Supabase client configuration checks.
- Session lookup through `getSession()`.
- Live server-side session validation through `getUser()`.
- Profile lookup for reset and role metadata.
- Timeout/error handling so the UI does not stay stuck on a loading screen.
- Auth-state subscriptions through `onAuthStateChange()`.

## 4. UI/UX Enhancements
The authentication forms have been completely upgraded with a premium, enterprise-grade aesthetic.
- **Micro-interactions:** Input fields feature hover and focus states, and the password field has an integrated visibility toggle.
- **Redirection State:** Upon successful authentication, the standard form cleanly transitions into a full-screen, focused loading state with a dynamic spinner, providing clear feedback that the secure workspace is being provisioned.
