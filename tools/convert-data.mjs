// One-off data conversion: vanilla JS global data files -> TS modules.
// Run: node tools/convert-data.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC = path.join(root, "game", "js");
const OUT = path.join(root, "web", "src", "data");
fs.mkdirSync(OUT, { recursive: true });

function write(name, code) {
  fs.writeFileSync(path.join(OUT, name), code, "utf8");
  console.log("wrote", name, code.length, "bytes");
}

/* ---------- data/lessons.js -> nh-lessons.ts ---------- */
{
  let t = fs.readFileSync(path.join(SRC, "data", "lessons.js"), "utf8").trim();
  t = t.replace(/^window\.NH_LESSONS\s*=/, "export const NH_LESSONS: NhLesson[] =");
  const hdr = `import type { NhLesson } from "@/types/lesson";\n\n`;
  write("nh-lessons.ts", hdr + t + "\n");
}

/* ---------- data/bm.js -> bm-data.ts ---------- */
{
  let t = fs.readFileSync(path.join(SRC, "data", "bm.js"), "utf8").trim();
  t = t.replace(/^const BM\s*=/, "export const BM: BmData =");
  // strip trailing comment-only tail after the object
  const hdr = `import type { BmData } from "@/types/lesson";\n\n`;
  write("bm-data.ts", hdr + t + "\n");
}

/* ---------- gt/gt-data.js -> gt-data.ts ---------- */
{
  let t = fs.readFileSync(path.join(SRC, "gt", "gt-data.js"), "utf8");
  t = t.replace(/^const GT_STAGES=/m, "export const GT_STAGES: GtStage[] =");
  t = t.replace(/^function gtLabel\(i\)/m, "export function gtLabel(i: number)");
  t = t.replace(/^const GT_LESSONS=/m, "export const GT_LESSONS: Record<number, GtLesson> =");
  t = t.replace(/^const GT_TITLES=/m, "export const GT_TITLES: Record<number, [string, string, string?]> =");
  t = t.replace(/^const GT_STEPS=/m, "export const GT_STEPS: [string, string][] =");
  const hdr = `import type { GtStage, GtLesson } from "@/types/gt";\n\n`;
  write("gt-data.ts", hdr + t + "\n");
}

/* ---------- js/curriculum.js LEVELS/GRAMMAR -> curriculum.ts ---------- */
{
  const t = fs.readFileSync(path.join(SRC, "curriculum.js"), "utf8");
  const lv = /const LEVELS = (\{[^\n]*?\});/.exec(t)[1];
  const gr = /const GRAMMAR = (\{[\s\S]*?\n\};)/.exec(t)[1].replace(/;$/, "");
  const code = `import type { Word, GrammarTopic } from "@/types/lesson";

export const LEVELS: Record<number, Word[]> = ${lv};
export const PER_DAY = 5;
export const GRAMMAR: Record<number, GrammarTopic[]> = ${gr};
`;
  write("curriculum.ts", code);
}
console.log("done");
