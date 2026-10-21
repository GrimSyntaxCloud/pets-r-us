# Pets-R-Us

Pets-R-Us is a Bellevue University web-development coursework project by Andres Macias for a fictional pet-service business. It demonstrates a full-stack flow: browse grooming, boarding, and training services; register and sign in; edit your own profile; and submit and view appointment requests.

The earlier Heroku demo is offline. This repair prepares the application for a future deployment; **no Azure resources or live database have been changed and no new live URL is available yet**.

## How it works

Express 5 renders the original EJS/HTML templates. Passport handles login, Node's built-in scrypt hashes passwords, and Mongoose persists users and appointment requests. Sessions use MongoDB via `connect-mongo`, with HTTP-only, SameSite cookies. Every form submission, including logout, uses a session-bound CSRF token. Registration and login requests are rate limited.

Appointments reference the authenticated user's stable database ID. Visitors cannot choose another owner, see another account's history, or set demo/expiry flags. The former public account/email directory has been removed. The appointment form and save handler now work, and duplicate usernames are enforced by a database index.

This is a demonstration, not a real pet-services booking system: requests do not reserve time slots, send email, or accept payments. Use fictional personal details and a unique demo password.

## Local setup

Use Node.js 24 and a local MongoDB instance. No paid hosting is needed.

```sh
npm ci
cp .env.example .env
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Put that generated value in `.env` as `SESSION_SECRET`. Keep `MONGODB_URI` pointed at a local database named `pets_r_us_local`. `.env` is ignored by Git. The example session secret is intentionally rejected.

```sh
npm run db:prepare
npm start
```

Open http://localhost:3000. Database preparation creates the unique username, appointment lookup, and expiry indexes, then inserts one fictional, read-only appointment for `/demo`. It is idempotent and accepts only a localhost `pets_r_us_*` database. Do not reuse old connection strings from Git history.

For a temporary preview without installing a MongoDB service:

```sh
npm run demo:local
```

This downloads a MongoDB test binary on first use, runs a disposable local database, and launches the app on port 3000. Ctrl+C stops the app and deletes this preview's temporary database. No Azure connection is used.

## Demo data retention

- Visitor accounts expire **96 hours after registration**, even if edited or used again.
- Appointment requests expire no later than their owner's account. Later requests therefore may remain for less than 96 hours.
- Authentication and history queries reject expired records immediately, even before background deletion finishes.
- Local MongoDB TTL indexes remove expired records asynchronously. The standalone server also attempts cleanup hourly while running; `npm run db:cleanup` can run it explicitly against a local database.
- Server-created fictional sample appointments have `isDemo: true` and no expiry. They are read-only and excluded from cleanup. Client input cannot set these fields.
- Sessions last at most two hours; an expired account cannot use a still-existing session.
- Unknown legacy records are not automatically deleted. A migration must explicitly classify them and assign an expiry.

The limits of 100 active visitor accounts and 20 appointment requests per account are demo guardrails, not billing guarantees or transactional quotas.

## Checks

```sh
npm test
npm audit
```

Integration tests use a disposable real local MongoDB process. They exercise registration, login/logout, duplicate usernames, CSRF failures, repeated appointments, ownership isolation, validation, profile editing, expiry boundaries, cleanup, and sample-data preservation. They do not connect to Atlas or Azure and are not a Cosmos compatibility test.

## Azure deployment is pending approval

An Azure Static Web Apps managed API is not a drop-in host for this server-rendered Express app. Deployment still needs a static frontend/managed-API adapter and a reviewed database migration plan. The existing Cosmos MongoDB account uses version 4.2 and two dedicated 400 RU/s allocations; adding another dedicated allocation would exceed its 1,000 RU/s cap.

The proposed shared-throughput database, per-project collections, Cosmos-specific expiry configuration, credentials, proxy/cookie settings, and public-demo validation must be approved and tested separately. Ordinary MongoDB `expiresAt` TTL indexes from local preparation must not be assumed compatible with Cosmos 4.2. Managed HTTP APIs also cannot rely on this server's hourly interval as a background scheduler.

The old hardcoded database credential was removed from current source, but may remain in history. Its owner must revoke it before public relaunch. New deployment credentials belong only in server environment settings, never browser code, repository files, or screenshots. No subscription upgrade, spending-limit removal, or throughput-cap increase is authorized.
