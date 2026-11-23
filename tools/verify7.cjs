const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 820 } });
  const errs = [];
  pg.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 300)); });
  pg.on("pageerror", (e) => errs.push("PAGE:" + e.message.slice(0, 300)));
  await pg.goto("http://127.0.0.1:5174/");
  await pg.waitForTimeout(2500);
  await pg.fill("#nick", "Tester");
  await pg.click("button[type=submit]");
  await pg.waitForTimeout(2000);
  await pg.screenshot({ path: "_analysis/e0-campus.png" });

  const snap = async (shot, wait = 900) => {
    await pg.waitForTimeout(wait);
    await pg.screenshot({ path: `_analysis/${shot}` });
    const open = await pg.evaluate(() => !!document.querySelector("[role=dialog]"));
    return open;
  };
  const close = async () => { await pg.keyboard.press("Escape"); await pg.waitForTimeout(350); };

  // GT lesson list (Giao tiếp tab → roadmap)
  await pg.evaluate(() => window.__hook("openLesson"));
  await snap("e1-openlesson.png", 1200);
  const gtTab = await pg.evaluate(() => window.__hook("renderGTNode") ? "hook-ok" : "no-hook");
  console.log("renderGTNode hook:", gtTab);
  await pg.click("button:has-text('Giao tiếp')").catch(() => {});
  await snap("e2-gt-roadmap.png", 1200);
  // open a GT lesson
  await pg.evaluate(() => !!window.__hook("gtOpenLesson", 1));
  await snap("e3-gt-lesson.png", 1500);
  await close(); await close();

  // class sheet
  await pg.evaluate(() => window.__hook("openGTClass", 1));
  await snap("e4-gtclass.png", 1200);
  await close();

  // library GT shelves
  await pg.evaluate(() => window.__hook("openGTLib", 1));
  await snap("e5-gtlib.png", 1000);
  await close();

  // pron dialog + trainer
  await pg.evaluate(() => window.__hook("openPron"));
  await snap("e6-pron.png", 1200);
  await close();
  await pg.evaluate(() => window.__hook("openTrainer", "level", 1));
  await snap("e7-trainer.png", 1500);
  await close();

  // missions
  await pg.evaluate(() => window.__hook("msStart"));
  await snap("e8-mission.png", 1200);
  await close();

  // gm panel + gate + blitz
  await pg.evaluate(() => window.__hook("openGM"));
  await snap("e9-gm.png", 1000);
  await close();

  // duo run for lesson 1 buổi 1
  await pg.evaluate(() => window.__hook("duoRun", 1, 1, { skip: false }));
  await snap("e10-duo.png", 1200);
  await close();

  // nv chat + review
  await pg.evaluate(() => window.__hook("nvOpenChat"));
  await snap("e11-nvchat.png", 1000);
  await close();
  await pg.evaluate(() => window.__hook("nvOpenReview"));
  await snap("e12-nvreview.png", 1000);
  await close();

  // roleplay
  await pg.evaluate(() => window.__hook("openRoleplay"));
  await snap("e13-roleplay.png", 1200);
  await close();

  // bm wizard
  await pg.evaluate(() => window.__hook("openBM", 1));
  await snap("e14-bm.png", 1500);
  await close();

  // quest widget + gm button presence
  const hud = await pg.evaluate(() => ({
    quest: !!document.querySelector("[class*='quest'],#quest"),
    gmBtn: document.body.innerText.includes("🔥"),
  }));
  console.log("HUD:", JSON.stringify(hud));
  console.log("ERRORS:", errs.length ? errs.join("\n---\n") : "none");
  await b.close();
})();
