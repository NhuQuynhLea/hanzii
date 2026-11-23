/**
 * duo feature (duo.js) — hook registrations.
 *
 *   duoRun(n, b, {skip})     challenge entry — opens the Thử thách session
 *                            (missions feature's "duoStart" wrapper forwards
 *                            here with {skip:true} after its mission check)
 *   duoRun(D, title, sub)    review session — same UI, custom exercise list
 *                            (lib.js callers in features/gt/library)
 *   duoSession()             current/last session info (libEnd fallback)
 *   duoReset()               clear the session (missions.js `duo = null`)
 */
import { registerHook } from "@/services/hooks";
import {
  duoStart,
  duoRun,
  getDuoSession,
  setDuoSession,
  type DuoInit,
} from "./engine";

let registered = false;

export function registerDuoHooks(): void {
  if (registered) return;
  registered = true;

  registerHook("duoRun", (a, b, c) => {
    if (typeof a === "number") {
      /* (n, b, {skip}) — challenge for lesson n, buổi b (0 → current). */
      duoStart(a, Number(b) || 0, !!(c && (c as { skip?: boolean }).skip));
      return true;
    }
    /* (D, title, sub) — review session built by the library feature. */
    duoRun(a as DuoInit, String(b ?? ""), c as string | undefined);
    return true;
  });
  registerHook("duoSession", () => getDuoSession());
  registerHook("duoReset", () => setDuoSession(null));
}
