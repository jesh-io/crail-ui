#!/usr/bin/env node
/* npx crail-skills — copy the crail-ui skills into this project's .claude/skills/
   so coding agents auto-discover them. Idempotent; re-run after upgrading crail-ui. */
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgSkills = join(dirname(fileURLToPath(import.meta.url)), "..", "skills");
const dest = join(process.cwd(), ".claude", "skills");

if (!existsSync(pkgSkills)) {
  console.error("crail-skills: no skills directory found in the crail-ui package.");
  process.exit(1);
}

mkdirSync(dest, { recursive: true });
const names = readdirSync(pkgSkills);
for (const name of names) {
  cpSync(join(pkgSkills, name), join(dest, name), { recursive: true });
}

console.log(`crail-skills: installed ${names.join(", ")} → ${join(".claude", "skills")}/`);
console.log("Your agent will discover them automatically in this project.");
console.log("Start with crail-apps/SKILL.md — the laws of building MCP apps that survive real hosts.");
