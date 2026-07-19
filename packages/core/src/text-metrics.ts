// Approximate per-character advance widths (as a fraction of font size) for the
// Inter font family. Used to estimate text width without a font engine so that
// node sizing and line wrapping account for actual glyph widths (e.g. "WWWW" is
// far wider than "llll") instead of a flat px-per-char constant. Calibrated to
// slightly over-estimate so text comfortably fits its computed box.

const DEFAULT_ADVANCE = 0.6;

const ADVANCE: Record<string, number> = {
  " ": 0.3,
  "i": 0.3, "j": 0.32, "l": 0.3, "I": 0.34, "f": 0.34, "t": 0.36, "r": 0.42,
  ".": 0.3, ",": 0.3, ":": 0.3, ";": 0.3, "'": 0.26, "`": 0.3, "|": 0.28, "!": 0.32,
  "(": 0.38, ")": 0.38, "[": 0.38, "]": 0.38, "{": 0.4, "}": 0.4, "-": 0.4, "/": 0.4, "\\": 0.4,
  "m": 0.86, "w": 0.8, "M": 0.88, "W": 0.88,
  "G": 0.76, "O": 0.78, "Q": 0.78, "D": 0.74, "H": 0.76, "N": 0.76, "U": 0.74, "C": 0.74, "A": 0.72
};

/** Estimated rendered width of `text` at `fontSize`px (heavier weights are a touch wider). */
export function measureTextWidth(text: string, fontSize: number, weight = 400): number {
  let units = 0;
  for (const ch of String(text)) units += ADVANCE[ch] ?? DEFAULT_ADVANCE;
  const boldFactor = weight >= 600 ? 1.04 : 1;
  return units * fontSize * boldFactor;
}

/** Greedily wrap `text` into lines that each fit within `maxWidth`px. */
export function wrapTextToWidth(text: string, maxWidth: number, fontSize: number, weight = 400): string[] {
  const words = String(text).split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && measureTextWidth(candidate, fontSize, weight) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

// Sequence-message label metrics, shared so the layout adapter and the SVG
// renderer wrap identically — sizing the diagram to the exact lines that get
// drawn. Font matches the text scene-builder emits for edge labels (12px / 500).
export const SEQ_LABEL_FONT_SIZE = 12;
export const SEQ_LABEL_FONT_WEIGHT = 500;
export const SEQ_LABEL_LINE_HEIGHT = 14; // must equal scene-builder's edgeLineHeight
export const SEQ_LABEL_PAD = 40; // total horizontal padding subtracted from a message's span

/** Wrap a sequence message label to the pixel width available across its span. */
export function wrapSequenceLabel(label: string, maxWidth: number): string[] {
  return wrapTextToWidth(label, maxWidth, SEQ_LABEL_FONT_SIZE, SEQ_LABEL_FONT_WEIGHT);
}
