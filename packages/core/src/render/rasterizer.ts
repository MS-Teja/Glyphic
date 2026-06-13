import { Resvg } from "@resvg/resvg-js";

export interface RasterizeOptions {
  dpi?: number;
  background?: string;
}

export function rasterizeSVG(svgString: string, options?: RasterizeOptions): Buffer {
  const resvg = new Resvg(svgString, {
    background: options?.background || "rgba(255, 255, 255, 1)",
    fitTo: {
      mode: "original",
    },
    // Optional scaling for high-DPI "retina" output
    ...(options?.dpi && options.dpi > 1 ? { fitTo: { mode: "zoom", value: options.dpi } } : {})
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  
  return pngBuffer;
}
