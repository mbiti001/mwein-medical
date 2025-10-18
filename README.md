# Mwein Medical Services site

Next.js 14 + TypeScript + Tailwind project powering the Mwein Medical Services marketing site, appointment request form, and storefront prototype. The clinic operates 24 hours a day, seven days a week, so the copy throughout the site reflects round-the-clock access.

## Quick start

```bash
npm install
npm run dev
```

Visit http://localhost:3000 to browse the site.

Key routes to explore during QA:

- `/services` — department directory with deep links into outpatient, maternal, laboratory, and chronic care clinics.
- `/services/outpatient` — newly added outpatient hub summarising visit flow, preparation tips, and booking options.

## Environment configuration

Create a `.env.local` file to enable email delivery from the appointment form:

```bash
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=account@example.com
SMTP_PASS=your-password
# SQLite dev database (creates prisma/dev.db next to the schema)
DATABASE_URL="file:./prisma/dev.db"
# Optional overrides
SMTP_FROM="Mwein Medical <no-reply@mweinmedical.co.ke>"
CONTACT_EMAIL=appointments@mweinmedical.co.ke
# Used by the sitemap/robots metadata helpers
NEXT_PUBLIC_SITE_URL=https://preview.mweinmedical.co.ke
# Or, if you prefer to keep the value server-side only
# SITE_URL=https://preview.mweinmedical.co.ke
```

If SMTP credentials are omitted the API logs submissions to the server console so the frontend flow remains functional during development.

Setting either `NEXT_PUBLIC_SITE_URL` or `SITE_URL` ensures the dynamic sitemap, robots.txt route, and canonical metadata reference the correct deployment domain. Values are normalised (protocol + no trailing slash) and default to `https://mweinmedical.co.ke` if unset.

## Database & migrations

Appointment submissions are now stored in a SQLite database via Prisma.

1. Install dependencies (one-time):
	```bash
	npm install
	```
2. Create or update the database schema locally:
	```bash
	DATABASE_URL="file:./prisma/dev.db" npx prisma migrate dev
	```
		This generates `prisma/migrations/**` and a dev database file at `prisma/prisma/dev.db` (gitignored).
3. For production, point `DATABASE_URL` to your managed database (e.g. PostgreSQL) and run:
	```bash
	npx prisma migrate deploy
	```

> **Note:** If you change providers (SQLite → PostgreSQL), update `provider` in `prisma/schema.prisma` before running migrations.

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
- `npm run test` executes the Vitest unit suite, covering the contact spam-protection helpers and persistence path for the contact API.
- `npm run test:coverage` generates text and LCOV coverage reports via V8.

## Continuous integration

Pushes and pull requests targeting `main` automatically run on GitHub Actions via [`.github/workflows/ci.yml`](.github/workflows/ci.yml). The workflow performs the following steps on **Ubuntu / Node.js 18**:

1. Checks out the repository and restores the npm cache.
2. Installs dependencies with `npm ci` and generates the Prisma client.
3. Runs `npm run lint` and executes the Vitest suite in run mode (`npm run test -- --run`).

### First-time setup

- Ensure the repository is hosted on GitHub so Actions can execute.
- If your tests depend on additional environment variables, add them under **Settings → Secrets and variables → Actions** as repository secrets, then reference them in the workflow.

### Connecting deployments

If you host on Vercel (or another CI-triggered platform) you have two easy options:

- Enable automatic deployments on push to `main` inside your hosting provider. CI will guard the branch, and successful merges will publish automatically.
- Or, create a deploy hook (e.g. Vercel → **Settings → Git → Deploy Hooks**), add the hook URL as an `VERCEL_DEPLOY_HOOK_URL` Actions secret, and append a final step to the workflow that `curl`s the hook when lint/tests succeed. Example snippet:

```yaml
			- name: Trigger Vercel deployment
				if: github.ref == 'refs/heads/main' && github.event_name == 'push'
				env:
					VERCEL_DEPLOY_HOOK_URL: ${{ secrets.VERCEL_DEPLOY_HOOK_URL }}
				run: |
					curl -X POST "$VERCEL_DEPLOY_HOOK_URL"
```

Feel free to extend the workflow with build checks (`npm run build`), preview comment bots, or integration test jobs as the project grows.

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

#### Fallback domain options

If the Bluehost DNS portal cannot delegate your existing domain, you still have a "deployment-ready" path that stays public:

- **Lean on the default Vercel URL.** Every project ships with a production domain like `https://mwein-medical.vercel.app`. Once the first deploy succeeds, you can share that URL immediately—no DNS changes required.
- **Attach a Vercel-managed domain.** Inside the project go to **Settings → Domains → Add**, pick **Register** to buy a new name or transfer an existing one. Vercel will manage DNS and SSL automatically, so deployments go live as soon as the build finishes.
- **Delegate the whole domain to Vercel** even if it’s registered elsewhere: update the registrar (e.g. Bluehost) nameservers to Vercel’s (`ns1.vercel-dns.com` and `ns2.vercel-dns.com`). After propagation, manage records from Vercel’s dashboard without relying on the Bluehost control panel.

Whichever route you take, keep `NEXT_PUBLIC_SITE_URL` (or `SITE_URL`) aligned with the domain you promote so sitemap, metadata, and email templates reference the correct host.

### Self-host / Docker

```bash
npm install
npm run build
npm run start
```

Expose port `3000` (reverse proxy with Nginx/Traefik if desired) and set environment variables for SMTP and contact email inside your host or container orchestrator.

## Release checklist

Before promoting a build to production, run the fast quality gates locally:

```bash
npm run lint
npm run test -- --run
npm run build
```

Lint keeps the codebase aligned with Next.js best practices, the Vitest suite verifies spam-prevention logic, and the production build catches type errors plus confirms every static route renders correctly.

## Production considerations

- Use a HIPAA-compliant (or local regulation compliant) hosting provider and secure email transport.
- Configure environment variables via your hosting provider’s secrets manager.
- Replace the placeholder cart/local storage workflow with your preferred commerce solution before accepting payments.
