/**
 * Canvas painters (community.js + cdq.js): bàn tròn & bảng tin trong
 * Nhà sinh hoạt (drawCDTables2 → hook "drawClub"), mừng thử thách tuần
 * trên sân trường (drawComm → hook "drawComm"/"drawQuest").
 */
import { PLAZA } from "@/game/world/geometry";
import { CDT, CDNB } from "@/game/scenes/geometry-rooms";
import { COMM, cdGroups, commTotal, gpNameOf, GP_MAX, type CommPeer } from "./community";
import { CDG, cdqAt, cdqActiveAt, type Qz } from "./cdq-core";

/* ---------- avatar.js `pill` (+ nh-icons.js `nhStrip`) ---------- */
const NHI_KEYS =
  "🔊|🔒|🔓|🎙|📚|⚔|🔥|⚡|🎯|💡|⬇|🎉|✋|👋|🥇|🥈|🥉|👥|🎁|🗂|⏹|📖|🏫|🧩|⭐|🏆|⏰|✍|❄|☕|💪|🎒|🏅|👂|🗺|⏱|🙈|🎧|❌|🎵|📕|🙏|🔁|📤|🐢|💯|🙋|🧱|💬|🏮|👏|🏯|📍|👀|💰|🍵|💧|🌳|🚪|🌇|🍜|🏦|🛏|📱|📄|🌐|🎲|🙇";
const NHI_STRIP = new RegExp(`(${NHI_KEYS})\\uFE0F?\\s*`, "gu");
export function nhStrip(t: string): string {
  return String(t).replace(NHI_STRIP, "").trim();
}

export function pill(
  ctx: CanvasRenderingContext2D,
  t: string,
  x: number,
  y: number,
  bg: string,
  fg: string,
  size = 12,
): void {
  t = nhStrip(t);
  ctx.font = `600 ${size}px "Be Vietnam Pro",system-ui,sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const w = ctx.measureText(t).width + 18,
    hh = size * 1.75;
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - hh / 2 + 1.5, w, hh, hh / 2);
  ctx.fill();
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - hh / 2, w, hh, hh / 2);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.fillText(t, x, y + 0.5);
}

/* ---------- community.js `drawComm` — pháo giấy quanh quảng trường ---------- */
export function drawComm(ctx: CanvasRenderingContext2D, now: number): void {
  if (commTotal() < COMM.goal) return;
  const P = PLAZA;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + now / 4000,
      x = P.x + Math.cos(a) * (P.r + 18),
      y = P.y + Math.sin(a) * (P.r * 0.55 + 14);
    ctx.fillStyle = "#C62828";
    ctx.beginPath();
    ctx.ellipse(x, y - 18 + Math.sin(now / 500 + i) * 2, 7, 9, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#F4C95D";
    ctx.fillRect(x - 4, y - 28, 8, 3);
  }
  for (let i = 0; i < 14; i++) {
    const t = ((now / 1400) + i / 14) % 1,
      a = i * 2.4,
      r = 20 + t * 70;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = ["#F4C95D", "#EA0000", "#ffffff"][i % 3];
    ctx.beginPath();
    ctx.arc(P.x + Math.cos(a) * r, P.y - 150 + Math.sin(a) * r * 0.6, 3, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  pill(ctx, "🎉 Cả trường đạt thử thách tuần!", P.x, P.y - 205, "#EA0000", "#fff", 13);
}

/* ---------- community.js `drawCDTables` (bản cũ — giữ để tương thích) ---------- */
export function drawCDTables(ctx: CanvasRenderingContext2D, _now: number): void {
  const G = cdGroups();
  CDT.forEach((t, i) => {
    const gg = G[i];
    if (gg) {
      const col = gg.mine ? "#2E7D4F" : "#14213D";
      pill(ctx, `👥 ${gg.name}`, t.x, t.y - 52, col, "#fff", 12);
      pill(ctx, `${gg.member_count}/${GP_MAX} – ${gg.week_points} điểm tuần`, t.x, t.y - 30, "#fff", col, 11);
      ctx.fillStyle = "#C8102E";
      ctx.font = '700 13px "Noto Serif SC",serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(gg.mine ? "我们" : "小组", t.x, t.y + 1);
    } else {
      ctx.fillStyle = "rgba(20,33,61,.45)";
      ctx.font = '600 11px "Be Vietnam Pro",sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Bàn trống", t.x, t.y - 4);
      ctx.fillText("– Lập nhóm –", t.x, t.y + 10);
    }
  });
  pill(ctx, "Bảng tin – Lập nhóm mới", CDNB.x + CDNB.w / 2, CDNB.y + CDNB.h + 18, "#fff", "#14213D", 12);
}

/* ---------- cdq.js `cdItem` — đồ trang trí trên bàn trống ---------- */
export function cdItem(ctx: CanvasRenderingContext2D, k: number, x: number, y: number): void {
  const c = ctx;
  c.save();
  c.translate(x, y - 4);
  c.lineJoin = "round";
  c.lineCap = "round";
  const sh = () => {
    c.fillStyle = "rgba(60,35,15,.18)";
    c.beginPath();
    c.ellipse(0, 10, 13, 4, 0, 0, 7);
    c.fill();
  };
  sh();
  if (k % 6 === 0) {
    // lọ hoa
    (
      [
        ["#E5262F", -7, -20],
        ["#F4A6B8", 0, -25],
        ["#FFD166", 7, -20],
        ["#E5262F", 3, -16],
        ["#F4A6B8", -4, -14],
      ] as [string, number, number][]
    ).forEach(([col, fx, fy]) => {
      c.strokeStyle = "#3E7C59";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(0, -4);
      c.lineTo(fx, fy);
      c.stroke();
      c.fillStyle = col;
      c.beginPath();
      c.arc(fx, fy, 3.6, 0, 7);
      c.fill();
    });
    c.fillStyle = "#2F5E9E";
    c.beginPath();
    c.moveTo(-5, -6);
    c.quadraticCurveTo(-10, 2, -6, 10);
    c.lineTo(6, 10);
    c.quadraticCurveTo(10, 2, 5, -6);
    c.closePath();
    c.fill();
    c.fillStyle = "#FFFFFF";
    c.globalAlpha = 0.6;
    c.fillRect(-4, 0, 8, 2);
    c.globalAlpha = 1;
  } else if (k % 6 === 1) {
    // ấm trà
    c.fillStyle = "#C8102E";
    c.beginPath();
    c.ellipse(0, 2, 11, 8, 0, 0, 7);
    c.fill();
    c.strokeStyle = "#C8102E";
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(10, 0);
    c.quadraticCurveTo(18, -2, 17, -8);
    c.stroke();
    c.beginPath();
    c.arc(-12, 2, 4, Math.PI * 0.5, Math.PI * 1.5);
    c.stroke();
    c.fillStyle = "#8E0B20";
    c.beginPath();
    c.ellipse(0, -6, 6, 2.5, 0, 0, 7);
    c.fill();
    c.beginPath();
    c.arc(0, -9, 2, 0, 7);
    c.fill();
    c.fillStyle = "#FFE7A8";
    c.fillRect(-6, 1, 12, 1.6);
  } else if (k % 6 === 2) {
    // chậu cây nhỏ
    c.fillStyle = "#3E7C59";
    (
      [
        [-6, -12, 7, 4, -0.5],
        [6, -12, 7, 4, 0.5],
        [0, -17, 4, 8, 0],
        [-3, -8, 6, 3, -0.3],
        [4, -7, 6, 3, 0.3],
      ] as number[][]
    ).forEach(([lx, ly, rx, ry, r]) => {
      c.beginPath();
      c.ellipse(lx, ly, rx, ry, r, 0, 7);
      c.fill();
    });
    c.fillStyle = "#B4541E";
    c.beginPath();
    c.moveTo(-8, -4);
    c.lineTo(8, -4);
    c.lineTo(6, 10);
    c.lineTo(-6, 10);
    c.closePath();
    c.fill();
    c.fillStyle = "#8A3E14";
    c.fillRect(-9, -5, 18, 3);
  } else if (k % 6 === 3) {
    // chồng sách
    (
      [
        ["#1C1A6B", -10, 4, 20],
        ["#C8102E", -9, -1, 19],
        ["#0F766E", -11, -6, 18],
      ] as [string, number, number, number][]
    ).forEach(([col, bx, by, w]) => {
      c.fillStyle = col;
      c.fillRect(bx, by, w, 5);
      c.fillStyle = "#FFF8EC";
      c.fillRect(bx + w - 3, by + 1, 2, 3);
    });
    c.fillStyle = "#FFD166";
    c.fillRect(-2, -10, 2, 6);
  } else if (k % 6 === 4) {
    // đèn lồng
    c.strokeStyle = "#5A3820";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0, -22);
    c.lineTo(0, -16);
    c.stroke();
    c.fillStyle = "#E2B14A";
    c.fillRect(-5, -17, 10, 3);
    c.fillRect(-5, 6, 10, 3);
    c.fillStyle = "#E5262F";
    c.beginPath();
    c.ellipse(0, -4, 10, 10, 0, 0, 7);
    c.fill();
    c.strokeStyle = "rgba(0,0,0,.18)";
    c.lineWidth = 1;
    [-5, 0, 5].forEach((dx) => {
      c.beginPath();
      c.ellipse(dx * 0.4, -4, Math.abs(dx) ? 6 : 1, 10, 0, 0, 7);
      c.stroke();
    });
    c.strokeStyle = "#E2B14A";
    c.beginPath();
    c.moveTo(0, 9);
    c.lineTo(0, 14);
    c.stroke();
  } else {
    // khay trà hai chén
    c.fillStyle = "#7A4A24";
    c.beginPath();
    c.ellipse(0, 4, 15, 6, 0, 0, 7);
    c.fill();
    (
      [
        [-6, 0],
        [6, 0],
      ] as number[][]
    ).forEach(([cx, cy]) => {
      c.fillStyle = "#FFFFFF";
      c.beginPath();
      c.moveTo(cx - 5, cy - 4);
      c.lineTo(cx + 5, cy - 4);
      c.lineTo(cx + 3, cy + 3);
      c.lineTo(cx - 3, cy + 3);
      c.closePath();
      c.fill();
      c.fillStyle = "#9C6B2F";
      c.beginPath();
      c.ellipse(cx, cy - 4, 4.5, 1.6, 0, 0, 7);
      c.fill();
      c.strokeStyle = "#2F5E9E";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(cx - 3.5, cy - 1);
      c.lineTo(cx + 3.5, cy - 1);
      c.stroke();
    });
  }
  c.restore();
}

/* ---------- cdq.js `drawCDTables2` — overlay Nhà sinh hoạt ---------- */
export function drawCDTables2(ctx: CanvasRenderingContext2D, _now: number): void {
  const G = cdGroups();
  CDT.forEach((t, i) => {
    const at = cdqAt(i),
      act = cdqActiveAt(i),
      gg = G[i];
    const seal = (txt: string) => {
      ctx.fillStyle = "#C8102E";
      ctx.font = '700 13px "Noto Serif SC",serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, t.x, t.y + 1);
    };
    if (at.length) {
      const pa = at as CommPeer[],
        gm = (pa.find((o) => o.qz && o.qz.gm) || ({} as CommPeer)).qz,
        gname = gm && gm.gm ? gpNameOf(gm.gm) : "",
        gi = CDG[((act || (pa[0] && pa[0].qz) || ({} as Qz)).g as string)] || CDG.do;
      pill(ctx, gname || gi.name, t.x, t.y - 58, gname ? "#2E7D4F" : "#C8102E", "#fff", 12);
      pill(ctx, `${at.length} người ${act ? "đang chơi" : "đang ngồi"}` + (gname ? ` – ${gi.name}` : ""), t.x, t.y - 36, "#fff", "#14213D", 11);
      seal("比赛");
      return;
    }
    if (gg) {
      const col = gg.mine ? "#2E7D4F" : "#14213D";
      pill(ctx, gg.name, t.x, t.y - 58, col, "#fff", 12);
      pill(ctx, `${gg.member_count}/${GP_MAX} – ${gg.week_points} điểm tuần`, t.x, t.y - 36, "#fff", col, 11);
      seal(gg.mine ? "我们" : "小组");
      return;
    }
    cdItem(ctx, i, t.x, t.y);
  });
  pill(ctx, "Bảng tin – Nhóm học", CDNB.x + CDNB.w / 2, CDNB.y + CDNB.h + 18, "#fff", "#14213D", 12);
}
