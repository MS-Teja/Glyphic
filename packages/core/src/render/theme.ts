/**
 * Resolve the SVG font-family stack from an optional theme font name.
 * Centralizes the fallback so every render strategy honors theme.fontFamily
 * consistently (previously several strategies hardcoded Inter).
 */
export function resolveFontFamily(fontFamily?: string): string {
  return fontFamily ? `'${fontFamily}', system-ui, sans-serif` : "Inter, system-ui, sans-serif";
}
