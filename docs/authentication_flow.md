# Authentication & User Provisioning Architecture

This document outlines the bespoke authentication architecture implemented for the Lifemail platform. 

## 1. Invite-Only Provisioning
To maximize security, public sign-ups are **disabled**. Only HR administrators can create accounts for employees. 

Users are provisioned via a secure Node.js Admin script (`frontend/scripts/create_user.js`). This script uses the official Supabase Admin API to guarantee database integrity. 

When a user is created:
1. They are registered with their work email.
2. The system auto-generates a highly secure 10-character alphanumeric password.
3. Their public profile is automatically instantiated.
4. They are strictly flagged with `force_password_reset: true`.

## 2. First-Time Password Reset (Security Policy)
When an employee logs in for the very first time using their temporary 10-character password, the system detects the `force_password_reset` flag. 

Instead of routing them to the dashboard, the application actively intercepts the routing flow and redirects them to a highly secure `/reset-password` portal. 

They cannot bypass this portal. They must choose a personal, private password (minimum 6 characters). Once submitted, the flag is permanently removed, and they are granted access to the HR workspace. 

## 3. UI/UX Enhancements
The authentication forms have been completely upgraded with a premium, enterprise-grade aesthetic.
- **Micro-interactions:** Input fields feature hover and focus states, and the password field has an integrated visibility toggle.
- **Redirection State:** Upon successful authentication, the standard form cleanly transitions into a full-screen, focused loading state with a dynamic spinner, providing clear feedback that the secure workspace is being provisioned.
