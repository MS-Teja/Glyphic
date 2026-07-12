#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createGlyphicServer, printBanner } from "./server.js";

async function main() {
  const server = createGlyphicServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  printBanner();
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
