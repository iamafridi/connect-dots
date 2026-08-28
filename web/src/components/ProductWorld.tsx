import type { CSSProperties } from "react";

const ORBITS = [
  { label: "CPEAK", accent: "var(--coral)", size: 46, duration: 18, delay: -3 },
  { label: "REDIS", accent: "var(--coral)", size: 68, duration: 28, delay: -12 },
  { label: "STREAM", accent: "var(--lime)", size: 88, duration: 38, delay: -24 },
  { label: "POSTGRES", accent: "var(--violet)", size: 108, duration: 48, delay: -36 },
] as const;

/**
 * Light-theme hero art: a true 3D Atomic Orbit system.
 * ConnectDots core is the central nucleus, while the load-test stack
 * (CPEAK, REDIS, STREAM, POSTGRES) physically orbit in full 360° circles around it like electrons.
 */
export default function ProductWorld() {
  return (
    <div className="world" aria-hidden="true">
      {ORBITS.map((orbit) => (
        <div
          key={orbit.label}
          className="world__orbit"
          style={
            {
              "--orbit-size": `${orbit.size}%`,
              "--orbit-dur": `${orbit.duration}s`,
              "--orbit-delay": `${orbit.delay}s`,
            } as CSSProperties
          }
        >
          <div
            className="world__sat"
            style={
              {
                "--accent": orbit.accent,
                "--orbit-dur": `${orbit.duration}s`,
                "--orbit-delay": `${orbit.delay}s`,
              } as CSSProperties
            }
          >
            <div className="world__chip">
              <i />
              <span>{orbit.label}</span>
            </div>
          </div>
        </div>
      ))}

      <div className="world__core">
        <div className="world__core-coin">
          <span className="world__core-face world__core-face--front">
            <span className="world__core-dot" />
            <span className="world__core-name">CD</span>
          </span>
          <span className="world__core-face world__core-face--back">
            <span className="world__core-name">CD</span>
          </span>
        </div>
        <span className="world__core-sub">connectdots</span>
      </div>
    </div>
  );
}