# Deploy / Activate Backend (Vercel + Prisma)

Use this checklist when promoting changes to production or setting up a fresh environment.

## 1. Environment Variables (Vercel Project → Settings → Environment Variables)

Set the production secrets before deploying:

- `DATABASE_URL` – point to the managed Postgres instance (include `?sslmode=require` if needed).
- `DATABASE_PROVIDER=postgresql`
- `ADMIN_SESSION_SECRET` – at least 32 random characters.
- Optional: `NEXT_PUBLIC_SITE_URL` for canonical URLs.
- Optional: SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `CONTACT_EMAIL`).
- Optional: M-Pesa secrets (`MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORT_CODE`, `MPESA_CALLBACK_SECRET`).

## 2. GitHub Actions Secrets (Repo → Settings → Secrets and variables → Actions)

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

These power the `vercel-deploy` workflow so deployments stay consistent.

## 3. Database Migration

The `npm run build` step runs `prisma migrate deploy`, so any pending migrations are applied automatically during the GitHub Action. For local verification you can run:

```bash
npx prisma migrate dev -n deploy_sync
```

## 4. Seed or Rotate Admin Credentials

Generate an admin account (or rotate credentials) with:

```bash
ADMIN_SEED_EMAIL=admin@mweinmed.com \
ADMIN_SEED_PASSWORD=ChangeMeNow!123 \
npm run seed:admin
```

Update the password immediately after confirming access, then remove the plaintext values from your shell history.

## 5. Smoke Test Checklist

After deployment:

- Sign in as the admin and confirm dashboard access.
- Submit an antifraud report, contact form, and donation to ensure queues still work.
- Download the donation CSV/XLSX exports and confirm spreadsheet integrity.
- Trigger password reset email (SMTP optional) and ensure reset flow completes.
