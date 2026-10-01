import type { Reliability } from "@/lib/v2/scoring";

const TONE: Record<Reliability["label"], string> = {
  High: "text-good",
  Good: "text-primary",
  Fair: "text-warn",
  Low: "text-bad",
};

/** Score out of 10 with a 10-segment meter. Hover/focus shows the reason. */
export function ReliabilityBadge({ reliability, compact = false }: { reliability: Reliability; compact?: boolean }) {
  const filled = Math.round(reliability.score);
  return (
    <span
      className="inline-flex items-center gap-2"
      title={`${reliability.reason}${reliability.preview ? " Preview score: real on-time data is not connected yet." : ""}`}
    >
      <span className={`v2-num text-sm font-semibold ${TONE[reliability.label]}`}>{reliability.score.toFixed(1)}</span>
      {!compact && (
        <span className="hidden gap-[2px] sm:flex" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={`h-2.5 w-[3px] rounded-full ${i < filled ? "bg-current " + TONE[reliability.label] : "bg-line-strong"}`} />
          ))}
        </span>
      )}
      <span className="text-xs text-ink-muted">
        <span className="sr-only">Reliability {reliability.score} out of 10, </span>
        {reliability.label}
      </span>
    </span>
  );
}
