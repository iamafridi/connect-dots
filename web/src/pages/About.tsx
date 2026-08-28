import { CtaBanner, SectionHeading, TerminalBlock, Timeline } from "../components/Primitives";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { AUTHOR, CPEAK_URL, MILESTONES, PHILOSOPHY, REPO_URL } from "../lib/data";
import { useReveal } from "../lib/hooks";

export default function About() {
  useReveal();

  return (
    <>
      <section className="section section--first">
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "About" }]} />
          <div className="split" style={{ alignItems: "end" }}>
            <div data-reveal>
              <span className="kicker kicker--coral">Origin story</span>
              <h1 className="h-display" style={{ marginTop: 18, fontSize: "clamp(3rem,6vw,5.4rem)" }}>
                One developer.
                <br />
                Peak performance.
              </h1>
            </div>
            <div data-reveal>
              <div className="mono" style={{ fontSize: 15, color: "var(--muted)", borderLeft: "3px solid var(--coral)", paddingLeft: 20 }}>
                From Chittagong to the peak — no team to meet, no meetings to
                schedule. Just Node.js, Postgres, Redis, and conviction.
                <div style={{ marginTop: 12 }}>
                  <a
                    href={AUTHOR.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--coral)", fontSize: 13, textDecoration: "none", borderBottom: "1px dashed var(--coral)" }}
                  >
                    View Portfolio ({AUTHOR.portfolioUrl.replace(/^https?:\/\//, "")}) ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="split">
            <div data-reveal>
              <span className="kicker kicker--lime">The story</span>
              <h2 className="h-display" style={{ marginTop: 18 }}>
                Infrastructure is a discipline, not a template.
              </h2>
              <p className="lead" style={{ marginTop: 24 }}>
                Most "fast" URL shorteners are thin wrappers around someone
                else's HTTP server. ConnectDots took the other road: a
                zero-dependency framework first, then an application built with
                it — so there is no layer between the product and the machine.
              </p>
            </div>
            <div data-reveal>
              <div style={{ display: "grid", gap: 14 }}>
                {[
                  ["No Express", "the router is the framework"],
                  ["No ORM", "raw SQL, indexes, and triggers you can read"],
                  ["No cookie-session", "signed tokens backed by a real store"],
                  ["No caching hacks", "Redis pipelines designed in from day one"],
                ].map(([k, v]) => (
                  <div key={k} className="speed-row" style={{ borderTop: "1px solid var(--line)" }}>
                    <span className="speed-row__k">{k}</span>
                    <span className="speed-row__v">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="split">
            <div data-reveal>
              <SectionHeading
                kicker="Benchmark"
                title={
                  <>
                    Measured, not
                    <br />
                    <span style={{ color: "var(--muted)" }}>marketed.</span>
                  </>
                }
                lead="A public autocannon run on consumer hardware. Same runtime, same config, same core you're reading about — and the production test ran on AWS EC2 (us-east-2) from a custom AMI, documented in Operations."
              />
            </div>
            <div data-reveal>
              <TerminalBlock
                title="autocannon — /simple"
                lines={[
                  { c: "$ autocannon -c 100 -d 5 http://localhost:2080/simple" },
                  { c: "Reqs/sec: 812,403   (peak single process)" },
                  { c: "Requests total: 4,061,215   in 5.0s" },
                  { c: "Latency: avg 0.11 ms   p99 0.42 ms" },
                  { y: "same core serves /:id redirects" },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <SectionHeading
            kicker="Milestones"
            title={
              <>
                The build, one
                <br />
                <span style={{ color: "var(--muted)" }}>breakpoint at a time.</span>
              </>
            }
          />
          <Timeline items={MILESTONES} />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <SectionHeading
            kicker="Principles"
            title={
              <>
                Building like
                <br />
                <span style={{ color: "var(--muted)" }}>it matters.</span>
              </>
            }
          />
          <div className="philosophy">
            {PHILOSOPHY.map((p, i) => (
              <article className="principle" key={p.idx} data-reveal>
                <div className="principle__idx">
                  {p.idx} / PRINCIPLE-{String(i + 1).padStart(2, "0")}
                </div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="split">
            <div data-reveal>
              <span className="kicker kicker--violet">Spotlight</span>
              <h2 className="h-display" style={{ marginTop: 18 }}>
                The Cpeak framework
              </h2>
              <p className="lead" style={{ marginTop: 22, maxWidth: "46ch" }}>
                ConnectDots is the first real-world application for{" "}
                <a href={CPEAK_URL} target="_blank" rel="noreferrer" style={{ color: "var(--coral)", borderBottom: "1px solid var(--coral)" }}>
                  Cpeak
                </a>
                , a zero-dependency Node.js framework written in tandem with
                this project. Routing, middleware, static files, auth, and
                sessions — every line in one package, ~80KB on disk.
              </p>
              <a className="link-line" style={{ marginTop: 28 }} href={CPEAK_URL} target="_blank" rel="noreferrer">
                Read Cpeak on npm ↗
              </a>
            </div>
            <div data-reveal>
              <div className="techpanel" style={{ textAlign: "center" }}>
                <div className="mono" style={{ fontSize: 12, letterSpacing: "0.24em", color: "var(--muted)", textTransform: "uppercase" }}>
                  cpeak / only what runs
                </div>
                <div style={{ margin: "38px 0", fontFamily: "var(--font-mono)", fontSize: "clamp(2.4rem,5vw,4rem)", fontWeight: 700, letterSpacing: "-0.05em", color: "var(--lime)" }}>
                  0
                </div>
                <div className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>
                  third-party dependencies
                  <br />· MIT · TypeScript
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner
        title={
          <>
            Built by {AUTHOR.name.split(" ")[0]}.
            <br />
            <span style={{ color: "var(--muted)" }}>Read the whole thing.</span>
          </>
        }
        primary="Open the repository"
        onPrimary={() => {
          window.open(REPO_URL, "_blank", "noreferrer");
        }}
        secondary={{ label: "Pricing →", to: "/pricing" }}
      />
    </>
  );
}