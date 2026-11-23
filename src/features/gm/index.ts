/**
 * gm feature — hook registrations (import for side effects).
 * Replaces gm.js's top-level DOM wiring: the streak button lives in BrandBar
 * (`<GmButton/>`), dialogs open through the room dialog, and cross-feature
 * callers reach everything here through the hook registry.
 */
import { registerHook, onHook } from "@/services/hooks";
import { sfx, gmSfxOn } from "@/services/sfx";
import { me } from "@/game/engine/state";
import { useGm } from "@/stores/gm";
import { useUi } from "@/stores/ui";
import {
  gmTitle,
  gmXu,
  gmStreak,
  gmToday,
  gmAc,
  gmGoalHit,
  gmLevelUp,
  gmPaint,
  gmPop,
  gmComboHit,
  gmCards,
  gmCardSave,
  gmCardSeen,
  gmCardOwn,
  gmSetCheck,
  gmPool,
  gmGates,
  gmGateOf,
  gmGatePassed,
  gmGateReady,
  gmGateOpenList,
  gmGateName,
  gtClassLesson,
  openGTClass,
  getGtOnly,
  setGtOnly,
  cbLesson,
  cbMap,
} from "./state";
import { gmDrawAc, gmTagColor, gmHat, gmGlass, gmPet, gmPreview } from "./draw";
import { openGM } from "./panel/GmPanel";
import { openChest } from "./panel/Chest";
import { openBlitz } from "./panel/Blitz";
import { openGate } from "./panel/Gate";

export { GmButton } from "./panel/GmButton";
export { openGM, openGate, openBlitz, openChest };

/* --- avatar accessories --- */
registerHook("gmDrawAc", (ctx, o, isMe, now, x, eyeY, petY, back, k) =>
  gmDrawAc(ctx as CanvasRenderingContext2D, o as never, !!isMe, now as number, x as number, eyeY as number, petY as number, !!back, k as number | undefined),
);
registerHook("gmTagColor", (o, isMe) => gmTagColor(o as never, !!isMe));

/* --- sound + pop (gm.js globals) --- */
registerHook("gmSfxOn", () => gmSfxOn());
registerHook("sfx", (kind) => sfx(kind as "ok" | "bad" | "combo" | "win"));
registerHook("gmPop", (elm) => gmPop(elm as HTMLElement | null));

/* --- state accessors other features call --- */
registerHook("gmTitle", (lv) => gmTitle(Number(lv) || 0));
registerHook("gmXu", () => gmXu());
registerHook("gmStreak", () => gmStreak());
registerHook("gmToday", () => gmToday());
registerHook("gmAc", () => gmAc());
registerHook("gmGoalHit", () => gmGoalHit());
registerHook("gmComboHit", (ok, box, n, qi) => gmComboHit(!!ok, box as HTMLElement | null, n as number | string, qi as number));
registerHook("gmCards", () => gmCards());
registerHook("gmCardSave", (c) => gmCardSave(c as never));
registerHook("gmCardSeen", (zh) => gmCardSeen(String(zh)));
registerHook("gmCardOwn", (zh) => gmCardOwn(String(zh)));
registerHook("gmSetCheck", () => gmSetCheck());
registerHook("gmPool", () => gmPool());
registerHook("gmChest", (n) => openChest(Number(n)));

/* --- cổng thử thách --- */
registerHook("gmGates", () => gmGates());
registerHook("gmGateOf", (i) => gmGateOf(Number(i)));
registerHook("gmGatePassed", (g) => gmGatePassed(Number(g)));
registerHook("gmGateReady", (g) => gmGateReady(Number(g)));
registerHook("gmGateOpenList", () => gmGateOpenList());
registerHook("gmGateName", (g) => gmGateName(Number(g)));
registerHook("openGate", (g) => openGate(Number(g)));

/* --- dialogs --- */
registerHook("openGM", (tab) => openGM(tab as string | undefined));
registerHook("gmBlitz", () => openBlitz());

/* --- giảng đường routing --- */
registerHook("gtClassLesson", (lv) => gtClassLesson(Number(lv)));
registerHook("openGTClass", (lv) => openGTClass(Number(lv)));
registerHook("gtOnly", () => getGtOnly());
registerHook("cbLesson", () => cbLesson());
registerHook("cbMap", () => cbMap());

/* --- accessory painters for shop previews elsewhere --- */
registerHook("gmPreview", (cv, slot, id) => gmPreview(cv as HTMLCanvasElement, slot as never, Number(id)));
registerHook("gmHat", (c, id, x, y, s) => gmHat(c as CanvasRenderingContext2D, Number(id), Number(x), Number(y), Number(s)));
registerHook("gmGlass", (c, id, x, y, s) => gmGlass(c as CanvasRenderingContext2D, Number(id), Number(x), Number(y), Number(s)));
registerHook("gmPet", (c, id, x, y, s, now) => gmPet(c as CanvasRenderingContext2D, Number(id), Number(x), Number(y), Number(s), Number(now)));

/* --- listeners --- */
onHook("levelUp", (lv, rewards) => gmLevelUp(Number(lv), (rewards as string[]) || []));
onHook("gmPaint", () => gmPaint());

/* --- gm.js top-level init: `gmPaint(); me.ac=gmAc();` + dlg close resets gtOnly --- */
me.ac = useGm.getState().ac();
let roomWasOpen = useUi.getState().room.open;
useUi.subscribe((s) => {
  if (roomWasOpen && !s.room.open) setGtOnly(0);
  roomWasOpen = s.room.open;
});
