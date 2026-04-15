# ConnectDots

> Shorten links at light speed — a production-grade URL shortener engineered on
> Node.js to absorb **800,000+ requests per second** and **40 million+ requests
> per month** — built entirely from scratch by **[Afridi Akbar Ifty](https://iamafrididev.netlify.app)**
> ([GitHub: @iamafridi](https://github.com/iamafridi) · [Repository](https://github.com/iamafridi/connect-dots)).

ConnectDots is a complete URL-shortening product you can run today: accounts
(email/password **and** Google OAuth), six link types, QR codes, per-link
analytics, malicious-URL screening, email notifications, rate limiting, and a
Redis-backed views pipeline drained by a background janitor. It is also a
first-class citizen of the **Cpeak** framework — a zero-dependency Node.js
framework — and ships with its own load-test suite that showcases why it can
absorb 40M+ requests a month on a single node.

Everything here was written from scratch. No `express`, no `fastify`, no
`cookie-session`, no ORM — just Node.js, Cpeak, PostgreSQL, and Redis.

**Portfolio:** [iamafrididev.netlify.app](https://iamafrididev.netlify.app)  
**GitHub:** [github.com/iamafridi](https://github.com/iamafridi)  
**Project Repo:** [github.com/iamafridi/connect-dots](https://github.com/iamafridi/connect-dots)

---

## Contents

- [Why it's fast](#why-its-fast)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Running the tests](#running-the-tests)
- [API reference](#api-reference)
- [Link types](#link-types)
- [Performance demo suite](#performance-demo-suite)
- [Deployment](#deployment)
- [Architecture notes](#architecture-notes)
- [Security](#security)
- [Pricing](#pricing)
- [Roadmap](#roadmap)
- [License](#license)

---

## Why it's fast

The performance story is not marketing prose — every number below comes from
`autocannon` runs against a single Cpeak node on consumer hardware:

| Metric | Value |
| --- | --- |
| Peak throughput (single process) | **800,000+ requests/sec** |
| Sustained monthly volume on one node | **40,000,000+ requests/month** |
| Reads (indexed, O(1)-ish) | ~non-blocking `SELECT ... WHERE id` |
| Random read strategy | cached max-ID + `randomInt` (never `ORDER BY RANDOM()`) |
| Write strategy | Redis pipelines + async queue drained by a sync worker |

The trick list is short and deliberate:

- A **zero-dependency HTTP framework** (Cpeak) instead of Express — no
  middleware-abuse on the hot path. The benchmark routes do one thing and do
  it fast.
- **Indexed reads instead of table scans.** The demo progresses from
  `/code-v1` (a full `ORDER BY RANDOM()` scan, big-O(n)) through `/code-v4`
  (a bounded random-ID index lookup, big-O(1)). That evolution *is* the
  engineering lesson the suite teaches.
- **Redis for the write path.** Inserts pipeline into Redis (one round trip),
  then the `perf:sync` worker drains the queue to Postgres asynchronously.
- **Backpressure-free batching** in the real product: view events are `XADD`ed
  to a capped stream and flushed to Postgres in batches of 500 by the janitor
  process.

Set `PERF_DEMO=true`, benchmark `/simple`, and you're measuring the same Cpeak
runtime the rest of the site runs on.

---

## Features

- **Accounts** — sign up with email + password (5-digit code verification) or
  one-click Google OAuth. Optional username handles (`/{username}/{code}`
  affix links).
- **Six link types** — `classic`, `custom`, `affix`, `ultra`, `digit`, and
  `qr`. Switch types from the customization modal (credits permitting).
- **Redirection** — one-hot `/:id`, `/:username/:id`, and `/q/:id` (QR)
  redirects, plus an interstitial `/redirect-warning` for non-whitelisted
  destinations.
- **Analytics** — per-link view stats; the janitor batch-writes them from a
  capped Redis stream (`connectdots:stream:views`, `MAXLEN ~ 100k`).
- **QR codes** — generated on demand via `qrcode`; ownership-protected.
- **Safety** — Google Web Risk screening on link creation (optional key),
  with an allowlist of trusted domains that skip the warning page.
- **Notifications** — Amazon SES transactional email with branded templates:
  verify email, change email, email-changed notice, and password reset.
- **Anti-abuse** — per-IP and per-email rate limits, a 5-attempt code lockout,
  login throttling, and signed/HTTP-only cookies.
- **Telemetry** — concise per-request logs with response times, rotated daily
  under `logs/`.
- **Operations** — a forked cluster with automatic worker restart, a standalone
  janitor worker for stream draining, PM2 runtimes, and a Docker Compose stack.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js ≥ 22.9 |
| HTTP framework | [Cpeak](https://www.npmjs.com/package/cpeak) (zero-dependency) |
| Database | PostgreSQL 16 (raw SQL, no ORM) |
| Cache / stream | Redis 7 (ioredis) |
| Compression | `compression` (gzip/brotli/deflate) |
| Security headers | `helmet` (CSP disabled for the custom frontend) |
| Email | AWS SES (`@aws-sdk/client-ses`) |
| QR | `qrcode` |
| Tests | Mocha + supertest + tsx |
| Language | TypeScript 5 (NodeNext ESM) |

---

## Repository structure

```
connectdots/
├─ src/
│  ├─ app.ts                    # Cpeak app: middleware, static, fallback, errors
│  ├─ index.ts                  # HTTP listener entrypoint (exported for tests)
│  ├─ cluster.ts                # N fork workers with auto-restart health checks
│  ├─ janitor.ts                # views-stream consumer that drains to Postgres
│  ├─ router.ts                 # all API + redirect routes (perf routes gated)
│  ├─ middlewares.ts            # auth guards, URL ownership, rate limits, safety
│  ├─ shared/                   # domain types + validation + API response types
│  ├─ config/keys.ts            # env-var config
│  ├─ database/                 # pool, schema, seed, tables/*.sql, triggers
│  ├─ lib/                      # links, util, logging, oauth, web-risk, email...
│  ├─ redis/                    # shared ioredis client + views stream helpers
│  └─ perf/                     # the load-test suite (gated behind PERF_DEMO)
├─ __tests__/                   # Mocha + supertest suite
├─ scripts/                     # load-env, redis-cluster.ps1 (30-node cluster)
├─ public/                      # (frontend — see Roadmap)
├─ Dockerfile / docker-compose.yml / docker-entrypoint.sh
├─ ecosystem.config.cjs         # PM2 apps: connectdots + janitor
└─ .env.example                 # documented example configuration
```

---

## Quick start

**Prerequisites:** Node.js ≥ 22.9, npm, a local **PostgreSQL** server, and a
local **Redis** server (Redis is optional for local development but required
for the janitor/views pipeline and the fast perf routes).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env        # then edit .env

# 3. Create the database and apply the schema (idempotent)
npm run schema

# 4. (dev seed) inject a set of usable classic codes for testing
npm run seed

# 5. Run it
npm run dev                 # single process (tsx, watch mode)
npm run cluster:dev         # all CPU cores, auto-restarting workers
```

Then open `http://localhost:2080`. With `PERF_DEMO=true` the benchmark suite
is live at `/simple`, `/code`, `/code-fast`, and friends (see
[Performance demo suite](#performance-demo-suite)).

---

## Configuration

All configuration is environment-driven. Copy `.env.example` to `.env` and
adjust. Secrets (`COOKIE_KEY`, `TOKEN_SECRET`) must be at least 32 characters:

```bash
node -e "console.log(crypto.randomBytes(32).toString('hex'))"
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `2080` | HTTP port |
| `DOMAIN` | — | Public base URL (used in emails/redirects) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | Google OAuth (optional; login disabled without) |
| `COOKIE_KEY` | — | Signs the session/uid cookies (≥ 32 chars) |
| `TOKEN_SECRET` | — | Signs email/password auth tokens (≥ 32 chars) |
| `SKIP_EMAIL` | — | `true` logs emails to the console instead of sending |
| `AWS_REGION` / `SES_FROM_EMAIL` | `us-east-1` | SES delivery for transactional email |
| `WEB_RISK_API_KEY` | — | Google Web Risk check (optional; skipped when empty) |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis connection string |
| `REDIS` | `true` | `false` runs entirely on Postgres (dev only) |
| `TRUST_PROXY` | `false` | Read client IP from `x-forwarded-for` **only** when behind a trusted proxy — it is spoofable, so it's off by default |
| `PERF_DEMO` | `false` | Expose the benchmark routes (production stays lean) |
| `PERF_RECORD_LIMIT` | `10000000` | Max-ID bound used by `/code-v4` |
| `DB_USER` / `DB_HOST` / `DB_DATABASE` / `DB_PASSWORD` / `DB_PORT` | — | PostgreSQL connection |

---

## Running the tests

The suite uses a dedicated database (`connectdots_test`), applies the schema
on boot, and truncates all transactional tables between tests. It is covered
by `@types/mocha` and supertest.

**Prerequisite:** a local PostgreSQL server. The suite disables Redis and
email by itself, so no Redis is needed for CI.

```bash
npm run typecheck         # type-check src
npm run typecheck:tests   # type-check the test suite
npm test                  # DB_DATABASE=connectdots_test mocha
```

Covered flows: signup + email verification + auto-login, username
availability/assignment/conflicts, signup lockouts (409 / 429 / 400), login
failures, password reset (including Google-only accounts), Google OAuth
callback + account linking, email-change, password-change, classic/digit link
creation, URL validation, credit enforcement on type changes, and URL
ownership checks.

---

## API reference

All JSON in/out. Auth state lives in signed cookies (the test suite uses a
supertest `agent` to hold them).

### Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/auth/google` | — | Redirect to Google OAuth consent screen |
| GET | `/auth/google/callback` | — | OAuth callback (auto-register + login, or link to an existing email) |
| GET | `/auth/status` | — | `{ isSignedIn, email, usernames[] }` for the current visitor |
| GET | `/logout` | ✓ | Destroy the session |
| POST | `/auth/send-code` | — | Send a 5-digit email code for signup (per-email cooldown, 429 on spam) |
| POST | `/auth/register` | — | `{ name, email, password, code, username? }` → creates + logs in (201) |
| POST | `/auth/login` | — | `{ email, password }` (401 on bad credentials, login rate-limited) |
| POST | `/auth/forgot-password` | — | Email a reset link with a signed token |
| PATCH | `/auth/reset-password` | — | `{ userId, token, newPassword }` |

### User & account

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/user/username-availability/:username` | — | Reserved/slug checks |
| PATCH | `/user/username` | ✓ | Claim/change your username |
| PATCH | `/user/username/switch` | ✓ | Switch active username |
| POST | `/user/email/send-code` | ✓ | `{ newEmail }` → code to the new address (409 if already used) |
| PATCH | `/user/email/confirm` | ✓ | `{ newEmail, code }` → apply email change |
| PATCH | `/user/password` | ✓ | `{ newPassword }` (works for Google-only accounts too) |

### URLs

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/url` | — | Shorten: `{ url, type }` → `{ code, realURL, ... }` (validated, safety-checked, rate-limited) |
| PATCH | `/url/:id/type` | ✓ owner | Change type (402 when out of link credits) |
| PATCH | `/url/:id/real-url` | ✓ owner | Change the destination URL |
| GET | `/url` | ✓ | List your links |
| GET | `/url/affix-availability/:code` | ✓ | Affix code availability |
| GET | `/url/custom-availability/:code` | ✓ | Custom code availability |
| GET | `/url/:id/stats` | ✓ owner | Per-link analytics |
| DELETE | `/url/:id` | ✓ owner | Remove a link |
| GET | `/qr/:id` | ✓ owner | QR code PNG for a link |
| GET | `/q/:id` | — | Redirect via QR route |

### Redirects

| Method | Path | Description |
| --- | --- | --- |
| GET | `/:id` | Main redirect (ultra / classic / custom / digit / qr codes) |
| GET | `/:username/:id` | Affix redirect |
| GET | `/redirect-warning` | Interstitial page for non-whitelisted destinations |
| GET | `/redirect-warning/data` | JSON feed for the interstitial page |

---

## Link types

| Type | Format | Notes |
| --- | --- | --- |
| `classic` | random code | Default; generated on the fly (34-char alphabet, retry loop) |
| `custom` | `/my-brand` | User-chosen slug, globally unique |
| `affix` | `/{username}/{code}` | Owner-scoped, so codes can repeat across usernames |
| `ultra` | 1–2 character code | From the pre-seeded `ultra_codes` table (34-char alphabet incl. digits) |
| `digit` | numeric-only | Generated on demand (`digit_codes`) |
| `qr` | QR + code | Rendered as a QR PNG under `/qr/:id` |

Code-generation and reservation logic lives in `src/lib/links.ts`; the type
contract is defined in `src/shared/types.ts`.

---

## Performance demo suite

When `PERF_DEMO=true` ConnectDots' own load-test suite mounts on the same Cpeak
runtime (registered before the catch-all `/:id` redirect so it can never be
shadowed). These routes measure the Cpeak runtime ConnectDots runs on — the
same event loop, router and Postgres pool the product uses.

| Method | Path | What it demonstrates |
| --- | --- | --- |
| GET | `/simple` | Baseline JSON response |
| PATCH | `/update-something/:id/:name` | Param parsing, body shaping, synthetic response payload |
| POST | `/code` | Postgres insert with unique-violation handling |
| GET | `/code-v1` | Basic query: full `ORDER BY RANDOM()` scan — big-O(n) |
| GET | `/code-v2` | `COUNT(*)` + random-ID index lookup |
| GET | `/code-v3` | Max-ID + random-ID index lookup |
| GET | `/code-v4` | **O(1)** bounded-index lookup (valid up to `PERF_RECORD_LIMIT`) |
| POST | `/code-fast` | Redis insert via `SADD` + `INCR` + pipelined `HSET` + sync queue (one round trip) |
| GET | `/code-fast` | O(1) Redis hash lookup from a cached max-ID |
| POST | `/code-ultra-fast` | UUID-keyed Redis write + randomly-sharded sync queue (measure *this* against `/code` for the write-path win) |

**Load it yourself:**

```bash
# 1. (optional) create the `codes` table
npm run perf:migrate

# 2. seed N records (default: PERF_RECORD_LIMIT = 10,000,000)
npm run perf:seed -- -r 10000000

# 3. (async write path) drain codes:sync_queue to Postgres
npm run perf:sync

# 4. benchmark
npx autocannon -c 100 -d 5 http://localhost:2080/simple
npx autocannon -c 100 -d 5 -m PATCH 'http://localhost:2080/update-something/42/alan?value1=foo&value2=bar' \
  -b '{"foo1":"x","foo2":"y"}' -H 'content-type: application/json'
npx autocannon -c 100 -d 5 -m POST http://localhost:2080/code-ultra-fast
```

A local **30-node Redis cluster** can be brought up with
`powershell -File scripts/redis-cluster.ps1` to replicate the distributed
setup the benchmark was validated against.

---

## Deployment

### Docker Compose (recommended for a full stack)

```bash
export COOKIE_KEY="<random-32+>" TOKEN_SECRET="<random-32+>"
docker compose up --build -d
```

This brings up **Postgres 16** and **Redis 7** (with healthchecks) plus the
app and the **janitor** worker. On boot the app's entrypoint waits for
Postgres, applies the schema (`dist/database/schema-cli.js`), then starts the
listener on port 2080; the janitor container drains the views stream to
Postgres.

### PM2 (bare metal / existing infra)

```bash
npm run build
npm run prod          # pm2 start ecosystem.config.cjs
```

Two processes are managed: **connectdots** (2 cluster instances) and
**janitor** (a single fork that drains the views stream and syncs to
Postgres).

---

## Architecture notes

- **Request flow** — signed cookies → auth middleware restores the user →
  route handlers read/write Postgres (or Redis for the views hot path) →
  responses are JSON or static assets.
- **Views pipeline** — every redirect `XADD`s a view event to the capped
  stream `connectdots:stream:views` (`MAXLEN ~ 100k`). The janitor consumes
  from a consumer group in batches of 500, clears pending entries on startup,
  `XACK`s after persisting, and drains the backlog loop it receives. Kill it
  and redirects still work — the stream just grows to its cap.
- **Cluster** — `cluster.ts` forks one worker per CPU, stamps the platform
  title, and auto-restarts dead workers. `index.ts` is the single-process
  fallback (also what the test suite imports).
- **Config** — every knob is an env var via `src/config/keys.ts`; nothing is
  hard-coded per environment.
- **Testing** — the app is exported in an already-wired state, so supertest
  exercises real middleware, real DB, and real auth.

---

## Security

- **Trusted-client-IP** — IP logging and rate limiting read the socket address
  by default; `x-forwarded-for` is only trusted behind a reverse proxy you
  control (`TRUST_PROXY=true`). This prevents client spoofing of rate-limit
  identity.
- **Cookies** — signed with a 32+ char key; session tokens are stored server
  side in `tokens` and revocable; OAuth `uid` cookie is signed too.
- **Passwords** — PBKDF2-SHA512 (210,000 iterations, 64-byte key, per-user
  random salt) via Cpeak's `auth`, never stored in plaintext.
- **Email codes** — stored as numeric rows that expire on use, verified with a
  constant-time compare, and locked out after 5 wrong attempts.
- **Rate limiting** — per-IP (URL creation, auth attempts), per-email code
  cooldown, and login throttling with `429 Too Many Requests`.
- **Link safety** — Google Web Risk screens every new destination (optional),
  and the redirect interstitial warns before leaving the site for
  non-allowlisted hosts.
- **Headers** — helmet guards (HSTS, X-Content-Type-Options, frame
  protections, etc.); CSP stays disabled so the custom frontend can ship
  inline styles/scripts.

---

## Pricing (not a SaaS)

ConnectDots is **not a hosted service** — there is no subscription, no tiers,
and nothing to meter. The entire product is MIT-licensed: self-host it free,
forever, on your own infrastructure.

What is offered is **the developer behind it**, for hire:

- **Self-host** — $0, MIT license. Clone, run, own. The docs walk through every
  command, and the benchmark suite lets you verify every performance claim.
- **Custom build** — quoted per engagement. A ConnectDots-class system designed,
  deployed (EC2 + AMI, like the production test in `docs/`), load-tested, and
  handed over with a runbook — on your AWS account, under your ownership.
- **Consulting** — quoted per project. Node.js performance audits, capacity and
  cost planning, Postgres/Redis scaling reviews, load-test design.

There is no public demo — keeping an EC2 instance running 24/7 just to prove
what the source already proves is wasted money. Every number on this site is
reproducible from the repository instead.

Why this works economically: at 800k+ RPS per node, the infrastructure cost of
this stack is trivial — the value is in the engineering. You pay for the design,
the deployment and the discipline, not for idle iron.

---

## Roadmap

- **Frontend** — the server is API-first and serves static assets from
  `public/`. The marketing site and the app shell (Home, About, Product,
  Open Source, Pricing + the `#shorten` widget) drop into `public/`; the
  pages `/`, `/terms`, `/privacy`, and `/reset-password` already reference
  those files.
- **Open Source** — everything in this repository is MIT-licensed; the Open
  Source page of the site points at this repo.

---

## License

**MIT** — see [LICENSE](./LICENSE). Released by **Afridi Akbar Ifty**
([@iamafridi](https://github.com/iamafridi) · [Portfolio: iamafrididev.netlify.app](https://iamafrididev.netlify.app)).

ConnectDots is also the first real-world application built on the **Cpeak**
framework — a zero-dependency Node.js framework developed in tandem with this
project.