#!/bin/bash

# Script to fix dynamic server usage errors in Next.js 15 API routes
# This adds the necessary route segment config to all routes using getServerSession

echo "🔧 Fixing dynamic server usage errors in API routes..."

# List of API routes that use getServerSession (excluding already fixed ones)
routes=(
  "app/api/auth/logout/route.ts"
  "app/api/lessons/[id]/progress/route.ts"
  "app/api/lessons/[id]/route.ts"
  "app/api/messages/[id]/reactions/route.ts"
  "app/api/notes/[id]/route.ts"
  "app/api/spaces/[id]/lessons/route.ts"
  "app/api/spaces/[id]/members/route.ts"
  "app/api/spaces/[id]/members/[userId]/role/route.ts"
  "app/api/spaces/[id]/messages/route.ts"
  "app/api/spaces/[id]/notes/route.ts"
  "app/api/spaces/[id]/route.ts"
  "app/api/spaces/join/[inviteCode]/route.ts"
  "app/api/users/[id]/route.ts"
)

# Dynamic route configuration to add
dynamic_config="
// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
"

for route in "${routes[@]}"; do
  if [ -f "$route" ]; then
    echo "Processing: $route"
    
    # Check if the route already has dynamic config
    if grep -q "export const dynamic" "$route"; then
      echo "  ✅ Already has dynamic config, skipping"
      continue
    fi
    
    # Find the line number after the last import
    last_import_line=$(grep -n "^import" "$route" | tail -1 | cut -d: -f1)
    
    if [ -n "$last_import_line" ]; then
      # Insert dynamic config after the last import
      sed -i "${last_import_line}a\\${dynamic_config}" "$route"
      echo "  ✅ Added dynamic config"
    else
      echo "  ❌ Could not find import statements"
    fi
  else
    echo "  ❌ File not found: $route"
  fi
done

echo ""
echo "🎉 Dynamic route fixes completed!"
echo ""
echo "Next steps:"
echo "1. Test the build: npm run build"
echo "2. Commit changes: git add . && git commit -m 'Fix dynamic server usage errors in API routes'"
echo "3. Deploy to Vercel"
