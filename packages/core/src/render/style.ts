// Render styles: a bundle of geometry/spacing/stroke tokens that give a diagram
// its "personality", layered independently of `theme` (which controls colors).
// `theme` = palette + fonts; `style` = shape geometry, spacing, and stroke.

export interface StyleTokens {
  /** Preset name, kept for debugging/introspection. */
  name: string;
  /** Corner radius for rectangle nodes. */
  rectRadius: number;
  /** Corner radius for rounded/service/pill nodes. */
  roundedRadius: number;
  /** Stroke width for node borders and edges. */
  strokeWidth: number;
  /**
   * How node fills are painted:
   * - "solid": the node color fills the shape (classic).
   * - "tint":  a light wash of the node color fills it; the color becomes the border.
   * - "none":  no fill (outline-only).
   */
  fillMode: "solid" | "tint" | "none";
  /** Default font weight for node labels. */
  fontWeight: number;
  /** ELK node-to-node spacing within a layer. */
  nodeSpacing: number;
  /** ELK spacing between layers. */
  layerSpacing: number;
  /** Render shapes/edges with a hand-drawn roughen pass. */
  sketch: boolean;
  /** Apply a subtle drop shadow to node shapes. */
  shadow: boolean;
}

export const STYLE_PRESETS: Record<string, StyleTokens> = {
  // The classic look prior to styles — preserved so users can opt back in.
  clean: {
    name: "clean",
    rectRadius: 6,
    roundedRadius: 20,
    strokeWidth: 2,
    fillMode: "solid",
    fontWeight: 600,
    nodeSpacing: 60,
    layerSpacing: 80,
    sketch: false,
    shadow: false,
  },
  // New default: dense, soft tinted fills, rounder corners, thin borders, subtle shadow.
  compact: {
    name: "compact",
    rectRadius: 10,
    roundedRadius: 14,
    strokeWidth: 1.5,
    fillMode: "tint",
    fontWeight: 600,
    nodeSpacing: 40,
    layerSpacing: 56,
    sketch: false,
    shadow: true,
  },
  // Outline-only, hairline borders, airy spacing.
  minimal: {
    name: "minimal",
    rectRadius: 8,
    roundedRadius: 16,
    strokeWidth: 1,
    fillMode: "none",
    fontWeight: 500,
    nodeSpacing: 70,
    layerSpacing: 92,
    sketch: false,
    shadow: false,
  },
  // Hand-drawn: compact geometry plus a roughen pass on shapes and edges.
  sketch: {
    name: "sketch",
    rectRadius: 10,
    roundedRadius: 14,
    strokeWidth: 1.75,
    fillMode: "tint",
    fontWeight: 600,
    nodeSpacing: 46,
    layerSpacing: 62,
    sketch: true,
    shadow: false,
  },
};

export const DEFAULT_STYLE: StyleTokens = STYLE_PRESETS.compact;

/** Resolve a style preset name to its tokens. Defaults to `compact`. */
export function resolveStyle(name?: string): StyleTokens {
  if (!name) return DEFAULT_STYLE;
  return STYLE_PRESETS[name] ?? DEFAULT_STYLE;
}
