#!/bin/bash
# Deployment Script for Mwein Medical
# Run this after setting up Vercel environment variables

set -e

echo "🚀 Mwein Medical Deployment Script"
echo "================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if logged into Vercel
echo -e "${BLUE}Checking Vercel authentication...${NC}"
if ! vercel whoami &>/dev/null; then
    echo -e "${YELLOW}Please login to Vercel first:${NC}"
    echo "vercel login"
    exit 1
fi

echo -e "${GREEN}✓ Logged into Vercel${NC}"

# Show current project status
echo -e "${BLUE}Current project status:${NC}"
vercel ls 2>/dev/null || echo "No linked project found"

# Deploy to production
echo -e "${BLUE}Deploying to production...${NC}"
vercel --prod

# Get deployment URL
DEPLOY_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "")

if [ -n "$DEPLOY_URL" ]; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo -e "${BLUE}Production URL: https://$DEPLOY_URL${NC}"
    
    echo -e "${BLUE}Testing deployment...${NC}"
    
    # Test health endpoint
    echo "Testing health endpoint..."
    if curl -f -s "https://$DEPLOY_URL/api/health" > /dev/null; then
        echo -e "${GREEN}✓ Health endpoint working${NC}"
    else
        echo -e "${RED}✗ Health endpoint failed${NC}"
    fi
    
    echo -e "${YELLOW}Post-deployment checklist:${NC}"
    echo "1. Set up production database (if not done)"
    echo "2. Run: npx prisma db push"
    echo "3. Create admin user: npm run seed:admin"
    echo "4. Verify Resend domain: https://resend.com/domains"
    echo "5. Test admin login at: https://$DEPLOY_URL/login"
    
else
    echo -e "${RED}✗ Could not determine deployment URL${NC}"
fi

echo -e "${GREEN}Deployment script completed!${NC}"