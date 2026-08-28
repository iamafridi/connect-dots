import { Link } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { CtaBanner, MetricCard, SectionHeading } from "../components/Primitives";
import { EXPLORE_ROUTES, PERF_METRICS } from "../lib/data";
import { useReveal } from "../lib/hooks";

export default function Explore() {
  useReveal();

  return (
    <>
      <section className="section section--first">
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Explore" }]} />
          <div className="split" style={{ alignItems: "end" }}>
            <div data-reveal>
              <span className="kicker kicker--violet">One door · every room</span>
              <h1 className="h-display" style={{ marginTop: 18, fontSize: "clamp(3rem,6vw,5.4rem)" }}>
                Everything.
                <br />
                <span style={{ color: "var(--muted)" }}>One route.</span>
              </h1>
            </div>
            <div data-reveal>
              <p className="lead">
                Product, source, and docs — three rooms, one door. Pick a door
                below and it routes you straight there.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <SectionHeading
            kicker="Browse"
            title={
              <>
                Choose where
                <br />
                <span style={{ color: "var(--muted)" }}>you're headed.</span>
              </>
            }
          />
          <div className="explore">
            {EXPLORE_ROUTES.map((r) => (
              <Link
                to={r.to}
                key={r.idx}
                className={`route route--${r.tone}`}
                data-reveal
              >
                <div className="route__k">{r.idx} / {r.kicker}</div>
                <h3>{r.title}</h3>
                <p>{r.body}</p>
                <div className="repo__tags" style={{ marginTop: "auto" }}>
                  {r.tags.map((t) => (
                    <span className="repo__tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="route__foot">
                  <span>{r.foot}</span>
                  <span className="route__arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="metrics">
            {PERF_METRICS.map((m) => (
              <MetricCard key={m.label} value={m.value} label={m.label} />
            ))}
          </div>
        </div>
      </section>

      <CtaBanner
        title={
          <>
            Don't want to browse?
            <br />
            <span style={{ color: "var(--muted)" }}>Shorten right now.</span>
          </>
        }
        subtitle="Jump directly to the live URL shortener utility and create lightning-fast redirects in milliseconds."
        primary="Shorten a URL"
        onPrimary={() => {
          window.location.hash = "#/product";
        }}
        secondary={{ label: "Docs →", to: "/docs/overview" }}
      />
    </>
  );
}