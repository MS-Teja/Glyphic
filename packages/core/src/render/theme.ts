export interface ThemeColors {
  background: string;
  nodeBackground: string;
  nodeBorder: string;
  nodeText: string;
  edgeColor: string;
  edgeLabelColor: string;
  fontFamily?: string;
  customFontUrl?: string;
  customIcons?: Record<string, string>;
}

export const DEFAULT_THEME: ThemeColors = {
  background: "#ffffff",
  nodeBackground: "#f0f4ff",
  nodeBorder: "#3b82f6",
  nodeText: "#1e293b",
  edgeColor: "#64748b",
  edgeLabelColor: "#475569",
};

// Named presets selectable via `theme: "dark"` etc. Each is a partial overlay
// on DEFAULT_THEME; omitting edgeLabelColor lets the renderer auto-contrast it
// against the background.
export const THEME_PRESETS: Record<string, Partial<ThemeColors>> = {
  light: {},
  dark: {
    background: "#0f172a",
    nodeBackground: "#1e293b",
    nodeBorder: "#38bdf8",
    nodeText: "#e2e8f0",
    edgeColor: "#94a3b8",
  },
  pastel: {
    background: "#fdf6f0",
    nodeBackground: "#fce7f3",
    nodeBorder: "#f472b6",
    nodeText: "#3f3f46",
    edgeColor: "#a78bfa",
  },
  mono: {
    background: "#ffffff",
    nodeBackground: "#f4f4f5",
    nodeBorder: "#52525b",
    nodeText: "#18181b",
    edgeColor: "#71717a",
  },
};

/** Resolve a theme input (preset name, custom object, or undefined) to a partial overlay. */
export function resolveThemePartial(theme?: string | Partial<ThemeColors>): Partial<ThemeColors> {
  if (!theme) return {};
  if (typeof theme === "string") return THEME_PRESETS[theme] ?? {};
  return theme;
}

/**
 * Resolve the SVG font-family stack from an optional theme font name.
 * Centralizes the fallback so every render strategy honors theme.fontFamily.
 */
export function resolveFontFamily(fontFamily?: string): string {
  return fontFamily ? `'${fontFamily}', system-ui, sans-serif` : "Inter, system-ui, sans-serif";
}
