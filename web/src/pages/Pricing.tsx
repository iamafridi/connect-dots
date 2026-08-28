import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CtaBanner, FaqAccordion, SectionHeading } from "../components/Primitives";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { AUTHOR } from "../lib/data";
import { ENGAGEMENTS, FAQS } from "../lib/pricing";
import { useReveal } from "../lib/hooks";

const VOLUME_TIERS = [
  {
    label: "10M / mo",
    volume: "10 Million",
    rps: "15,000+ peak RPS",
    awsCost: "$25 – $40 / mo",
    hardware: "1x AWS t4g.small (Graviton2) + L1 In-Memory + ElastiCache micro",
    annualSavings: "Save ~$5,000 / yr vs SaaS",
  },
  {
    label: "50M / mo",
    volume: "50 Million",
    rps: "80,000+ peak RPS",
    awsCost: "$75 – $110 / mo",
    hardware: "2x AWS c7g.medium (Graviton3) + L1/L2 Multi-Tier Cache + Stream Janitor",
    annualSavings: "Save ~$20,000 / yr vs SaaS",
  },
  {
    label: "200M / mo",
    volume: "200 Million",
    rps: "350,000+ peak RPS",
    awsCost: "$180 – $260 / mo",
    hardware: "4x AWS c7g.large + Multi-AZ ElastiCache Cluster + Hashtag Sharding",
    annualSavings: "Save ~$45,000 / yr vs SaaS",
  },
  {
    label: "500M+ / mo",
    volume: "500+ Million",
    rps: "800,000+ peak RPS",
    awsCost: "$350 – $480 / mo",
    hardware: "Auto-scaled ECS Cluster + 30-Node Redis Cluster Master/Replica",
    annualSavings: "Save ~$75,000+ / yr vs SaaS",
  },
];

const CLOUD_TARGETS = [
  { id: "aws", label: "AWS (us-east-1 / Any Region)", note: "Optimized Graviton instances" },
  { id: "multi-aws", label: "AWS Multi-Region", note: "Global low-latency DNS routing" },
  { id: "baremetal", label: "Bare Metal / On-Prem", note: "Direct hardware execution" },
];

const ENGAGEMENT_TYPES = [
  { id: "turnkey", label: "Turnkey AWS Deployment", desc: "Production setup on your AWS account with runbooks." },
  { id: "tuning", label: "Node.js Performance Tuning", desc: "Audit and optimize your existing stack to 100k+ RPS." },
  { id: "custom", label: "Custom Architecture Build", desc: "Bespoke high-volume engine tailored to proprietary workflows." },
];

const AWS_TOPOLOGY_DATA = [
  {
    scale: "10 Million req/mo",
    awsSpec: "1x AWS t4g.small + L1 In-Memory LRU + ElastiCache micro",
    estAwsCost: "$28 – $40 / mo",
    latency: "< 0.05ms (L1) / 0.4ms (L2)",
    saasAlt: "$450 / mo (Bitly Enterprise)",
    annualSavings: "Save ~$5,000 / yr",
  },
  {
    scale: "50 Million req/mo",
    awsSpec: "2x AWS c7g.medium + L1/L2 Read-Through Cache + Stream Janitor",
    estAwsCost: "$85 – $115 / mo",
    latency: "< 0.05ms RAM / 0.35ms Redis",
    saasAlt: "$1,800 / mo (Custom Shortener)",
    annualSavings: "Save ~$20,000 / yr",
  },
  {
    scale: "250 Million+ req/mo",
    awsSpec: "Auto-scaled ECS Cluster + Multi-AZ ElastiCache Cluster Sharding",
    estAwsCost: "$260 – $380 / mo",
    latency: "< 0.05ms memory pool",
    saasAlt: "$6,500+ / mo (Enterprise API Gateway)",
    annualSavings: "Save ~$75,000 / yr",
  },
];

function ProjectScopeEstimator() {
  const [volIndex, setVolIndex] = useState(1);
  const [cloudIndex, setCloudIndex] = useState(0);
  const [typeIndex, setTypeIndex] = useState(0);

  const selectedVol = VOLUME_TIERS[volIndex];
  const selectedCloud = CLOUD_TARGETS[cloudIndex];
  const selectedType = ENGAGEMENT_TYPES[typeIndex];

  const mailtoHref = `mailto:${AUTHOR.email}?subject=${encodeURIComponent(
    `ConnectDots Custom Scope: ${selectedVol.label} on ${selectedCloud.label}`
  )}&body=${encodeURIComponent(
    `Hi Afridi,\n\nI am reviewing ConnectDots and would like to scope a custom engagement:\n\n` +
      `• Target Monthly Volume: ${selectedVol.volume} (${selectedVol.rps})\n` +
      `• Cloud Infrastructure: ${selectedCloud.label}\n` +
      `• Engagement Type: ${selectedType.label}\n` +
      `• Estimated AWS Monthly Run-rate: ${selectedVol.awsCost}\n\n` +
      `Please let me know your availability for an architectural consultation and quote.`
  )}`;

  return (
    <div className="estimator" data-reveal>
      <div className="estimator__grid">
        <div className="estimator__controls">
          <div className="estimator__group">
            <span className="estimator__label">1. Target Monthly Traffic</span>
            <div className="estimator__pills" role="radiogroup" aria-label="Monthly traffic">
              {VOLUME_TIERS.map((tier, i) => (
                <button
                  type="button"
                  key={tier.label}
                  className={`estimator__pill${volIndex === i ? " is-active" : ""}`}
                  onClick={() => setVolIndex(i)}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          <div className="estimator__group">
            <span className="estimator__label">2. Target Cloud Environment</span>
            <div className="estimator__pills" role="radiogroup" aria-label="Cloud environment">
              {CLOUD_TARGETS.map((target, i) => (
                <button
                  type="button"
                  key={target.id}
                  className={`estimator__pill${cloudIndex === i ? " is-active" : ""}`}
                  onClick={() => setCloudIndex(i)}
                >
                  {target.label}
                </button>
              ))}
            </div>
          </div>

          <div className="estimator__group">
            <span className="estimator__label">3. Engagement Model</span>
            <div className="estimator__pills" role="radiogroup" aria-label="Engagement model">
              {ENGAGEMENT_TYPES.map((type, i) => (
                <button
                  type="button"
                  key={type.id}
                  className={`estimator__pill${typeIndex === i ? " is-active" : ""}`}
                  onClick={() => setTypeIndex(i)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="estimator__summary">
          <div className="estimator__summary-head">
            <div className="estimator__summary-title">Estimated AWS Run-Rate</div>
            <div className="estimator__cost">{selectedVol.awsCost}</div>
            <div className="estimator__stat-sub">{selectedVol.annualSavings}</div>
          </div>

          <div className="estimator__stat">
            <span className="estimator__stat-label">Hardware Profile</span>
            <span className="estimator__stat-val">{selectedVol.hardware}</span>
          </div>

          <div className="estimator__stat">
            <span className="estimator__stat-label">Peak Throughput Headroom</span>
            <span className="estimator__stat-val" style={{ color: "var(--coral)" }}>
              {selectedVol.rps}
            </span>
          </div>

          <div className="estimator__stat">
            <span className="estimator__stat-label">Selected Scope</span>
            <span className="estimator__stat-sub">{selectedType.desc}</span>
          </div>

          <div className="estimator__action">
            <a href={mailtoHref} className="btn btn--coral">
              Request Technical Quote →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function AwsTopologyTable() {
  return (
    <div className="table-wrap" data-reveal>
      <table className="compare" aria-label="AWS Infrastructure Cost Comparison">
        <thead>
          <tr>
            <th>Monthly Volume</th>
            <th>Recommended AWS Hardware</th>
            <th>Estimated AWS Cost</th>
            <th>P99 Latency</th>
            <th>Conventional SaaS</th>
            <th>Savings</th>
          </tr>
        </thead>
        <tbody>
          {AWS_TOPOLOGY_DATA.map((row) => (
            <tr key={row.scale}>
              <td>{row.scale}</td>
              <td>{row.awsSpec}</td>
              <td style={{ color: "var(--lime)" }}>{row.estAwsCost}</td>
              <td style={{ color: "var(--text)" }}>{row.latency}</td>
              <td style={{ color: "var(--muted)" }}>{row.saasAlt}</td>
              <td className="yes">{row.annualSavings}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EngagementCard({
  name,
  tag,
  amount,
  unit,
  blurb,
  cta,
  featured,
  features,
  id,
}: (typeof ENGAGEMENTS)[number]) {
  const navigate = useNavigate();

  const onClick = () => {
    if (id === "self-host") {
      navigate("/docs/quickstart");
      return;
    }
    window.location.href = `mailto:${AUTHOR.email}?subject=ConnectDots ${name}`;
  };

  return (
    <article className={`price${featured ? " price--featured" : ""}`} data-reveal>
      {featured && <div className="price__badge">Recommended</div>}
      <div className="price__head">
        <div className="price__name">
          <span>{name}</span>
          <span className="mono price__tag">{tag}</span>
        </div>
        <div className="price__pricing">
          <div className="price__amount">
            {amount}
            <span className="price__unit">{unit}</span>
          </div>
          <p className="price__blurb">{blurb}</p>
        </div>
      </div>

      <div className="price__divider" />

      <ul className="price__features">
        {features.map((f) => (
          <li key={f}>
            <svg className="price__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`btn price__btn${featured ? " btn--coral" : " price__btn--ghost"}`}
        onClick={onClick}
      >
        {cta}
      </button>
    </article>
  );
}

export default function Pricing() {
  useReveal();
  const navigate = useNavigate();

  return (
    <>
      <section className="section section--first">
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Pricing" }]} />
          <div style={{ textAlign: "center", maxWidth: 840, margin: "0 auto 16px" }}>
            <div data-reveal>
              <span className="kicker kicker--coral">Pricing 10.004</span>
              <h1 className="h-display" style={{ marginTop: 18, fontSize: "clamp(3rem,6vw,5.4rem)" }}>
                Not a SaaS.
                <br />
                <span style={{ color: "var(--muted)" }}>A developer, for hire.</span>
              </h1>
              <p className="lead" style={{ marginTop: 24, margin: "24px auto 0", maxWidth: 680 }}>
                There are no tiers to subscribe to and nothing to meter — the
                software is MIT-licensed and yours to run today. What I quote is
                custom work: building, deploying and operating systems like
                this one.
              </p>
            </div>
          </div>

          <div className="prices">
            {ENGAGEMENTS.map((engagement) => (
              <EngagementCard key={engagement.id} {...engagement} />
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Scope & AWS Cost Estimator */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <SectionHeading
            kicker="Scope Estimator"
            centered
            title={
              <>
                Estimate your AWS <span style={{ color: "var(--muted)" }}>infrastructure run-rate.</span>
              </>
            }
            lead="Configure your traffic volume, cloud target, and deployment model to see projected hardware specs and monthly cloud costs."
          />
          <ProjectScopeEstimator />
        </div>
      </section>

      {/* AWS Cost Transparency Table */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <SectionHeading
            kicker="Cost Transparency"
            centered
            title={
              <>
                The economics of <span style={{ color: "var(--muted)" }}>extreme efficiency.</span>
              </>
            }
            lead="Because ConnectDots runs on a zero-dependency Cpeak core with O(1) indexed reads, your monthly cloud infrastructure bill is negligible compared to bloated frameworks."
          />
          <AwsTopologyTable />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="split" style={{ alignItems: "start" }}>
            <div data-reveal>
              <span className="kicker kicker--lime">Why these numbers?</span>
              <h2 className="h-display" style={{ marginTop: 18 }}>
                One node runs
                <br />
                <span style={{ color: "var(--muted)" }}>a small country's traffic.</span>
              </h2>
            </div>
            <div data-reveal>
              <div className="techpanel" style={{ display: "grid", gap: 22 }}>
                <p className="lead" style={{ fontSize: 16 }}>
                  At <span className="mono" style={{ color: "var(--coral)" }}>800k+ RPS per node</span>, a single
                  Cpeak process covers roughly the entire monthly traffic of a
                  mid-size product in under a day of load.
                </p>
                <p className="lead" style={{ fontSize: 16 }}>
                  That's why custom pricing works: the hardware bill is tiny
                  compared to the engineering. What you pay me for is the
                  design, the deployment and the discipline — not idle iron.
                </p>
                <p className="lead" style={{ fontSize: 16 }}>
                  Self-hosting costs <span className="mono" style={{ color: "var(--violet)" }}>nothing but the
                    infrastructure</span>. Start from the docs and you'll have the
                  whole stack up in minutes.
                </p>
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
            lead="Everything you need to know about pricing, self-hosting, custom engagements, and architectural reviews."
          />
          <FaqAccordion items={FAQS} />
        </div>
      </section>

      <CtaBanner
        title={
          <>
            Run it yourself,
            <br />
            <span style={{ color: "var(--muted)" }}>or have me build it.</span>
          </>
        }
        subtitle="Production-ready binary downloads, turnkey cloud deployments, or custom architectural consulting — tailored to your exact traffic scale."
        primary="Read the quickstart →"
        onPrimary={() => navigate("/docs/quickstart")}
        secondary={{ label: "Open source ↘", to: "/opensource" }}
      />
    </>
  );
}