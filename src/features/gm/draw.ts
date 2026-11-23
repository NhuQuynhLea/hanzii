/**
 * Accessory canvas painters — VERBATIM port of gm.js
 * gmHat / gmGlass / gmPet / gmPreview / gmDrawAc / gmTagColor.
 * The avatar layer calls `gmDrawAc` every frame with a 2d context already
 * transformed so world coordinates work.
 */
import type { PlayerState } from "@/types/player";
import { HAIR, SKIN } from "@/game/entities/avatar-svg";
import { GM_SHOP, gmAc } from "./state";
import type { GmSlot } from "@/stores/gm";

type Ctx = CanvasRenderingContext2D;

export function gmHat(c: Ctx, id: number, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  if (id === 1) {
    c.fillStyle = "#D7263D";
    c.beginPath();
    c.arc(0, 2, 11, Math.PI, 0);
    c.fill();
    c.fillRect(-1, -10, 2, 3);
    c.beginPath();
    c.ellipse(7, 2, 9, 2.6, 0, 0, 7);
    c.fill();
  }
  if (id === 2) {
    c.fillStyle = "#E9D3A0";
    c.beginPath();
    c.moveTo(-17, 4);
    c.lineTo(0, -13);
    c.lineTo(17, 4);
    c.closePath();
    c.fill();
    c.strokeStyle = "#B8975A";
    c.lineWidth = 1;
    c.beginPath();
    for (let i = -2; i <= 2; i++) {
      c.moveTo(0, -13);
      c.lineTo(i * 7, 4);
    }
    c.stroke();
  }
  if (id === 3) {
    c.fillStyle = "#1F2333";
    c.beginPath();
    c.moveTo(-15, -4);
    c.lineTo(0, -11);
    c.lineTo(15, -4);
    c.lineTo(0, 3);
    c.closePath();
    c.fill();
    c.fillRect(-8, -3, 16, 6);
    c.strokeStyle = "#F4C95D";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(0, -4);
    c.lineTo(11, -2);
    c.lineTo(11, 7);
    c.stroke();
    c.fillStyle = "#F4C95D";
    c.beginPath();
    c.arc(11, 8, 1.8, 0, 7);
    c.fill();
  }
  if (id === 4) {
    c.fillStyle = "#F4C95D";
    c.strokeStyle = "#B8860B";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-11, 3);
    c.lineTo(-11, -6);
    c.lineTo(-5.5, -1);
    c.lineTo(0, -9);
    c.lineTo(5.5, -1);
    c.lineTo(11, -6);
    c.lineTo(11, 3);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "#D7263D";
    c.beginPath();
    c.arc(0, -1, 1.8, 0, 7);
    c.fill();
  }
  c.restore();
}

export function gmGlass(c: Ctx, id: number, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineWidth = 1.6;
  c.strokeStyle = "#1F2333";
  if (id === 1) {
    c.beginPath();
    c.arc(-4.5, 0, 3.6, 0, 7);
    c.moveTo(8.1, 0);
    c.arc(4.5, 0, 3.6, 0, 7);
    c.moveTo(-0.9, 0);
    c.lineTo(0.9, 0);
    c.stroke();
  }
  if (id === 2) {
    c.fillStyle = "#1F2333";
    c.beginPath();
    c.roundRect(-9, -2.8, 7.6, 5.6, 2);
    c.roundRect(1.4, -2.8, 7.6, 5.6, 2);
    c.fill();
    c.beginPath();
    c.moveTo(-1.4, -1);
    c.lineTo(1.4, -1);
    c.stroke();
  }
  c.restore();
}

export function gmPet(c: Ctx, id: number, x: number, y: number, s: number, now: number): void {
  if (!GM_SHOP.pet.items.some((i) => i[0] === id)) return;
  const t = (now || 0) / 260,
    bob = Math.sin(t) * 1.2;
  c.save();
  c.translate(x, y + bob * s);
  c.scale(s, s);
  c.lineJoin = "round";
  c.lineCap = "round";
  const OL = "rgba(40,25,20,.35)";
  const sh = () => {
    c.fillStyle = "rgba(20,30,10,.22)";
    c.beginPath();
    c.ellipse(0, 8.4 - bob, 6, 1.6, 0, 0, 7);
    c.fill();
  };
  const eyes = (ex: number, ey: number, r: number, col?: string) => {
    c.fillStyle = col || "#2A1F1A";
    c.beginPath();
    c.arc(-ex, ey, r, 0, 7);
    c.arc(ex, ey, r, 0, 7);
    c.fill();
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(-ex + r * 0.35, ey - r * 0.35, r * 0.35, 0, 7);
    c.arc(ex + r * 0.35, ey - r * 0.35, r * 0.35, 0, 7);
    c.fill();
  };
  const blush = (bx: number, by: number) => {
    c.fillStyle = "rgba(255,120,130,.45)";
    c.beginPath();
    c.ellipse(-bx, by, 1.3, 0.8, 0, 0, 7);
    c.ellipse(bx, by, 1.3, 0.8, 0, 0, 7);
    c.fill();
  };
  const body = (col: string) => {
    c.fillStyle = col;
    c.strokeStyle = OL;
    c.lineWidth = 0.5;
    c.beginPath();
    c.ellipse(0, 4.6, 4.6, 3.8, 0, 0, 7);
    c.fill();
    c.stroke();
  };
  sh();
  if (id === 1) {
    // mèo cam
    c.strokeStyle = "#E08A3C";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(3.6, 5.5);
    c.quadraticCurveTo(8, 5, 7, 1 + Math.sin(t * 1.5));
    c.stroke();
    body("#F4A259");
    c.fillStyle = "#F4A259";
    c.strokeStyle = OL;
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(-4.6, -3.2);
    c.lineTo(-4.2, -8.2);
    c.lineTo(-1.2, -5.6);
    c.closePath();
    c.moveTo(4.6, -3.2);
    c.lineTo(4.2, -8.2);
    c.lineTo(1.2, -5.6);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "#FFC6C6";
    c.beginPath();
    c.moveTo(-3.8, -4.4);
    c.lineTo(-3.6, -6.9);
    c.lineTo(-2, -5.4);
    c.closePath();
    c.moveTo(3.8, -4.4);
    c.lineTo(3.6, -6.9);
    c.lineTo(2, -5.4);
    c.closePath();
    c.fill();
    c.fillStyle = "#F4A259";
    c.beginPath();
    c.ellipse(0, -2.2, 5.4, 4.6, 0, 0, 7);
    c.fill();
    c.stroke();
    c.fillStyle = "#E08A3C";
    c.beginPath();
    c.moveTo(-1, -6.6);
    c.lineTo(0, -4.8);
    c.lineTo(1, -6.6);
    c.fill();
    eyes(2.1, -2.2, 0.95);
    blush(3.4, -0.6);
    c.fillStyle = "#E86A7A";
    c.beginPath();
    c.moveTo(-0.6, -0.9);
    c.lineTo(0.6, -0.9);
    c.lineTo(0, -0.3);
    c.fill();
    c.strokeStyle = "rgba(60,40,30,.55)";
    c.lineWidth = 0.35;
    [
      [-1.4, -0.6, -5.6, -1.2],
      [-1.4, -0.2, -5.6, 0.4],
      [1.4, -0.6, 5.6, -1.2],
      [1.4, -0.2, 5.6, 0.4],
    ].forEach(([a, b, cc, d]) => {
      c.beginPath();
      c.moveTo(a, b);
      c.lineTo(cc, d);
      c.stroke();
    });
  } else if (id === 2) {
    // cún
    c.strokeStyle = "#D9B07A";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(3.8, 4.2);
    c.lineTo(6.6, 1.6 + Math.sin(t * 3) * 1.2);
    c.stroke();
    body("#F1D3A6");
    c.fillStyle = "#F1D3A6";
    c.strokeStyle = OL;
    c.lineWidth = 0.5;
    c.beginPath();
    c.ellipse(0, -2.4, 5.2, 4.6, 0, 0, 7);
    c.fill();
    c.stroke();
    c.fillStyle = "#9C6B3F";
    c.beginPath();
    c.ellipse(-5, -2.2, 1.8, 3.4, 0.25, 0, 7);
    c.ellipse(5, -2.2, 1.8, 3.4, -0.25, 0, 7);
    c.fill();
    c.fillStyle = "#FFF4E2";
    c.beginPath();
    c.ellipse(0, -0.6, 2.8, 2, 0, 0, 7);
    c.fill();
    eyes(2, -3, 0.95);
    c.fillStyle = "#2A1F1A";
    c.beginPath();
    c.ellipse(0, -1.4, 0.9, 0.65, 0, 0, 7);
    c.fill();
    c.fillStyle = "#E86A7A";
    c.beginPath();
    c.ellipse(0, 0.4, 0.7, 0.9, 0, 0, Math.PI);
    c.fill();
    blush(3.2, -1.2);
    c.fillStyle = "#C8102E";
    c.fillRect(-3, 1.8, 6, 1);
  } else if (id === 3) {
    // gấu trúc
    body("#FFFFFF");
    c.fillStyle = "#232634";
    c.beginPath();
    c.ellipse(-3.2, 5.4, 1.6, 2, 0, 0, 7);
    c.ellipse(3.2, 5.4, 1.6, 2, 0, 0, 7);
    c.fill();
    c.fillStyle = "#232634";
    c.beginPath();
    c.arc(-4.2, -6, 1.9, 0, 7);
    c.arc(4.2, -6, 1.9, 0, 7);
    c.fill();
    c.fillStyle = "#FFFFFF";
    c.strokeStyle = OL;
    c.lineWidth = 0.5;
    c.beginPath();
    c.ellipse(0, -2.4, 5.4, 4.7, 0, 0, 7);
    c.fill();
    c.stroke();
    c.fillStyle = "#232634";
    c.beginPath();
    c.ellipse(-2.1, -2.6, 1.6, 1.9, -0.5, 0, 7);
    c.ellipse(2.1, -2.6, 1.6, 1.9, 0.5, 0, 7);
    c.fill();
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(-1.9, -2.8, 0.55, 0, 7);
    c.arc(1.9, -2.8, 0.55, 0, 7);
    c.fill();
    c.fillStyle = "#232634";
    c.beginPath();
    c.ellipse(0, -0.7, 0.8, 0.55, 0, 0, 7);
    c.fill();
    blush(3.3, -0.6);
    c.fillStyle = "#3E7C59";
    c.save();
    c.rotate(-0.5);
    c.fillRect(-7.5, 1, 1, 6);
    c.restore();
  } else if (id === 4) {
    // rồng nhỏ
    const fl = Math.sin(t * 2) * 0.35;
    c.fillStyle = "#E2B14A";
    c.strokeStyle = OL;
    c.lineWidth = 0.4;
    c.save();
    c.translate(-3.8, 2.4);
    c.rotate(-0.5 - fl);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(-4.4, -2.2);
    c.lineTo(-3, 0.4);
    c.lineTo(-4.2, 1.8);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
    c.save();
    c.translate(3.8, 2.4);
    c.rotate(0.5 + fl);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(4.4, -2.2);
    c.lineTo(3, 0.4);
    c.lineTo(4.2, 1.8);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
    c.strokeStyle = "#C8102E";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(3, 6.4);
    c.quadraticCurveTo(7, 7.4, 7.4, 4.4);
    c.stroke();
    c.fillStyle = "#E2B14A";
    c.beginPath();
    c.moveTo(7.4, 3.2);
    c.lineTo(8.4, 4.8);
    c.lineTo(6.6, 4.8);
    c.fill();
    body("#D7263D");
    c.fillStyle = "#FFD98A";
    c.beginPath();
    c.ellipse(0, 5, 2.6, 2.6, 0, 0, 7);
    c.fill();
    c.fillStyle = "#E2B14A";
    c.beginPath();
    c.moveTo(-3, -5.6);
    c.lineTo(-3.8, -9);
    c.lineTo(-1.6, -6.2);
    c.closePath();
    c.moveTo(3, -5.6);
    c.lineTo(3.8, -9);
    c.lineTo(1.6, -6.2);
    c.closePath();
    c.fill();
    c.fillStyle = "#D7263D";
    c.strokeStyle = OL;
    c.lineWidth = 0.5;
    c.beginPath();
    c.ellipse(0, -2.4, 5.2, 4.5, 0, 0, 7);
    c.fill();
    c.stroke();
    c.fillStyle = "#FFD98A";
    c.beginPath();
    c.ellipse(0, -0.4, 2.6, 1.7, 0, 0, 7);
    c.fill();
    c.fillStyle = "#8E0B20";
    c.beginPath();
    c.arc(-0.8, -0.6, 0.3, 0, 7);
    c.arc(0.8, -0.6, 0.3, 0, 7);
    c.fill();
    eyes(2.2, -3, 0.95);
    c.strokeStyle = "#FFD98A";
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(-1.6, -0.1);
    c.quadraticCurveTo(-4.5, 0.2, -5.5, 1.8);
    c.moveTo(1.6, -0.1);
    c.quadraticCurveTo(4.5, 0.2, 5.5, 1.8);
    c.stroke();
  }
  c.restore();
}

export function gmPreview(cv: HTMLCanvasElement, slot: GmSlot, id: number): void {
  const c = cv.getContext("2d");
  if (!c) return;
  c.clearRect(0, 0, 120, 120);
  c.fillStyle = "#F1F3F6";
  c.beginPath();
  c.roundRect(0, 0, 120, 120, 14);
  c.fill();
  if (id === 0) {
    c.fillStyle = "#A4A6BC";
    c.font = "600 13px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("—", 60, 60);
    return;
  }
  if (slot === "pet") {
    gmPet(c, id, 60, 54, 5, 0);
    return;
  }
  if (slot === "tag") {
    const col = GM_SHOP.tag.items.find((i) => i[0] === id)![4] as string;
    c.fillStyle = col;
    c.beginPath();
    c.roundRect(14, 46, 92, 28, 14);
    c.fill();
    c.fillStyle = "#fff";
    c.font = "700 13px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("Tên – Lv5", 60, 61);
    return;
  }
  c.fillStyle = SKIN;
  c.beginPath();
  c.arc(60, 66, 26, 0, 7);
  c.fill();
  c.fillStyle = HAIR;
  c.beginPath();
  c.arc(60, 60, 26, Math.PI * 1.05, Math.PI * 1.95);
  c.fill();
  if (slot === "hat") gmHat(c, id, 60, 44, 2.4);
  if (slot === "glass") gmGlass(c, id, 60, 68, 2.6);
}

/* gắn vào vẽ nhân vật — called every frame by the avatar layer via `gmDrawAc` hook. */
export function gmDrawAc(
  ctx: Ctx,
  o: PlayerState,
  isMe: boolean,
  now: number,
  x: number,
  eyeY: number,
  petY: number,
  back: boolean,
  k?: number,
): void {
  k = k || 0.34;
  const ac = String(isMe ? gmAc() : o.ac || "0,0,0,0")
    .split(",")
    .map(Number);
  const [h, gl, pt] = ac;
  if (gl && !back) gmGlass(ctx, gl, x, eyeY, k * 4.2);
  if (h) gmHat(ctx, h, x, eyeY - 40 * k, k * 4.4);
  if (pt) gmPet(ctx, pt, x + 20, petY, 1.1, now);
}

export function gmTagColor(o: PlayerState, isMe: boolean): string | null {
  const t = Number(String(isMe ? gmAc() : o.ac || "0,0,0,0").split(",")[3]) || 0;
  const it = GM_SHOP.tag.items.find((i) => i[0] === t);
  return it ? (it[4] as string) : null;
}
