#!/bin/bash

# Test script to verify Vercel deployment readiness
# Run this script before deploying to catch issues early

echo "🔍 Testing Vercel deployment readiness..."

# Check if required files exist
echo "Checking required files..."
required_files=("package.json" "next.config.js" "vercel.json" ".vercelignore")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check if Replit dependencies are removed
echo ""
echo "Checking for Replit dependencies..."
if grep -q "@replit" package.json; then
    echo "❌ Replit dependencies still present in package.json"
    echo "Run: npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-dev-banner @replit/vite-plugin-runtime-error-modal"
    exit 1
else
    echo "✅ No Replit dependencies found"
fi

# Check if required environment variables are documented
echo ""
echo "Checking environment variable documentation..."
if [ -f ".env.vercel.example" ]; then
    echo "✅ .env.vercel.example exists"
else
    echo "❌ .env.vercel.example missing"
    exit 1
fi

# Test TypeScript compilation
echo ""
echo "Testing TypeScript compilation..."
if npm run check; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi

# Test Next.js build
echo ""
echo "Testing Next.js build..."
if npm run build; then
    echo "✅ Next.js build successful"
else
    echo "❌ Next.js build failed"
    exit 1
fi

# Check for common Vercel issues
echo ""
echo "Checking for common Vercel deployment issues..."

# Check for dynamic imports that might cause issues
if grep -r "import(" --include="*.ts" --include="*.tsx" app/ src/ 2>/dev/null | grep -v "next/dynamic"; then
    echo "⚠️  Found dynamic imports - ensure they're compatible with Vercel"
fi

# Check for large dependencies
echo ""
echo "Checking bundle size..."
if [ -d ".next" ]; then
    bundle_size=$(du -sh .next | cut -f1)
    echo "📦 Bundle size: $bundle_size"
fi

echo ""
echo "🎉 Vercel deployment readiness test complete!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to Vercel"
echo "3. Set up environment variables in Vercel dashboard"
echo "4. Deploy!"
echo ""
echo "Remember to update:"
echo "- NEXTAUTH_URL to your Vercel deployment URL"
echo "- Supabase authentication redirect URLs"
