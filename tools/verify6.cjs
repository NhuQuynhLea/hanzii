const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1200, height: 800 } });
  const errs = [];
  pg.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 300)); });
  pg.on("pageerror", (e) => errs.push("PAGE:" + e.message.slice(0, 300)));
  await pg.goto("http://127.0.0.1:5174/");
  await pg.waitForTimeout(2000);
  await pg.fill("#nick", "Tester");
  await pg.click("button[type=submit]");
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: "_analysis/d0-campus.png" });

  const openDlg = async (hook, arg, shot, wait = 900) => {
    await pg.evaluate(([h, a]) => window.__hook(h, a), [hook, arg]);
    await pg.waitForTimeout(wait);
    await pg.screenshot({ path: `_analysis/${shot}` });
    const open = await pg.evaluate(() => !!document.querySelector("[role=dialog]"));
    if (!open) errs.push(`${hook}: dialog not open`);
    await pg.keyboard.press("Escape");
    await pg.waitForTimeout(350);
  };

  await openDlg("openRoom", "thu", "d1-library.png", 1200);
  await openDlg("openLesson", null, "d2-lessons.png");
  await openDlg("openBoard", null, "d3-board.png");
  await openDlg("openProgress", null, "d4-progress.png");
  await openDlg("openLotus", null, "d5-lotus.png");
  await openDlg("openAI", null, "d6-ai.png");
  await openDlg("openRoom", "tuvan", "d7-tuvan.png");
  await openDlg("openGame", "g1", "d8-game-match.png");
  await openDlg("openGame", "g2", "d9-game-build.png");
  await openDlg("openGame", "g4", "d10-game-tone.png");

  // tab interactions: library cards tab + lesson GT tab
  await pg.evaluate(() => window.__hook("openRoom", "thu"));
  await pg.waitForTimeout(800);
  await pg.click("button:has-text('Thẻ từ')");
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: "_analysis/d11-cards.png" });
  await pg.click("[role=dialog] div[role=button]");
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: "_analysis/d12-card-flip.png" });
  await pg.keyboard.press("Escape");
  await pg.waitForTimeout(300);

  console.log("ERRORS:", errs.length ? errs.join("\n") : "none");
  await b.close();
})();
