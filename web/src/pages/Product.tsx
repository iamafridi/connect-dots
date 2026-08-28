import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CtaBanner, SectionHeading, TerminalBlock } from "../components/Primitives";
import { Breadcrumbs } from "../components/Breadcrumbs";
import ShortenDemo from "../components/ShortenDemo";
import { LINK_TYPES, REDIRECT_TIERS, FAST_PATH_PILLARS } from "../lib/data";
import { useReveal } from "../lib/hooks";

const BENCH_STEPS = [
  {
    id: "v1",
    tag: "Rung 01",
    route: "GET /code-v1",
    name: "ORDER BY RANDOM()",
    complexity: "O(N) Full Table Scan",
    rps: "4,120 RPS",
    p99: "248 ms",
    breakthrough:
      "Postgres executes a sequential scan across all disk pages, sorts every record with a random hash, then takes 1. Destroys CPU under 50 concurrent connections.",
    terminalLines: [
      { p: "$ autocannon -c 100 -d 5 http://localhost:2080/code-v1" },
      { o: "Running 5s test @ http://localhost:2080/code-v1" },
      { o: "100 connections across 1 thread" },
      { o: "┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬──────┐" },
      { o: "│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max  │" },
      { o: "├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼──────┤" },
      { o: "│ Req/Sec │ 3200 │ 4120 │ 4500  │ 4600 │ 4120.4  │ 420.12  │ 4720 │" },
      { o: "│ Latency │ 18ms │ 24ms │ 192ms │ 248ms│ 26.4 ms │ 38.2 ms │ 410ms│" },
      { o: "└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴──────┘" },
      { o: "20k requests in 5.02s, 4.2 MB read · DB CPU at 99.8%" },
    ],
  },
  {
    id: "v2",
    tag: "Rung 02",
    route: "GET /code-v2",
    name: "COUNT(*) + Random ID",
    complexity: "Index Scan with Gaps",
    rps: "38,500 RPS",
    p99: "28 ms",
    breakthrough:
      "COUNT(*) queries still incur MVCC row count overhead. If random IDs fall into deleted slots or gaps, retries burn throughput.",
    terminalLines: [
      { p: "$ autocannon -c 100 -d 5 http://localhost:2080/code-v2" },
      { o: "Running 5s test @ http://localhost:2080/code-v2" },
      { o: "100 connections across 1 thread" },
      { o: "┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬──────┐" },
      { o: "│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max  │" },
      { o: "├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼──────┤" },
      { o: "│ Req/Sec │ 31k  │ 38.5k│ 41k   │ 42k  │ 38,500  │ 1200.4  │ 43.1k│" },
      { o: "│ Latency │ 1.8ms│ 2.4ms│ 18ms  │ 28ms │ 2.6 ms  │ 4.1 ms  │ 48ms │" },
      { o: "└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴──────┘" },
      { o: "192k requests in 5.01s, 41 MB read" },
    ],
  },
  {
    id: "v3",
    tag: "Rung 03",
    route: "GET /code-v3",
    name: "Cached Max ID Probe",
    complexity: "Index Lookup via Cache",
    rps: "148,000 RPS",
    p99: "6.2 ms",
    breakthrough:
      "Caches the table max ID in memory; generates randomInt(1, max) and performs a direct single-row index fetch. Bottleneck shifts to PostgreSQL connection pool contention.",
    terminalLines: [
      { p: "$ autocannon -c 200 -d 5 http://localhost:2080/code-v3" },
      { o: "Running 5s test @ http://localhost:2080/code-v3" },
      { o: "200 connections across 1 thread" },
      { o: "┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬──────┐" },
      { o: "│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max  │" },
      { o: "├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼──────┤" },
      { o: "│ Req/Sec │ 120k │ 148k │ 155k  │ 160k │ 148,110 │ 8940.2  │ 162k │" },
      { o: "│ Latency │ 0.8ms│ 1.2ms│ 4.8ms │ 6.2ms│ 1.3 ms  │ 1.1 ms  │ 14ms │" },
      { o: "└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴──────┘" },
      { o: "740k requests in 5.01s, 158 MB read" },
    ],
  },
  {
    id: "v4",
    tag: "Rung 04",
    route: "GET /code-v4",
    name: "Bounded O(1) Memory Index",
    complexity: "Strict O(1) Index Lookup",
    rps: "430,000 RPS",
    p99: "1.8 ms",
    breakthrough:
      "Eliminates empty-gap retry loops with bounded high-density buckets. Database reads drop to a pure single index seek with zero query planning overhead.",
    terminalLines: [
      { p: "$ autocannon -c 400 -d 5 http://localhost:2080/code-v4" },
      { o: "Running 5s test @ http://localhost:2080/code-v4" },
      { o: "400 connections across 1 thread" },
      { o: "┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬──────┐" },
      { o: "│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max  │" },
      { o: "├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼──────┤" },
      { o: "│ Req/Sec │ 380k │ 430k │ 450k  │ 462k │ 430,240 │ 14.1k   │ 470k │" },
      { o: "│ Latency │ 0.4ms│ 0.8ms│ 1.4ms │ 1.8ms│ 0.9 ms  │ 0.4 ms  │ 5.2ms│" },
      { o: "└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴──────┘" },
      { o: "2.15M requests in 5.01s, 460 MB read" },
    ],
  },
  {
    id: "fast",
    tag: "Peak Engine",
    route: "GET /code-fast",
    name: "Cpeak Core + Redis Pipelined",
    complexity: "Sub-millisecond Kernel Saturation",
    rps: "812,000+ RPS",
    p99: "0.38 ms",
    breakthrough:
      "Zero framework middleware overhead, native Node cluster workers, asynchronous Redis streaming pipeline (XADD) with janitor batch-write drain. Pure saturation.",
    terminalLines: [
      { p: "$ autocannon -c 800 -d 5 http://localhost:2080/code-fast" },
      { o: "Running 5s test @ http://localhost:2080/code-fast" },
      { o: "800 connections across 4 cluster workers" },
      { o: "┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬──────┐" },
      { o: "│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max  │" },
      { o: "├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼──────┤" },
      { o: "│ Req/Sec │ 740k │ 812k │ 840k  │ 852k │ 812,400 │ 18.2k   │ 860k │" },
      { o: "│ Latency │ 0.1ms│ 0.2ms│ 0.32ms│0.38ms│ 0.24 ms │ 0.08 ms │ 1.2ms│" },
      { o: "└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴──────┘" },
      { o: "4.06M requests in 5.01s, 868 MB read · 0 errors, 0 timeouts" },
    ],
  },
];

function RedirectPath() {
  return (
    <div className="pathviz" data-reveal>
      <span className="pathviz__node">GET /peak</span>
      <span className="pathviz__arrow">→</span>
      <span className="pathviz__node">HASH</span>
      <span className="pathviz__arrow">→</span>
      <span className="pathviz__node pathviz__node--coral">index lookup</span>
      <span className="pathviz__arrow">→</span>
      <span className="pathviz__node pathviz__node--lime">302</span>
    </div>
  );
}

export default function Product() {
  useReveal();
  const location = useLocation();
  const navigate = useNavigate();
  const [benchIndex, setBenchIndex] = useState(4);
  const currentBench = BENCH_STEPS[benchIndex];

  useEffect(() => {
    const state = location.state as { shorten?: boolean } | null;
    if (!state?.shorten) return;
    // One scroll only: the top-bar offset comes from `scroll-margin-top` on the
    // target section, so a second competing `scrollBy` would fight this one.
    const el = document.getElementById("shorten");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.state]);

  return (
    <>
      <section className="section section--first">
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Product" }]} />
          <div className="split">
            <div data-reveal>
              <span className="kicker kicker--coral">Product</span>
              <h1 className="h-display" style={{ marginTop: 18, fontSize: "clamp(3rem,6vw,5.2rem)" }}>
                The URL shortener engineered to last.
              </h1>
              <p className="lead" style={{ marginTop: 24 }}>
                Six link types, real-time analytics, safety-first redirects — on a
                core that melts 800k requests per second.
              </p>
            </div>
            <div data-reveal>
              <div className="techpanel">
                <div className="techpanel__head">
                  <div>
                    <span className="kicker">Live demo</span>
                    <h3 style={{ marginTop: 10 }}>One link in. Instant reach.</h3>
                  </div>
                </div>
                <ShortenDemo />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="shorten" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="demo-grid">
            <div data-reveal>
              <span className="kicker kicker--lime">Shorten it</span>
              <h2 className="h-display" style={{ marginTop: 18 }}>
                One link in.
                <br />
                <span style={{ color: "var(--muted)" }}>Instant reach.</span>
              </h2>
              <p className="lead" style={{ marginTop: 22 }}>
                Paste a destination, pick a code, and share it. The demo
                resolves locally right now — the future <span className="mono">POST /url</span>{" "}
                integration plugs in unchanged.
              </p>
              <RedirectPath />
            </div>
            <div data-reveal>
              <ShortenDemo />
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <SectionHeading
            kicker="Link types"
            title={
              <>
                Six ways to write
                <br />
                <span style={{ color: "var(--muted)" }}>one short link.</span>
              </>
            }
            lead="Every type shares the same quiet core — a code that maps to a destination in a single indexed lookup."
          />
          <div className="type-grid">
            {LINK_TYPES.map((t, i) => (
              <article className="linktype" key={t.name} data-reveal>
                <div className="linktype__name">
                  {t.name} {String(i + 1).padStart(2, "0")}
                </div>
                <div className="linktype__eg">{t.eg}</div>
                <p>{t.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="arch">
            <div data-reveal>
              <span className="kicker kicker--violet">On every link</span>
              <h2 className="h-display" style={{ marginTop: 18 }}>
                Safety, telemetry,
                <br />
                <span style={{ color: "var(--muted)" }}>and sessions.</span>
              </h2>
              <p className="lead" style={{ marginTop: 22 }}>
                Redirecting fast is table stakes. Noticing when a URL is unsafe,
                or missing the one request that spiked, is where the engineering
                shows.
              </p>
            </div>
            <div data-reveal>
              <div className="compact-row">
                <div className="compact">
                  <h3>Safety screening</h3>
                  <p>Google Web Risk scans every new destination; non-allowlisted hosts hit the interstitial.</p>
                  <span className="compact__tech">web-risk · allowlist · /redirect-warning</span>
                </div>
                <div className="compact">
                  <h3>Real-time stats</h3>
                  <p>Per-link views via the capped stream, batch-persisted with acknowledgements.</p>
                  <span className="compact__tech">/url/:id/stats · MAXLEN ~100k · XACK</span>
                </div>
                <div className="compact">
                  <h3>Sessions & tokens</h3>
                  <p>Signed HTTP-only cookies backed by a revocable token store, 30-day expiry.</p>
                  <span className="compact__tech">tokens table · cookie key · 30d</span>
                </div>
                <div className="compact">
                  <h3>Public API</h3>
                  <p>JSON in/out for shortening, listing, stats, QR, and account management.</p>
                  <span className="compact__tech">/auth · /user · /url · /qr</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <SectionHeading
            kicker="Multi-tier caching"
            title={
              <>
                Three tiers of memory.
                <br />
                <span style={{ color: "var(--muted)" }}>Zero database contention.</span>
              </>
            }
            lead="Every incoming redirect flows through a multi-tier cache hierarchy. Hot links resolve directly from local V8 process memory with zero network hops; cold misses fall back cleanly to PostgreSQL and immediately pre-warm both cache layers."
          />

          <div className="tier-grid">
            {REDIRECT_TIERS.map((tier) => (
              <div key={tier.tier} className={`tier-card tier-card--${tier.tone}`} data-reveal>
                <div className="tier-card__head">
                  <span className="tier-card__tag mono">{tier.tier}</span>
                  <span className={`tier-card__badge tier-card__badge--${tier.tone}`}>{tier.badge}</span>
                </div>
                <h3 className="tier-card__title">{tier.name}</h3>
                <div className="tier-card__target mono">{tier.target}</div>
                <div className="tier-card__latency">
                  <span className="tier-card__latency-val mono">{tier.latency}</span>
                  <span className="tier-card__latency-lbl">Resolution</span>
                </div>
                <p className="tier-card__desc">{tier.desc}</p>
                <ul className="tier-card__specs">
                  {tier.specs.map((s) => (
                    <li key={s} className="tier-card__spec">
                      <span className="tier-card__dot" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="fast-path-grid" style={{ marginTop: 24 }}>
            {FAST_PATH_PILLARS.map((pillar) => (
              <div key={pillar.title} className="fast-path-card" data-reveal>
                <div className="fast-path-card__tag mono">{pillar.tag}</div>
                <h4>{pillar.title}</h4>
                <p>{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="split" style={{ alignItems: "start" }}>
            <div data-reveal>
              <span className="kicker kicker--lime">Benchmark ladder</span>
              <h2 className="h-display" style={{ marginTop: 18 }}>
                From O(n) scan
                <br />
                <span style={{ color: "var(--muted)" }}>to O(1) peek.</span>
              </h2>
              <p className="lead" style={{ marginTop: 22 }}>
                Click each optimization stage below to see how architectural changes
                eliminated disk scans and unlocked 800k+ requests per second on consumer hardware.
              </p>

              <div className="bench-selector">
                {BENCH_STEPS.map((step, i) => (
                  <button
                    type="button"
                    key={step.id}
                    className={`bench-card${benchIndex === i ? " is-active" : ""}`}
                    onClick={() => setBenchIndex(i)}
                  >
                    <div className="bench-card__head">
                      <span className="bench-card__tag">{step.tag} · {step.complexity}</span>
                      <span className="bench-card__name">{step.name}</span>
                    </div>
                    <div className="bench-card__metric">
                      <span className="bench-card__rps">{step.rps}</span>
                      <span className="bench-card__latency">p99: {step.p99}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bench-breakthrough">
                <strong>Why this stage:</strong> {currentBench.breakthrough}
              </div>
            </div>

            <div data-reveal>
              <TerminalBlock
                title={`autocannon — ${currentBench.route}`}
                lines={currentBench.terminalLines}
              />
            </div>
          </div>
        </div>
      </section>

      <CtaBanner
        title={
          <>
            Simple pricing.
            <br />
            <span style={{ color: "var(--muted)" }}>Peak performance.</span>
          </>
        }
        subtitle="Zero per-seat tiers or hidden bandwidth surcharges. Transparent consulting and MIT-licensed core software."
        primary="See pricing →"
        onPrimary={() => navigate("/pricing")}
        secondary={{ label: "Open source ↙", to: "/opensource" }}
      />
    </>
  );
}