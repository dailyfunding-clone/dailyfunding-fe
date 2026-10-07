import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scale, semantic } from "../src/tokens.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const kebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const cssValue = (group, value) =>
  group === "fontWeight" || group === "color" ? value : `${value}px`;

const lines = [":root {"];
for (const [group, values] of Object.entries(scale)) {
  for (const [name, value] of Object.entries(values)) {
    lines.push(`  --scale-${kebab(group)}-${kebab(name)}: ${cssValue(group, value)};`);
  }
}
for (const [group, values] of Object.entries(semantic)) {
  for (const [name, scaleKey] of Object.entries(values)) {
    lines.push(
      `  --semantic-${kebab(group)}-${kebab(name)}: var(--scale-${kebab(group)}-${kebab(scaleKey)});`,
    );
  }
}
lines.push("}", "");

const all = { scale, semantic };
mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "tokens.css"), lines.join("\n"));
writeFileSync(join(root, "dist", "tokens.json"), JSON.stringify(all, null, 2));
console.log("generated dist/tokens.css + dist/tokens.json");
