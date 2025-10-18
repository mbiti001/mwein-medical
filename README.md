# Mwein Medical Services site

		- name: Trigger Vercel deployment
			if: github.ref == 'refs/heads/main' && github.event_name == 'push'
			env:
				VERCEL_DEPLOY_HOOK_URL: ${{ secrets.VERCEL_DEPLOY_HOOK_URL }}
			run: |
				curl -X POST "$VERCEL_DEPLOY_HOOK_URL"

	 ```bash
	 cp .env.example .env.local
	 ```

	Update `SMTP_*`, `CONTACT_EMAIL`, and `ADMIN_SESSION_SECRET` alongside `DATABASE_URL` as needed. Leaving the email values blank will fall back to console logging so you can still submit the form locally, but you must seed at least one admin account before you can access the dashboard.

	If you would like the mental health assistant to produce personalised supportive messages, add `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) to your environment. Without these, the assistant still runs locally with reassuring defaults and never stores PHQ-9 responses.

2. If you stay on the bundled SQLite database, nothing else is required—`lib/prisma.ts` points to `file:./prisma/dev.db` by default when `DATABASE_URL` is missing.

3. To use PostgreSQL (or another provider) instead:
	 - Update `DATABASE_URL` in `.env.local`, for example

		 ```bash
		 DATABASE_URL="postgresql://user:password@host:5432/mwein_medical?schema=public"
		 ```

	 - Edit `prisma/schema.prisma` and change the datasource provider to match (`provider = "postgresql"`).
	 - Apply migrations against the new database:

		 ```bash
		 npx prisma migrate deploy
		 ```

	 - Redeploy the Next.js app with the new environment variables so the API routes connect to the managed database.

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

## Dashboard & admin access

- Set `ADMIN_SESSION_SECRET` in `.env.local` and run `npm run seed:admin` to create at least one user (see [Environment configuration](#environment-configuration) for details).
- Visit `/login` and sign in with the seeded email/password to unlock the protected dashboard routes (`/dashboard`, `/dashboard/orders`, `/dashboard/telehealth`).
- Roles control which modules appear in the navigation:
	- `ADMIN` sees everything.
	- `PHARMACY` can manage orders.
	- `CLINIC` can review telehealth submissions.
- Orders submitted through the shop appear in **Dashboard → Orders** where you can update status, add staff notes, and track fulfilment history. Telehealth submissions remain accessible via the dedicated telehealth dashboard.
- Admin sessions expire after six hours; signing out clears the cookie immediately.

## Order notifications

- Every shop order triggers `lib/orderNotifications.ts`, which sends an email (when SMTP is configured) and stores the outcome in the `OrderNotification` table via Prisma.
- The `/api/orders/notifications` route exposes the 12 most recent alerts to the dashboard, and `/dashboard/orders` now includes a quick view of the latest alert per order.
- If SMTP details are missing, notifications are recorded with status `SKIPPED`; failures are logged with status `ERROR`, so the dashboard still shows a full audit trail.
- Ensure the email environment variables from [Environment configuration](#environment-configuration) are set in production so alerts deliver to the pharmacy team.

## Mental health check-in assistant

- `/mental-health` provides a compassionate, privacy-first PHQ-9 check-in. Responses remain in the browser and are never stored on the server.
- The assistant offers tailored guidance, immediate safety messaging (Kenya emergency numbers 999 / 1199), and directs positive screens to telehealth or walk-in care.
- Optional integration with OpenAI is available by setting `OPENAI_API_KEY`. When absent, the assistant falls back to curated supportive copy so the workflow continues to function offline.
- The API proxy (`/api/mental-health/support`) only sends aggregate scoring data to OpenAI and strips identifiers to support compliance with data-protection expectations.
- Aggregate analytics for the check-in are captured via `/api/mental-health/analytics`, which increments `SiteMetric` totals for starts, completions, severity bands, positive screens, harm alerts, and care CTA clicks without recording any individual responses.

## Donation experience highlights

- `components/DonationRail.tsx` renders a right-to-left ticker showcasing recent supporters. Pass it an array of `{ id, who, amount, message, time }` entries; the component will duplicate cars automatically so the loop never stutters.
- The ticker is embedded in `DonateExperience` alongside live supporter stats. Public supporters pulled from `/api/donations/supporters` are transformed into rail items, and the list refreshes every minute so new gifts appear without a manual reload.
- To reuse the rail elsewhere, import the component and feed it the supporters you want to highlight:

	```tsx
	import DonationRail from '@/components/DonationRail'

	const supporters = [
	  { id: '1', who: 'Grace K.', amount: 'KES 2,500', message: 'Maternal health fund', time: '5m ago' }
	]

	export function HeroRail() {
	  return <DonationRail items={supporters} durationSec={50} heightPx={80} />
	}
	```

The component ships with its own scoped styles, so no Tailwind configuration changes are required.

## Tooling

- Pages live under `/app` using the App Router.
- Styling is handled with Tailwind (`tailwind.config.js`, `styles/globals.css`).
- Dynamic favicons are generated via `app/icon.tsx` and `app/apple-icon.tsx`, so no manual `.ico` assets are required.
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
	Update `SMTP_*`, `CONTACT_EMAIL`, and `ADMIN_SESSION_SECRET` alongside `DATABASE_URL` as needed. Leaving the email values blank will fall back to console logging so you can still submit the form locally, but you must seed at least one admin account before you can access the dashboard.

2. Seed an admin user (one-time per environment) so the dashboard login works:

	```bash
	ADMIN_SEED_EMAIL=admin@example.com \
	ADMIN_SEED_PASSWORD=super-secure-password \
	ADMIN_SEED_ROLE=ADMIN \
	npm run seed:admin
	```

	The role defaults to `ADMIN` if omitted. Accepted values are `ADMIN`, `PHARMACY`, and `CLINIC`. Remove the plaintext seed variables from your shell after the account is created—the password is hashed in the database.
				run: |
3. If you stay on the bundled SQLite database, nothing else is required—`lib/prisma.ts` points to `file:./prisma/dev.db` by default when `DATABASE_URL` is missing.
```
4. To use PostgreSQL (or another provider) instead:
Feel free to extend the workflow with build checks (`npm run build`), preview comment bots, or integration test jobs as the project grows.

## Testing

Vitest powers the unit tests that cover the honeypot and rate-limiter utilities used by the contact API.

```bash
npm run test
```

Add `--run` to execute once in CI or use `npm run test:coverage` to emit LCOV output for reporting tools such as Codecov. Additional suites exercise email delivery helpers and the order-notification pipeline so dashboard alerts stay reliable.

## Deployment

### Vercel (recommended)

1. Commit and push this repository to GitHub (or import directly on Vercel).
2. In the Vercel dashboard choose **New Project → Import Repository** and select this repo.
3. Accept the default Next.js build settings (build command `npm run build`, output `.next`).
4. Add the environment variables from the [Environment configuration](#environment-configuration) section under **Settings → Environment Variables**. At minimum set `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, and a production `DATABASE_URL` (PostgreSQL recommended). Keep a matching `DATABASE_PROVIDER` note alongside your secrets so teammates know which Prisma provider the deployment expects.
5. After the first build, run database migrations against the production database:

    ```bash
    # run locally with production DATABASE_URL or via Vercel "Run Command"
    npx prisma migrate deploy
    ```

6. Click **Deploy**. Vercel will handle SSL, CDN, and automatic previews for pull requests. You can confirm configuration by hitting `/api/health` once the deployment is live—`dbConfigured: true` indicates Prisma can reach the database.

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
npm run check
# or run individually
npm run lint
npm run test -- --run
npm run build
```

Lint keeps the codebase aligned with Next.js best practices, the Vitest suite verifies spam-prevention logic, and the production build catches type errors plus confirms every static route renders correctly.

## Production considerations

- Use a HIPAA-compliant (or local regulation compliant) hosting provider and secure email transport.
- Configure environment variables via your hosting provider’s secrets manager.
- Replace the placeholder cart/local storage workflow with your preferred commerce solution before accepting payments.
