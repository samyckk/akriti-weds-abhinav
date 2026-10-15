/**
 * Generic runtime error reporter.
 * Forwards boundary-caught errors to the browser console so they are
 * visible in DevTools even when React does not rethrow them to window.onerror.
 */
export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  console.error("[ErrorBoundary]", message, context);
}
