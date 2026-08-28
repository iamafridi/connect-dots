import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CPEAK_URL, REPO_URL } from "../lib/data";
import AnimatedCounter from "./AnimatedCounter";

/* ---------- Section heading ---------- */
export function SectionHeading({
  kicker,
  title,
  lead,
  tone = "coral",
  centered = false,
}: {
  kicker: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "coral" | "lime" | "violet";
  centered?: boolean;
}) {
  return (
    <div
      className={`sec-head${centered ? " sec-head--centered" : ""}`}
      data-reveal
      style={{
        maxWidth: "820px",
        ...(centered ? { margin: "0 auto", textAlign: "center" } : {}),
      }}
    >
      <span className={`kicker kicker--${tone}`}>{kicker}</span>
      <h2 className="h-display" style={{ marginTop: 18 }}>
        {title}
      </h2>
      {lead ? (
        <p
          className="lead"
          style={{
            marginTop: 22,
            ...(centered ? { margin: "22px auto 0", maxWidth: 640 } : {}),
          }}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}

/* ---------- Status label ---------- */
export function StatusLabel({ children, live = false }: { children: ReactNode; live?: boolean }) {
  return (
    <span className="tag">
      {live ? <span className="dot" /> : null}
      {children}
    </span>
  );
}

/* ---------- CTA banner ---------- */
export function CtaBanner({
  title,
  subtitle,
  primary,
  secondary,
  onPrimary,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  primary: string;
  secondary?: { label: string; to: string };
  onPrimary?: () => void;
}) {
  return (
    <section className="section">
      <div className="container">
        <div className="cta" data-reveal>
          <h2>{title}</h2>
          {subtitle ? <p className="lead cta__lead">{subtitle}</p> : null}
          <div className="cta__actions">
            <button type="button" className="btn btn--coral" onClick={onPrimary}>
              {primary}
            </button>
            {secondary ? (
              <Link to={secondary.to} className="btn btn--ghost">
                {secondary.label}
              </Link>
            ) : (
              <a className="btn btn--ghost" href={REPO_URL} target="_blank" rel="noreferrer">
                Star on GitHub
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Metric card ---------- */
export function MetricCard({
  value,
  label,
  tone = "coral",
}: {
  value: string;
  label: string;
  tone?: "coral" | "lime" | "violet";
}) {
  return (
    <div className="metric" data-reveal>
      <div className={`metric__num metric__num--${tone}`}>
        <AnimatedCounter value={value} />
      </div>
      <div className="metric__lab">{label}</div>
    </div>
  );
}

/* ---------- Copy button ---------- */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button type="button" className={`copybtn${copied ? " is-copied" : ""}`} onClick={copy}>
      {copied ? "Copied" : label}
    </button>
  );
}

/* ---------- Terminal block ---------- */
export function TerminalBlock({
  title,
  lines,
}: {
  title: string;
  lines: Array<{ c?: ReactNode; o?: ReactNode; y?: ReactNode }>;
}) {
  return (
    <div className="terminal">
      <div className="terminal__bar">
        <i aria-hidden="true" />
        <i aria-hidden="true" />
        <i aria-hidden="true" />
        <span>{title}</span>
      </div>
      <div className="terminal__body">
        <pre>
          {lines.map((line, i) => (
            <span className="t-line" key={i}>
              {line.c !== undefined ? (
                <span className="c">{line.c}</span>
              ) : line.o !== undefined ? (
                <span className="o">{line.o}</span>
              ) : (
                <span className="y">{line.y}</span>
              )}
            </span>
          ))}
        </pre>
      </div>
    </div>
  );
}

/* ---------- Timeline ---------- */
export function Timeline({
  items,
}: {
  items: ReadonlyArray<{ date: string; title: string; body: string }>;
}) {
  return (
    <div className="timeline">
      {items.map((item, i) => (
        <div className="tl-item" key={item.title} data-reveal style={{ transitionDelay: `${i * 60}ms` }}>
          <div className="tl-item__date">{item.date}</div>
          <div className="tl-item__body">
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- FAQ accordion ---------- */
export function FaqAccordion({ items }: { items: ReadonlyArray<{ q: string; a: string }> }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="faqs">
      {items.map((item, i) => (
        <div className={`faq${open === i ? " is-open" : ""}`} key={item.q}>
          <button
            type="button"
            className="faq__q"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            {item.q}
            <span aria-hidden="true">+</span>
          </button>
          <div className="faq__a">
            <div className="faq__a-inner">
              <p>{item.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Reveal wrapper ---------- */
export function revealStyle(delay = 0): CSSProperties {
  return { transitionDelay: delay ? `${delay}ms` : undefined };
}

export { CPEAK_URL, REPO_URL };