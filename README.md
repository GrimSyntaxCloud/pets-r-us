# Pets-R-Us

Pets-R-Us is a Bellevue University web-development coursework project by Andres Macias for a fictional pet-service business. It demonstrates a full-stack flow: browse grooming, boarding, and training services; register and sign in; edit your own profile; and submit and view appointment requests.

The earlier Heroku deployment has been replaced by a [live Azure demo](https://white-sand-0e657a60f.1.azurestaticapps.net). Hosting uses Static Web Apps Free and an existing free-tier Cosmos DB account.

## How it works

Express 5 renders the EJS/HTML pages on the server. Passport handles login, Node's built-in scrypt hashes passwords, and Mongoose persists users and appointment requests. Sessions use MongoDB via `connect-mongo`, with HTTP-only, SameSite cookies. Every form submission, including logout, uses a session-bound CSRF token. Registration and login requests are rate limited.

Appointments reference the authenticated user's stable database ID. Visitors cannot choose another owner, see another account's history, or set demo/expiry flags. The former public account/email directory has been removed. The appointment form and save handler now work, and duplicate usernames are enforced by a database index.

This is a demonstration, not a real pet-services booking system: requests do not reserve time slots, send email, or accept payments. Use fictional personal details and a unique demo password.

## Pet clubhouse design

The site has a warm, playful visual identity across the homepage, service catalog, registration/login, profile, and appointment forms. Original SVG pet illustrations, a small keyboard-accessible “boop” interaction, responsive navigation, and reduced-motion support are implemented with plain CSS and JavaScript. There is no paid design service, animation library, external font request, or new hosting dependency.

- Shared navigation and footer: `views/header.html` and `views/footer.html`.
- Design system and responsive layouts: `public/styles/site.css`.
- Navigation and the optional pet interaction: `public/js/menu.js`.
- Original illustrations: `public/images/clubhouse/`.
- Self-hosted Fraunces and DM Sans fonts: `public/fonts/`, with their SIL Open Font License files.
- Ferdinand’s existing project photo remains in `public/images/weekly-dog/`.

Service prices are fictional catalog examples. The earlier nonfunctional contact form has been replaced by links into the working account and appointment flow. The redesign does not change the database schema, authentication, retention policy, or Azure resource configuration.

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

## Azure deployment

The Azure deployment uses Static Web Apps **Free**, with Express/EJS pages served through managed Node.js HTTP functions. Route rewrites keep the original page URLs. Assets are static; accounts, appointments, and sessions remain in Cosmos DB for MongoDB. `npm run package:azure` builds the explicit deployment package; `azure/handler.js` adapts requests without starting a listening server or logging private responses.

Azure settings are server-only: `MONGODB_URI` (a collection-scoped credential), `MONGODB_DATABASE=portfolio-demos`, `SESSION_SECRET` (a random secret), and optional `DEMO_MAINTENANCE=true`. Collections `pets_users`, `pets_appointments`, and `pets_sessions` share a 400 RU/s database pool with the other demos. No paid hosting or additional throughput is required. Keep the account cap at 1,000 RU/s and the subscription spending limit enabled; never upgrade an expired trial automatically.

The app pins the current Mongoose 8 patch because its MongoDB driver supports the existing Cosmos MongoDB 4.2 protocol; Mongoose 9 requires a newer protocol. Cosmos MongoDB 4.2 does not use the local TTL setup. The API checks expiry and cleans expired visitor records on access. An hourly public-repository Actions job uses the environment secret `DEMO_CLEANUP_MONGODB_URI` and repository variable `DEMO_CLEANUP_ENABLED=true`; it logs counts only. Data becomes unusable at 96 hours. Physical deletion happens on the next successful cleanup, usually within an hour. GitHub can delay schedules or disable them after 60 days without repository activity, so check Actions during upkeep. Fictional sample appointments have no expiry and remain read-only.

The deployment workflow runs tests and dependency audit before publishing. `AZURE_DEPLOY_ENABLED=true` enables deployment, using the `azure` environment secret `AZURE_STATIC_WEB_APPS_API_TOKEN`. The Azure adapter test covers form submission, CSRF, secure cookies, persistent sessions, and appointments. The normal local server and local database preparation remain available as described above.
