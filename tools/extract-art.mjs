// Extract SVG avatar templates + inline art strings from the live page -> TS module.
// Run: node tools/extract-art.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = path.join(root, "web", "src", "game", "entities");
fs.mkdirSync(OUT, { recursive: true });

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  fs.readFile(path.join(root, "game", p === "/" ? "index.html" : p), (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream" });
    res.end(data);
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;

let browser = null;
for (const opt of [{ channel: "msedge" }, { channel: "chrome" }, {}]) {
  try {
    browser = await chromium.launch({ headless: true, ...opt });
    break;
  } catch {}
}
const page = await browser.newPage();
await page.goto(url, { waitUntil: "load" });
await page.waitForFunction(() => typeof AV_TPL !== "undefined", null, { timeout: 30000 });

const data = await page.evaluate(() => ({
  AV_TPL,
  AV_TPL_SIDE,
  TCH_TPL,
  MAI_IMG: typeof MAI_IMG !== "undefined" ? MAI_IMG : null,
}));

await browser.close();
server.close();

const ts = `/** Avatar/NPC SVG templates — extracted verbatim from avatar.js + scene-lib.js.
 *  Templates use {{token}} placeholders; see avatar-svg.ts render code. */
export const AV_TPL = ${JSON.stringify(data.AV_TPL)};
export const AV_TPL_SIDE = ${JSON.stringify(data.AV_TPL_SIDE)};
export const TCH_TPL = ${JSON.stringify(data.TCH_TPL)};
export const MAI_IMG = ${JSON.stringify(data.MAI_IMG)};
`;
fs.writeFileSync(path.join(OUT, "avatar-art.ts"), ts, "utf8");
console.log("wrote avatar-art.ts", ts.length, "bytes; TCH_TPL is", Array.isArray(data.TCH_TPL) ? "array" : typeof data.TCH_TPL);
