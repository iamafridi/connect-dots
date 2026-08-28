import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * Dual-theme state, shared through a tiny module-level store so the rail, the
 * mobile menu and the hero always read one value. ("dark" is the default and
 * the canonical design; "light" restyles the exact same content via the
 * [data-theme="light"] token overrides in styles.css.)
 */
export type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "connectdots-theme";
const NANO_DURATION_MS = 4400;
const NANO_REDUCED = "(prefers-reduced-motion: reduce)";

const THEME_COLORS: Record<Theme, string> = {
  dark: "#101315",
  light: "#f5f6f2",
};

export type ThemeToggleEvent =
  | React.MouseEvent<HTMLElement>
  | MouseEvent
  | { clientX?: number; clientY?: number; target?: EventTarget | null; currentTarget?: EventTarget | null };

/* The boot script in index.html has already resolved storage + ?theme. */
function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

let current: Theme = readInitialTheme();
const listeners = new Set<() => void>();
let animating = false;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Theme {
  return current;
}

function getServerSnapshot(): Theme {
  return "dark";
}

/** Push the theme onto <html>, the browser UI color, and storage. */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage unavailable (private mode) — the theme still applies for the session */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[theme]);
}

function setTheme(theme: Theme) {
  if (theme === current) return;
  current = theme;
  applyTheme(theme);
  for (const listener of listeners) listener();
}

/** Nanotech wavefront / symbiote shockwave overlay. */
function ensureNanowave(): HTMLDivElement {
  let el = document.querySelector<HTMLDivElement>(".nanowave");
  if (!el) {
    el = document.createElement("div");
    el.className = "nanowave";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="nanowave__ring"></div>' +
      '<div class="nanowave__ring-core"></div>' +
      '<div class="nanowave__mesh"></div>';
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Nanotech / Symbiote theme takeover transition:
 * Sweeps smoothly across the entire screen from the click origin, morphing
 * every card, terminal, button and pixel bit-by-bit like an assembling
 * Ironman nanotech suit / Venom symbiote spreading.
 */
export function toggleTheme(event?: ThemeToggleEvent) {
  const next: Theme = current === "dark" ? "light" : "dark";

  if (
    typeof document === "undefined" ||
    typeof window === "undefined" ||
    animating ||
    window.matchMedia(NANO_REDUCED).matches
  ) {
    setTheme(next);
    return;
  }

  // Calculate origin coordinates
  let x: number;
  let y: number;

  if (
    typeof event?.clientX === "number" &&
    typeof event?.clientY === "number" &&
    (event.clientX !== 0 || event.clientY !== 0)
  ) {
    x = event.clientX;
    y = event.clientY;
  } else {
    const target = (event as any)?.currentTarget || (event as any)?.target;
    if (target && typeof target.getBoundingClientRect === "function") {
      const rect = target.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else {
      x = window.innerWidth - 60;
      y = 40;
    }
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const wave = ensureNanowave();
  wave.style.setProperty("--origin-x", `${x}px`);
  wave.style.setProperty("--origin-y", `${y}px`);
  wave.style.setProperty("--max-r", `${Math.ceil(endRadius)}px`);
  wave.style.setProperty("--wave-dur", `${NANO_DURATION_MS}ms`);

  wave.classList.remove("is-active", "is-pulsing");
  void wave.offsetWidth;
  wave.classList.add("is-active", "is-pulsing");
  animating = true;

  // Use native View Transitions if supported
  if ("startViewTransition" in document && typeof (document as any).startViewTransition === "function") {
    const transition = (document as any).startViewTransition(() => {
      setTheme(next);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: NANO_DURATION_MS,
          easing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });

    transition.finished.finally(() => {
      wave.classList.remove("is-active", "is-pulsing");
      animating = false;
    });
  } else {
    // Fallback for browsers without View Transitions
    window.setTimeout(() => setTheme(next), Math.round(NANO_DURATION_MS * 0.45));
    window.setTimeout(() => {
      wave.classList.remove("is-active", "is-pulsing");
      animating = false;
    }, NANO_DURATION_MS + 50);
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = useCallback((e?: ThemeToggleEvent) => toggleTheme(e), []);
  return { theme, toggleTheme: toggle };
}

export function useReveal() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observed = new WeakSet<HTMLElement>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
    );

    const scan = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
      for (const el of els) {
        if (reduce) {
          el.classList.add("is-in");
          continue;
        }
        if (!observed.has(el) && !el.classList.contains("is-in")) {
          observed.add(el);
          io.observe(el);
        }
      }
    };

    scan();

    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.scrollBy({ top: -24, behavior: "smooth" });
  }
}

export function useScrollReset() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);
}

/**
 * Interactive cursor spotlight: tracks mouse coordinates across cards and bento boxes,
 * providing dynamic radial neon illumination on borders and glass surfaces.
 */
export function useSpotlight() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const handlePointerMove = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest?.(
        "[data-spotlight], .spotlight-card, .metric, .step, .price, .repo, .principle, .compact, .feature, .speed-strip__panel"
      ) as HTMLElement | null;

      if (!target) return;

      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      target.style.setProperty("--mouse-x", `${x}px`);
      target.style.setProperty("--mouse-y", `${y}px`);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);
}