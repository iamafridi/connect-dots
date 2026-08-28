import { useEffect, useState } from "react";

interface TypewriterTextProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
  className?: string;
}

export default function TypewriterText({
  phrases,
  typingSpeed = 70,
  deletingSpeed = 40,
  pauseTime = 2200,
  className = "",
}: TypewriterTextProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setCurrentText(phrases[0] || "");
      return;
    }

    const currentFullText = phrases[phraseIndex] || "";

    let timer: number;

    if (!isDeleting && currentText === currentFullText) {
      // Finished typing, pause before deleting
      timer = window.setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && currentText === "") {
      // Finished deleting, move to next phrase
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    } else {
      // Type or delete next char
      const speed = isDeleting ? deletingSpeed : typingSpeed;
      timer = window.setTimeout(() => {
        const nextLength = isDeleting ? currentText.length - 1 : currentText.length + 1;
        setCurrentText(currentFullText.slice(0, nextLength));
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseTime]);

  return (
    <span className={`typewriter-container ${className}`}>
      <span>{currentText}</span>
      <span className="typewriter-cursor" aria-hidden="true">|</span>
    </span>
  );
}
