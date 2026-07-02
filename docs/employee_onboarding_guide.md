# Lifemail Employee Onboarding & Authentication Guide

When an HR Administrator creates a new user account via the terminal script (`npm run create-user`), the system generates a secure 16-character temporary password.

Because we use an **invite-only architecture**, employees cannot sign up on their own. You need to send them their initial credentials and instructions on how to access the workspace.

---

## 📧 Copy-and-Paste Email Template for New Employees

You can copy and paste the message below into your email client or company messaging app (Slack, Microsoft Teams, etc.) whenever you onboard a new team member:

```text
Subject: Welcome to Lifemail – Your Account Credentials & Onboarding Instructions

Hi [Employee Name],

Welcome to the team! Your secure account for the Lifemail HR Workspace has been created. 

Since our platform handles sensitive HR data and email workflows, we use an invite-only authentication system. Below are your temporary login credentials:

🌐 Portal URL: [Insert Your Live/Staging Link Here, e.g., http://localhost:5173]
✉️ Login Email: [Employee Email Address]
🔑 Temporary Password: [Paste the 16-character password from your terminal]

---

### 🛡️ First-Time Login Instructions:

1. Go to the Portal URL above and enter your work email and the temporary password.
2. Because this is your first time logging in, our security system will immediately intercept your request and redirect you to the "Secure Your Account" portal.
3. You will be required to create your own private, secure password (minimum 12 characters).
4. Once updated, you will automatically be granted full access to the Dashboard!

Note: Please change your password immediately upon receipt of this email. Never share your Lifemail password with anyone.

If you experience any issues logging in, please reply to this email or contact the HR IT Admin team.

Best regards,
[Your Name / HR Administration Team]
Lifemail Operations
```

---

## 🧑‍💻 Administrator Checklist (When Adding Users)

1. Open your terminal in the `frontend` folder.
2. Run: `npm run create-user new.hire@lifewoodph.com "New Hire Name"`
3. Copy the randomized password printed in the console.
4. Paste it into the email template above and send it to the employee!
5. Remind them that they *must* complete the forced password reset on their first login before they can access the dashboard.
