#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DiagramInput } from "@glyphicjs/schema";
import { z } from "zod";
import { processDiagram } from "@glyphicjs/core";
import { zodToJsonSchema } from "zod-to-json-schema";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";

const server = new Server(
  {
    name: "glyphic-mcp-server",
    version: "1.0.0",
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
        description: "Returns the JSON schema of the DiagramInput payload to help the AI understand supported diagram types and properties.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "render_diagram",
        description: "Renders a declarative JSON diagram into a visual representation. The input MUST conform to the DiagramInput schema.",
        inputSchema: zodToJsonSchema(z.object({ diagram: DiagramInput })) as any,
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "get_schema": {
      const schema = zodToJsonSchema(DiagramInput);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(schema, null, 2),
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

        const outputDir = path.join(os.homedir(), 'Desktop', 'Glyphic Diagrams');
        await fs.mkdir(outputDir, { recursive: true });

        const exportFormat = validated.exportFormat || ["png"];
        const safeTitle = (validated.title || 'diagram').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const baseFilename = `${safeTitle}_${Date.now()}`;

        let textContent = `Diagram generated successfully.`;
        const contentBlocks: any[] = [];

        if (exportFormat.includes("png") && result.png) {
          const filepath = path.join(outputDir, `${baseFilename}.png`);
          await fs.writeFile(filepath, result.png);
          textContent += `\n\nPNG saved to: ${filepath}`;
          contentBlocks.push({
            type: "image",
            data: result.png.toString("base64"),
            mimeType: "image/png",
          });
        }

        if (exportFormat.includes("svg") && result.svg) {
          const filepath = path.join(outputDir, `${baseFilename}.svg`);
          await fs.writeFile(filepath, result.svg, 'utf8');
          textContent += `\n\nSVG saved to: ${filepath}`;
        }

        if (exportFormat.includes("react-flow") && result.reactFlow) {
          const filepath = path.join(outputDir, `${baseFilename}_react_flow.json`);
          const rfJson = JSON.stringify(result.reactFlow, null, 2);
          await fs.writeFile(filepath, rfJson, 'utf8');
          textContent += `\n\nReact Flow JSON saved to: ${filepath}`;
          textContent += `\n\nReact Flow Config:\n\`\`\`json\n${rfJson}\n\`\`\``;
        }

        textContent += `\n\nPlease tell the user that the diagram has been saved to the exact file paths above so they can find it. If they requested react-flow, provide them the json string.`;

        contentBlocks.unshift({ type: "text", text: textContent });
        return { content: contentBlocks };
      } catch (error) {
        // Surface only the message (Zod issues formatted) — never the stack trace.
        const message =
          error instanceof z.ZodError
            ? `Invalid diagram input:\n${error.issues.map((i) => `- ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n")}`
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Glyphic MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
