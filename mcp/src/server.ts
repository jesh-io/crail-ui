#!/usr/bin/env node
/* crail-mcp — stdio entry (npx crail-mcp / Claude Desktop). */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createCrailServer, type Catalog } from "./core.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const appHtml = readFileSync(path.join(here, "../dist-app/index.html"), "utf8");
const catalog: Catalog = JSON.parse(readFileSync(path.join(here, "../catalog.json"), "utf8"));

const server = createCrailServer(appHtml, catalog);
const transport = new StdioServerTransport();
await server.connect(transport);
