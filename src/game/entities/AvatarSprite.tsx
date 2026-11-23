/**
 * One avatar entity rendered as DOM (port of avatar.js `drawPerson`).
 * `update(now)` is called every frame by AvatarLayer and writes styles
 * directly — no React re-render on the hot path.
 */
import { forwardRef, useImperativeHandle, useRef } from "react";
import type { PlayerState } from "@/types/player";
import { avatarSvgUri, teacherSvgUri, lvOf, AV_REWARDS } from "./avatar-svg";
import { MAI_IMG } from "./avatar-art";
import { usePlayer } from "@/stores/player";
import { useGm } from "@/stores/gm";
import { emitHook, callHook } from "@/services/hooks";

export interface AvatarHandle {
  update(now: number): void;
}

interface Props {
  get: () => { o: PlayerState; isMe: boolean; kind: "player" | "npc" | "mai" };
}

const K = 0.34; // sprite scale (avatar.js `k`)
let myLv = 0;

function maiUri(): string {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(MAI_IMG!);
}
const MAI_URI = maiUri();

export const AvatarSprite = forwardRef<AvatarHandle, Props>(function AvatarSprite({ get }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const spr = useRef<HTMLDivElement>(null);
  const imgEl = useRef<HTMLImageElement>(null);
  const sit = useRef<HTMLDivElement>(null);
  const sitImg = useRef<HTMLImageElement>(null);
  const chair = useRef<HTMLDivElement>(null);
  const acc = useRef<HTMLCanvasElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const emo = useRef<HTMLDivElement>(null);
  const bub = useRef<HTMLDivElement>(null);
  const last = useRef({ src: "", pill: "", emo: "", bub: "", pillBg: "" });

  useImperativeHandle(ref, () => ({
    update(now: number) {
      const { o, isMe, kind } = get();
      const r = root.current;
      if (!r) return;
      const L = last.current;
      const { points } = usePlayer.getState();

      r.style.transform = `translate3d(${o.x}px,${o.y}px,0)`;
      r.style.zIndex = String(Math.round(o.y) + (isMe ? 1 : 0));

      if (kind === "npc") {
        const bow = o.bowUntil > now ? Math.sin((1 - (o.bowUntil - now) / 1500) * Math.PI) : 0;
        const breathe = Math.sin(now / 700) * 0.02;
        shadowStyle(shadow.current!, 13, 4.8);
        const uri = teacherSvgUri(o.d === 3 ? 1 : 0);
        if (L.src !== uri) {
          imgEl.current!.src = uri;
          L.src = uri;
        }
        spr.current!.style.transform = `translate(0px,12px) rotate(${Math.sin(now / 1400) * 0.02}rad) scale(${1 - breathe * 0.5},${1 + breathe - bow * 0.12})`;
        pillSet(pill.current!, o.n || "Thầy Vương", "#E2B14A", "#050349", -28 + bow * 6 - 29, L);
        hintSet(hint.current!, o.hint || "", "#fff", "#050349", -28 - 53 + Math.sin(now / 400) * 2);
        emoBub(emo.current!, bub.current!, o, now, -28 - 42);
        return;
      }

      if (kind === "mai") {
        const br = Math.sin(now / 700) * 0.02;
        shadowStyle(shadow.current!, 13, 4.8);
        if (L.src !== MAI_URI) {
          imgEl.current!.src = MAI_URI;
          L.src = MAI_URI;
        }
        spr.current!.style.transform = `translate(0px,12px) rotate(${Math.sin(now / 1300) * 0.025}rad) scale(${1 - br * 0.5},${1 + br})`;
        pillSet(pill.current!, "Cô Mai – Tư vấn", "#E2B14A", "#050349", -57 - 29 + 29 - 28, L);
        hintSet(hint.current!, "Cần tư vấn? Lại gần cô nhé!", "#fff", "#050349", -81 + Math.sin(now / 400) * 2);
        return;
      }

      // ---- học viên ----
      const lv = lvOf(isMe ? points : o.p);
      const hh = [0, 1, 2, 3].includes(o.h ?? -1) ? o.h! : 0;
      if (isMe && usePlayer.getState().entered) {
        if (myLv && lv > myLv) {
          const rewards = AV_REWARDS.filter((a) => a[0] > myLv && a[0] <= lv).map((a) => a[1]);
          const ml = myLv;
          setTimeout(() => emitHook("levelUp", lv, rewards, ml), 0);
        }
        myLv = lv;
      }
      const moving = !!o.m;
      const ph = (o.walk || 0) * 10;
      const d = o.d || 0;
      let seed = 0;
      for (const ch of String(o.n || "")) seed = (seed * 31 + ch.charCodeAt(0)) % 997;
      const s = Math.abs(Math.sin(ph));
      const hop = moving ? s * 6 : 0;
      const land = moving ? 1 - s : 0;
      const breathe = moving ? 0 : Math.sin(now / 650 + seed) * 0.022;
      const A = (o.actUntil ?? 0) > now ? o.act : "";
      const ap = A ? 1 - (o.actUntil! - now) / 1300 : 0;
      let aRot = 0,
        aHop = 0;
      if (A === "wave") aRot = Math.sin(ap * Math.PI * 6) * 0.2 * (1 - ap * 0.4);
      if (A === "jiayou") {
        const q = (ap * 2) % 1;
        aHop = Math.sin(q * Math.PI) * 20;
      }
      const bow = Math.max(
        o.bowUntil > now ? Math.sin((1 - (o.bowUntil - now) / 1500) * Math.PI) : 0,
        A === "xiexie" ? Math.sin(ap * Math.PI) * 1.25 : 0,
      );
      const lean = moving ? (d === 1 ? -0.07 : d === 2 ? 0.07 : Math.sin(ph) * 0.06) : Math.sin(now / 1300 + seed) * 0.025;

      // rings
      const ringEl = ring.current!;
      if (isMe) {
        const pr = 1 + Math.sin(now / 320) * 0.06;
        ringEl.style.display = "block";
        ringEl.style.borderColor = "#E2B14A";
        ringEl.style.background = "rgba(226,177,74,.26)";
        ringEl.style.width = `${19 * pr * 2}px`;
        ringEl.style.height = `${8 * pr * 2}px`;
        ringEl.style.left = `${-19 * pr}px`;
        ringEl.style.top = `${11 - 8 * pr}px`;
      } else {
        const gp = callHook<string>("gpCode");
        if (gp && o.gp === gp) {
          ringEl.style.display = "block";
          ringEl.style.borderColor = "#2E7D4F";
          ringEl.style.background = "rgba(46,125,79,.18)";
          ringEl.style.width = "36px";
          ringEl.style.height = "15px";
          ringEl.style.left = "-18px";
          ringEl.style.top = "3.5px";
        } else ringEl.style.display = "none";
      }

      shadowStyle(shadow.current!, 13 - hop * 0.7, 4.8 - hop * 0.25);

      // sprite
      const gmAc = String(isMe ? useGm.getState().ac() : o.ac || "0");
      const gmHatOn = +gmAc.split(",")[0] > 0;
      const uri = avatarSvgUri(hh, lv, d === 3 ? 2 : 0, gmHatOn);
      let sy0 = 0,
        ssc = 1;
      if (o.sitting) {
        const t = o.sitT ? Math.min(1, (now - o.sitT) / 380) : 1;
        sy0 = 11 - Math.sin(t * Math.PI) * 14;
        ssc = 0.88 + (1 - t) * 0.12;
      }
      const sitting = !!o.sitting;
      spr.current!.style.display = sitting ? "none" : "block";
      sit.current!.style.display = sitting ? "block" : "none";
      chair.current!.style.display = sitting ? "block" : "none";
      if (L.src !== uri) {
        imgEl.current!.src = uri;
        sitImg.current!.src = uri;
        L.src = uri;
      }
      const ty = 12 - hop - aHop + sy0;
      if (sitting) {
        const t = o.sitT ? Math.min(1, (now - o.sitT) / 420) : 1;
        const jump = -Math.sin(t * Math.PI) * 12;
        sit.current!.style.transform = `translate(0px,${12 + jump}px) scale(${1 - breathe * 0.5},${1 + breathe})`;
        // accessories above sitting torso
        accDraw(acc.current, o, isMe, now, o.x, o.y + 12 + jump - 72 * K, o.y + 4, d === 3, K);
      } else {
        spr.current!.style.transform = `translate(0px,${ty}px) rotate(${lean + aRot}rad) scale(${(1 + land * 0.07 - breathe * 0.5 + (aHop > 16 ? -0.05 : 0)).toFixed(4)},${((1 - land * 0.08 + breathe - bow * 0.12 + (aHop > 16 ? 0.06 : 0)) * ssc).toFixed(4)})`;
        accDraw(acc.current, o, isMe, now, o.x, o.y + 12 - hop - aHop + sy0 - 108 * K, o.y + 4, d === 3, K);
      }

      // chair back (vẽ lưng ghế che hông)
      const ch = chair.current!;
      if (sitting) {
        ch.style.transform = "translate(-17px,2px)";
      }

      // name pill + emo + bubble
      const hy = sitting ? -16 : -28 - hop - aHop + bow * 6 + sy0;
      const tag = callHook<string | null>("gmTagColor", o, isMe);
      pillSet(pill.current!, (o.n || "Học viên") + "  Lv" + lv, tag || (isMe ? "#EA0000" : "rgba(5,3,73,.88)"), "#fff", hy - 29, L);
      hintSet(hint.current!, "", "#fff", "#050349", 0);
      emoBub(emo.current!, bub.current!, o, now, hy - 42);
    },
  }));

  return (
    <div ref={root} className="absolute left-0 top-0 will-change-transform" style={{ transform: "translate3d(-999px,-999px,0)" }}>
      <div
        ref={ring}
        className="absolute rounded-[50%] border-[2.5px]"
        style={{ display: "none", borderColor: "#E2B14A", background: "rgba(226,177,74,.26)" }}
      />
      <div ref={shadow} className="absolute rounded-[50%]" style={{ background: "rgba(20,30,10,.28)", left: -13, top: 6.2, width: 26, height: 9.6 }} />
      {/* standing sprite */}
      <div ref={spr} className="absolute left-0 top-0" style={{ transformOrigin: "0 0" }}>
        <img ref={imgEl} alt="" draggable={false} style={{ position: "absolute", left: -80 * K, top: -186 * K, width: 160 * K, height: 196 * K, maxWidth: "none" }} />
      </div>
      {/* sitting: torso crop */}
      <div ref={sit} className="absolute left-0 top-0" style={{ display: "none", transformOrigin: "0 0" }}>
        <div style={{ position: "absolute", left: -80 * K, top: -150 * K, width: 160 * K, height: 150 * K, overflow: "hidden" }}>
          <img ref={sitImg} alt="" draggable={false} style={{ position: "absolute", left: 0, top: 0, width: 160 * K, height: 196 * K, maxWidth: "none" }} />
        </div>
      </div>
      {/* chair back */}
      <div ref={chair} style={{ display: "none", position: "absolute", left: 0, top: 0 }}>
        <div style={{ position: "absolute", left: -18, top: 25, width: 36, height: 4, borderRadius: "50%", background: "rgba(20,10,5,.28)" }} />
        <div style={{ position: "absolute", left: -13, top: 11, width: 4, height: 14, borderRadius: 2, background: "#5A3820" }} />
        <div style={{ position: "absolute", left: 9, top: 11, width: 4, height: 14, borderRadius: 2, background: "#5A3820" }} />
        <div style={{ position: "absolute", left: -17, top: 1, width: 34, height: 16, borderRadius: 5, background: "#7A4A24", border: "1px solid rgba(0,0,0,.3)" }} />
        <div style={{ position: "absolute", left: -17, top: 1, width: 34, height: 5, borderRadius: "5px 5px 0 0", background: "#9A6436" }} />
      </div>
      <canvas ref={acc} width={160} height={160} style={{ position: "absolute", left: -40, top: -70, width: 80, height: 80, pointerEvents: "none" }} />
      <div ref={pill} className="absolute whitespace-nowrap rounded-full px-[9px] py-[2px] text-[11px] font-semibold" style={{ display: "none", transform: "translate(-50%,-50%)" }} />
      <div ref={hint} className="absolute whitespace-nowrap rounded-full bg-white px-[9px] py-[2px] text-[12px] font-semibold text-[#050349]" style={{ display: "none", transform: "translate(-50%,-50%)" }} />
      <div ref={emo} className="absolute whitespace-nowrap rounded-full px-[9px] py-[2px] text-[13px] font-semibold" style={{ display: "none", transform: "translate(-50%,-50%)", background: "#FFE7A8", color: "#A61E22" }} />
      <div ref={bub} className="absolute max-w-[190px] rounded-xl bg-white px-3 py-1.5 text-center text-[13px] font-medium text-[#1C1A6B] shadow-md" style={{ display: "none", transform: "translate(-50%,-100%)" }} />
    </div>
  );
});

function shadowStyle(el: HTMLDivElement, rx: number, ry: number): void {
  el.style.width = `${rx * 2}px`;
  el.style.height = `${ry * 2}px`;
  el.style.left = `${-rx}px`;
  el.style.top = `${11 - ry}px`;
}

function pillSet(el: HTMLDivElement, text: string, bg: string, fg: string, top: number, L: { pill: string; pillBg: string }): void {
  const key = text;
  if (L.pill !== key) {
    el.textContent = text;
    el.style.background = bg;
    el.style.color = fg;
    L.pill = key;
    L.pillBg = bg;
  }
  el.style.display = "block";
  el.style.top = `${top}px`;
}

function hintSet(el: HTMLDivElement, text: string, bg: string, fg: string, top: number): void {
  if (!text) {
    el.style.display = "none";
    return;
  }
  if (el.textContent !== text) el.textContent = text;
  el.style.background = bg;
  el.style.color = fg;
  el.style.display = "block";
  el.style.top = `${top}px`;
}

function emoBub(emoEl: HTMLDivElement, bubEl: HTMLDivElement, o: PlayerState, now: number, hy: number): void {
  let top = hy;
  if (o.emoUntil > now && o.emo) {
    if (emoEl.textContent !== o.emo) emoEl.textContent = o.emo;
    emoEl.style.display = "block";
    emoEl.style.top = `${top - 6}px`;
    top -= 26;
  } else emoEl.style.display = "none";
  if (o.bubbleUntil > now && o.bubble) {
    if (bubEl.textContent !== o.bubble) bubEl.textContent = o.bubble;
    bubEl.style.display = "block";
    bubEl.style.top = `${top - 4}px`;
  } else bubEl.style.display = "none";
}

/** Accessories canvas — delegated to the gm module via hook when ported. */
function accDraw(
  cv: HTMLCanvasElement | null,
  o: PlayerState,
  isMe: boolean,
  now: number,
  x: number,
  eyeY: number,
  petY: number,
  back: boolean,
  k: number,
): void {
  if (!cv) return;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  // canvas covers world rect (x-40, y-70, 80, 80) at 2x
  ctx.setTransform(2, 0, 0, 2, -(x - 40) * 2, -(o.y - 70) * 2);
  callHook("gmDrawAc", ctx, o, isMe, now, x, eyeY, petY, back, k);
}
