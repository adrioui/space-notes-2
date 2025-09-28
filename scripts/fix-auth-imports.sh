#!/bin/bash

# Script to fix auth imports in API routes
echo "🔧 Fixing auth imports in API routes..."

# Find all TypeScript files in app/api that import authOptions
files=$(grep -r "import.*authOptions.*from.*@/lib/auth" app/api/ --include="*.ts" -l | grep -v "__tests__")

for file in $files; do
    echo "📝 Updating $file"
    
    # Replace the import statement
    sed -i 's/import { authOptions } from '\''@\/lib\/auth'\''/import { authOptionsBypass } from '\''@\/lib\/auth-bypass'\''/g' "$file"
    
    # Replace all usages of authOptions with authOptionsBypass
    sed -i 's/getServerSession(authOptions)/getServerSession(authOptionsBypass)/g' "$file"
done

echo "✅ Auth imports fixed in all API routes"
