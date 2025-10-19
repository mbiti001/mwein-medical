# 🔑 PRODUCTION ENVIRONMENT VARIABLES FOR VERCEL

## Copy these to Vercel Dashboard > Settings > Environment Variables

### **CRITICAL - DATABASE & AUTH**
```
DATABASE_URL=[GET FROM VERCEL POSTGRES CREATION - WILL BE AUTO-GENERATED]
DATABASE_PROVIDER=postgresql
ADMIN_SESSION_SECRET=417ed1ca8a27a313d0548cc061ea6366f2dd3a2680e06a49d514fe08aa0038b4
```

### **ADMIN USER SEEDING**
```
ADMIN_SEED_EMAIL=admin@mweinmedical.co.ke
ADMIN_SEED_PASSWORD=A6TjyVYA2Lsv2eSOjaGnBg==
ADMIN_SEED_ROLE=ADMIN
```

### **SITE CONFIGURATION**
```
NEXT_PUBLIC_SITE_URL=https://mwein-medical-as6xgdqg7-mbitis-projects.vercel.app
NODE_ENV=production
```

### **EMAIL CONFIGURATION (OPTIONAL - CAN ADD LATER)**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=[YOUR_EMAIL@gmail.com]
SMTP_PASS=[YOUR_APP_PASSWORD]
SMTP_FROM="Mwein Medical <no-reply@mweinmedical.co.ke>"
CONTACT_EMAIL=appointments@mweinmedical.co.ke
```

### **OPTIONAL SERVICES**
```
OPENAI_API_KEY=[OPTIONAL - FOR MENTAL HEALTH ASSISTANT]
RESEND_API_KEY=[OPTIONAL - ALTERNATIVE TO SMTP]
```

---

## 🚨 **IMPORTANT NOTES:**

1. **DATABASE_URL**: Will be auto-generated when you create the Postgres database in Vercel
2. **ADMIN_SESSION_SECRET**: The 64-character hex string generated above
3. **ADMIN_SEED_PASSWORD**: The secure password generated above (change after first login)
4. **Scope**: Set all variables to "Production" environment initially
5. **Email**: Can be configured later - not required for login functionality

---

## 📋 **VERCEL SETUP STEPS:**

1. Go to: https://vercel.com/mbitis-projects/mwein-medical/settings/environment-variables
2. Click "Add New" for each variable above
3. Set Environment to "Production" 
4. After adding all variables, trigger a new deployment

---

## 🧪 **AFTER SETUP - TEST WITH:**
```
https://mwein-medical-as6xgdqg7-mbitis-projects.vercel.app/api/health
```

Should return: `{"dbConfigured": true, "status": "healthy"}`