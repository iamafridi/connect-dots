import { SectionHeading } from "../components/Primitives";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { useReveal } from "../lib/hooks";

const BLOCKS: Array<{ h: string; p: string }> = [
  {
    h: "1. The software",
    p: "ConnectDots is an MIT-licensed URL shortener — source code, documentation, and benchmark suite published for you to run on your own infrastructure. This website itself is not a hosted service: it does not shorten links for visitors, and it never holds your data.",
  },
  {
    h: "2. Acceptable use",
    p: "You agree not to use the software to shorten links to unlawful content, malware, or phishing schemes, and not to present ConnectDots as your own product in violation of its MIT license. Where you deploy it, you are the operator and set your own acceptable-use policy.",
  },
  {
    h: "3. Custom engagements",
    p: "What is for hire is the developer: scoped custom builds, deployments, and consulting, quoted per project as described on the pricing page. Each engagement is defined by a written scope and a fixed quote agreed by both sides before work starts — there are no subscriptions, seats, or metered usage.",
  },
  {
    h: "4. Payment",
    p: "Custom work is invoiced against the agreed quote — typically a deposit to schedule, the remainder on delivery. There is no recurring billing to cancel and no usage overage to dispute. Self-hosting the MIT-licensed source costs nothing, ever.",
  },
  {
    h: "5. No hosted service, no SLA",
    p: "Because no hosted service is operated, there is no uptime guarantee to offer and none to disclaim. A running deployment — yours, or one built under an engagement — is operated by its owner. The 99.99% figure on this site is an engineering target, not a contractual commitment.",
  },
  {
    h: "6. Intellectual property",
    p: "ConnectDots is MIT-licensed open source. You are free to self-host, modify, and redistribute the software under the terms of the MIT license.",
  },
];

export default function Terms() {
  useReveal();
  return (
    <section className="section section--first">
      <div className="container" style={{ maxWidth: 760 }}>
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Terms" }]} />
        <SectionHeading kicker="Legal" title="Terms of service" />
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