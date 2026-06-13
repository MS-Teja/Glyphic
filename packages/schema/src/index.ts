export * from "./diagram.js";
// Re-export zod so downstream packages share a single zod instance
// (keeps `instanceof ZodError` reliable across the workspace).
export { z, ZodError } from "zod";
