import { Link } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";

export default function NotFound() {
  return (
    <section className="section section--first">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "404" }]} />
        <div className="mono" style={{ fontSize: 13, letterSpacing: "0.2em", color: "var(--coral)", textTransform: "uppercase" }}>
          404 / no such node in the graph
        </div>
        <h1 className="h-display" style={{ marginTop: 20 }}>
          This route
          <br />
          <span style={{ color: "var(--muted)" }}>doesn't resolve.</span>
        </h1>
        <p className="lead" style={{ marginTop: 24 }}>
          The link you followed never got a hash assignment.
        </p>
        <div style={{ marginTop: 34, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link className="btn btn--coral" to="/">
            Back to base ↗
          </Link>
          <Link className="btn btn--ghost" to="/product">
            Try the demo
          </Link>
        </div>
      </div>
    </section>
  );
}