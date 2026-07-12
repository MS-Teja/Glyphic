import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
  type ContentBlock,
} from "@modelcontextprotocol/sdk/types.js";
import { DiagramInput, formatValidationError } from "@glyphicjs/schema";
import { z } from "zod";
import { processDiagram } from "@glyphicjs/core";
import { zodToJsonSchema } from "zod-to-json-schema";

const require = createRequire(import.meta.url);
// package.json sits one level up from both src/ and dist/, so this resolves
// correctly whether we're running from source (vitest) or the tsc build.
export const VERSION: string = require("../package.json").version;

// Precomputed once at module load — these were previously recomputed on every
// ListTools / get_schema call, which is wasted work since the schema is static.
const RENDER_DIAGRAM_INPUT_SCHEMA = zodToJsonSchema(z.object({ diagram: DiagramInput })) as Tool["inputSchema"];
const DIAGRAM_SCHEMA_TEXT = JSON.stringify(zodToJsonSchema(DiagramInput), null, 2);

const DEFAULT_OUTPUT_DIR_NAME = path.join("Desktop", "Glyphic Diagrams");

/**
 * Sanitizes a diagram title into a filesystem-safe base name. Falls back to
 * "diagram" when the title is missing or sanitizes down to nothing (e.g. a
 * title made entirely of symbols like "!!!").
 */
export function sanitizeTitle(title?: string): string {
  const sanitized = (title || "diagram").replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return /^_*$/.test(sanitized) ? "diagram" : sanitized;
}

/**
 * Builds a base filename (no extension) for a rendered diagram. Includes a
 * random hex suffix so two renders of the same title in the same millisecond
 * don't collide.
 */
export function makeBaseFilename(title?: string): string {
  return `${sanitizeTitle(title)}_${Date.now()}_${randomBytes(3).toString("hex")}`;
}

/**
 * Resolves where rendered diagrams should be saved on disk, or `null` if
 * saving is disabled. Reads from the passed-in env (defaulting to
 * process.env) rather than a module-level constant so callers — including
 * tests — can vary it per call.
 */
export function resolveOutputDir(env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.GLYPHIC_NO_SAVE === "1" || env.GLYPHIC_NO_SAVE === "true") {
    return null;
  }
  if (env.GLYPHIC_OUTPUT_DIR && env.GLYPHIC_OUTPUT_DIR.length > 0) {
    return env.GLYPHIC_OUTPUT_DIR;
  }
  return path.join(os.homedir(), DEFAULT_OUTPUT_DIR_NAME);
}

export function createGlyphicServer(): Server {
  const server = new Server(
    {
      name: "glyphic-mcp-server",
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "get_schema",
          description:
            "Returns the JSON schema of the DiagramInput payload to help the AI understand supported diagram types and properties.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "render_diagram",
          description:
            "Renders a declarative JSON diagram into a visual representation. The input MUST conform to the DiagramInput schema.",
          inputSchema: RENDER_DIAGRAM_INPUT_SCHEMA,
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
      case "get_schema": {
        return {
          content: [
            {
              type: "text",
              text: DIAGRAM_SCHEMA_TEXT,
            },
          ],
        };
      }
      case "render_diagram": {
        try {
          // Validate the input here too (consistent with the HTTP API) so malformed
          // LLM output yields a clean error instead of crashing the renderer.
          const validated = DiagramInput.parse((request.params.arguments as any)?.diagram);
          const result = await processDiagram(validated);

          // Resolved per-call (not hoisted to module scope) so tests — and
          // long-lived server processes reacting to env changes — see the
          // current value rather than one captured at startup.
          const outputDir = resolveOutputDir();
          const exportFormat = validated.exportFormat;
          const baseFilename = makeBaseFilename(validated.title);

          let textContent = "Diagram generated successfully.";
          const contentBlocks: ContentBlock[] = [];
          let savedAnyFile = false;

          if (outputDir === null) {
            textContent += "\n\nFile saving is disabled (GLYPHIC_NO_SAVE).";
          } else {
            try {
              await fs.mkdir(outputDir, { recursive: true });

              if (exportFormat.includes("png") && result.png) {
                const filepath = path.join(outputDir, `${baseFilename}.png`);
                await fs.writeFile(filepath, result.png);
                textContent += `\n\nPNG saved to: ${filepath}`;
                savedAnyFile = true;
              }

              if (exportFormat.includes("svg") && result.svg) {
                const filepath = path.join(outputDir, `${baseFilename}.svg`);
                await fs.writeFile(filepath, result.svg, "utf8");
                textContent += `\n\nSVG saved to: ${filepath}`;
                savedAnyFile = true;
              }

              if (exportFormat.includes("react-flow") && result.reactFlow) {
                const filepath = path.join(outputDir, `${baseFilename}_react_flow.json`);
                const rfJson = JSON.stringify(result.reactFlow, null, 2);
                await fs.writeFile(filepath, rfJson, "utf8");
                textContent += `\n\nReact Flow JSON saved to: ${filepath}`;
                savedAnyFile = true;
              }
            } catch (fsError) {
              const message = fsError instanceof Error ? fsError.message : String(fsError);
              console.error(`[glyphic] Warning: could not save diagram to ${outputDir}: ${message}`);
              textContent += `\n\nFiles could not be saved to ${outputDir}: ${message}. Set GLYPHIC_OUTPUT_DIR to a writable directory, or GLYPHIC_NO_SAVE=1 to disable saving.`;
            }
          }

          // The inline image/JSON blocks are returned regardless of whether the
          // on-disk save succeeded — the caller still gets the rendered output.
          if (exportFormat.includes("png") && result.png) {
            contentBlocks.push({
              type: "image",
              data: result.png.toString("base64"),
              mimeType: "image/png",
            });
          }

          if (exportFormat.includes("react-flow") && result.reactFlow) {
            const rfJson = JSON.stringify(result.reactFlow, null, 2);
            textContent += `\n\nReact Flow Config:\n\`\`\`json\n${rfJson}\n\`\`\``;
          }

          if (savedAnyFile) {
            textContent += "\n\nPlease tell the user that the diagram has been saved to the exact file paths above so they can find it. If they requested react-flow, provide them the json string.";
          }

          contentBlocks.unshift({ type: "text", text: textContent });
          return { content: contentBlocks };
        } catch (error) {
          // Surface only the message (Zod issues formatted) — never the stack trace.
          const message =
            error instanceof z.ZodError
              ? formatValidationError(error, {
                  tip: "Call the get_schema tool for the full DiagramInput contract.",
                })
              : error instanceof Error
                ? error.message
                : "Unknown error occurred while rendering the diagram.";
          return {
            content: [{ type: "text", text: `Error rendering diagram: ${message}` }],
            isError: true,
          };
        }
      }
      default:
        throw new Error("Unknown tool");
    }
  });

  return server;
}

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  brand: "\x1b[38;2;226;80;47m", // Glyphic orange (#e2502f)
};

/**
 * Prints the startup banner to STDERR (stdout is reserved for the MCP stdio
 * protocol channel). Colors are used only when stderr is an interactive
 * terminal and NO_COLOR is unset, so MCP client log files stay clean. When
 * stdin is a TTY — a human ran us by hand instead of an MCP client — the
 * banner explains why nothing appears to happen.
 */
export function printBanner(): void {
  const useColor = Boolean(process.stderr.isTTY) && process.env.NO_COLOR === undefined;
  const style = (codes: string, text: string) => (useColor ? `${codes}${text}${ANSI.reset}` : text);

  const outputDir = resolveOutputDir();
  const home = os.homedir();
  const prettyDir = outputDir?.startsWith(home) ? `~${outputDir.slice(home.length)}` : outputDir;

  const lines = [
    "",
    `  ${style(ANSI.brand + ANSI.bold, "◆ Glyphic")} ${style(ANSI.dim, "— the rendering engine for AI-generated diagrams")}`,
    `  ${style(ANSI.dim, `v${VERSION} · speaking MCP over stdio`)}`,
    "",
  ];

  if (outputDir === null) {
    lines.push(`  ${style(ANSI.dim, "File saving is off (GLYPHIC_NO_SAVE) — diagrams return inline only.")}`);
  } else {
    lines.push(
      `  Diagrams land in ${style(ANSI.bold, prettyDir ?? outputDir)}`,
      `  ${style(ANSI.dim, "GLYPHIC_OUTPUT_DIR to relocate · GLYPHIC_NO_SAVE=1 to go file-free")}`
    );
  }

  lines.push(
    "",
    `  ${style(ANSI.dim, "Docs")}  https://github.com/MS-Teja/Glyphic/blob/main/docs/mcp.md`,
    `  ${style(ANSI.dim, "Bugs")}  https://github.com/MS-Teja/Glyphic/issues`
  );

  if (process.stdin.isTTY) {
    lines.push(
      "",
      `  ${style(ANSI.bold, "Running this by hand?")} It will look quiet from here — Glyphic is an`,
      "  MCP server, patiently waiting for an AI client to speak first.",
      "  Hook it up and start drawing:",
      "",
      `    ${style(ANSI.brand, "claude mcp add glyphic -- npx -y @glyphicjs/mcp-server")}`,
      "",
      `  ${style(ANSI.dim, "(Ctrl+C to exit)")}`
    );
  }

  lines.push("");
  console.error(lines.join("\n"));
}
