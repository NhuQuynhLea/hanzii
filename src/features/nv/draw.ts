/**
 * Overlay canvas: nhãn khoá khu vực + mũi tên chỉ đường nhiệm vụ
 * (nv-quest.js `drawQuest`).
 */
import { me, target, zoneNow } from "@/game/engine/state";
import {
  BUILD,
  BOOTHS,
  CLASS_DOORS,
  NPC_CAMPUS,
} from "@/game/world/geometry";
import { getCurLevel } from "@/lib/curriculum";
import { usePlayer } from "@/stores/player";
import { callHook } from "@/services/hooks";
import { SOON_Z, NV_LOCK, soonLocked, nvLocked } from "./locks";
import { nvCurrent } from "./tasks";
import { nvOpenChat } from "./chat";

let nvWalk: string | null = null;

export function drawQuest(ctx: CanvasRenderingContext2D, now: number): void {
  if (!usePlayer.getState().entered) return;
  callHook("drawComm", ctx, now);

  // khoá
  ctx.font = '700 11px "Be Vietnam Pro",sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const z in SOON_Z) {
    if (!soonLocked(z)) continue;
    let x: number, y: number;
    const b = BUILD.find((q) => q.id === z);
    if (b) {
      x = b.dx;
      y = b.dy + 12;
    } else {
      const g = BOOTHS.find((q) => q.id === z);
      if (!g) continue;
      x = g.fx;
      y = g.fy - 6;
    }
    const txt = "🔒 Ra mắt 30/11";
    const w = ctx.measureText(txt).width + 18;
    ctx.fillStyle = "rgba(200,16,46,.92)";
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 12, w, 24, 12);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(txt, x, y + 0.5);
  }
  for (const z in NV_LOCK) {
    if (!nvLocked(z)) continue;
    let x: number, y: number;
    const b = BUILD.find((q) => q.id === z);
    if (b) {
      x = b.dx;
      y = b.dy + 12;
    } else {
      const g = BOOTHS.find((q) => q.id === z);
      if (!g) continue;
      x = g.fx;
      y = g.fy - 6;
    }
    const txt = "🔒 Ngày " + NV_LOCK[z].day;
    const w = ctx.measureText(txt).width + 16;
    ctx.fillStyle = "rgba(5,3,73,.85)";
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 11, w, 22, 11);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(txt, x, y + 0.5);
  }

  if (nvWalk && !target) {
    if (nvWalk === "chat" && zoneNow === "ai") {
      nvWalk = null;
      setTimeout(nvOpenChat, 200);
    } else nvWalk = null;
  }

  const cur = nvCurrent();
  if (!cur || cur.k === "rev" || me.sc) return;
  let tx: number, ty: number;
  if (cur.k === "learn") {
    const d = CLASS_DOORS[getCurLevel() - 1];
    tx = d.x;
    ty = BUILD[0].dy - 6;
  } else {
    tx = NPC_CAMPUS.x;
    ty = NPC_CAMPUS.y - 70;
  }
  const bob = Math.sin(now / 220) * 5;
  ctx.fillStyle = "#EA0000";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tx, ty + bob);
  ctx.lineTo(tx - 13, ty - 16 + bob);
  ctx.lineTo(tx - 5, ty - 16 + bob);
  ctx.lineTo(tx - 5, ty - 30 + bob);
  ctx.lineTo(tx + 5, ty - 30 + bob);
  ctx.lineTo(tx + 5, ty - 16 + bob);
  ctx.lineTo(tx + 13, ty - 16 + bob);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  const dx = tx - me.x,
    dy = ty - me.y,
    L = Math.hypot(dx, dy);
  if (L > 140) {
    const ux = dx / L,
      uy = dy / L,
      px = me.x + ux * 36,
      py = me.y - 14 + uy * 36,
      a = Math.atan2(uy, ux);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a);
    ctx.fillStyle = "rgba(234,0,0,.9)";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-6, -7);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
