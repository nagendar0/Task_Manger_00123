# OAuth Authentication Setup Guide

This guide will help you configure Google and GitHub authentication for your application using Supabase.

## Prerequisites

- A Supabase project (create one at https://supabase.com/dashboard)
- Developer accounts for Google and GitHub

## Step 1: Configure Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. You'll see a list of authentication providers

## Step 2: Setup Google OAuth

### Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if prompted
6. Select **Web application** as the application type
7. Add authorized redirect URI:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   Replace `your-project-ref` with your actual Supabase project reference
8. Click **Create** and copy the **Client ID** and **Client Secret**

### Enable in Supabase

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find **Google** and click to expand
3. Toggle **Enable Sign in with Google**
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

## Step 3: Setup GitHub OAuth

### Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the application details:
   - **Application name**: Your app name
   - **Homepage URL**: Your application URL
   - **Authorization callback URL**:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it

### Enable in Supabase

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find **GitHub** and click to expand
3. Toggle **Enable Sign in with GitHub**
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   Find these values in Supabase Dashboard > **Settings** > **API**

## Step 5: Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:5173

3. Test each authentication method:
   - Click "Continue with Google" - should redirect to Google login
   - Click "Continue with GitHub" - should redirect to GitHub login
   - Test email/password signup and signin

## Troubleshooting

### Common Issues

**"Invalid redirect URI"**
- Verify the redirect URI in your OAuth app matches exactly: `https://your-project-ref.supabase.co/auth/v1/callback`
- Check for trailing slashes or typos

**"OAuth provider not enabled"**
- Ensure the provider is toggled ON in Supabase Dashboard
- Verify Client ID and Secret are correctly entered

**"CORS errors"**
- Add your local development URL to allowed origins in Supabase Dashboard
- Go to **Authentication** > **URL Configuration** > Add `http://localhost:5173`

**Email confirmation required**
- By default, Supabase requires email confirmation for new signups
- Disable in **Authentication** > **Settings** > **Email Auth** > Toggle off "Enable email confirmations"

## Security Best Practices

1. **Never commit `.env` file** - it contains sensitive credentials
2. **Use environment variables** - never hardcode API keys in your code
3. **Rotate secrets regularly** - update OAuth secrets periodically
4. **Enable email verification** - for production environments
5. **Configure allowed redirect URLs** - restrict to your actual domains in production

## Production Deployment

Before deploying to production:

1. Update OAuth redirect URIs in all providers to use your production domain
2. Update Supabase **URL Configuration** with production URLs
3. Set environment variables in your hosting platform
4. Enable email confirmations for security
5. Configure custom SMTP for email delivery (optional)

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)