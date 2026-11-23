const { chromium } = require("playwright");
(async () => {
  let browser;
  for (const opt of [{ channel: "msedge" }, { channel: "chrome" }, {}]) {
    try { browser = await chromium.launch({ headless: true, ...opt }); break; } catch { /* try next channel */ }
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERR: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });
  await page.goto("http://127.0.0.1:5174/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "D:/Project/Hanzii_web/_analysis/shot-gate.png" });
  // join
  await page.fill("#nick", "Test Bot");
  await page.click("button[type=submit]");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "D:/Project/Hanzii_web/_analysis/shot-world.png" });
  // walk up a bit
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(1500);
  await page.keyboard.up("ArrowUp");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "D:/Project/Hanzii_web/_analysis/shot-walk.png" });
  console.log(errors.length ? errors.slice(0, 10).join("\n") : "no errors");
  await browser.close();
})();
