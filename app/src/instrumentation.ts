import type { Instrumentation } from "next";

/**
 * Server error reporting. Until an error-tracking service (e.g. Sentry) is
 * connected, every uncaught server error is written as one structured JSON
 * line, which Vercel's runtime logs can search and filter. Headers are left
 * out on purpose: they can carry cookies and other personal data.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const error = err instanceof Error ? err : new Error(String(err));
  const digest = typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;

  console.error(
    JSON.stringify({
      level: "error",
      event: "request_error",
      message: error.message,
      digest,
      stack: error.stack?.split("\n").slice(0, 8).join("\n"),
      method: request.method,
      path: request.path,
      routePath: context.routePath,
      routeType: context.routeType,
      at: new Date().toISOString(),
    }),
  );
};
