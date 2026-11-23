/** Interior scene geometry — collision, zones, seats (scene-class/pron/lib/community). */
import { R } from "@/game/world/geometry";

export const CW = 900;
export const CH = 640;

/* ---------- Lớp học (sc=1) ---------- */
export const SEATS: { x: number; y: number }[] = [];
[300, 410, 520].forEach((y) => [210, 370, 530, 690].forEach((x) => SEATS.push({ x, y })));
export const BOARD = { x: 210, y: 36, w: 480, h: 110 };
export const SHELF = { x: 812, y: 200, w: 62, h: 270 };
export const DOOR = { x: 26, y: 588, w: 100, h: 48 };
export const NPC_CLASS = { x: 592, y: 212 };

const CBLOCK = [
  ...SEATS.map((p) => ({ t: "r" as const, x: p.x - 60, y: p.y - 52, w: 120, h: 40 })),
  { t: "r" as const, x: 375, y: 186, w: 150, h: 40 },
  { t: "r" as const, ...SHELF },
  { t: "c" as const, x: NPC_CLASS.x, y: NPC_CLASS.y, r: 12 },
  { t: "c" as const, x: 70, y: 250, r: 18 },
  { t: "c" as const, x: 70, y: 470, r: 18 },
];

export function cblocked(x: number, y: number): boolean {
  if (x < 20 + R || x > CW - 20 - R || y < 186 || y > CH - 10) return true;
  for (const b of CBLOCK) {
    if (b.t === "r") {
      const cx = Math.max(b.x, Math.min(x, b.x + b.w));
      const cy = Math.max(b.y, Math.min(y, b.y + b.h));
      if ((x - cx) ** 2 + (y - cy) ** 2 < R * R) return true;
    } else if ((x - b.x) ** 2 + (y - b.y) ** 2 < (b.r + R) ** 2) return true;
  }
  return false;
}

/* ---------- Phòng phát âm (sc=2) ---------- */
export const PBOOTH = [
  { lv: 1, x: 180, col: "#EA0000", zh: "一级" },
  { lv: 2, x: 450, col: "#050349", zh: "二级" },
  { lv: 3, x: 720, col: "#2E7D4F", zh: "三级" },
];
export const MIRROR = { x: 690, y: 500 };
export const RPT = { x: 440, y: 540 }; // bàn nhập vai (roleplay.js)

const PBLOCK = [
  ...PBOOTH.map((b) => ({ t: "r" as const, x: b.x - 80, y: 186, w: 160, h: 40 })),
  { t: "c" as const, x: 860, y: 560, r: 18 },
  { t: "c" as const, x: 860, y: 240, r: 18 },
];

export function pblocked(x: number, y: number): boolean {
  if (x < 20 + R || x > CW - 20 - R || y < 186 || y > CH - 10) return true;
  if (x > RPT.x - 52 - R && x < RPT.x + 52 + R && y > RPT.y - 18 - R && y < RPT.y + 18 + R) return true;
  for (const b of PBLOCK) {
    if (b.t === "r") {
      const cx = Math.max(b.x, Math.min(x, b.x + b.w));
      const cy = Math.max(b.y, Math.min(y, b.y + b.h));
      if ((x - cx) ** 2 + (y - cy) ** 2 < R * R) return true;
    } else if ((x - b.x) ** 2 + (y - b.y) ** 2 < (b.r + R) ** 2) return true;
  }
  return false;
}

/* ---------- Phòng chung (sc=3 thư viện, 4 tư vấn, 5 nhà sinh hoạt) ---------- */
export interface RoomSpec {
  sc: number;
  zh: string;
  vi: string;
  wall: [string, string];
  floor: [string, string];
  band: string;
}
export const RS: Record<string, RoomSpec> = {
  thu: { sc: 3, zh: "图书馆", vi: "Thư viện", wall: ["#F3E9D6", "#FBF5EA"], floor: ["#B98B5E", "#A4774C"], band: "#5A3A22" },
  tuvan: { sc: 4, zh: "咨询台", vi: "Văn phòng tuyển sinh", wall: ["#FCEFEF", "#FFF8F6"], floor: ["#D9CBB8", "#C9B9A3"], band: "#A61E22" },
  cd: { sc: 5, zh: "社团中心", vi: "Nhà sinh hoạt", wall: ["#F4EFE6", "#FBF9F5"], floor: ["#D8BE95", "#CDB185"], band: "#A84A35" },
};
export const RID: Record<number, string> = { 3: "thu", 4: "tuvan", 5: "cd" };

export const LSHELF = [{ x: 70, c: "#EA0000" }, { x: 350, c: "#050349" }, { x: 630, c: "#2E7D4F" }];
export const LTABLE = [{ x: 250, y: 350 }, { x: 560, y: 350 }, { x: 250, y: 480 }, { x: 560, y: 480 }];
export const DESK = { x: 300, y: 196, w: 300, h: 52 };
export const MAI = { x: 640, y: 262 };
export const CCH = [{ x: 405, y: 292 }, { x: 495, y: 292 }, { x: 470, y: 452 }, { x: 690, y: 452 }];
export const CTBL = [{ x: 470, y: 418 }, { x: 690, y: 418 }];
export const WATER = { x: 70, y: 214 };
export const CDT = [
  { x: 240, y: 300 }, { x: 460, y: 300 }, { x: 680, y: 300 },
  { x: 240, y: 470 }, { x: 460, y: 470 }, { x: 680, y: 470 },
];
export const CDNB = { x: 560, y: 30, w: 270, h: 118 };

export function rblocked(x: number, y: number, sc: number): boolean {
  if (x < 20 + R || x > CW - 20 - R || y < 186 || y > CH - 10) return true;
  if (sc === 5) {
    for (const t of CDT) if (((x - t.x) / (46 + R)) ** 2 + ((y - t.y) / (30 + R)) ** 2 < 1) return true;
    if (y < CDNB.y + CDNB.h + 40 && x > CDNB.x - 10 && x < CDNB.x + CDNB.w + 10 && y < 200) return true;
    return false;
  }
  const rects =
    sc === 3
      ? LTABLE.map((t) => ({ x: t.x - 90, y: t.y - 26, w: 180, h: 52 }))
      : [
          { x: DESK.x, y: DESK.y, w: DESK.w, h: DESK.h },
          { x: 112, y: 450, w: 176, h: 40 },
          { x: 800, y: 300, w: 50, h: 90 },
          { x: WATER.x - 14, y: WATER.y - 10, w: 28, h: 54 },
          ...CTBL.map((t) => ({ x: t.x - 30, y: t.y - 18, w: 60, h: 34 })),
        ];
  for (const b of [...rects, { x: 842, y: 540, w: 36, h: 44 }, { x: 842, y: 220, w: 36, h: 44 }]) {
    const cx = Math.max(b.x, Math.min(x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(y, b.y + b.h));
    if ((x - cx) ** 2 + (y - cy) ** 2 < R * R) return true;
  }
  if (sc === 4 && Math.hypot(x - MAI.x, y - MAI.y) < R + 16) return true;
  return false;
}

/* ---------- Zone detection ---------- */
export interface SceneZone {
  k: string;
  label?: string;
  i?: number;
  lv?: number;
  seat?: number;
}

type OtherPeek = { sc: number; cl: number; fl?: string; seat: number; x: number; y: number; rp?: boolean };

export function takenSeats(others: Iterable<OtherPeek>, meCl: number, meFl: string): Set<number> {
  const t = new Set<number>();
  for (const o of others) if (o.sc === 1 && o.cl === meCl && (o.fl || "hsk") === meFl && o.seat >= 0) t.add(o.seat);
  return t;
}
