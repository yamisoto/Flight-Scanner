const WORDMARK = "Skyfare";

/**
 * Renders "Skyfare" as individually-animated letters (see .loading-letter
 * in globals.css). Used both for the persistent header wordmark (small,
 * animates continuously) and the full-screen loading state (large, shown
 * only while a search is in flight) — same animation, different size.
 */
export function AnimatedWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      {WORDMARK.split("").map((letter, i) => (
        <span key={i} className="loading-letter" style={{ animationDelay: `${i * 0.1}s` }}>
          {letter}
        </span>
      ))}
    </span>
  );
}
