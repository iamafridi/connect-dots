import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { NAV_LINKS, REPO_URL } from "../lib/data";
import { useTheme } from "../lib/hooks";

function ThemeGlyph({ theme }: { theme: "dark" | "light" }) {
  return theme === "dark" ? (
    // In dark mode the button offers the light world: a sun.
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.4" />
      <path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a7 7 0 0 0 9.7 9.7Z" />
    </svg>
  );
}

export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" aria-hidden="true">
      {/* Fills resolve through theme tokens so the mark stays legible on both
          the dark canvas and the light one. */}
      <circle cx="13" cy="13" r="3.4" fill="var(--coral)" />
      <circle cx="4.5" cy="5.6" r="2.1" fill="var(--violet)" />
      <circle cx="21.5" cy="4.9" r="1.7" fill="var(--lime)" />
      <path
        d="M6.3 7 11 11.2M19.9 6.2l-5.3 4.7M13 16.4l-.7 5.4"
        stroke="var(--brand-line)"
        strokeWidth="1.1"
      />
    </svg>
  );
}

export default function Rail() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const themeLabel = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <>
      <aside className="rail" aria-label="Primary">
        <Link to="/" className="rail__brand" aria-label="ConnectDots home">
          <span className="rail__mark">
            <BrandMark />
          </span>
          <span className="rail__wordmark">ConnectDots</span>
        </Link>

        <nav className="rail__nav">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rail__link${isActive || (link.to === "/" && location.pathname === "/") ? " is-active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="rail__foot">
          <button
            type="button"
            className="rail__themebtn"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            aria-label="Command Center (⌘K)"
            title="Command Center (⌘K)"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button
            type="button"
            className="rail__themebtn"
            onClick={toggleTheme}
            aria-label={themeLabel}
            title={themeLabel}
          >
            <ThemeGlyph theme={theme} />
          </button>
          <a
            className="rail__github"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="ConnectDots on GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-1.93c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
          </a>
          <Link to="/product" state={{ shorten: true }} className="rail__cta">
            Shorten a URL
          </Link>
        </div>
      </aside>

      <header className="topbar">
        <Link to="/" className="topbar__brand">
          <BrandMark size={22} />
          <span className="topbar__wordmark">ConnectDots</span>
        </Link>
        <div className="topbar__actions">
          <button
            type="button"
            className="topbar__theme"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            aria-label="Command Center (⌘K)"
            title="Command Center (⌘K)"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button
            type="button"
            className="topbar__theme"
            onClick={toggleTheme}
            aria-label={themeLabel}
            title={themeLabel}
          >
            <ThemeGlyph theme={theme} />
          </button>
          <button
            type="button"
            className={`hamburger${open ? " is-open" : ""}`}
            aria-expanded={open}
            aria-label="Toggle navigation menu"
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <nav className={`topnav-menu${open ? " is-open" : ""}`} aria-label="Mobile">
        {NAV_LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
            {link.label}
          </NavLink>
        ))}
        <a href={`${REPO_URL}`} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <Link to="/product" state={{ shorten: true }} onClick={() => setOpen(false)}>
          Shorten a URL
        </Link>
        <button
          type="button"
          className="topnav-menu__theme"
          onClick={toggleTheme}
          aria-label={themeLabel}
        >
          <ThemeGlyph theme={theme} />
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </nav>
    </>
  );
}