/**
 * Thách đấu (td.js duel section): đấu trực tiếp 1-1 (mã phòng, mời bạn online,
 * bot) và mã vượt điểm. The original drove the minigames by setting a global
 * `TDG` then re-invoking the game inside the shared <dialog>; here the game
 * components live in features/games and cooperate through hooks:
 *   "tdPanel"(id,lv)  — open the duel panel (Games.tsx ⚔ button)
 *   "tdProg"(k,ok)    — progress ping from inside a running game
 *   "tdActive"()      — a duel game is mounted (bigger pool)
 *   "tdDone"(id,score,total) — game finished; resolves TDG.onDone like the
 *                              original `gameDone` TDG branch
 *   "tdAbsorb"(o,pr)  — called by community.commAbsorb per peer update
 * and `onHook("commAbsorb")` as a fallback when the social feature is absent.
 */
import { createElement, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { GAMES } from "@/data/games-data";
import { getCurLevel } from "@/lib/curriculum";
import { dstr, seededRand } from "@/lib/helpers";
import { ls } from "@/lib/storage";
import { keys, me, setTarget } from "@/game/engine/state";
import { usePlayer } from "@/stores/player";
import { usePresence } from "@/stores/presence";
import { useUi, toast } from "@/stores/ui";
import { callHook, onHook, registerHook } from "@/services/hooks";
import { sendPresence } from "@/services/presence/runtime";
import { sfx } from "@/services/sfx";
import type { PlayerState } from "@/types/player";
import {
  TD_BOTS,
  TD_G,
  bumpTd,
  useTd,
  type TdInvite,
  type TdOppStat,
  type TdPeer,
  type TdResultData,
  type TdState,
  type TdTarget,
  type TdWire,
} from "./state";
import { TdCountdown, TdJoined, TdPanel, TdPlay, TdWait } from "./views";

export type { TdPeer, TdState } from "./state";
export { TdLayer } from "./views";

/** Current duel state (td.js `TD`) — read-only accessor for the views. */
export const getTd = () => TD;

let TD: TdState | null = null;
let TDG: { id: string; t0: number; onDone: (r: { ok: number; total: number; ms: number }) => void } | null = null;
let tdTickH: ReturnType<typeof setInterval> | null = null;
let tdBotH: ReturnType<typeof setTimeout> | null = null;
let tdSendT = 0;

/** community.js `myTok` — the invite token (`nh:tok`, shared with social). */
const myTok: string = (() => {
  let t = ls.get("nh:tok");
  if (!t) {
    t = Math.random().toString(36).slice(2, 10);
    ls.set("nh:tok", t);
  }
  return t;
})();

/* ================= helpers ================= */

/** td.js `tdSeeded` — deterministic Math.random during game mount. */
function tdSeeded(seed: number, fn: () => void): void {
  const R = Math.random;
  Math.random = seededRand((seed >>> 0) || 7);
  try {
    fn();
  } finally {
    Math.random = R;
  }
}

function tdNewSeed(): number {
  return Math.floor(Math.random() * 60000000) + 1;
}

function tdRoomCode(): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

export function tdSec(ms: number | undefined): number {
  return Math.max(0, Math.round((ms || 0) / 1000));
}

function tdBetter(a: { ok: number; ms?: number }, b: { ok: number; ms?: number }): boolean {
  return a.ok !== b.ok ? a.ok > b.ok : (a.ms || 0) < (b.ms || 0);
}

/* ================= mã vượt điểm ================= */

function tdChk(s: string): string {
  let n = 0;
  for (const c of s) n = (n * 7 + c.charCodeAt(0)) % 36;
  return n.toString(36).toUpperCase();
}

export function tdEncode(id: string, lv: number, seed: number, ok: number, tot: number, ms: number): string {
  const body = `${TD_G.indexOf(id as (typeof TD_G)[number])}${lv}${seed.toString(36).toUpperCase().padStart(5, "0")}${Math.min(9, ok)}${Math.min(9, tot)}${Math.min(1295, tdSec(ms)).toString(36).toUpperCase().padStart(2, "0")}`;
  return `TD-${body.slice(0, 7)}-${body.slice(7)}${tdChk(body)}`;
}

export function tdDecode(code: string): (TdTarget & { id: string; lv: number; seed: number }) | null {
  let s = String(code || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (s.startsWith("TD")) s = s.slice(2);
  if (s.length !== 12) return null;
  const body = s.slice(0, 11);
  if (tdChk(body) !== s[11]) return null;
  const gi = +body[0],
    lv = +body[1],
    seed = parseInt(body.slice(2, 7), 36),
    ok = +body[7],
    tot = +body[8],
    sec = parseInt(body.slice(9, 11), 36);
  if (!(gi >= 0 && gi < 4) || !(lv >= 1 && lv <= 3) || !seed || !(tot >= 1)) return null;
  return { id: TD_G[gi], lv, seed, ok, tot, ms: sec * 1000 };
}

/* ================= gửi trạng thái ================= */

function tdSend(force?: boolean): void {
  if (!TD || TD.role === "bot" || TD.role === "async") return;
  const now = Date.now();
  if (!force && now - tdSendT < 350) return;
  tdSendT = now;
  sendPresence({
    td: {
      r: TD.code,
      g: TD.id,
      lv: TD.lv,
      sd: TD.seed,
      st: TD.st,
      t0: TD.t0 || 0,
      k: TD.k || 0,
      ok: TD.ok || 0,
      tot: TD.tot || 0,
      dn: TD.dn ? 1 : 0,
      ms: TD.ms || 0,
      inv: TD.inv || "",
    },
  });
}

export function tdLeave(): void {
  if (tdTickH) {
    clearInterval(tdTickH);
    tdTickH = null;
  }
  if (tdBotH) {
    clearTimeout(tdBotH);
    tdBotH = null;
  }
  const had = TD && TD.role !== "bot" && TD.role !== "async";
  TD = null;
  TDG = null;
  if (had) sendPresence({ td: { st: "x" } });
}

/** td.js `tdAbsorb` — sanitize peer `td` field, fire invite cards. */
function tdAbsorb(o: PlayerState, pr: Record<string, unknown>): void {
  const p = o as TdPeer;
  p.nw = typeof pr.nw === "string" ? pr.nw.slice(0, 12) : "";
  const t = pr.td as Partial<TdWire> | undefined;
  if (!t || typeof t !== "object" || t.st === "x") {
    p.td = null;
    return;
  }
  const r = typeof t.r === "string" && /^[A-Z0-9]{4}$/.test(t.r) ? t.r : "";
  if (!r || !(TD_G as readonly string[]).includes(t.g as string)) {
    p.td = null;
    return;
  }
  p.td = {
    r,
    g: t.g as string,
    lv: [1, 2, 3].includes(t.lv as number) ? (t.lv as number) : 1,
    sd: Math.max(1, Math.min(99999999, +((t.sd as number) || 1))),
    st: ["w", "r", "go"].includes(t.st as string) ? (t.st as TdWire["st"]) : "w",
    t0: +((t.t0 as number) || 0),
    k: Math.max(0, Math.min(20, ((t.k as number) | 0) || 0)),
    ok: Math.max(0, Math.min(20, ((t.ok as number) | 0) || 0)),
    tot: Math.max(0, Math.min(20, ((t.tot as number) | 0) || 0)),
    dn: t.dn ? 1 : 0,
    ms: Math.max(0, Math.min(3600000, +((t.ms as number) || 0))),
    inv: typeof t.inv === "string" ? t.inv.slice(0, 12) : "",
  };
  if (p.td.inv && p.td.inv === myTok && p.td.st === "w" && p._tdInv !== p.td.r) {
    p._tdInv = p.td.r;
    tdInvite(p);
  }
}

/** td.js `tdInvite` — floating invite card (React: `useTd.invite` + TdLayer). */
function tdInvite(o: TdPeer): void {
  if (TD || !o.td) return;
  const G = GAMES[o.td.g];
  if (!G) return;
  const inv: TdInvite = { key: `${o.td.r}:${o.n}`, n: o.n, g: o.td.g, r: o.td.r, gameName: G.name };
  useTd.getState().setInvite(inv);
  try {
    sfx("ok");
  } catch {
    /* noop */
  }
  setTimeout(() => {
    const cur = useTd.getState().invite;
    if (cur && cur.key === inv.key) useTd.getState().setInvite(null);
  }, 30000);
}

/** td.js `tdOpp` — live opponent lookup (or the synthetic bot/async one). */
export function tdOpp(): TdPeer | TdOppStat | null {
  if (!TD) return null;
  if (TD.role === "bot" || TD.role === "async") return TD.opp || null;
  const S = TD;
  let f: TdPeer | null = null;
  for (const o of usePresence.getState().others.values()) {
    const p = o as TdPeer;
    if (p.td && p.td.r === S.code && (S.role === "host" ? p.td.st !== "w" : true) && (!S.oppNw || p.nw === S.oppNw)) f = p;
  }
  return f;
}

/** Normalise a live peer / synthetic opponent into progress stats (`o.td||o`). */
export function tdOppStat(o: TdPeer | TdOppStat | null): TdOppStat | null {
  if (!o) return null;
  return (((o as TdPeer).td as TdOppStat | null | undefined) || o) as TdOppStat;
}

/* ================= khung chung ================= */

/** td.js `tdShell` — swap the shared room dialog to a duel screen. */
function tdShell(title: string, sub: string, body: ReactNode): void {
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({ mark: "战", title, sub: sub || "", body, variant: "default" });
}

/** td.js `tdPanel` — the "Thách đấu" two-card panel. */
export function tdPanel(id: string, lv0?: number): void {
  tdLeave();
  const G = GAMES[id];
  if (!G) return;
  const lv = G.lv ? lv0 || me.cl || getCurLevel() || 1 : 1;
  tdShell(
    `Thách đấu: ${G.name}`,
    "Đấu trực tiếp với bạn, hoặc gửi mã để bạn vượt điểm",
    createElement(TdPanel, { id, lv0: lv }),
  );
}

/** td.js `tdHost` — create a room (optionally inviting one online player). */
export function tdHost(id: string, lv: number, o: { inv?: string; name?: string }): void {
  tdLeave();
  TD = { id, lv, seed: tdNewSeed(), code: tdRoomCode(), role: "host", st: "w", inv: o.inv || "", oppName: o.name || "" };
  tdSend(true);
  tdWait();
  tdTickH = setInterval(tdTick, 400);
}

/** td.js `tdJoin` — join a host's room by 4-char code. */
export function tdJoin(code: string): boolean {
  let h: TdPeer | null = null;
  for (const o of usePresence.getState().others.values()) {
    const p = o as TdPeer;
    if (p.td && p.td.r === code && p.td.st === "w") h = p;
  }
  if (!h) return false;
  tdLeave();
  TD = { id: h.td!.g, lv: h.td!.lv, seed: h.td!.sd, code, role: "guest", st: "r", oppNw: h.nw, oppName: h.n };
  tdSend(true);
  const G = GAMES[TD.id];
  tdShell(`Thách đấu: ${G.name}`, `Phòng ${code}`, createElement(TdJoined, { host: h.n }));
  tdTickH = setInterval(tdTick, 400);
  return true;
}

/** td.js `tdWait` — host waiting room. */
function tdWait(): void {
  const S = TD;
  if (!S) return;
  const G = GAMES[S.id];
  tdShell(`Thách đấu: ${G.name}`, S.oppName ? `Đang mời ${S.oppName}` : "Gửi mã phòng cho bạn", createElement(TdWait));
}

/** td.js `tdTick` — 400ms room heartbeat. */
function tdTick(): void {
  if (!TD) {
    if (tdTickH) {
      clearInterval(tdTickH);
      tdTickH = null;
    }
    return;
  }
  if (!useUi.getState().room.open) {
    tdLeave();
    return;
  }
  const S = TD;
  const o = tdOpp();
  const ot = tdOppStat(o) as TdWire | null;

  if (S.role === "host" && S.st === "w" && ot && ot.st === "r") {
    S.oppNw = (o as TdPeer).nw;
    S.oppName = (o as TdPeer).n;
    S.st = "go";
    S.t0 = Date.now() + 3200;
    tdSend(true);
    tdCountdown();
    return;
  }
  if (S.role === "guest" && S.st === "r") {
    if (!o) {
      if (!S.lost) S.lost = Date.now();
      else if (Date.now() - S.lost > 8000) {
        const id = S.id,
          lv = S.lv;
        tdPanel(id, lv);
        toast("Phòng đã đóng.");
      }
      return;
    }
    S.lost = 0;
    if (ot && ot.st === "go" && ot.t0) {
      let t0 = ot.t0;
      if (t0 - Date.now() > 6000 || t0 - Date.now() < -1500) t0 = Date.now() + 1500;
      S.t0 = t0;
      S.st = "go";
      tdSend(true);
      tdCountdown();
    }
    return;
  }
  if (S.st === "go") {
    if (o) {
      S.oppSeen = Date.now();
      const n = (o as TdPeer).n;
      if (n) S.oppName = n;
    }
    bumpTd();
    if (S.dn) tdMaybeResult();
  }
}

/** td.js `tdCountdown` — "3…2…1" then tdStart. */
function tdCountdown(): void {
  const S = TD;
  if (!S) return;
  const G = GAMES[S.id];
  tdShell(
    `Thách đấu: ${G.name}`,
    S.oppName ? `Bạn đấu với ${S.oppName}` : "Thử thách vượt điểm",
    createElement(TdCountdown, { S }),
  );
}

/**
 * td.js `tdStart` — mount the shared game under the seeded RNG.
 * The original ran `tdSeeded(seed, () => gameX(pane,…))` synchronously, so only
 * the initial pool/shuffle calls are deterministic; React mounts the game inside
 * a `flushSync`ed room-body update so the same holds for mount-time shuffles,
 * while later per-question shuffles use real randomness (same as the original).
 */
export function tdStart(S: TdState): void {
  if (TD !== S) return;
  const G = GAMES[S.id];
  S.k = 0;
  S.ok = 0;
  S.tot = ({ g1: 6, g2: 5, g3: 5, g4: 6 } as Record<string, number>)[S.id] || 6;
  TDG = { id: S.id, t0: performance.now(), onDone: (r) => tdMyDone(S, r) };
  useTd.getState().setPlay("game");
  bumpTd();
  const sub = S.oppName ? `Bạn đấu với ${S.oppName}` : S.target ? "Vượt điểm người thách đấu" : "Chơi lấy mã thách đấu";
  tdSeeded(S.seed, () => {
    flushSync(() => {
      tdShell(`Thách đấu: ${G.name}`, sub, createElement(TdPlay));
    });
  });
  if (S.role === "bot") tdBotRun(S);
}

/** td.js `tdProg` — progress ping from the running game. */
function tdProg(k: number, ok: number): void {
  if (!TDG || !TD) return;
  TD.k = k;
  TD.ok = ok;
  tdSend();
  bumpTd();
}

/** td.js `tdMyDone` — my game finished (via TDG.onDone). */
function tdMyDone(S: TdState, r: { ok: number; total: number; ms: number }): void {
  if (TD !== S) return;
  S.dn = 1;
  S.ok = r.ok;
  S.tot = r.total || S.tot;
  S.ms = r.ms;
  S.k = S.tot;
  tdSend(true);
  bumpTd();
  setTimeout(() => {
    if (TD === S) tdMaybeResult();
  }, 700);
}

/** td.js `tdMaybeResult`. */
function tdMaybeResult(): void {
  const S = TD;
  if (!S || !S.dn || S.shown) return;
  if (S.role === "async")
    return tdResult(S, S.target ? { n: "Người thách đấu", ok: S.target.ok, tot: S.target.tot, ms: S.target.ms } : null);
  const o = tdOpp();
  const ot = tdOppStat(o);
  if (ot && ot.dn) return tdResult(S, { n: S.oppName || "Bạn đấu", ok: ot.ok, tot: ot.tot || S.tot || 0, ms: ot.ms });
  if (!o && S.oppSeen && Date.now() - S.oppSeen > 8000) return tdResult(S, null, true);
  if (useTd.getState().playSub !== "wait") useTd.getState().setPlay("wait");
}

/** td.js `tdResult` — score table, award, challenge code, replay buttons. */
function tdResult(S: TdState, opp: { n: string; ok: number; tot: number; ms: number } | null, left?: boolean): void {
  S.shown = 1;
  const G = GAMES[S.id];
  const mine = { ok: S.ok || 0, ms: S.ms || 0 };
  let head: string,
    win = false;
  if (left) {
    head = "Bạn đấu đã rời phòng, bạn thắng!";
    win = true;
  } else if (!opp) head = "Xong! Đây là mã thách đấu của bạn";
  else if (opp.ok === mine.ok && tdSec(opp.ms) === tdSec(mine.ms)) head = "Hoà! Ngang tài ngang sức";
  else {
    win = tdBetter(mine, opp);
    head = win ? "Bạn thắng!" : `${opp.n} thắng rồi, đấu lại nhé!`;
  }
  const res: TdResultData = {
    head,
    win,
    rows: [
      { n: "Bạn", ok: mine.ok, tot: S.tot || 0, ms: mine.ms, me: true },
      ...(opp ? [{ n: opp.n, ok: opp.ok, tot: opp.tot, ms: opp.ms, me: false }] : []),
    ],
  };
  if (S.role === "async" || S.role === "bot") {
    res.code = tdEncode(S.id, S.lv, S.seed, mine.ok, S.tot || 0, mine.ms);
    res.codeLabel = opp ? "Gửi bộ câu này kèm điểm của bạn" : "Mã thách đấu";
    res.codeText = `Mình đạt ${mine.ok}/${S.tot} câu đúng trong ${tdSec(mine.ms)} giây ở ${G.name} (khuôn viên NowHanzi). Vào gian ${G.name}, bấm Thách đấu rồi nhập mã ${res.code} để vượt điểm mình nhé!`;
  }
  useTd.getState().setPlay("result", res);
  if (win) {
    try {
      usePlayer.getState().award(`td:win:${S.id}:${dstr()}:${(opp && opp.n) || "x"}`, 8, "thắng thách đấu");
      sfx("win");
      callHook("gtConfetti");
    } catch {
      /* noop */
    }
  }
  if (S.role !== "async" && S.role !== "bot") {
    setTimeout(() => {
      if (TD === S) {
        if (tdTickH) {
          clearInterval(tdTickH);
          tdTickH = null;
        }
        S.gone = 1;
        sendPresence({ td: { st: "x" } });
      }
    }, 4000);
  }
}

/* ================= bot ================= */

/** td.js `tdBot`. */
export function tdBot(id: string, lv: number): void {
  tdLeave();
  TD = {
    id,
    lv,
    seed: tdNewSeed(),
    role: "bot",
    st: "go",
    t0: Date.now() + 2600,
    oppName: "Bot " + TD_BOTS[Math.floor(Math.random() * TD_BOTS.length)],
  };
  TD.opp = { k: 0, ok: 0, dn: 0, ms: 0 };
  tdCountdown();
  tdTickH = setInterval(tdTick, 400);
}

/** td.js `tdBotRun` — bot progresses with ~62–87% accuracy on a fixed pace. */
function tdBotRun(S: TdState): void {
  const tot = S.tot || 6,
    t0 = performance.now(),
    acc = 0.62 + Math.random() * 0.25,
    pace = S.id === "g1" ? [1800, 3600] : [3200, 6200];
  const step = () => {
    if (TD !== S) return;
    const o = S.opp!;
    o.k++;
    if (Math.random() < acc) o.ok++;
    if (o.k >= tot) {
      o.dn = 1;
      o.ms = performance.now() - t0;
      if (S.id === "g1") o.ok = Math.max(o.ok, tot - 2);
    }
    bumpTd();
    if (S.dn) tdMaybeResult();
    if (!o.dn) tdBotH = setTimeout(step, pace[0] + Math.random() * (pace[1] - pace[0]));
  };
  tdBotH = setTimeout(step, pace[0] + Math.random() * (pace[1] - pace[0]));
}

/* ================= chơi theo mã ================= */

/** td.js `tdAsync` — solo run for a code, or beating someone's code. */
export function tdAsync(id: string, lv: number, seed: number, target: TdTarget | null): void {
  tdLeave();
  TD = { id, lv, seed, role: "async", st: "go", t0: Date.now() + 2600, target, oppName: "" };
  tdCountdown();
  tdTickH = setInterval(tdTick, 400);
}

/* ================= hook wiring ================= */

registerHook("tdPanel", (id, lv) => tdPanel(String(id), Number(lv) || 0));
registerHook("tdProg", (k, ok) => tdProg(Number(k) || 0, Number(ok) || 0));
registerHook("tdActive", () => !!TDG);
registerHook("tdDone", (id, score, total) => {
  // games.js `gameDone` TDG branch — fire the duel completion callback
  if (TDG && TDG.id === String(id)) {
    const g = TDG;
    TDG = null;
    setTimeout(() => g.onDone({ ok: Number(score) || 0, total: Number(total) || 0, ms: Math.round(performance.now() - g.t0) }), 0);
  }
});
registerHook("tdAbsorb", (o, pr) => tdAbsorb(o as PlayerState, (pr || {}) as Record<string, unknown>));
// Fallback when the social feature doesn't funnel commAbsorb → tdAbsorb.
onHook("commAbsorb", (o, pr) => tdAbsorb(o as PlayerState, (pr || {}) as Record<string, unknown>));

// td.js `dlg "close" → tdLeave` — covers phases after the tick already stopped.
useUi.subscribe((s, prev) => {
  if (!s.room.open && prev.room.open && TD) tdLeave();
});
