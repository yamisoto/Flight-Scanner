import { AnimatedWordmark } from "@/components/AnimatedWordmark";

/**
 * Shown while a search is in flight — a full-screen takeover of the
 * animated wordmark until results (or an error) are ready.
 */
export function LoadingWordmark() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Searching for flights"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg"
    >
      <AnimatedWordmark className="text-3xl sm:text-4xl" />
    </div>
  );
}
