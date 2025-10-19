# Deployment Guide - Mwein Medical

## 🚀 Quick Deployment Checklist

### 1. Pre-Deployment Setup

#### A. Database Options (Choose One)
```bash
# Option 1: Vercel Postgres (Recommended)
vercel postgres create mwein-medical-db

# Option 2: PlanetScale (Alternative)
# Sign up at planetscale.com and create database

# Option 3: Turso (SQLite-compatible)
# Sign up at turso.tech and create database
```

#### B. Generate Production Secrets
```bash
# Generate secure session secret (64 chars)
node -e "console.log('ADMIN_SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate NextAuth secret (32 chars) 
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(16).toString('hex'))"
```

### 2. Vercel Deployment Steps

#### A. Login to Vercel
```bash
vercel login
```

#### B. Link Project
```bash
# In project directory
vercel link
```

#### C. Set Environment Variables
```bash
# Set each variable individually
vercel env add DATABASE_URL
vercel env add RESEND_API_KEY
vercel env add ADMIN_SESSION_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add CONTACT_TO
vercel env add CONTACT_FROM
vercel env add ADMIN_SEED_EMAIL
vercel env add ADMIN_SEED_PASSWORD
vercel env add DATABASE_PROVIDER
vercel env add SITE_URL

# Or use Vercel dashboard: vercel.com/dashboard
```

#### D. Deploy
```bash
# Deploy to production
vercel --prod

# Or just deploy (preview first)
vercel
```

### 3. Post-Deployment Setup

#### A. Database Migration
```bash
# After deployment, run database setup
vercel env pull .env.production
npx prisma db push --accept-data-loss
```

#### B. Create Admin User
```bash
# Run admin seeding in production
vercel env pull .env.production
npm run seed:admin
```

#### C. Verify Deployment
```bash
# Test health endpoint
curl https://your-domain.vercel.app/api/health

# Test admin login
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "admin@mweinmedical.co.ke", "password": "your_password"}'
```

### 4. Domain Setup (Optional)

#### A. Add Custom Domain
```bash
vercel domains add mweinmedical.com
vercel domains add www.mweinmedical.com
```

#### B. Update Environment Variables
```bash
# Update SITE_URL and NEXTAUTH_URL to your custom domain
vercel env rm SITE_URL production
vercel env add SITE_URL production
# Enter: https://mweinmedical.com
```

### 5. Email Domain Verification

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add domain: `mweinmedical.com`
3. Add DNS records as shown
4. Verify domain

### 6. Monitoring & Maintenance

#### A. Health Checks
- Monitor: `https://your-domain.vercel.app/api/health`
- Set up uptime monitoring (UptimeRobot, Pingdom, etc.)

#### B. Logs
```bash
# View deployment logs
vercel logs your-domain.vercel.app

# View function logs
vercel logs your-domain.vercel.app --follow
```

### 7. Troubleshooting

#### Common Issues:
1. **Database Connection**: Check DATABASE_URL format
2. **Environment Variables**: Use `vercel env ls` to verify
3. **Build Errors**: Check `vercel logs` for details
4. **Email Issues**: Verify Resend domain and API key

#### Database URL Formats:
```bash
# PostgreSQL (Vercel/Neon)
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# PlanetScale (MySQL)
DATABASE_URL="mysql://username:password@host:3306/database?sslaccept=strict"

# Turso (LibSQL)
DATABASE_URL="libsql://your-db-name-username.turso.io"
```

## 🎯 Current Project Status

✅ Backend infrastructure complete  
✅ Admin authentication system ready  
✅ Contact form with database persistence  
✅ Rate limiting and security features  
✅ Comprehensive error handling and logging  
✅ Database schema with performance indexes  

## 🔄 Next Steps After Reading This Guide

1. Choose your database provider
2. Set up Vercel account and login
3. Configure environment variables
4. Deploy and test!

Your medical platform is production-ready! 🏥✨