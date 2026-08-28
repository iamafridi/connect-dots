import { Link, useNavigate } from "react-router-dom";
import HeroGeometry from "../components/HeroGeometry";
import ProductWorld from "../components/ProductWorld";
import { useReveal, useTheme } from "../lib/hooks";
import {
  CtaBanner,
  FaqAccordion,
  MetricCard,
  SectionHeading,
  StatusLabel,
  TerminalBlock,
} from "../components/Primitives";
import AnimatedCounter from "../components/AnimatedCounter";
import TypewriterText from "../components/TypewriterText";
import {
  ARCH_NODES,
  AUTHOR,
  FEATURES,
  HOME_FAQS,
  HOW_IT_WORKS,
  PERF_METRICS,
  REPO_URL,
  SECURITY_CHECKS,
  TECH_STACK,
} from "../lib/data";

function PerfBar() {
  return (
    <div className="perfbar" role="list" aria-label="Performance proof">
      {PERF_METRICS.map((m) => (
        <div className="perfcol" role="listitem" key={m.label}>
          <div className="perfcol__num">
            <i aria-hidden="true">{m.symbol}</i>
            <AnimatedCounter value={m.value} />
          </div>
          <div className="perfcol__lab">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  useReveal();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const goShorten = () => navigate("/product", { state: { shorten: true } });

  return (
    <>
      <section className="hero hero--home">
        <div className="hero__copy">
          <StatusLabel>Load-tested past 800k RPS · engineered for 40M+/month</StatusLabel>
          <h1 className="h-hero">
            Shorten links at <span className="grad">light speed.</span>
          </h1>
          <p className="lead">
            ConnectDots is a production-grade URL shortener built entirely from
            scratch on Node.js — load-tested to 800,000+ requests per second and
            tuned to absorb 40 million requests a month.
          </p>
          <div className="hero__actions">
            <button type="button" className="btn btn--coral" onClick={goShorten}>
              Start shortening →
            </button>
            <a
              className="btn btn--ghost"
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
            >
              Star on GitHub
            </a>
          </div>
          <div className="hero__proof">
            <span>MIT licensed</span>
            <span>99.99% target uptime</span>
          </div>
        </div>
        {theme === "light" ? <ProductWorld /> : <HeroGeometry />}
      </section>

      <PerfBar />

      <section className="section">
        <div className="container">
          <SectionHeading
            kicker="How it works"
            title={
              <>
                Three moves. <br />
                <span style={{ color: "var(--muted)" }}>Instant reach.</span>
              </>
            }
            lead="No accounts required to shorten. No queues, no waiting."
          />
          <div className="steps">
            {HOW_IT_WORKS.map((step, i) => (
              <article className="step" key={step.title} data-reveal>
                <div className="step__idx">{`0${i + 1}`}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingBottom: 120 }}>
        <div className="container">
          <div className="speed-strip">
            <div data-reveal>
              <span className="kicker kicker--lime">Redirect speed proof</span>
              <h2 className="h-display" style={{ marginTop: 18 }}>
                The lookups are <span className="grad">indexed</span>, not scanned.
              </h2>
              <p className="lead" style={{ marginTop: 22 }}>
                Every redirect is a deterministic hash lookup on a
                PostgreSQL index — never an ORDER BY RANDOM(). The heavy
                telemetry work happens in Redis, off the hot path.
              </p>
              <Link to="/product" className="link-line" style={{ marginTop: 30 }}>
                See the benchmark ladder ↓
              </Link>
            </div>

            <div className="speed-strip__panel" data-reveal>
              <div className="speed-row">
                <span className="speed-row__k">Route</span>
                <span className="speed-row__v">
                  GET <em>/:id</em> → HASH → 302
                </span>
              </div>
              <div className="speed-row">
                <span className="speed-row__k">Lookup</span>
                <span className="speed-row__v">
                  index read, <em>&lt; 1ms</em>
                </span>
              </div>
              <div className="speed-row">
                <span className="speed-row__k">Telemetry</span>
                <span className="speed-row__v">
                  XADD to <em>connectdots:stream:views</em>
                </span>
              </div>
              <div className="speed-row">
                <span className="speed-row__k">Janitor drain</span>
                <span className="speed-row__v">
                  batches of <em>500</em>, always XACK'd
                </span>
              </div>
              <div className="speed-row">
                <span className="speed-row__k">Framework</span>
                <span className="speed-row__v">
                  <em>Cpeak</em> — zero third-party HTTP deps
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <SectionHeading
            kicker="Capabilities"
            title={
              <>
                Everything a link has
                <br />
                <span style={{ color: "var(--muted)" }}>ever wished for.</span>
              </>
            }
          />
          <div className="features">
            {FEATURES.map((f, i) => (
              <article className="feature" key={f.id} data-reveal>
                <div className="feature__id">
                  {f.id} / CLS-{String(i + 1).padStart(3, "0")}
                </div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
                <div className="feature__tech">{f.tech}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <SectionHeading
            kicker="Security"
            title={
              <>
                Hardened
                <br />
                <span style={{ color: "var(--muted)" }}>by default.</span>
              </>
            }
            lead="Abuse resistance is designed into the request layer — not bolted on at the edge."
          />
          <div className="compact-row">
            {SECURITY_CHECKS.map((s) => (
              <div className="compact" key={s.title} data-reveal>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="arch">
            <div data-reveal>
              <span className="kicker kicker--violet">Architecture</span>
              <h2 className="h-display" style={{ marginTop: 18 }}>
                One core.
                <br />
                <span style={{ color: "var(--muted)" }}>Three stores.</span>
              </h2>
              <p className="lead" style={{ marginTop: 22, maxWidth: "44ch" }}>
                Postgres owns the truth, Redis carries the speed, and the
                janitor moves events between them in batches. Every arrow is a
                single responsibility.
              </p>
              <div style={{ marginTop: 34, display: "grid", gap: 10 }}>
                <MetricCard value="12" label="postgres tables + triggers" />
                <MetricCard value="1" label="capped views stream" tone="lime" />
                <MetricCard value="500" label="rows per janitor batch" tone="violet" />
              </div>
            </div>

            <div className="arch__map" data-reveal>
              {ARCH_NODES.map((node) => (
                <div key={node.name}>
                  <div className={`arch-node${node.color ? ` arch-node--${node.color}` : ""}`}>
                    <b>{node.name}</b>
                    <span>{node.detail}</span>
                  </div>
                </div>
              ))}
              <div className="arch__flow">
                <span>client</span>
                <span>→</span>
                <span>cpeak core</span>
                <span>→</span>
                <span>302</span>
                <span style={{ marginLeft: "auto", color: "var(--lime)" }}>XADD</span>
                <span style={{ color: "var(--violet)" }}>→ janitor → pg</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="split">
            <div data-reveal>
              <span className="kicker kicker--lime">Tech stack</span>
              <h2 className="h-display" style={{ marginTop: 18 }}>
                The whole stack,
                <br />
                <span style={{ color: "var(--muted)" }}>twelve tables deep.</span>
              </h2>
              <p className="lead" style={{ marginTop: 22, maxWidth: "46ch" }}>
                Nothing exotic, nothing hidden — a small set of proven pieces
                wired by one person, from the TCP socket up to the dashboard.
              </p>
              <div className="compact-row">
                {TECH_STACK.map((t) => (
                  <div className="compact" key={t.name} data-reveal>
                    <h3>{t.name}</h3>
                    <p>{t.role}</p>
                  </div>
                ))}
              </div>
            </div>
            <div data-reveal>
              <span className="kicker kicker--violet">Deployment</span>
              <h2 className="h-display" style={{ marginTop: 18 }}>
                Up in one
                <br />
                <span style={{ color: "var(--muted)" }}>command.</span>
              </h2>
              <p className="lead" style={{ marginTop: 22 }}>
                Postgres, Redis, the app, and the janitor all come up behind a
                single compose file — or a PM2 cluster on bare metal.
              </p>
              <div style={{ marginTop: 30 }}>
                <TerminalBlock
                  title="deploy — connectdots"
                  lines={[
                    { c: "$ export COOKIE_KEY=\"$(openssl rand -hex 32)\"" },
                    { c: "$ export TOKEN_SECRET=\"$(openssl rand -hex 32)\"" },
                    { c: "$ docker compose up --build -d" },
                    { y: "# postgres 16 · redis 7 · app :2080 · janitor" },
                    { c: "$ npm run build && npm run prod" },
                    { y: "# pm2 cluster · auto-restarting workers" },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="split" style={{ alignItems: "start" }}>
            <div data-reveal>
              <span className="kicker kicker--coral">AWS · production test</span>
              <h2 className="h-display" style={{ marginTop: 18 }}>
                Proven on
                <br />
                <span style={{ color: "var(--muted)" }}>real infrastructure.</span>
              </h2>
              <p className="lead" style={{ marginTop: 22, maxWidth: "46ch" }}>
                The production test ran on Amazon EC2 in <span className="mono">us-east-2</span> (Ohio),
                launched from a custom AMI with Postgres, Redis, and the app
                wired exactly as documented. No managed services hiding the
                moving parts — the same compose file you get in the repo.
              </p>
              <Link to="/docs/aws" className="link-line" style={{ marginTop: 28 }}>
                Read the AWS deployment notes →
              </Link>
            </div>
            <div data-reveal>
              <div className="techpanel" style={{ display: "grid", gap: 22 }}>
                <div className="speed-row" style={{ borderTop: "1px solid var(--line)" }}>
                  <span className="speed-row__k">Region</span>
                  <span className="speed-row__v">us-east-2 · Ohio</span>
                </div>
                <div className="speed-row" style={{ borderTop: "1px solid var(--line)" }}>
                  <span className="speed-row__k">Compute</span>
                  <span className="speed-row__v">EC2, launched from a custom AMI</span>
                </div>
                <div className="speed-row" style={{ borderTop: "1px solid var(--line)" }}>
                  <span className="speed-row__k">Measured</span>
                  <span className="speed-row__v">autocannon load, end to end</span>
                </div>
                <div className="speed-row" style={{ borderTop: "1px solid var(--line)" }}>
                  <span className="speed-row__k">Public demo</span>
                  <span className="speed-row__v">none — AWS cost discipline</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="creator">
            <div data-reveal>
              <div className="creator__portrait" aria-hidden="true">
                AI
              </div>
            </div>
            <div data-reveal>
              <span className="kicker">The creator</span>
              <h2 className="h-display" style={{ marginTop: 18, fontSize: "clamp(2.2rem,4vw,3.4rem)" }}>
                {AUTHOR.name}
              </h2>
              <p className="lead" style={{ marginTop: 20 }}>
                One developer, working from Chittagong. ConnectDots and Cpeak
                were both written entirely by hand — no Express, no ORM, no
                vendored scaffolding to hide behind.
              </p>
              <div style={{ marginTop: 30, display: "flex", gap: 18, flexWrap: "wrap" }}>
                <MetricCard value="2" label="projects, one person" tone="lime" />
                <MetricCard value="100%" label="from scratch" tone="violet" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <SectionHeading
            kicker="FAQ"
            centered
            title={
              <>
                Asked & <span style={{ color: "var(--muted)" }}>answered.</span>
              </>
            }
            lead="The questions that come up in every issue thread, architecture review, and benchmark discussion."
          />
          <FaqAccordion items={HOME_FAQS} />
        </div>
      </section>

      <CtaBanner
        title={
          <>
            Open source.
            <br />
            <span style={{ color: "var(--coral)", display: "inline-block", minHeight: "1.2em" }}>
              <TypewriterText
                phrases={[
                  "Engineered to scale.",
                  "Auditable by design.",
                  "Zero third-party HTTP deps.",
                  "800,000+ RPS proved.",
                ]}
              />
            </span>
          </>
        }
        subtitle="Fork the repo, inspect every line of Cpeak routing, or clone the Docker Compose stack to run your own private high-throughput cluster today."
        primary="See the source"
        onPrimary={() => navigate("/opensource")}
        secondary={{ label: "Pricing →", to: "/pricing" }}
      />
    </>
  );
}