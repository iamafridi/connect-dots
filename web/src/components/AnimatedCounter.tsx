import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: string;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 1600,
  className = "",
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(value);
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    // Match numbers, decimals, and commas
    const match = value.match(/^([^0-9.]*)([0-9,.]+)(.*)$/);
    if (!match) {
      setDisplay(value);
      return;
    }

    const prefix = match[1] || "";
    const rawNumberStr = match[2];
    const suffix = match[3] || "";

    const hasCommas = rawNumberStr.includes(",");
    const decimalParts = rawNumberStr.replace(/,/g, "").split(".");
    const targetNum = parseFloat(rawNumberStr.replace(/,/g, ""));
    const decimals = decimalParts.length > 1 ? decimalParts[1].length : 0;

    if (isNaN(targetNum)) {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTime: number | null = null;

          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease Out Expo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const currentNum = targetNum * easeProgress;

            let formatted = currentNum.toFixed(decimals);
            if (hasCommas) {
              const parts = formatted.split(".");
              parts[0] = parseInt(parts[0], 10).toLocaleString("en-US");
              formatted = parts.join(".");
            }

            setDisplay(`${prefix}${formatted}${suffix}`);

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setDisplay(value);
            }
          };

          requestAnimationFrame(step);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={containerRef} className={className}>
      {display}
    </span>
  );
}
