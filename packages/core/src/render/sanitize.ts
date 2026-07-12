/**
 * Output-sanitization helpers for generating safe SVG.
 *
 * Glyphic emits SVG that callers may rasterize (resvg) *and* display directly
 * in a browser / React Flow. Any caller-controlled string that reaches the SVG
 * must therefore be escaped or sanitized so it cannot break out of its context
 * (attribute, CSS string, or markup) and inject active content.
 */

/** Escape a string for safe inclusion in XML/SVG text or a double-quoted attribute. */
export function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Escape a string for safe inclusion inside a single-quoted CSS string / url().
 * Uses CSS hex escapes for characters that could terminate the string or the
 * surrounding rule (quotes, parens, angle brackets, backslash, newlines).
 */
export function escapeCssString(str: string): string {
  return String(str).replace(/[\\"'()<>\n\r\f]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `);
}

/** True only for well-formed https: URLs (blocks file:, javascript:, data:, http:, ...). */
export function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Conservative sanitizer for caller-supplied SVG markup (theme.customIcons and
 * canvas raw-svg). Strips active content and event handlers so the emitted SVG
 * is safe to display in a browser. This is defense-in-depth; for fully
 * untrusted multi-tenant input, also run a DOM sanitizer (e.g. DOMPurify)
 * upstream.
 */
export function sanitizeSvg(svg: string): string {
  return String(svg)
    // Remove dangerous elements together with their content.
    .replace(
      /<\s*(script|foreignObject|iframe|style|set|animate[a-zA-Z]*)\b[\s\S]*?<\s*\/\s*\1\s*>/gi,
      ""
    )
    // Remove dangerous self-closing / unclosed tags.
    .replace(/<\s*(script|foreignObject|iframe|style|set|animate[a-zA-Z]*)\b[^>]*\/?>/gi, "")
    // Strip inline event handlers (onload=, onclick=, ...). The separator can be
    // whitespace OR a slash — `<svg/onload=alert(1)>` is valid markup, so a
    // whitespace-only match would miss it.
    .replace(/[\s/]on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // Neutralize any (xlink:)href that isn't a local fragment ref (#id). This
    // blocks javascript:/data: AND external http(s)/protocol-relative refs in
    // <a>/<use>/<image> — icons are self-contained, so external loads aren't
    // needed and would leak/track when the SVG is shown as live DOM.
    .replace(/((?:xlink:)?href)\s*=\s*("|')\s*(?!#)[^"']*\2/gi, '$1="#"');
}
