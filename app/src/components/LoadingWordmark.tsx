const WORDMARK = "Skyfare";

/**
 * Shown while a search is in flight. Each letter of the wordmark idles
 * at the logo color and pulses to brand blue in a left-to-right wave,
 * looping until the results (or an error) are ready. Fixed overlay so
 * it fully replaces the page content rather than sharing space with it.
 */
export function LoadingWordmark() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Searching for flights"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg"
    >
      <div className="text-3xl sm:text-4xl">
        {WORDMARK.split("").map((letter, i) => (
          <span key={i} className="loading-letter" style={{ animationDelay: `${i * 0.1}s` }}>
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}
