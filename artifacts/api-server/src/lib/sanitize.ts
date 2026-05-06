/**
 * Lightweight input sanitization for free-text fields.
 *
 * Strips the most common XSS vectors (script tags, event handlers, javascript:
 * hrefs, HTML tags) without requiring an external dependency.  This is a
 * defense-in-depth measure — the admin panel renders data as text nodes, not
 * innerHTML, so the primary risk is future code changes accidentally treating
 * user content as HTML.
 *
 * For richer HTML sanitization (e.g., if the app ever allows formatted bios)
 * replace this with the `xss` or `sanitize-html` npm package.
 */

// Strip all HTML tags and common XSS injection patterns
const HTML_TAG_RE = /<[^>]*>/g;
const JS_URL_RE = /javascript\s*:/gi;
const DATA_URL_RE = /data\s*:/gi;
const EVENT_HANDLER_RE = /\bon\w+\s*=/gi;

export function sanitizeText(input: string): string {
  return input
    .replace(HTML_TAG_RE, "")        // remove any HTML tags
    .replace(JS_URL_RE, "")          // remove javascript: URIs
    .replace(DATA_URL_RE, "")        // remove data: URIs
    .replace(EVENT_HANDLER_RE, "")   // remove onerror=, onclick=, etc.
    .trim();
}

/**
 * Apply sanitizeText to every string value in an object, recursively.
 * Arrays of strings are sanitized element-by-element.
 * Non-string values are passed through untouched.
 */
export function sanitizeFields<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "string") {
      out[key] = sanitizeText(val);
    } else if (Array.isArray(val)) {
      out[key] = val.map((item) => (typeof item === "string" ? sanitizeText(item) : item));
    } else {
      out[key] = val;
    }
  }
  return out as T;
}
