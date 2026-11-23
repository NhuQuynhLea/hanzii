// Bake the procedural canvas art to static PNGs using headless Edge/Chrome.
// Run: node tools/bake-assets.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = path.join(root, "web", "public", "assets");
fs.mkdirSync(OUT, { recursive: true });

// Serve game/ over http so canvas isn't tainted by file:// image loads.
import http from "node:http";

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const f = path.join(root, "game", p === "/" ? "index.html" : p);
  fs.readFile(f, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
    res.end(data);
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const url = `http://127.0.0.1:${port}/index.html`;

const launchOpts = [
  { channel: "msedge" },
  { channel: "chrome" },
  { executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" },
  {},
];

let browser = null;
let lastErr = null;
for (const opt of launchOpts) {
  try {
    browser = await chromium.launch({ headless: true, ...opt });
    break;
  } catch (e) {
    lastErr = e;
  }
}
if (!browser) throw lastErr;

const page = await browser.newPage();
page.on("console", (m) => {
  if (m.type() === "error") console.log("[page]", m.text());
});
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(url, { waitUntil: "load" });

// wait for the boot sequence (loop.js): fonts + LOGO decode -> buildMap/buildClass/...
await page.waitForFunction(
  () =>
    typeof map !== "undefined" &&
    typeof cmap !== "undefined" &&
    typeof pmap !== "undefined" &&
    typeof rmaps !== "undefined" &&
    rmaps.thu &&
    rmaps.tuvan &&
    rmaps.cd,
  null,
  { timeout: 30000 },
);
await page.waitForTimeout(800);

async function grab(expr, name) {
  const data = await page.evaluate((e) => {
    const c = new Function("return (" + e + ")")();
    return c && c.toDataURL ? c.toDataURL("image/png") : null;
  }, expr);
  if (!data) {
    console.log("MISS", name);
    return;
  }
  const buf = Buffer.from(data.split(",")[1], "base64");
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log("wrote", name, buf.length, "bytes");
}

await grab("map", "map.png");
await grab("cmap", "room-lop.png");
await grab("pmap", "room-am.png");
await grab("rmaps.thu", "room-thu.png");
await grab("rmaps.tuvan", "room-tuvan.png");
await grab("rmaps.cd", "room-cd.png");

await browser.close();
server.close();
console.log("done");
