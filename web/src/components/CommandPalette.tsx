import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../lib/hooks";
import { CPEAK_URL, REPO_URL } from "../lib/data";

interface CommandItem {
  id: string;
  category: "Actions" | "Navigation" | "Documentation" | "Community";
  title: string;
  description: string;
  shortcut?: string;
  icon: string;
  perform: () => void;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const commands: CommandItem[] = [
    {
      id: "shorten",
      category: "Actions",
      title: "Shorten a URL",
      description: "Create an instant, high-speed redirect link",
      shortcut: "S",
      icon: "⚡",
      perform: () => {
        navigate("/product", { state: { shorten: true } });
        setIsOpen(false);
      },
    },
    {
      id: "theme",
      category: "Actions",
      title: theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme",
      description: "Toggle nanotech suit assembly theme transition",
      shortcut: "T",
      icon: theme === "dark" ? "☀️" : "🌙",
      perform: () => {
        toggleTheme();
        setIsOpen(false);
      },
    },
    {
      id: "copy-benchmark",
      category: "Actions",
      title: "Copy Autocannon Benchmark Command",
      description: "npx autocannon -c 100 -d 5 http://localhost:2080/simple",
      shortcut: "C",
      icon: "📋",
      perform: async () => {
        try {
          await navigator.clipboard.writeText("npx autocannon -c 100 -d 5 http://localhost:2080/simple");
          setCopiedNotice(true);
          setTimeout(() => setCopiedNotice(false), 2000);
        } catch {
          /* clipboard fallback */
        }
      },
    },
    {
      id: "nav-home",
      category: "Navigation",
      title: "Home",
      description: "ConnectDots command center and telemetry",
      icon: "🏠",
      perform: () => {
        navigate("/");
        setIsOpen(false);
      },
    },
    {
      id: "nav-product",
      category: "Navigation",
      title: "Product & Benchmark Ladder",
      description: "Explore the live URL shortener and perf ladder",
      icon: "📊",
      perform: () => {
        navigate("/product");
        setIsOpen(false);
      },
    },
    {
      id: "nav-explore",
      category: "Navigation",
      title: "Architecture & Concurrency",
      description: "Deep dive into Cpeak, Redis telemetry & Postgres",
      icon: "🏗️",
      perform: () => {
        navigate("/explore");
        setIsOpen(false);
      },
    },
    {
      id: "nav-opensource",
      category: "Navigation",
      title: "Open Source Engine",
      description: "Under the hood: zero-dependency Cpeak architecture",
      icon: "📦",
      perform: () => {
        navigate("/opensource");
        setIsOpen(false);
      },
    },
    {
      id: "nav-pricing",
      category: "Navigation",
      title: "Pricing & Plans",
      description: "Free tier, Pro, Enterprise, and Self-hosted",
      icon: "🏷️",
      perform: () => {
        navigate("/pricing");
        setIsOpen(false);
      },
    },
    {
      id: "nav-docs",
      category: "Documentation",
      title: "Documentation Overview",
      description: "Comprehensive guides, APIs, and deployment recipes",
      icon: "📖",
      perform: () => {
        navigate("/docs");
        setIsOpen(false);
      },
    },
    {
      id: "cpeak-npm",
      category: "Community",
      title: "Cpeak Framework on npm",
      description: "Zero-dependency Node.js HTTP framework by Afridi",
      icon: "🚀",
      perform: () => {
        window.open(CPEAK_URL, "_blank");
        setIsOpen(false);
      },
    },
    {
      id: "github",
      category: "Community",
      title: "Star ConnectDots on GitHub",
      description: "View repository source code, issues, and releases",
      icon: "🐙",
      perform: () => {
        window.open(REPO_URL, "_blank");
        setIsOpen(false);
      },
    },
  ];

  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  // Global key listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].perform();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-backdrop" onClick={() => setIsOpen(false)} aria-modal="true" role="dialog">
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-header">
          <svg className="cmd-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className="cmd-input"
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="cmd-kbd">ESC</kbd>
        </div>

        {copiedNotice && (
          <div className="cmd-toast">
            ✓ Benchmark command copied to clipboard!
          </div>
        )}

        <div className="cmd-list" role="listbox">
          {filtered.length === 0 ? (
            <div className="cmd-empty">No matching commands found.</div>
          ) : (
            filtered.map((cmd, idx) => (
              <div
                key={cmd.id}
                className={`cmd-item${idx === selectedIndex ? " is-selected" : ""}`}
                role="option"
                aria-selected={idx === selectedIndex}
                onClick={() => cmd.perform()}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <span className="cmd-item-icon">{cmd.icon}</span>
                <div className="cmd-item-body">
                  <div className="cmd-item-title">{cmd.title}</div>
                  <div className="cmd-item-desc">{cmd.description}</div>
                </div>
                {cmd.shortcut && <kbd className="cmd-shortcut">{cmd.shortcut}</kbd>}
              </div>
            ))
          )}
        </div>

        <div className="cmd-footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> Navigate
          </span>
          <span>
            <kbd>↵</kbd> Select
          </span>
          <span>
            <kbd>ESC</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
