import { Link } from "react-router-dom";
import { AUTHOR, REPO_URL } from "../lib/data";
import { BrandMark } from "./Rail";

export default function Footer() {
  return (
    <footer className="footer footer--antigravity">
      {/* 1. Actual Structured Footer Content */}
      <div className="footer__content">
        <div className="footer__grid">
          <div className="footer__col footer__col--brand">
            <div className="footer__brand-header">
              <BrandMark size={26} />
              <span className="footer__brand-title">ConnectDots</span>
            </div>
            <p className="footer__brand-desc">
              Shorten links at light speed. A production-grade URL shortener forged on Node.js,
              load-tested to 800,000+ requests per second.
            </p>
            <div className="footer__status-badge">
              <span className="footer__status-dot" />
              <span>All Systems Operational · 800k RPS Engine</span>
            </div>
          </div>

          <div className="footer__col">
            <h4>Product</h4>
            <Link to="/product">Product Overview</Link>
            <Link to="/pricing">Pricing & Engagements</Link>
            <Link to="/product" state={{ shorten: true }}>
              Shorten a URL
            </Link>
            <Link to="/explore">Benchmark Ladder</Link>
          </div>

          <div className="footer__col">
            <h4>Platform</h4>
            <Link to="/explore">Architecture & Redis</Link>
            <Link to="/opensource">Open Source Engine</Link>
            <Link to="/about">About the Author</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>

          <div className="footer__col">
            <h4>Documentation</h4>
            <Link to="/docs/overview">Overview</Link>
            <Link to="/docs/quickstart">Quick Start</Link>
            <Link to="/docs/configuration">Configuration</Link>
            <Link to="/docs/structure">Project Structure</Link>
            <Link to="/docs/api">API Reference</Link>
          </div>

          <div className="footer__col">
            <h4>Connect</h4>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              Star on GitHub ↗
            </a>
            <a href={AUTHOR.portfolioUrl} target="_blank" rel="noreferrer">
              Portfolio: {AUTHOR.portfolioUrl.replace(/^https?:\/\//, "")} ↗
            </a>
            <a href={`mailto:${AUTHOR.email}`}>Email: {AUTHOR.email}</a>
            <a href={AUTHOR.githubUrl} target="_blank" rel="noreferrer">
              Author: @{AUTHOR.github}
            </a>
            <a href="https://www.npmjs.com/package/cpeak" target="_blank" rel="noreferrer">
              Cpeak on npm ↗
            </a>
          </div>
        </div>

        <div className="footer__base">
          <span>© {new Date().getFullYear()} ConnectDots — Built by {AUTHOR.name}</span>
          <span>MIT Licensed Open Source</span>
          <span className="footer__base-tech">Node.js · Cpeak · PostgreSQL · Redis</span>
        </div>
      </div>

      {/* 2. Massive Grand Finale Section Underneath the Actual Footer */}
      <div className="footer__stage" aria-hidden="true">
        {/* Background globe video */}
        <div className="footer__stage-globe">
          <video
            className="footer__stage-video"
            src="./footer_globe.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          {/* Vignette and atmosphere overlay over the video */}
          <div className="footer__stage-overlay" />
        </div>

        {/* Huge Monolithic Wordmark touching the bottom edge */}
        <div className="footer__stage-wordmark-wrap">
          <span className="footer__stage-wordmark">connectdots</span>
        </div>
      </div>
    </footer>
  );
}