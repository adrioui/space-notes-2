# Vercel Environment Variables Setup Guide

## Method 1: Using Vercel Dashboard (Recommended)

1. **Go to your Vercel project dashboard**:
   ```
   https://vercel.com/[your-username]/[project-name]/settings/environment-variables
   ```

2. **Add each environment variable**:
   - Click "Add New"
   - Enter the key and value
   - Select environments: Production, Preview, Development (as needed)

## Method 2: Using Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link your project**:
   ```bash
   vercel link
   ```

4. **Add environment variables**:
   ```bash
   # Database
   vercel env add DATABASE_URL production
   vercel env add SUPABASE_DATABASE_URL production
   
   # Supabase
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   
   # NextAuth
   vercel env add NEXTAUTH_URL production
   vercel env add NEXTAUTH_SECRET production
   vercel env add NEXT_PUBLIC_NEXTAUTH_URL production
   
   # Email
   vercel env add EMAIL_USER production
   vercel env add EMAIL_PASS production
   
   # SMS/Twilio
   vercel env add TWILIO_ACCOUNT_SID production
   vercel env add TWILIO_AUTH_TOKEN production
   vercel env add TWILIO_PHONE_NUMBER production
   
   # Environment
   vercel env add NODE_ENV production
   ```

## Method 3: Using .env File Import

1. **Create a production .env file**:
   ```bash
   cp .env.vercel.example .env.production
   # Edit .env.production with your actual values
   ```

2. **Import via Vercel CLI**:
   ```bash
   vercel env pull .env.local
   ```

## Required Environment Variables Checklist

### ✅ Database & Supabase
- [ ] `DATABASE_URL`
- [ ] `SUPABASE_DATABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### ✅ Authentication
- [ ] `NEXTAUTH_URL` (https://your-app.vercel.app)
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXT_PUBLIC_NEXTAUTH_URL`

### ✅ Email Service
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASS`

### ✅ SMS Service (Twilio)
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_PHONE_NUMBER`

### ✅ Environment
- [ ] `NODE_ENV=production`

## Important Notes

1. **NEXTAUTH_URL**: Must be updated to your Vercel deployment URL
2. **Database URLs**: Ensure they're accessible from Vercel's infrastructure
3. **Secrets**: Use strong, unique values for production
4. **Public variables**: Only `NEXT_PUBLIC_*` variables are exposed to the browser
