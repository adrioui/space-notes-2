# NextAuth.js Vercel Deployment Fix

## 🔧 Required Environment Variables for Vercel

### **Critical NextAuth Variables**
```bash
# NextAuth.js Configuration
NEXTAUTH_SECRET=qD+/g/uDApWl5oZE96UeKNgjC4MTxACIrQUcp6IMTXw=
NEXTAUTH_URL=https://space-notes-psi.vercel.app
NEXT_PUBLIC_NEXTAUTH_URL=https://space-notes-psi.vercel.app

# Environment
NODE_ENV=development
```

### **Database Configuration**
```bash
# Primary database connection
DATABASE_URL=postgresql://postgres:AN7S7KmitRAYRDRg@db.afkfhoouirxevtctzfnf.supabase.co:5432/postgres

# Pooled connection for better Vercel performance
SUPABASE_DATABASE_URL=postgresql://postgres.afkfhoouirxevtctzfnf:AN7S7KmitRAYRDRg@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### **Supabase Configuration**
```bash
# Public Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://afkfhoouirxevtctzfnf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFma2Zob291aXJ4ZXZ0Y3R6Zm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTcwNjcsImV4cCI6MjA3NDQ3MzA2N30.IK3-B3qTug6oH79AAE5n4hjM4nQsguAiVoKHvEDVt4Y

# Server-side Supabase key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFma2Zob291aXJ4ZXZ0Y3R6Zm5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg5NzA2NywiZXhwIjoyMDc0NDczMDY3fQ.Y977fHzc7M9zr538VBs4Z05APga1nLzvuMr9NdDOyFg
```

## 🚀 Deployment Steps

### **1. Update Environment Variables in Vercel**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update/add all variables above
3. Ensure they're set for Production, Preview, and Development environments

### **2. Update Supabase Redirect URLs**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set Site URL: `https://space-notes-psi.vercel.app`
3. Add Redirect URLs:
   ```
   https://space-notes-psi.vercel.app/api/auth/callback/credentials
   https://space-notes-psi.vercel.app/api/auth/signin
   https://space-notes-psi.vercel.app/dashboard
   https://space-notes-psi.vercel.app/
   ```

### **3. Redeploy Application**
1. Go to Vercel Dashboard → Deployments
2. Click "Redeploy" on the latest deployment
3. Wait for deployment to complete

## 🔍 Troubleshooting

### **Check Vercel Function Logs**
1. Go to Vercel Dashboard → Functions
2. Look for `/api/auth/[...nextauth]` function
3. Check for error messages in recent invocations

### **Expected Success Indicators**
- ✅ No CLIENT_FETCH_ERROR in browser console
- ✅ Demo accounts work: `demo-admin@example.com`, `demo-member@example.com`
- ✅ Session persists after login
- ✅ `/api/auth/session` returns valid session data

### **Common Issues and Solutions**

#### **Issue: "There is a problem with the server configuration"**
**Solution**: Verify NEXTAUTH_URL matches your Vercel deployment URL exactly

#### **Issue: Session not persisting**
**Solution**: Check NEXTAUTH_SECRET is set and consistent across deployments

#### **Issue: Database connection errors**
**Solution**: Use SUPABASE_DATABASE_URL (pooled connection) instead of direct DATABASE_URL

#### **Issue: CORS errors**
**Solution**: Ensure Supabase redirect URLs include your Vercel domain

## 📋 Verification Checklist

### **Environment Variables**
- [ ] NEXTAUTH_SECRET is set
- [ ] NEXTAUTH_URL matches Vercel deployment URL
- [ ] All Supabase variables are present
- [ ] NODE_ENV=development for demo mode

### **Supabase Configuration**
- [ ] Site URL updated to Vercel domain
- [ ] Redirect URLs include all necessary paths
- [ ] Database is accessible from Vercel

### **Application Testing**
- [ ] Homepage loads without errors
- [ ] Demo login works: `demo-admin@example.com`
- [ ] Session persists after login
- [ ] No console errors related to NextAuth

## 🎯 Key Changes Made

1. **NextAuth Route Configuration**: Added `force-dynamic` to `/api/auth/[...nextauth]/route.ts`
2. **JWT Strategy**: Disabled database adapter for better serverless compatibility
3. **Error Handling**: Added comprehensive error handling for database operations
4. **Environment Validation**: Added validation for required NextAuth variables
5. **Serverless Optimization**: Configured NextAuth for Vercel serverless environment

The application should now work correctly with NextAuth.js on Vercel! 🎉
