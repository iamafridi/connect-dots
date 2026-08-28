import { CtaBanner, MetricCard, SectionHeading, TerminalBlock } from "../components/Primitives";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { REPOS, REPO_METRICS } from "../lib/data";
import { useReveal } from "../lib/hooks";

export default function OpenSource() {
  useReveal();

  return (
    <>
      <section className="section section--first">
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Open source" }]} />
          <div className="split" style={{ alignItems: "end" }}>
            <div data-reveal>
              <span className="kicker kicker--coral">Open source</span>
              <h1 className="h-display" style={{ marginTop: 18, fontSize: "clamp(3rem,6vw,5.4rem)" }}>
                Open source.
                <br />
                <span style={{ color: "var(--muted)" }}>Engineered to scale.</span>
              </h1>
            </div>
            <div data-reveal>
              <p className="lead">
                MIT, public history, and a benchmark suite you can run on your
                own machine to verify every number on this site.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <SectionHeading
            kicker="Repositories"
            title={
              <>
                Two projects,
                <br />
                <span style={{ color: "var(--muted)" }}>one author.</span>
              </>
            }
          />
          <div className="repos">
            {REPOS.map((repo, i) => (
              <a className="repo" href={repo.url} target="_blank" rel="noreferrer" key={repo.name} data-reveal>
                <div className="repo__name">
                  {repo.url.replace(/^https?:\/\//, "")}
                </div>
                <p>{repo.body}</p>
                <div className="repo__tags">
                  {repo.tags.map((t) => (
                    <span className="repo__tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                  MIT · {i === 0 ? "product + API + janitor" : "framework"}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="metrics">
            {REPO_METRICS.map((m) => (
              <MetricCard
                key={m.label}
                value={m.value}
                label={m.label}
                tone={m.tone as "coral" | "lime" | "violet"}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="split">
            <div data-reveal>
              <span className="kicker kicker--lime">Run it in 90 seconds</span>
              <h2 className="h-display" style={{ marginTop: 18 }}>
                Clone. Configure.
                <br />
                <span style={{ color: "var(--muted)" }}>Shorten.</span>
              </h2>
              <p className="lead" style={{ marginTop: 22, maxWidth: "46ch" }}>
                PostgreSQL and Redis local, `.env` from the example, schema from
                the migration entrypoint. Nothing hidden.
              </p>
            </div>
            <div data-reveal>
              <TerminalBlock
                title="quick-start — connectdots"
                lines={[
                  { c: "$ git clone https://github.com/afridi9/connectdots" },
                  { c: "$ cd connectdots && npm install" },
                  { c: "$ cp .env.example .env   # add your secrets" },
                  { c: "$ npm run schema          # create db + apply schema" },
                  { c: "$ npm run dev             # http://localhost:2080" },
                  { y: "# then open /#/product and shorten a link" },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <SectionHeading
            kicker="Get involved"
            title={
              <>
                Contribute like
                <br />
                <span style={{ color: "var(--muted)" }}>a systems engineer.</span>
              </>
            }
          />
          <div className="sequence">
            {[
              { k: "01", title: "Fork", body: "Fork the repository to your own account — the whole tree, plus the benchmark suite." },
              { k: "02", title: "Branch", body: "Branch from main, one concise commit per change, conventional messages." },
              { k: "03", title: "Pull request", body: "Open a PR with the evidence: tests run, typecheck green, benchmarks attached when relevant." },
            ].map((s) => (
              <div className="seq" key={s.k} data-reveal>
                <div className="seq__k">{s.k} / FLOW</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner
        title={
          <>
            Star the repo.
            <br />
            <span style={{ color: "var(--muted)" }}>Shape the core.</span>
          </>
        }
        subtitle="Join the open-source community building high-throughput Node.js microservices and verifiable load-testing suites."
        primary="Star on GitHub"
        onPrimary={() => {
          window.open("https://github.com/afridi9/connectdots", "_blank", "noreferrer");
        }}
        secondary={{ label: "Pricing →", to: "/pricing" }}
      />
    </>
  );
}