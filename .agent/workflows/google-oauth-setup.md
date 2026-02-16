---
description: How to set up Google OAuth credentials
---

# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth credentials for the Healthcare Chatbot application.

## Prerequisites
- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Healthcare Chatbot")
5. Click "Create"
6. Wait for the project to be created and select it

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on "Google+ API"
4. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required information:
   - **App name**: Healthcare Chatbot
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click "Save and Continue"
6. On the "Scopes" page, click "Save and Continue" (default scopes are sufficient)
7. On the "Test users" page, add your email for testing
8. Click "Save and Continue"
9. Review and click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name (e.g., "Healthcare Chatbot Web Client")
5. Add **Authorized JavaScript origins**:
   - `http://localhost:5173` (for local development - Vite default port)
   - `http://localhost:3000` (if using different port)
   - Add your production domain when deploying (e.g., `https://yourdomain.com`)
6. Add **Authorized redirect URIs**:
   - `http://localhost:5173` (for local development)
   - `http://localhost:3000` (if using different port)
   - Add your production domain when deploying
7. Click "Create"
8. **IMPORTANT**: Copy the **Client ID** that appears - you'll need this!

## Step 5: Add Client ID to Your Application

1. Create a `.env` file in the `frontend` directory if it doesn't exist
2. Add the following line with your Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```
3. Save the file

## Step 6: Update Your Code (if needed)

Make sure your authentication component uses the environment variable:

```typescript
// In your auth component
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
```

## Step 7: Restart Development Server

// turbo
1. Stop the frontend development server (Ctrl+C in the terminal)
2. Restart it with `npm run dev` in the frontend directory

## Step 8: Test Google Sign-In

1. Open your application in the browser
2. Navigate to the login/signup page
3. Click the "Sign in with Google" button
4. You should see the Google sign-in popup
5. Sign in with your Google account

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches your application URL
- Check for trailing slashes - they must match exactly

### "Error 403: access_denied"
- Make sure you've added your email as a test user in the OAuth consent screen
- If the app is in testing mode, only test users can sign in

### Google button doesn't appear
- Check browser console for errors
- Verify the Client ID is correctly set in the `.env` file
- Make sure you've restarted the dev server after adding the `.env` file

## Security Notes

- **Never commit your `.env` file to version control**
- Add `.env` to your `.gitignore` file
- For production, use environment variables in your hosting platform
- The Client ID is safe to expose in frontend code (it's public)
- The Client Secret (if you have one) should NEVER be in frontend code

## Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Web](https://developers.google.com/identity/gsi/web/guides/overview)
