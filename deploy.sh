#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "===================================================="
echo "    DEPLOYING TO LIVE WEBSITE: https://udaannitr.in"
echo "===================================================="
echo ""

# Check if user is logged in to Firebase CLI
if ! npx --no-install firebase-tools login:list 2>/dev/null | grep -q "@"; then
    echo "⚠️  You are not logged into Firebase CLI yet."
    echo "Opening Google Login in your browser..."
    npx firebase-tools login
    echo ""
fi

echo "Step 1: Building latest production files..."
npm run build
echo ""

echo "Step 2: Deploying to Firebase Hosting (udaan-web)..."
npx firebase-tools deploy --only hosting --project udaan-web
echo ""

echo "===================================================="
echo "  ✅ SUCCESS! Website is now LIVE on:"
echo "     • https://udaannitr.in"
echo "     • https://udaan-web.web.app"
echo "===================================================="
