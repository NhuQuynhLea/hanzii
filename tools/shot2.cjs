const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERR: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });
  await page.goto("http://127.0.0.1:5174/", { waitUntil: "networkidle" });
  await page.fill("#nick", "Test Bot");
  await page.click("button[type=submit]");
  await page.waitForTimeout(1500);
  // walk left to open grass
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(900);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(700);
  await page.keyboard.up("ArrowUp");
  await page.waitForTimeout(400);
  // inspect avatar DOM state
  const info = await page.evaluate(() => {
    const avatars = [...document.querySelectorAll("img")].filter((i) => i.src.startsWith("data:image/svg"));
    const av = avatars.map((i) => {
      const spr = i.parentElement;
      const root = spr.parentElement;
      const r = i.getBoundingClientRect();
      return {
        visible: getComputedStyle(spr).display, transform: root.style.transform,
        x: Math.round(r.x), y: Math.round(r.y), w: r.width, h: r.height,
      };
    });
    return av;
  });
  console.log(JSON.stringify(info, null, 1));
  // zoom screenshot around player
  await page.screenshot({ path: "D:/Project/Hanzii_web/_analysis/shot-avatar.png", clip: { x: 500, y: 300, width: 500, height: 350 } });
  console.log(errors.length ? errors.slice(0, 10).join("\n") : "no errors");
  await browser.close();
})();
