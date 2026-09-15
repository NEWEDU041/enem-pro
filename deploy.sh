#!/bin/bash
set -e

echo "🚀 ENEM Pro SEO Fix Deployment Script"
echo "===================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not installed. Installing..."
    npm install -g vercel
fi

echo "📝 Vercel login required..."
echo "   This will open your browser to authenticate."
echo ""
vercel login

echo ""
echo "🔄 Deploying latest code to production..."
echo ""
cd "$(dirname "$0")"

vercel deploy --prod

echo ""
echo "✅ Deployment started!"
echo ""
echo "🔍 Verification (wait 2-3 minutes for build to complete):"
echo ""
echo "   1. Check homepage robots:"
echo "      curl -s https://questoesenem.pro | grep robots"
echo ""
echo "   2. Test blog route:"
echo "      curl -sI https://questoesenem.pro/blog/local-de-prova-enem-2026"
echo ""
echo "   3. Check Vercel dashboard:"
echo "      https://vercel.com/dashboard/enem-pro"
echo ""
echo "🎯 Next steps:"
echo "   1. Monitor build completion"
echo "   2. Run verification commands above"
echo "   3. Submit to Google Search Console"
echo "   4. Check SEO Audit report: ./questoesenem-audit/ACTION-PLAN.md"
echo ""
