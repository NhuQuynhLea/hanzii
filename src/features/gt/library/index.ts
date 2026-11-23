/**
 * GT library floor (tầng 2 thư viện) — port of game/js/gt/lib.js.
 *
 * Hooks registered (called by engine/navigation.ts and other features):
 *   libTableLabel(i)  → shelf table caption            → LIB_TABLE[i]
 *   libShelfLabel(i)  → shelf caption                  → LIB_SHELF[i]
 *   libTable(i)       → reading-table action           → review/tones/write
 *   openLibShelf(i)   → shelf dialog                   → my-words/books/docs
 *   libToneVars(py)   → 4 tone variants (duo.js/cdq.js consumers)
 *   thuToast()        → enter toast with sai-word count
 *   libEnd(info?)     → end-of-review summary (called by duo feature)
 *   libScene/libTones/libReview/libMyWords/libDocs/libTable → also callable
 *   wmSeen/wmHit/wmBuckets → delegate to the useWm store
 *
 * Cross-feature calls used here (registered by other modules):
 *   duoRun(D,title,sub) · duoStart(n) · duoSession() · openGTLesson(n,step)
 *   openGTLib(lv) · openLesson() · gtClassLesson(lv) · gtConfetti()
 *   fbLine(src) → ReactNode · openBuy()
 */
import { registerHook } from "@/services/hooks";
import { useWm } from "@/stores/wm";
import { LIB_SHELF, LIB_TABLE, libToneVars, type LibEndInfo } from "./data";
import { libScene, libTones, libReview, libTable, libWrite, thuToast } from "./flow";
import { libMyWords, libBooks, libDocs, openLibShelf, libEnd } from "./open";

export { LIB_SHELF, LIB_TABLE, LIB_TM, LIB_DOCS, libToneVars, libU, libDownload, gtDict, gtTok } from "./data";
export { libWords, libReview, libLessons, libScene, libTones, libWrite, libTable, duoRun, thuToast } from "./flow";
export { libMyWords, libBooks, libDocs, openLibShelf, libEnd } from "./open";
export type { DuoSpec, DuoEx, LibEndInfo } from "./data";

let registered = false;

export function registerGtLibraryHooks(): void {
  if (registered) return;
  registered = true;

  /* engine (roomZone/roomAction, enterRoomScene) */
  registerHook("libTableLabel", (i) => LIB_TABLE[Number(i)] || "");
  registerHook("libShelfLabel", (i) => LIB_SHELF[Number(i)] || "");
  registerHook("libTable", (i) => {
    libTable(Number(i));
    return true;
  });
  registerHook("openLibShelf", (i) => {
    openLibShelf(Number(i));
    return true;
  });
  registerHook("thuToast", () => thuToast());

  /* called by duo.js / cdq.js ports */
  registerHook("libToneVars", (py) => libToneVars(String(py)) || null);
  registerHook("libEnd", (info) => {
    libEnd(info as LibEndInfo | undefined);
    return true;
  });
  registerHook("wmSeen", (zs) => useWm.getState().seen(zs as string[]));
  registerHook("wmHit", (zs, ok) => useWm.getState().hit(zs as string[], !!ok));
  registerHook("wmBuckets", () => useWm.getState().buckets());

  /* direct feature entry points */
  registerHook("libScene", () => {
    libScene();
    return true;
  });
  registerHook("libTones", () => {
    libTones();
    return true;
  });
  registerHook("libReview", (zs, title, kind) => {
    libReview(zs as string[], String(title), kind as string | undefined);
    return true;
  });
  registerHook("libMyWords", () => {
    libMyWords();
    return true;
  });
  registerHook("libBooks", (lv) => {
    libBooks(Number(lv) || 1);
    return true;
  });
  registerHook("libDocs", () => {
    libDocs();
    return true;
  });
  registerHook("libWrite", () => {
    libWrite();
    return true;
  });
}
