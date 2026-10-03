import type { Reliability } from "@/lib/v2/scoring";

const TONE: Record<Reliability["label"], string> = {
  High: "text-good",
  Good: "text-primary",
  Fair: "text-warn",
  Low: "text-bad",
};

interface ReliabilityBadgeProps {
  reliability: Reliability;
  compact?: boolean;
  /** When given, the badge is a button that shows/hides the explanation panel with this id. */
  panelId?: string;
  expanded?: boolean;
  onToggle?: () => void;
}

/** Score out of 10 with a 10-segment meter. Tap or click to see why (see ReliabilityExplainer). */
export function ReliabilityBadge({ reliability, compact = false, panelId, expanded = false, onToggle }: ReliabilityBadgeProps) {
  const filled = Math.round(reliability.score);
  const content = (
    <>
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
    </>
  );

  if (!onToggle) return <span className="inline-flex items-center gap-2">{content}</span>;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={panelId}
      className="-m-2 inline-flex min-h-11 items-center gap-2 rounded-lg p-2 transition hover:bg-surface-2"
    >
      {content}
      <span aria-hidden="true" className={`text-ink-muted transition ${expanded ? "rotate-180" : ""}`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
      <span className="sr-only">{expanded ? "Hide" : "Show"} why</span>
    </button>
  );
}

const SOURCE_TEXT: Record<Reliability["source"], string> = {
  "ncaa-airline-baseline": "Based on the airline's published NCAA delay and cancellation rates. Route-level on-time history is coming.",
  preview: "Preview score: there's no published on-time data for this airline yet.",
};

/** The plain-English explanation behind a reliability score, shown inline in a result card. */
export function ReliabilityExplainer({ id, reliability }: { id: string; reliability: Reliability }) {
  return (
    <div id={id} role="region" aria-label="Why this reliability score" className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
      <p className="text-ink">
        <span className={`font-semibold ${TONE[reliability.label]}`}>
          {reliability.score.toFixed(1)}/10 · {reliability.label}
        </span>{" "}
        {reliability.reason}
      </p>
      <p className="mt-1.5 text-xs text-ink-muted">
        {SOURCE_TEXT[reliability.source]} Confidence: {reliability.confidence.toLowerCase()}.
      </p>
    </div>
  );
}
