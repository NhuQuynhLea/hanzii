const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERR: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("404")) errors.push("CONSOLE: " + m.text()); });
  await page.goto("http://127.0.0.1:5174/", { waitUntil: "networkidle" });
  await page.fill("#nick", "Test Bot");
  await page.click("button[type=submit]");
  await page.waitForTimeout(1200);
  // route around plaza: left → up → right → up into class door
  await page.keyboard.down("ArrowLeft"); await page.waitForTimeout(1600); await page.keyboard.up("ArrowLeft");
  await page.keyboard.down("ArrowUp"); await page.waitForTimeout(2600); await page.keyboard.up("ArrowUp");
  await page.keyboard.down("ArrowRight"); await page.waitForTimeout(1100); await page.keyboard.up("ArrowRight");
  await page.keyboard.down("ArrowUp"); await page.waitForTimeout(800); await page.keyboard.up("ArrowUp");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "D:/Project/Hanzii_web/_analysis/shot-class.png" });
  // sit at a seat — walk right/up into seat zone
  await page.keyboard.down("ArrowRight"); await page.waitForTimeout(800); await page.keyboard.up("ArrowRight");
  await page.keyboard.down("ArrowUp"); await page.waitForTimeout(600); await page.keyboard.up("ArrowUp");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "D:/Project/Hanzii_web/_analysis/shot-class2.png" });
  console.log(errors.length ? errors.slice(0, 10).join("\n") : "no errors");
  await browser.close();
})();
