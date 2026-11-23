/**
 * Presence runtime — sendMove/absorb orchestration (presence.js).
 * Keeps `others` Map (mutable, render-loop read) and online status in sync.
 */
import { usePresence, countText } from "@/stores/presence";
import { usePlayer, COLORS } from "@/stores/player";
import { mkPlayer } from "@/types/player";
import { W, H } from "@/game/world/geometry";
import { emitHook, onHook, callHook } from "@/services/hooks";
import { ls } from "@/lib/storage";
import type { PresenceService, PeerInfo } from "./types";
import { SoloPresence } from "./solo";

let room: PresenceService = new SoloPresence();
let firstDel = true;
let lastSend = 0;
let connectTask: Promise<void> | null = null;
let stopEnteredSub: (() => void) | null = null;

/**
 * Sticky extra presence fields (qz/ch/rp/gr/a/s/hv…), merged into every
 * tracked payload — same semantics as the original `room.presence({…})`
 * merge API (receivers dedupe events by their `t` timestamp).
 */
const extra: Record<string, unknown> = {};

export const hasRoom = () => room.connected;

/** presence.js `room.presence(patch)` — merge extra fields then broadcast. */
export function sendPresence(patch: Record<string, unknown>): void {
  if (!room.connected) return;
  Object.assign(extra, patch);
  sendMove(true);
}

/** presence.js `sendMove` — throttled 60ms, full state payload. */
export function sendMove(force?: boolean): void {
  if (!room.connected || !usePlayer.getState().entered) return;
  const now = performance.now();
  if (!force && now - lastSend < 60) return;
  lastSend = now;
  const { me, points, badgeCount } = usePlayer.getState();
  Promise.resolve(
    room.send({
      x: Math.round(me.x),
      y: Math.round(me.y),
      d: me.d,
      m: me.m,
      sc: me.sc,
      seat: me.seat,
      p: Math.max(0, Math.round(points)),
      b: badgeCount,
      h: me.h,
      cl: me.cl,
      fl: me.fl || "",
      ac: me.ac || "0,0,0,0",
      n: me.n,
      c: me.c,
      nw: (callHook<string>("newbieTok") as string) || "",
      gp: (callHook<string>("gpCode") as string) || "",
      u: ls.get("nh:uid") || "",
      ...extra,
    }),
  ).catch(() => {});
}

/** presence.js `absorb` — sanitize & merge a peer presence update. */
export function absorb(p: PeerInfo, quiet?: boolean): void {
  if (p.sameTab || p.kind === "bot") return;
  const pr = (p.presence || {}) as Record<string, unknown>;
  const others = usePresence.getState().others;
  if (typeof pr.x !== "number" || typeof pr.y !== "number") {
    others.delete(p.peer);
    return;
  }
  const n = String(pr.n || "").slice(0, 20) || "Học viên";
  const c = COLORS.includes(pr.c as string) ? (pr.c as string) : COLORS[0];
  const d = Math.max(0, Math.min(3, Math.round(Number(pr.d) || 0))) as 0 | 1 | 2 | 3;
  const scv = Number(pr.sc);
  const sc = ([1, 2, 3, 4, 5].includes(scv) ? scv : 0) as 0 | 1 | 2 | 3 | 4 | 5;
  const seat = sc === 1 ? Math.max(-1, Math.min(11, Math.round(Number(pr.seat)))) : -1;
  const h = [0, 1, 2, 3].includes(pr.h as number) ? (pr.h as number) : 0;
  const ac =
    typeof pr.ac === "string" && /^\d{1,2}(,\d{1,2}){3}$/.test(pr.ac) ? pr.ac : "0,0,0,0";
  const pv = Math.max(0, Math.min(1000000, Math.round(Number(pr.p) || 0)));
  const b = Math.max(0, Math.min(99, Math.round(Number(pr.b) || 0)));
  const cl = sc && [1, 2, 3].includes(pr.cl as number) ? (pr.cl as number) : 0;
  const fl = pr.fl === "gt" ? "gt" : "hsk";

  let o = others.get(p.peer);
  if (!o) {
    o = mkPlayer({ x: pr.x, y: pr.y, n, c, d, sc, seat: Number.isFinite(seat) ? seat : -1 });
    o.h = h;
    others.set(p.peer, o);
    if (!quiet) emitHook("sys", `${n} vừa vào trung tâm`);
  } else {
    if (sc !== o.sc) {
      o.x = pr.x;
      o.y = pr.y;
    }
    o.tx = Math.max(0, Math.min(W, pr.x));
    o.ty = Math.max(0, Math.min(H, pr.y));
    o.d = d;
    o.m = pr.m ? 1 : 0;
    o.n = n;
    o.c = c;
    o.sc = sc;
    o.seat = Number.isFinite(seat) ? seat : -1;
    o.h = h;
  }
  o.b = String(b);
  o.cl = cl;
  o.fl = fl;
  o.ac = ac;
  o.p = pv;
  emitHook("commAbsorb", o, pr);

  // cdq quiz state
  const q = pr.qz as Record<string, unknown> | undefined;
  if (q && typeof q === "object") {
    const tb = (q.tb as number) | 0;
    (o as unknown as Record<string, unknown>).qz =
      tb >= 0 && tb < 6 && tb !== -1
        ? {
            tb,
            sd: +((q.sd as number) || 0),
            t0: +((q.t0 as number) || 0),
            sc: Math.max(0, Math.min(5000, +((q.sc as number) || 0))),
            k: Math.max(0, Math.min(9, (q.k as number) | 0)),
            la: q.la ? 1 : 0,
            g: ["do", "ghep", "thanh"].includes(q.g as string) ? q.g : "do",
            gm: typeof q.gm === "string" && /^[A-Z0-9]{0,8}$/.test(q.gm) ? q.gm : "",
          }
        : null;
  }

  // emote action
  const a = pr.a as { k?: string; t?: number } | undefined;
  const rec = o as unknown as { aT?: number; sT?: number };
  if (a && a.t !== rec.aT) {
    rec.aT = a.t;
    emitHook("emote", o, String(a.k));
  }
  // speech bubble
  const s = pr.s as { m?: string; t?: number } | undefined;
  if (s && s.t !== rec.sT) {
    rec.sT = s.t;
    const mtxt = String(s.m || "").slice(0, 100);
    if (mtxt) {
      o.bubble = mtxt;
      o.bubbleUntil = performance.now() + 7000;
      emitHook("addMsg", n, mtxt);
    }
  }
}

/** Connect with the best available transport (Supabase if configured, else solo). */
export function connectPresence(): Promise<void> {
  if (room.connected) return Promise.resolve();
  if (connectTask) return connectTask;
  const task = (async () => {
    const { getSupabase } = await import("../supabase");
    const client = getSupabase();
    if (client) {
      const { SupabasePresence } = await import("./supabase");
      room = new SupabasePresence(client);
    } else {
      room = new SoloPresence();
    }
    const { connectScores } = await import("../scores");
    connectScores();
    const ok = await room.connect();
    const { setOnline } = usePresence.getState();
    if (!ok) {
      setOnline("Chế độ một mình", false);
      return;
    }
    setOnline("Đã kết nối", true);
    room.onPeers(
      (ch) => {
        const q = firstDel;
        firstDel = false;
        ch.joined.forEach((p) => absorb(p, q));
        ch.updated.forEach((p) => absorb(p, false));
        ch.left.forEach((p) => {
          const o = usePresence.getState().others.get(p.peer);
          if (o) emitHook("sys", `${o.n} đã rời đi`);
          usePresence.getState().others.delete(p.peer);
        });
        setOnline(countText(usePlayer.getState().entered), true);
      },
      () => setOnline("Mất kết nối. Tải lại trang để vào lại.", false),
    );
    if (!stopEnteredSub) {
      stopEnteredSub = usePlayer.subscribe((s, prev) => {
        if (s.entered && !prev.entered) {
          setOnline(countText(true), true);
          sendMove(true);
        }
      });
    }
    if (usePlayer.getState().entered) sendMove(true);
  })();
  connectTask = task;
  return task.finally(() => {
    if (connectTask === task) connectTask = null;
  });
}

/** Wire sendMove hook so stores can trigger broadcasts without importing us. */
onHook("sendMove", (force) => sendMove(!!force));

setTimeout(() => {
  if (!room.connected) usePresence.getState().setOnline("Chế độ một mình", false);
}, 10000);
