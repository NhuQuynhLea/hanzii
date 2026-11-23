/**
 * Per-frame canvas painters — dynamic world art (fx.js + scene overlays).
 * Painted on the scene overlay canvas in scene coordinates each frame.
 * Avatars/UI stay DOM; this layer is pure decoration.
 */
import { POND, BRIDGE_Y, BRIDGE_HW, TREES, CAROUSEL, BALLOONS, HONOR } from "@/game/world/geometry";
import { BOARD, SHELF, DOOR, PBOOTH, RPT } from "@/game/scenes/geometry-rooms";
import { me, target } from "@/game/engine/state";
import { usePlayer } from "@/stores/player";
import { usePresence } from "@/stores/presence";
import { callHook } from "@/services/hooks";
import { getCurLevel, todayWords } from "@/lib/curriculum";
import { FLR } from "@/game/world/geometry";
import { GT_LESSONS } from "@/data/gt-data";
import { gtClassName } from "@/game/engine/navigation";

export const REDUCE =
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function classPill(ctx: CanvasRenderingContext2D, t: string, x: number, y: number): void {
  ctx.font = '600 12px "Be Vietnam Pro",system-ui,sans-serif';
  const w = ctx.measureText(t).width + 22;
  ctx.fillStyle = "rgba(20,12,5,.25)";
  ctx.beginPath();
  ctx.roundRect(x - w / 2 + 1, y - 10, w, 22, 11);
  ctx.fill();
  ctx.fillStyle = "#FFF8EC";
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 11, w, 22, 11);
  ctx.fill();
  ctx.fillStyle = "#050349";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(t, x, y + 0.5);
}

/* ---------- Cá koi ---------- */
const KOI = [
  { c: "#F27A2E", s: "#fff", r: 0.62, v: 0.16, p: 0 },
  { c: "#FFFFFF", s: "#EA4A1F", r: 0.42, v: -0.22, p: 2 },
  { c: "#F5A623", s: "#2A1B14", r: 0.75, v: 0.12, p: 4 },
  { c: "#E8401C", s: "#fff", r: 0.3, v: 0.26, p: 1 },
];

export function drawKoi(ctx: CanvasRenderingContext2D, now: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(POND.x, POND.y, POND.rx - 4, POND.ry - 4, 0, 0, 7);
  ctx.rect(POND.x - POND.rx - 30, BRIDGE_Y - BRIDGE_HW - 22, 2 * POND.rx + 60, 2 * BRIDGE_HW + 30);
  ctx.clip("evenodd");
  KOI.forEach((k) => {
    const t = REDUCE ? k.p : (now / 1000) * k.v + k.p;
    const wob = Math.sin(now / 300 + k.p) * (REDUCE ? 0 : 0.25);
    const fx = POND.x + Math.cos(t) * POND.rx * k.r;
    const fy = POND.y + Math.sin(t) * POND.ry * k.r;
    const ang = Math.atan2(
      Math.cos(t) * POND.ry * k.r * Math.sign(k.v),
      -Math.sin(t) * POND.rx * k.r * Math.sign(k.v),
    );
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(ang);
    ctx.fillStyle = "rgba(0,40,50,.25)";
    ctx.beginPath();
    ctx.ellipse(2, 3, 9, 4, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = k.c;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-14, -4 + wob * 8);
    ctx.lineTo(-14, 4 + wob * 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 3.8, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = k.s;
    ctx.beginPath();
    ctx.ellipse(2, -0.5, 3, 1.8, 0, 0, 7);
    ctx.ellipse(-4, 0.8, 2, 1.4, 0, 0, 7);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

/* ---------- Hoa đào rơi ---------- */
interface Petal {
  x: number;
  y: number;
  vy: number;
  ph: number;
  life: number;
  max: number;
}
const PETALS: Petal[] = [];

export function drawPetals(ctx: CanvasRenderingContext2D, dt: number, now: number): void {
  if (REDUCE) return;
  const DAO = TREES.filter((t) => t.k === "dao");
  if (!DAO.length && !PETALS.length) return;
  if (DAO.length && PETALS.length < 26 && Math.random() < 0.25) {
    const t = DAO[Math.floor(Math.random() * DAO.length)];
    PETALS.push({
      x: t.x + (Math.random() - 0.5) * t.r * 1.6,
      y: t.y - t.r * 0.8 + (Math.random() - 0.5) * t.r,
      vy: 12 + Math.random() * 10,
      ph: Math.random() * 7,
      life: 0,
      max: 4 + Math.random() * 3,
    });
  }
  for (let i = PETALS.length - 1; i >= 0; i--) {
    const p = PETALS[i];
    p.life += dt;
    p.y += p.vy * dt;
    p.x += Math.sin(now / 700 + p.ph) * 0.4;
    if (p.life > p.max) {
      PETALS.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = Math.min(1, p.max - p.life);
    ctx.fillStyle = "#F7B6C8";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 3, 1.8, p.ph + now / 900, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ---------- Khu vui chơi ---------- */
export function drawFair(ctx: CanvasRenderingContext2D, now: number): void {
  const C2 = CAROUSEL;
  const a0 = REDUCE ? 0 : now / 2200;
  ctx.fillStyle = "rgba(35,55,20,.25)";
  ctx.beginPath();
  ctx.ellipse(C2.x + 6, C2.y + 10, C2.r, C2.r * 0.7, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#C9B38A";
  ctx.beginPath();
  ctx.arc(C2.x, C2.y, C2.r, 0, 7);
  ctx.fill();
  const hc = ["#EA0000", "#F7D154", "#2E9E5B", "#9FD3C7", "#F4A6B8", "#C9B6F2"];
  for (let k = 0; k < 6; k++) {
    const an = a0 + (k / 6) * Math.PI * 2;
    const hx = C2.x + Math.cos(an) * (C2.r - 12);
    const hy = C2.y + Math.sin(an) * (C2.r - 12);
    ctx.fillStyle = hc[k];
    ctx.beginPath();
    ctx.ellipse(hx, hy, 7, 5, an + Math.PI / 2, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(hx, hy - 4, 2.5, 0, 7);
    ctx.fill();
  }
  for (let k = 0; k < 12; k++) {
    const b0 = a0 + (k / 12) * Math.PI * 2;
    const b1 = a0 + ((k + 1) / 12) * Math.PI * 2;
    ctx.fillStyle = k % 2 ? "#FFF8EC" : "#EA0000";
    ctx.beginPath();
    ctx.moveTo(C2.x, C2.y - 6);
    ctx.arc(C2.x, C2.y - 6, C2.r * 0.55, b0, b1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#E2B14A";
  ctx.beginPath();
  ctx.arc(C2.x, C2.y - 6, 6, 0, 7);
  ctx.fill();

  // bóng bay
  const B = BALLOONS;
  const bob = REDUCE ? 0 : Math.sin(now / 700) * 2;
  ctx.strokeStyle = "rgba(80,60,40,.6)";
  ctx.lineWidth = 1;
  (
    [
      [-14, -46, "#EA0000"],
      [0, -56, "#F7D154"],
      [14, -46, "#2E9E5B"],
      [-6, -36, "#F4A6B8"],
      [8, -34, "#9FD3C7"],
    ] as [number, number, string][]
  ).forEach(([ox, oy, c], k) => {
    const bx = B.x + ox;
    const by = B.y + oy + bob * (k % 2 ? 1 : -1);
    ctx.beginPath();
    ctx.moveTo(B.x, B.y);
    ctx.lineTo(bx, by + 9);
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(bx, by, 8, 10, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.45)";
    ctx.beginPath();
    ctx.ellipse(bx - 3, by - 4, 2.2, 3, 0, 0, 7);
    ctx.fill();
  });
  ctx.fillStyle = "#6B4220";
  ctx.beginPath();
  ctx.roundRect(B.x - 8, B.y - 3, 16, 10, 3);
  ctx.fill();

  // bảng vàng top 3
  const { points, entered } = usePlayer.getState();
  const rows: [string, number][] = [];
  usePresence.getState().others.forEach((o) => rows.push([o.n, o.p || 0]));
  if (entered) rows.push([me.n, points]);
  rows.sort((a, b) => b[1] - a[1]);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = '700 17px "Noto Serif SC",serif';
  ctx.fillText("光荣榜", HONOR.x, HONOR.y + 11);
  ctx.fillStyle = "#C9CBE0";
  ctx.font = '700 11px "Be Vietnam Pro",sans-serif';
  ctx.fillText("Bảng vàng", HONOR.x, HONOR.y + 27);
  ctx.font = '600 11px "Be Vietnam Pro",sans-serif';
  const hL = HONOR.x - HONOR.w / 2 + 12;
  const hR = HONOR.x + HONOR.w / 2 - 12;
  if (!rows.length) {
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fillText("Chưa có ai", HONOR.x, HONOR.y + 52);
  }
  let hy2 = HONOR.y + 43;
  const hBot = HONOR.y + HONOR.h - 22;
  rows.slice(0, 3).forEach(([n, pt], i) => {
    if (hy2 > hBot) return;
    ctx.fillStyle = i ? "#fff" : "#FFE07A";
    const ps = String(pt);
    ctx.textAlign = "right";
    ctx.fillText(ps, hR, hy2);
    const pre = `${i + 1}. `;
    const ind = ctx.measureText(pre).width;
    const w1 = hR - hL - ctx.measureText(ps).width - 8;
    const w2 = hR - hL - ind;
    const words = String(n).split(/\s+/).filter(Boolean);
    const lines = [""];
    words.forEach((wd) => {
      const k = lines.length - 1;
      const cand = lines[k] ? lines[k] + " " + wd : wd;
      const lim = k ? w2 : w1 - ind;
      if (ctx.measureText(cand).width <= lim || !lines[k]) lines[k] = cand;
      else lines.push(wd);
    });
    const fit = (t: string, lim: number) => {
      if (ctx.measureText(t).width <= lim) return t;
      while (t.length > 1 && ctx.measureText(t + "…").width > lim) t = t.slice(0, -1);
      return t + "…";
    };
    const show = lines.slice(0, 2);
    if (lines.length > 2) show[1] = show[1] + " " + lines.slice(2).join(" ");
    ctx.textAlign = "left";
    ctx.fillText(pre + fit(show[0], w1 - ind), hL, hy2);
    if (show[1] && hy2 + 13 <= hBot + 6) {
      hy2 += 13;
      ctx.fillText(fit(show[1], w2), hL + ind, hy2);
    }
    hy2 += 16;
  });
  ctx.textAlign = "center";
}

/** Click-target pulse ring (all scenes). */
export function drawTargetRing(ctx: CanvasRenderingContext2D, now: number): void {
  if (!target) return;
  ctx.strokeStyle = "rgba(234,0,0,.8)";
  ctx.lineWidth = 2.5;
  const p = (now / 500) % 1;
  ctx.globalAlpha = 1 - p;
  ctx.beginPath();
  ctx.ellipse(target.x, target.y, 6 + p * 10, (6 + p * 10) * 0.5, 0, 0, 7);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/* ---------- Lớp học overlay ---------- */
export function drawClassOverlay(ctx: CanvasRenderingContext2D, now: number): void {
  const blv = me.cl || getCurLevel();
  const onGT = FLR.lop === "gt";
  const gn = onGT ? (callHook<number>("gtClassLesson", blv) ?? 0) : 0;
  const GL = gn ? GT_LESSONS[gn] : null;
  const t = onGT ? { words: [], day: 0, done: false } : todayWords(blv);
  ctx.fillStyle = "#4B5872";
  ctx.font = '600 13px "Be Vietnam Pro",sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  if (!onGT) ctx.fillText(t.done ? `HSK ${blv}: ôn tập` : `HSK ${blv}, ngày ${t.day}`, BOARD.x + 14, BOARD.y + 22);
  else if (GL) ctx.fillText(`Hôm nay – Bài ${gn > 30 ? gn - 30 : gn}`, BOARD.x + 14, BOARD.y + 22);
  else callHook("gtDrawLocked", ctx, blv);
  const pc = ["#EA0000", "#050349", "#2E7D4F"][blv - 1] || "#EA0000";
  ctx.fillStyle = pc;
  ctx.beginPath();
  ctx.roundRect(BOARD.x + BOARD.w - 96, BOARD.y - 26, 96, 22, [8, 8, 0, 0]);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = '700 12px "Be Vietnam Pro",sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(onGT ? gtClassName(blv) : "Lớp HSK " + blv, BOARD.x + BOARD.w - 48, BOARD.y - 14.5);
  ctx.textBaseline = "alphabetic";
  const two = t.words.length > 5;
  t.words.slice(0, 10).forEach(([zh, py], i) => {
    const x = BOARD.x + 56 + (i % 5) * 92;
    const yb = two ? (i < 5 ? BOARD.y + 56 : BOARD.y + 96) : BOARD.y + 70;
    ctx.textAlign = "center";
    ctx.fillStyle = "#14213D";
    ctx.font = two ? '600 22px "Noto Serif SC",serif' : '600 30px "Noto Serif SC",serif';
    ctx.fillText(zh, x, yb, 86);
    ctx.font = two ? '500 10px "Be Vietnam Pro",sans-serif' : '500 12px "Be Vietnam Pro",sans-serif';
    ctx.fillStyle = "#C8102E";
    ctx.fillText(py, x, two ? yb + 13 : BOARD.y + 94, 86);
  });
  if (onGT) callHook("gtDrawClass", ctx, now, blv, gn);
  classPill(ctx, FLR.lop === "gt" ? "📚 Giáo trình" : "Tài liệu", SHELF.x + SHELF.w / 2, SHELF.y + SHELF.h + 18);
  if (callHook<boolean>("studyHour")) {
    const mates = callHook<number>("classMates") ?? 0;
    classPill(ctx, `⏰ Giờ học chung – x2 điểm${mates ? ` – ${mates + 1} người đang học` : ""}`, BOARD.x + BOARD.w / 2, BOARD.y + BOARD.h + 16);
  }
  classPill(ctx, "Ra ngoài", DOOR.x + DOOR.w / 2, DOOR.y - 14);
  drawTargetRing(ctx, now);
}

/* ---------- Phòng phát âm overlay ---------- */
export function drawPronOverlay(ctx: CanvasRenderingContext2D, now: number): void {
  const others = usePresence.getState().others;
  PBOOTH.forEach((b) => {
    let n = 0;
    others.forEach((o) => {
      if (o.sc === 2 && Math.hypot(o.x - b.x, o.y - 330) < 120) n++;
    });
    if (n) classPill(ctx, n + " người đang luyện", b.x, 420);
  });
  let n = 0;
  others.forEach((o) => {
    if (o.sc === 2 && o.rp) n++;
  });
  classPill(ctx, n ? `Bàn nhập vai – ${n} bạn đang luyện` : "Bàn nhập vai", RPT.x, RPT.y - 40);
  classPill(ctx, "Ra ngoài", DOOR.x + DOOR.w / 2, DOOR.y - 14);
  drawTargetRing(ctx, now);
}

/* ---------- Phòng chung overlay ---------- */
export function drawRoomOverlay(ctx: CanvasRenderingContext2D, now: number): void {
  classPill(ctx, "Ra ngoài", DOOR.x + DOOR.w / 2, DOOR.y - 14);
  if (me.sc === 5) callHook("drawCDTables2", ctx, now);
  else if (me.sc === 3) callHook("drawLibFloor", ctx, now);
  else if (me.sc === 4) callHook("drawAdmissions", ctx, now);
  drawTargetRing(ctx, now);
}
