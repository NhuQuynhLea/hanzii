/**
 * Social feature — port of community.js + gt/cdq.js + roleplay.js + gt/fb.js.
 * Import for side effects: registers all hooks consumed by Board, navigation,
 * presence runtime, award multiplier and painters.
 */
import type { ReactNode } from "react";
import { registerHook, onHook } from "@/services/hooks";
import { me } from "@/game/engine/state";
import { usePlayer } from "@/stores/player";
import { lvOf } from "@/game/entities/avatar-svg";
import type { PlayerState } from "@/types/player";
import type { Word } from "@/types/lesson";

import {
  commSync, commAbsorb, studyHour, classMates, gpCode, newbieTok, cuidNow,
} from "./community";
import { WeekBoard, GroupPanel, cdBoard, cdOpenTable, GreetHost } from "./community-ui";
import { drawCDTables2, drawCDTables, cdItem, drawComm } from "./painters";
import { cdTableLabel, cdSit, cdPickGame, cdPlay, cdqAnswer, cdqLoop, cdqFinish, PlayerStrip, CdqStage } from "./cdq";
import {
  cdqGet, cdqSet, cdqRand, cdqPool, cdqShuf, cdqBuild, cdqDur, cdqHumans,
  cdqActiveAt, cdqAt, cdqSend, cdqLeave, cdqBotScore, cdqPlayers,
  type CdqPlayerRow,
} from "./cdq-core";
import { openRoleplay } from "./roleplay";
import { fbOpen, fbNudge, fbSeen, fbLine, fbStat, fbProgress, fbText, fbGo, FbNudgeHost } from "./fb";

/* ---------- community ---------- */
registerHook("studyHour", () => studyHour());
registerHook("classMates", () => classMates());
registerHook("weekBoard", () => <WeekBoard /> as ReactNode);
registerHook("gpRender", () => <GroupPanel /> as ReactNode);
registerHook("cdBoard", () => cdBoard());
registerHook("cdOpenTable", (i) => cdOpenTable(Number(i)));
registerHook("gpCode", () => gpCode());
registerHook("newbieTok", () => newbieTok());
registerHook("cuid", () => cuidNow());
onHook("commSync", () => commSync());
onHook("commAbsorb", (o, pr) => commAbsorb(o as PlayerState, pr as Record<string, unknown>));

/* ---------- cdq ---------- */
registerHook("cdTableLabel", (i) => cdTableLabel(Number(i)));
registerHook("cdSit", (i) => cdSit(Number(i)));
registerHook("cdPickGame", (i, gm) => cdPickGame(Number(i), String(gm || "")));
registerHook("cdPlay", (i, fresh, g, gm) => cdPlay(Number(i), !!fresh, String(g || "do"), String(gm || "")));
registerHook("cdqRand", (s) => cdqRand(Number(s)));
registerHook("cdqPool", () => cdqPool() as Word[]);
registerHook("cdqShuf", (a, R) => cdqShuf(a as unknown[], R as () => number));
registerHook("cdqBuild", (s, g) => cdqBuild(Number(s), String(g || "do")));
registerHook("cdqDur", (g) => cdqDur(String(g || "do")));
registerHook("cdqHumans", () => cdqHumans());
registerHook("cdqActiveAt", (i) => cdqActiveAt(Number(i)));
registerHook("cdqAt", (i) => cdqAt(Number(i)));
registerHook("cdqSend", () => cdqSend());
registerHook("cdqLeave", () => cdqLeave());
registerHook("cdqBotScore", (b, j, a) => cdqBotScore(b as never, Number(j), a as { at: number; ok: boolean }));
registerHook("cdqPlayers", () => cdqPlayers(lvOf, me.h || 0, me.n, usePlayer.getState().points));
registerHook("cdqGet", () => cdqGet());
registerHook("cdqSet", (v) => cdqSet(v as never));
registerHook("cdqAnswer", (k, ok, bonus) => cdqAnswer(Number(k), !!ok, Number(bonus) || 0));
registerHook("cdqLoop", () => cdqLoop());
registerHook("cdqEnd", () => cdqFinish());
registerHook("cdqPaintPlayers", (rows) => (<PlayerStrip rows={rows as never} />) as ReactNode);
registerHook("cdqRender", (k) => (<CdqStage k={Number(k)} />) as ReactNode);

/* ---------- painters ---------- */
registerHook("cdItem", (ctx, k, x, y) => cdItem(ctx as CanvasRenderingContext2D, Number(k), Number(x), Number(y)));
registerHook("drawCDTables2", (ctx, now) => drawCDTables2(ctx as CanvasRenderingContext2D, Number(now)));
registerHook("drawClub", (ctx, now) => drawCDTables2(ctx as CanvasRenderingContext2D, Number(now)));
registerHook("drawCDTables", (ctx, now) => drawCDTables(ctx as CanvasRenderingContext2D, Number(now)));
registerHook("drawComm", (ctx, now) => drawComm(ctx as CanvasRenderingContext2D, Number(now)));

/* ---------- roleplay ---------- */
registerHook("openRoleplay", () => openRoleplay());

/* ---------- fanpage ---------- */
registerHook("fbOpen", (src) => fbOpen(src as string | undefined));
registerHook("fbNudge", (key, msg) => fbNudge(String(key), String(msg)));
registerHook("fbSeen", () => fbSeen());
registerHook("fbLine", (src) => fbLine(String(src || "")));
registerHook("fbStat", (k, f) => fbStat(String(k), String(f)));
registerHook("fbProgress", () => fbProgress());
registerHook("fbText", (kind, src) => fbText(String(kind), String(src)));
registerHook("fbGo", (kind, src) => fbGo(String(kind), String(src)));

/* ---------- mounted hosts (greet card + fb nudge) ---------- */
export function SocialHosts() {
  return (
    <>
      <GreetHost />
      <FbNudgeHost />
    </>
  );
}

export type { CdqPlayerRow };
