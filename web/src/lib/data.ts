export const AUTHOR = {
  name: "Afridi Akbar Ifty",
  github: "iamafridi",
  githubUrl: "https://github.com/iamafridi",
  portfolioUrl: "https://iamafrididev.netlify.app",
  email: "support@connectdots.pro",
};

export const REPO_URL = "https://github.com/iamafridi/connect-dots";

export const CPEAK_URL = "https://www.npmjs.com/package/cpeak";

export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Explore", to: "/explore" },
  { label: "Pricing", to: "/pricing" },
] as const;

export const EXPLORE_ROUTES = [
  {
    idx: "01",
    kicker: "The product",
    title: "Product",
    to: "/product",
    body: "Shorten a URL in the command center — six link types, custom codes, QR codes, batch tags, and real-time view analytics in one console.",
    tags: ["REST API", "PostgreSQL", "Redis", "analytics"],
    foot: "route → /product",
    tone: "coral",
  },
  {
    idx: "02",
    kicker: "The code",
    title: "Open source",
    to: "/opensource",
    body: "MIT-licensed monorepo on Node.js + TypeScript, a zero-dependency framework, and a benchmark suite you can run to verify every number.",
    tags: ["node.js", "cpeak", "typescript", "MIT"],
    foot: "route → /opensource",
    tone: "lime",
  },
  {
    idx: "03",
    kicker: "The manual",
    title: "Documentation",
    to: "/docs",
    body: "Everything in one place — architecture, environment config, the request lifecycle, npm scripts, and the full API reference.",
    tags: ["getting started", "reference", "runbooks"],
    foot: "route → /docs",
    tone: "violet",
  },
] as const;

export const PERF_METRICS = [
  { value: "800k+", label: "requests / second", symbol: "+" },
  { value: "40M+", label: "requests / month", symbol: "+" },
  { value: "100%", label: "node.js, from scratch", symbol: "=" },
  { value: "0", label: "http frameworks", symbol: "—" },
] as const;

export const HOW_IT_WORKS = [
  {
    title: "Paste a long URL",
    body: "Give ConnectDots any destination — a product page, a video, a campaign. It runs the URL through validation and a Web Risk safety check before anything is created.",
  },
  {
    title: "Pick a short code",
    body: "Six link types cover every case — a random classic code, your own custom slug, a 1–2 character ultra code, a numeric digit code, a QR link, or a username-scoped affix.",
  },
  {
    title: "Redirect at 800k+ RPS",
    body: "Each hit is a 302 through a Cpeak core load-tested to 800,000+ requests per second — with a view event pushed to a Redis stream for your analytics.",
  },
] as const;

export const FEATURES = [
  {
    id: "F01",
    title: "Six link types",
    body: "Classic, custom, affix, ultra, digit, and QR — generated and reserved without collisions, switchable from the customization modal.",
    tech: "src/lib/links.ts · classic/custom/affix/ultra/digit/qr",
  },
  {
    id: "F02",
    title: "Real-time analytics",
    body: "Views stream into a capped Redis channel and are batch-persisted by the janitor — 500 rows at a time, acknowledged after every write.",
    tech: "connectdots:stream:views · MAXLEN ~ 100k · janitor",
  },
  {
    id: "F03",
    title: "Safety-first redirects",
    body: "Google Web Risk screens every destination, and non-allowlisted hosts get an interstitial warning page before the 302.",
    tech: "web-risk.ts · domain-allowlist.ts · /redirect-warning",
  },
  {
    id: "F04",
    title: "Real accounts",
    body: "Email + password with 5-digit verification codes, or one-click Google OAuth. Optional username handles for affix links.",
    tech: "email-codes.ts · google-oauth.ts · timing-safe compare",
  },
  {
    id: "F05",
    title: "Hard anti-abuse",
    body: "Per-IP and per-email rate limits, a 5-attempt code lockout, login throttling, and signed HTTP-only cookies with a revocable token store.",
    tech: "rate-limit.ts · tokens table · 30-day sessions",
  },
  {
    id: "F06",
    title: "Operationally lean",
    body: "A forked cluster that restarts dead workers, daily rotating logs, and a schema migration entrypoint for clean deploys.",
    tech: "cluster.ts · logs/ · npm run schema",
  },
] as const;

export const ARCH_NODES = [
  { name: "POST /url", detail: "atomic CTE · QR pre-compute · cache pre-warm", color: "coral" },
  { name: "L1 Process RAM", detail: "V8 LRU map · < 0.05ms · 50k keys", color: "lime" },
  { name: "L2 Redis Cluster", detail: "ioredis.Cluster · {id} slot sharded · < 0.40ms", color: "coral" },
  { name: "views stream", detail: "XADD → connectdots:stream:views", color: "lime" },
  { name: "janitor", detail: "XREADGROUP · batch 500 · XACK", color: "violet" },
  { name: "PostgreSQL 16", detail: "12 tables · cold miss L3 fallback", color: "" },
] as const;

export const REDIRECT_TIERS = [
  {
    tier: "Tier 01",
    name: "L1 Process Memory",
    target: "In-Memory V8 LRU",
    latency: "< 0.05 ms",
    badge: "Zero Network I/O",
    tone: "lime",
    desc: "Top 50,000 hottest redirect URLs resolve directly from local Node process RAM. Bypasses TCP sockets, serialization, and network hops completely.",
    specs: ["50k bounded LRU Map", "Sub-microsecond read seek", "Redis Pub/Sub multi-worker eviction"],
  },
  {
    tier: "Tier 02",
    name: "L2 Redis Cluster",
    target: "AWS ElastiCache / Redis",
    latency: "< 0.40 ms",
    badge: "Hashtag Sharded",
    tone: "coral",
    desc: "Distributed O(1) cache using {lookupKey} hashtag syntax, ensuring all keys for a link map to the exact same Redis hash slot across 30+ cluster nodes.",
    specs: ["ioredis.Cluster auto-discovery", "Hashtag slot distribution", "Immediate creation pre-warming"],
  },
  {
    tier: "Tier 03",
    name: "L3 PostgreSQL Relational",
    target: "ACID Persistent Store",
    latency: "~ 3.0 ms",
    badge: "Cold Miss Fallback",
    tone: "violet",
    desc: "Queried only when L1 and L2 miss. Once resolved, writes back through to L2 and L1. Includes 30s negative caching to stop database enumeration attacks.",
    specs: ["Single-connection cold fetch", "Automatic write-through", "Anti-enumeration negative cache"],
  },
] as const;

export const FAST_PATH_PILLARS = [
  {
    title: "Zero-I/O Fast Path",
    desc: "Eliminates fs.stat filesystem lookups on short codes by fast-forwarding redirects straight to memory.",
    tag: "0 disk lookups",
  },
  {
    title: "Atomic 1-Query Writes",
    desc: "Pre-generates QR and short codes in RAM, reducing link creation from 3 sequential round-trips to 1.",
    tag: "66% fewer DB ops",
  },
  {
    title: "Pub/Sub Worker Eviction",
    desc: "Broadcasts invalidations on connectdots:cache:invalidate so all clustered Node workers evict L1 in real time.",
    tag: "Cluster-coherent",
  },
] as const;

export const LINK_TYPES = [
  { name: "classic", eg: "connectdots.pro/a8f2k", body: "The default — 6 random glyphs (34-char alphabet, no o/l), generated on the fly with a retry loop." },
  { name: "custom", eg: "connectdots.pro/my-brand", body: "Your own slug, globally unique and always available to check first." },
  { name: "affix", eg: "connectdots.pro/iftys/pub", body: "Username-scoped codes so a short handle is never shared across people." },
  { name: "ultra", eg: "connectdots.pro/yx", body: "1–2 character codes claimed atomically from a pre-seeded table. Fast to type, fast to render." },
  { name: "digit", eg: "connectdots.pro/482913", body: "Numeric codes generated on demand for keyboards, SMS, and QR contexts." },
  { name: "qr", eg: "connectdots.pro/q/9t2", body: "A scannable QR PNG per link, ownership-protected under /qr/:id." },
] as const;

export const MILESTONES = [
  {
    date: "SEP 2025",
    title: "Runtime & framework",
    body: "ConnectDots starts as the first real-world application for Cpeak — a zero-dependency Node.js framework written alongside it. No Express, no framework gods.",
  },
  {
    date: "DEC 2025",
    title: "Product core",
    body: "The PostgreSQL schema lands: 12 tables wired with triggers, six link types, full email + Google auth, URL safety checks, and per-route rate limiting.",
  },
  {
    date: "MAR 2026",
    title: "The pipeline",
    body: "Views stop touching the database per-hit. Every redirect XADDs to a capped Redis stream and the janitor batch-writes 500 events at a time to Postgres.",
  },
  {
    date: "JUN 2026",
    title: "Load-tested",
    body: "A dedicated load-test suite pushes one Cpeak node past 800,000 requests per second — the same runtime this site runs on.",
  },
  {
    date: "SEP 2026",
    title: "Open source",
    body: "MIT licensed and released. The code, the schema, the deployment stack, and the benchmark suite are all public.",
  },
] as const;

export const PHILOSOPHY = [
  {
    idx: "01",
    title: "Performance-first",
    body: "Every decision is a hot-path decision. Indexed reads over table scans, Redis for writes, and a framework whose default is speed.",
  },
  {
    idx: "02",
    title: "From scratch",
    body: "No third-party HTTP framework, no ORM, no scaffolding. When you read the source you see exactly what runs in production.",
  },
  {
    idx: "03",
    title: "Security by default",
    body: "Trusted-client IPs only, constant-time code compares, 5-attempt lockouts, signed cookies, and safety checks on every new URL.",
  },
  {
    idx: "04",
    title: "Open source always",
    body: "MIT, public history, and a benchmark suite you can run on your own machine to verify the numbers.",
  },
] as const;

export const REPOS = [
  {
    name: "connectdots",
    url: REPO_URL,
    body: "The product itself — the URL shortener, API, janitor, and deployment stack you're reading about.",
    tags: ["node.js", "cpeak", "postgres", "redis"],
  },
  {
    name: "cpeak",
    url: CPEAK_URL,
    body: "The zero-dependency Node.js framework underneath. Routing, middleware, static files, auth, sessions — all from scratch.",
    tags: ["framework", "zero-dependency", "typescript"],
  },
] as const;

export const REPO_METRICS = [
  { value: "800k+", label: "RPS load-tested", tone: "coral" },
  { value: "40M+", label: "requests / month", tone: "lime" },
  { value: "100%", label: "built from scratch", tone: "violet" },
  { value: "0", label: "HTTP framework deps", tone: "coral" },
] as const;

export type Tone = "coral" | "lime" | "violet";

export const BENCH_LADDER = [
  { code: "GET /code-v1", what: "ORDER BY RANDOM()", note: "full table scan — O(n)" },
  { code: "GET /code-v2", what: "COUNT + random id", note: "index lookup" },
  { code: "GET /code-v3", what: "max id + random id", note: "index lookup" },
  { code: "GET /code-v4", what: "bounded random id", note: "index lookup — O(1)" },
  { code: "GET/POST /code-fast", what: "Redis hash", note: "O(1), pipelined" },
] as const;

export const TECH_STACK = [
  { name: "Node.js 22+", role: "ESM runtime, cluster worker per CPU" },
  { name: "Cpeak", role: "zero-dependency HTTP framework" },
  { name: "PostgreSQL 16", role: "12 tables, triggers, raw SQL" },
  { name: "Redis 7", role: "capped views stream + fast path" },
  { name: "TypeScript 5", role: "strict, NodeNext ESM" },
  { name: "Docker + PM2", role: "compose stack + auto-restart cluster" },
] as const;

export const SECURITY_CHECKS = [
  {
    title: "Rate limits everywhere",
    body: "Per-IP and per-email limits, a 5-attempt code lockout, and login throttling with 429 responses.",
  },
  {
    title: "Trusted-client IPs",
    body: "x-forwarded-for is only honored behind a reverse proxy you control (TRUST_PROXY), never spoofable.",
  },
  {
    title: "Revocable sessions",
    body: "Signed HTTP-only cookies backed by a real token store with 30-day expiry — kill a session any time.",
  },
  {
    title: "PBKDF2 passwords",
    body: "210,000-iteration PBKDF2-SHA512 with a 64-byte derived key and a per-user random salt, via Cpeak auth. Full hashes, never plaintext, never reversible.",
  },
  {
    title: "Constant-time codes",
    body: "Email verification codes compare in constant time, expire on use, and lock after five misses.",
  },
  {
    title: "Web Risk screening",
    body: "Every new destination is screened, and non-allowlisted hosts get a warning page before the 302.",
  },
] as const;

export const HOME_FAQS = [
  {
    q: "Is it really built from scratch?",
    a: "Yes — no Express, no Fastify, no ORM, no third-party HTTP layer. ConnectDots runs on Cpeak, the zero-dependency framework written in tandem with it, over raw PostgreSQL and Redis. Read the source and you see exactly what runs in production.",
  },
  {
    q: "How was 800k+ RPS measured?",
    a: "autocannon with 100 concurrent connections over 5 seconds against a single Cpeak process on consumer hardware: 812,403 req/s peak and ~0.11 ms average latency. The load-test suite ships in the repo so you can reproduce it.",
  },
  {
    q: "What happens if the janitor worker dies?",
    a: "Redirects never depend on it. View events simply accumulate in the capped Redis stream until a worker reconnects, then drain in batches of 500 with an XACK after every write.",
  },
  {
    q: "Can I run it myself?",
    a: "PostgreSQL and Redis locally, copy .env.example, run `npm run schema`, then `npm run dev`. Full Docker Compose and PM2 configurations are included for production.",
  },
  {
    q: "What's the license?",
    a: "MIT. The product, the schema, the deployment stack, and the benchmark suite are all public on GitHub — self-host it, fork it, or just audit the numbers.",
  },
] as const;