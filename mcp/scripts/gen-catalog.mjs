/* Generate catalog.json from the kit's compiled .d.ts files.
   The catalog powers list_components / get_component, so docs can never
   drift from the kit: they ARE the kit's types. Run after the root
   `npm run build:lib`. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(here, "../../dist");

const GROUPS = [
  ["primitives", "Primitives — buttons, inputs, badges, structure"],
  ["widgets", "Tool widgets — stats, charts, tables, cards, approval"],
  ["layout", "Layout — disclosure, sheets, split views, fullscreen"],
  ["chat", "Chat chrome — messages, tool blocks, code"],
  ["icons", "Icons — one Icon component + ICON_NAMES"],
];

const SKIP = new Set(["ModalExample"]);

const catalog = [];

for (const [file, groupLabel] of GROUPS) {
  const dts = path.join(distDir, `${file}.d.ts`);
  if (!existsSync(dts)) {
    console.error(`missing ${dts} — run \`npm run build:lib\` in the repo root first`);
    process.exit(1);
  }
  const content = readFileSync(dts, "utf8");

  // export declare function Name(...): ...;
  for (const match of content.matchAll(
    /export declare function (\w+)([\s\S]*?;)(?=\r?\n(?:export|declare|import|$))/g,
  )) {
    const [, name, rest] = match;
    if (SKIP.has(name)) continue;
    catalog.push({
      name,
      group: file,
      groupLabel,
      kind: "component",
      signature: `function ${name}${rest.trim()}`,
    });
  }

  // export declare const Name: ...;
  for (const match of content.matchAll(
    /export declare const (\w+):([\s\S]*?;)(?=\r?\n(?:export|declare|import|$))/g,
  )) {
    const [, name, rest] = match;
    if (SKIP.has(name)) continue;
    catalog.push({
      name,
      group: file,
      groupLabel,
      kind: rest.includes("=>") || rest.includes("ReactElement") || rest.includes("JSX") ? "component" : "value",
      signature: `const ${name}:${rest.trim()}`,
    });
  }
}

const out = path.join(here, "../catalog.json");
writeFileSync(out, JSON.stringify({ generatedFrom: "crail-ui dist/*.d.ts", entries: catalog }, null, 2));
console.log(`catalog.json: ${catalog.length} entries`);
