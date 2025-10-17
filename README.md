# Mwein Medical Services site

Next.js 14 + TypeScript + Tailwind project powering the Mwein Medical Services marketing site, appointment request form, and storefront prototype. The clinic operates 24 hours a day, seven days a week, so the copy throughout the site reflects round-the-clock access.

## Quick start

```bash
npm install
npm run dev
```

Visit http://localhost:3000 to browse the site.

## Environment configuration

Create a `.env.local` file to enable email delivery from the appointment form:

```bash
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=account@example.com
SMTP_PASS=your-password
# Optional overrides
SMTP_FROM="Mwein Medical <no-reply@mweinmedical.co.ke>"
CONTACT_EMAIL=appointments@mweinmedical.co.ke
```

If SMTP credentials are omitted the API logs submissions to the server console so the frontend flow remains functional during development.

## Contact/booking form hardening

- A hidden honeypot field drops most automated bot submissions without alerting the sender.
- A lightweight in-memory rate limiter allows **5 submissions every 5 minutes per IP**. On stateless (serverless) hosting you should replace this with a shared store (Redis, Upstash, etc.) for consistent throttling across instances.
- All payloads are validated with `zod` both client- and server-side.

### Testing the API locally

```bash
curl -X POST http://localhost:3000/api/contact \
	-H 'Content-Type: application/json' \
	-d '{
		"name": "Test User",
		"phone": "+254700000000",
		"preferredDate": "2025-01-20",
		"preferredTime": "10:30",
		"reason": "Follow-up visit"
	}'
```

When SMTP is configured you should receive an email at `CONTACT_EMAIL`; otherwise the payload is logged to the terminal running `npm run dev`.

## Tooling

- Pages live under `/app` using the App Router.
- Styling is handled with Tailwind (`tailwind.config.js`, `styles/globals.css`).
- `npm run lint` runs ESLint with the Next.js ruleset; keep it clean before deploying.
- `npm run test` executes the Vitest unit suite, covering the contact spam-protection helpers.
- `npm run test:coverage` generates text and LCOV coverage reports via V8.

## Testing

Vitest powers the unit tests that cover the honeypot and rate-limiter utilities used by the contact API.

```bash
npm run test
```

Add `--run` to execute once in CI or use `npm run test:coverage` to emit LCOV output for reporting tools such as Codecov.

## Deployment

### Vercel (recommended)

1. Commit and push this repository to GitHub (or import directly on Vercel).
2. In the Vercel dashboard choose **New Project → Import Repository** and select this repo.
3. Accept the default Next.js build settings (build command `npm run build`, output `.next`).
4. Add the environment variables from the [Environment configuration](#environment-configuration) section under **Settings → Environment Variables**.
5. Click **Deploy**. Vercel will handle SSL, CDN, and automatic previews for pull requests.

### Self-host / Docker

```bash
npm install
npm run build
npm run start
```

Expose port `3000` (reverse proxy with Nginx/Traefik if desired) and set environment variables for SMTP and contact email inside your host or container orchestrator.

## Production considerations

- Use a HIPAA-compliant (or local regulation compliant) hosting provider and secure email transport.
- Configure environment variables via your hosting provider’s secrets manager.
- Replace the placeholder cart/local storage workflow with your preferred commerce solution before accepting payments.
