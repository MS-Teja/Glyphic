import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createGlyphicServer } from "./server.js";

const RENDER_TIMEOUT = 30000;

async function connectedClient() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createGlyphicServer();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server };
}

const MINIMAL_FLOWCHART = {
  type: "flowchart",
  title: "Test Flow",
  nodes: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ],
  edges: [{ source: "a", target: "b" }],
};

describe("glyphic mcp server", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("lists exactly get_schema and render_diagram", async () => {
    const { client } = await connectedClient();
    const { tools } = await client.listTools();

    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(["get_schema", "render_diagram"]);

    const renderDiagram = tools.find((t) => t.name === "render_diagram")!;
    expect((renderDiagram.inputSchema as any).properties).toHaveProperty("diagram");
  });

  it("get_schema returns the DiagramInput JSON schema", async () => {
    const { client } = await connectedClient();
    const result = await client.callTool({ name: "get_schema", arguments: {} });
    const content = result.content as any[];
    expect(content).toHaveLength(1);
    expect(content[0].type).toBe("text");

    const parsed = JSON.parse(content[0].text);
    const serialized = JSON.stringify(parsed);
    expect(serialized).toContain("flowchart");
    expect(serialized).toContain("sequence");
  });

  it(
    "renders a diagram and saves files to GLYPHIC_OUTPUT_DIR",
    async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "glyphic-test-"));
      process.env.GLYPHIC_OUTPUT_DIR = tmpDir;
      // biome-ignore lint/performance/noDelete: `process.env.X = undefined` coerces to the string "undefined" in Node.js rather than unsetting the var, defeating this test's intent.
      delete process.env.GLYPHIC_NO_SAVE;

      const { client } = await connectedClient();
      const result = await client.callTool({
        name: "render_diagram",
        arguments: { diagram: MINIMAL_FLOWCHART },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content as any[];

      const imageBlock = content.find((c) => c.type === "image");
      expect(imageBlock).toBeDefined();
      expect(imageBlock.mimeType).toBe("image/png");
      expect(imageBlock.data.length).toBeGreaterThan(0);

      const textBlock = content.find((c) => c.type === "text");
      expect(textBlock).toBeDefined();
      expect(textBlock.text).toContain(tmpDir);

      const files = await fs.readdir(tmpDir);
      const pngFile = files.find((f) => f.endsWith(".png"));
      expect(pngFile).toBeDefined();
      const stat = await fs.stat(path.join(tmpDir, pngFile!));
      expect(stat.size).toBeGreaterThan(0);
    },
    RENDER_TIMEOUT
  );

  it(
    "skips saving when GLYPHIC_NO_SAVE=1 but still returns the inline image",
    async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "glyphic-test-"));
      process.env.GLYPHIC_OUTPUT_DIR = tmpDir;
      process.env.GLYPHIC_NO_SAVE = "1";

      const { client } = await connectedClient();
      const result = await client.callTool({
        name: "render_diagram",
        arguments: { diagram: MINIMAL_FLOWCHART },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content as any[];

      const imageBlock = content.find((c) => c.type === "image");
      expect(imageBlock).toBeDefined();
      expect(imageBlock.data.length).toBeGreaterThan(0);

      const textBlock = content.find((c) => c.type === "text");
      expect(textBlock.text.toLowerCase()).toContain("disabled");

      const files = await fs.readdir(tmpDir);
      expect(files).toHaveLength(0);
    },
    RENDER_TIMEOUT
  );

  it(
    "does not error when the output dir cannot be created, and still returns the image",
    async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "glyphic-test-"));
      const blockerFile = path.join(tmpDir, "blocker");
      await fs.writeFile(blockerFile, "not a directory");
      // mkdir(recursive) fails because "blocker" is a file, not a directory.
      process.env.GLYPHIC_OUTPUT_DIR = path.join(blockerFile, "sub");
      // biome-ignore lint/performance/noDelete: `process.env.X = undefined` coerces to the string "undefined" in Node.js rather than unsetting the var, defeating this test's intent.
      delete process.env.GLYPHIC_NO_SAVE;

      const { client } = await connectedClient();
      const result = await client.callTool({
        name: "render_diagram",
        arguments: { diagram: MINIMAL_FLOWCHART },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content as any[];

      const imageBlock = content.find((c) => c.type === "image");
      expect(imageBlock).toBeDefined();

      const textBlock = content.find((c) => c.type === "text");
      expect(textBlock.text.toLowerCase()).toContain("could not be saved");
    },
    RENDER_TIMEOUT
  );

  it("returns a validation error for an invalid diagram, without leaking a stack trace", async () => {
    const { client } = await connectedClient();
    const result = await client.callTool({
      name: "render_diagram",
      arguments: { diagram: { type: "flowchart" } },
    });

    expect(result.isError).toBe(true);
    const content = result.content as any[];
    expect(content[0].type).toBe("text");
    expect(content[0].text).toMatch(/^Error rendering diagram:/);
    expect(content[0].text).toContain("Invalid diagram input");
    expect(content[0].text).toContain("nodes");
    expect(content[0].text).not.toContain("  at ");
  });

  it("rejects calls to an unknown tool", async () => {
    const { client } = await connectedClient();
    await expect(client.callTool({ name: "not_a_real_tool", arguments: {} })).rejects.toBeTruthy();
  });
});
