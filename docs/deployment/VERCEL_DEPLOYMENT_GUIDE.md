# 🚀 Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Supabase Project**: Ensure your Supabase project is accessible from external sources

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Remove Replit-specific dependencies
npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-dev-banner @replit/vite-plugin-runtime-error-modal

# Install dependencies
npm install

# Test build locally
npm run build
```

### 2. Connect to Vercel

#### Option A: Vercel Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 3. Configure Environment Variables

Go to your Vercel project dashboard → Settings → Environment Variables

#### Required Variables:

```bash
# Environment
NODE_ENV=production

# Database
DATABASE_URL=postgresql://username:password@db.your-project.supabase.co:5432/postgres
SUPABASE_DATABASE_URL=postgresql://username:password@db.your-project.supabase.co:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# NextAuth (UPDATE THESE!)
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-secure-secret-key

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Update Domain-Specific Settings

After deployment, update these URLs:

1. **Supabase Authentication Settings**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL to allowed redirect URLs:
     ```
     https://your-app-name.vercel.app/api/auth/callback/credentials
     ```

2. **Update Environment Variables**:
   ```bash
   NEXTAUTH_URL=https://your-app-name.vercel.app
   NEXT_PUBLIC_NEXTAUTH_URL=https://your-app-name.vercel.app
   ```

### 5. Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update environment variables with your custom domain

## Verification Checklist

### ✅ Pre-Deployment
- [ ] Removed Replit dependencies
- [ ] Build passes locally (`npm run build`)
- [ ] Environment variables prepared
- [ ] Database accessible from external sources

### ✅ Post-Deployment
- [ ] Application loads successfully
- [ ] Authentication works
- [ ] Database connections work
- [ ] Real-time features work
- [ ] File uploads work (Supabase Storage)
- [ ] Email/SMS services work

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check build logs in Vercel dashboard
   # Common fixes:
   - Ensure all dependencies are in package.json
   - Check TypeScript errors
   - Verify environment variables
   ```

2. **Database Connection Issues**:
   ```bash
   # Verify Supabase connection strings
   # Check if Supabase allows external connections
   # Ensure connection pooling is optimized
   ```

3. **Authentication Issues**:
   ```bash
   # Verify NEXTAUTH_URL matches deployment URL
   # Check Supabase auth redirect URLs
   # Ensure NEXTAUTH_SECRET is set
   ```

4. **Real-time Issues**:
   ```bash
   # Check Supabase real-time settings
   # Verify WebSocket connections work on Vercel
   # Check rate limiting settings
   ```

## Performance Optimization

### Vercel-Specific Optimizations Applied

1. **Database Connection Pooling**: Optimized for serverless
2. **Build Configuration**: Vercel-specific webpack settings
3. **API Routes**: Configured for serverless functions
4. **Static Generation**: Optimized for Vercel's CDN

### Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Error Tracking**: Check function logs in Vercel dashboard
3. **Performance**: Monitor Core Web Vitals

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js on Vercel**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Supabase + Vercel**: [supabase.com/docs/guides/getting-started/tutorials/with-nextjs](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
