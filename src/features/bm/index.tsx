/**
 * Bài mới entry point (bm.js `openBM`): opens the room dialog in "wb"
 * (whiteboard) variant with the 6-step wizard. Falls back to the lesson
 * list when today has no words.
 */
import { useUi } from "@/stores/ui";
import { me, keys, setTarget } from "@/game/engine/state";
import { getCurLevel, todayWords } from "@/lib/curriculum";
import { NH_LESSONS } from "@/data/nh-lessons";
import { callHook, registerHook } from "@/services/hooks";
import { ls } from "@/lib/storage";
import { BmLesson } from "./BmLesson";
import { bmToday } from "./model";

export function openBm(lv?: number): void {
  const l = lv || me.cl || getCurLevel();
  const words = bmToday(l);
  if (!words.length) {
    callHook("openLessonList");
    return;
  }
  // bm.js bm.seen — parsed at open; vestigial (nothing in bm.js reads it back).
  void new Set(ls.getJSON<string[]>("nh:strokes", []));
  const t = todayWords(l);
  const L0 = NH_LESSONS.find((x) => x.w.some((y) => y[0] === words[0].zh));
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({
    mark: "课",
    title: `Bài học hôm nay – HSK ${l}` + (t.done ? "" : `, ngày ${t.day}`),
    sub: (L0 ? `Từ của Bài ${L0.n}: ${L0.vi} – ` : "") + words.map((x) => x.zh).join(" – ") + " – mỗi từ 6 bước",
    variant: "wb",
    body: (
      <BmLesson
        lv={l}
        words={words}
        onRestart={() => openBm(l)}
        onShowList={() => callHook("openLessonList")}
      />
    ),
  });
}

export function registerBmHooks(): void {
  registerHook("openBM", (lv) => openBm(lv as number | undefined));
}
