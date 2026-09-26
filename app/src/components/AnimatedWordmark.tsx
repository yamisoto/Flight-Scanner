const WORDMARK = "Skyfare";

interface AnimatedWordmarkProps {
  className?: string;
  /**
   * "loading" always animates, in both themes — used by the full-screen
   * loading state. "header" animates in light mode but is forced to a
   * static, solid blue in dark mode (see .wordmark-letter in
   * globals.css) — used by the persistent header logo.
   */
  variant?: "loading" | "header";
}

export function AnimatedWordmark({ className = "", variant = "loading" }: AnimatedWordmarkProps) {
  const letterClass = variant === "header" ? "wordmark-letter" : "loading-letter";

  return (
    <span className={className}>
      {WORDMARK.split("").map((letter, i) => (
        <span key={i} className={letterClass} style={{ animationDelay: `${i * 0.1}s` }}>
          {letter}
        </span>
      ))}
    </span>
  );
}
