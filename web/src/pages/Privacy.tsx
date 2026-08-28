import { SectionHeading } from "../components/Primitives";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { useReveal } from "../lib/hooks";

const BLOCKS: Array<{ h: string; p: string }> = [
  {
    h: "1. What we store",
    p: "To operate, ConnectDots stores the destination URLs you shorten, the short codes and their settings, view counts, and — when you sign up — the account details you provide (name, email, optional username, and password hash). Session and verification codes are stored server-side and deleted when they expire.",
  },
  {
    h: "2. What we don't",
    p: "We do not sell your data, serve ads from your links, or mine your traffic for profiling. Logs contain request metadata (route, status, latency) for operations; they are rotated daily.",
  },
  {
    h: "3. IP handling",
    p: "Rate limiting and request logs use the connecting socket address. X-Forwarded-For is only honored when a deployment explicitly opts in behind a trusted proxy — it is ignored by default because it is client-spoofable.",
  },
  {
    h: "4. Third parties",
    p: "Transactional email is sent through AWS SES. Optional malicious-URL screening uses the Google Web Risk API when an admin configures a key. Neither receives your link histories beyond the request you explicitly send.",
  },
  {
    h: "5. Self-hosting",
    p: "ConnectDots is MIT-licensed. If you run your own instance, the database and logs stay entirely on your infrastructure and this policy applies to that deployment instead.",
  },
  {
    h: "6. Contact",
    p: "Privacy questions go to support@connectdots.pro — a human (the one developer) answers.",
  },
];

export default function Privacy() {
  useReveal();
  return (
    <section className="section section--first">
      <div className="container" style={{ maxWidth: 760 }}>
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Privacy" }]} />
        <SectionHeading kicker="Legal" title="Privacy policy" />
        <div data-reveal style={{ display: "grid", gap: 30, marginTop: 44 }}>
          {BLOCKS.map((b) => (
            <div key={b.h}>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>{b.h}</h3>
              <p style={{ color: "var(--muted)" }}>{b.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}