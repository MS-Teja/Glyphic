import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface RasterizeOptions {
  dpi?: number;
  background?: string;
  /** Optional custom font (e.g. a .ttf) to embed so it appears in the PNG. */
  fontBuffer?: ArrayBuffer;
}

export class RasterizationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "RasterizationError";
  }
}

export function rasterizeSVG(svgString: string, options?: RasterizeOptions): Buffer {
  // Optional high-DPI scaling for crisp "retina" output.
  const fitTo =
    options?.dpi && options.dpi > 1
      ? ({ mode: "zoom", value: options.dpi } as const)
      : ({ mode: "original" } as const);

  // resvg cannot fetch remote @font-face URLs and (in this version) only loads
  // fonts from files, so write the caller-supplied buffer to a temp file and
  // pass it via fontFiles so the custom font appears in the rasterized PNG.
  let tmpFontPath: string | undefined;
  if (options?.fontBuffer && options.fontBuffer.byteLength > 0) {
    tmpFontPath = join(tmpdir(), `glyphic-font-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    writeFileSync(tmpFontPath, Buffer.from(options.fontBuffer));
  }

  try {
    const resvg = new Resvg(svgString, {
      background: options?.background || "rgba(255, 255, 255, 1)",
      fitTo,
      ...(tmpFontPath ? { font: { fontFiles: [tmpFontPath], loadSystemFonts: true } } : {}),
    });
    return resvg.render().asPng();
  } catch (err) {
    throw new RasterizationError(
      `Failed to rasterize SVG to PNG: ${err instanceof Error ? err.message : String(err)}`,
      err
    );
  } finally {
    if (tmpFontPath) {
      try {
        unlinkSync(tmpFontPath);
      } catch {
        /* best-effort cleanup */
      }
    }
  }
}
