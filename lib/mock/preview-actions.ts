/**
 * Preview-mode mutation results.
 *
 * In preview (nobody signed in, or no database configured) server
 * actions never write and never bounce to /login. They return a
 * `PreviewError` instead, which the calling component surfaces inline.
 *
 * We return rather than throw because Next redacts thrown server-action
 * messages in production builds, so a thrown "sign in to save" would
 * reach the browser as a generic error.
 *
 * Client- and server-safe (no imports).
 */

export const PREVIEW_SAVE_MESSAGE =
  "Preview: sign in to save changes. Nothing was saved.";

export type PreviewError = { error: string };

export function previewError(message = PREVIEW_SAVE_MESSAGE): PreviewError {
  return { error: message };
}

export function isPreviewError(value: unknown): value is PreviewError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  );
}

/**
 * Unwrap an action result inside a component's try/catch: a
 * `PreviewError` is re-thrown client-side so the existing
 * `catch (e) { setError(e.message) }` paths display it unchanged.
 */
export function unwrapAction<T>(result: T | PreviewError): T {
  if (isPreviewError(result)) throw new Error(result.error);
  return result;
}
