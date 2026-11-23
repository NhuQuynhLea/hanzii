const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto("http://127.0.0.1:5174/", { waitUntil: "networkidle" });
  await page.fill("#nick", "Test Bot");
  await page.click("button[type=submit]");
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")].filter((i) => i.src.startsWith("data:image/svg"));
    return imgs.map((i) => {
      const cs = getComputedStyle(i);
      const spr = i.parentElement;
      return {
        cw: cs.width, ch: cs.height, cl: cs.left, ct: cs.top,
        nw: i.naturalWidth, nh: i.naturalHeight,
        sprT: spr.style.transform, sprD: cs.display,
        srcLen: i.src.length, srcHead: i.src.slice(0, 120),
      };
    });
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
})();
