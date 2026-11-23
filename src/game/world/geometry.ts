/** World geometry & collision — ported verbatim from game/js/world.js. */
import { ls } from "@/lib/storage";
import { GT_LESSONS } from "@/data/gt-data";

export const W = 1900;
export const H = 1000;
export const R = 13;
export const SPEED = 210;

export interface GtClassInfo {
  name: string;
  short: string;
  from: number;
  to: number;
  book: string;
}

export const GT_CLASS: Record<number, GtClassInfo> = {
  1: { name: "Nhập môn 1", short: "入门 1", from: 1, to: 15, book: "入门篇（上）" },
  2: { name: "Nhập môn 2", short: "入门 2", from: 16, to: 30, book: "入门篇（下）" },
  3: { name: "Cơ sở", short: "基础", from: 31, to: 55, book: "基础篇（上）+（下）" },
};

export function gtClassName(lv: number): string {
  return (GT_CLASS[lv] || GT_CLASS[1]).name;
}

/** tạm thời chỉ mở tầng Giao tiếp; đổi thành false để mở lại tầng HSK */
export const GT_ONLY = true;

export type FloorId = "hsk" | "gt";

/** Per-building floor selection (mutable; persisted per building). */
export const FLR: { lop: FloorId; thu: FloorId } = {
  lop: GT_ONLY || ls.get("nh:fl:lop") === "gt" ? "gt" : "hsk",
  thu: GT_ONLY || ls.get("nh:fl:thu") === "gt" ? "gt" : "hsk",
};

export function LVN(lv: number): string {
  return GT_ONLY ? gtClassName(lv) : "HSK " + lv;
}

export function LVS(): number[] {
  return GT_ONLY
    ? [1, 2, 3].filter((l) =>
        Object.keys(GT_LESSONS).some(
          (k) => Number(k) >= GT_CLASS[l].from && Number(k) <= GT_CLASS[l].to,
        ),
      )
    : [1, 2, 3];
}

export function clsName(lv: number, fl?: FloorId): string {
  return (fl || FLR.lop) === "gt" ? gtClassName(lv) : "HSK " + lv;
}

export interface Building {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  wall: number;
  roof: string;
  zh: string;
  vi: string;
  dx: number;
  dy: number;
  doors?: { lv: number; x: number }[];
}

const BUILD_BASE: Array<Omit<Building, "dx" | "dy"> & { dx?: number; dy?: number }> = [
  { id: "lop", x: 500, y: 96, w: 400, h: 214, wall: 60, roof: "#B3261E", zh: "教室", vi: "Giảng đường" },
  { id: "thu", x: 70, y: 140, w: 380, h: 170, wall: 56, roof: "#2F6B5E", zh: "图书馆", vi: "Thư viện" },
  { id: "am", x: 990, y: 142, w: 300, h: 170, wall: 50, roof: "#24395E", zh: "发音室", vi: "Phòng phát âm" },
  { id: "tuvan", x: 100, y: 612, w: 330, h: 108, wall: 50, roof: "#B3261E", zh: "咨询台", vi: "Tuyển sinh" },
  { id: "cd", x: 950, y: 641, w: 350, h: 88, wall: 44, roof: "#B3261E", zh: "社团中心", vi: "Nhà sinh hoạt" },
];

/** dịch cả khuôn viên sang phải cho cân với khu vui chơi */
export const OX = 40;

export const BUILD: Building[] = BUILD_BASE.map((b) => {
  const x = b.x + OX;
  return { ...b, x, dx: x + b.w / 2, dy: b.y + b.h + b.wall } as Building;
});
BUILD[0].doors = [
  { lv: 1, x: 590 + OX },
  { lv: 2, x: 700 + OX },
  { lv: 3, x: 810 + OX },
];
export const CLASS_DOORS = BUILD[0].doors!;

export const PLAZA = { x: 700 + OX, y: 610, r: 125 };

export interface Tree {
  x: number;
  y: number;
  r: number;
  k?: string;
}

export const TREES: Tree[] = [
  { x: 72, y: 440, r: 40 }, { x: 470, y: 900, r: 44 }, { x: 930, y: 900, r: 44 },
  { x: 120, y: 900, r: 50 }, { x: 1280, y: 900, r: 50 }, { x: 540, y: 520, r: 36 },
  { x: 845, y: 530, r: 32 }, { x: 985, y: 545, r: 38 }, { x: 1385, y: 690, r: 30 },
  { x: 1420, y: 470, r: 26 }, { x: 52, y: 80, r: 44 }, { x: 470, y: 66, r: 34 },
  { x: 930, y: 66, r: 34 }, { x: 1380, y: 84, r: 46 }, { x: 40, y: 300, r: 36 },
  { x: 476, y: 690, r: 34 }, { x: 1350, y: 600, r: 22 },
];
["lieu", "tron", "dao", "tron", "dao", "dao", "dao", "tron", "tron", "tron", "tron", "tron", "dao", "tron", "tron", "tron", "tron"].forEach(
  (k, i) => {
    if (TREES[i]) TREES[i].k = k;
  },
);

export const POND = { x: 265 + OX, y: 512, rx: 96, ry: 50 };
export const BRIDGE_Y = POND.y + 16;
export const BRIDGE_HW = 14;

export const ROCKS: [number, number][] = [
  [470, 600], [1330, 520], [1010, 890], [388, 872], [1110, 850], [160, 700],
];
export const LANTERNS: [number, number][] = [
  [640, 500], [760, 500], [640, 720], [760, 720], [640, 880], [760, 880],
  [452, 470], [880, 470], [1480, 520], [1830, 520], [1480, 880], [1830, 880],
];
TREES.forEach((t) => {
  if (t.x < 1340) t.x += OX;
});
ROCKS.forEach((r) => {
  if (r[0] < 1340) r[0] += OX;
});
LANTERNS.forEach((l) => {
  if (l[0] < 1340) l[0] += OX;
});

export interface Booth {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  col: string;
  zh: string;
  vi: string;
  fx: number;
  fy: number;
}

export const BOOTHS: Booth[] = [
  { id: "g1", x: 1475, y: 180, w: 120, h: 120, col: "#EA0000", zh: "连连看", vi: "Nối từ" },
  { id: "g2", x: 1715, y: 180, w: 120, h: 120, col: "#050349", zh: "拼汉字", vi: "Ghép chữ" },
  { id: "g3", x: 1475, y: 560, w: 120, h: 120, col: "#2E7D4F", zh: "排句子", vi: "Xếp câu" },
  { id: "g4", x: 1715, y: 560, w: 120, h: 120, col: "#B7791F", zh: "听声调", vi: "Nghe thanh điệu" },
].map((b) => ({ ...b, fx: b.x + b.w / 2, fy: b.y + b.h + 26 }));

export const CAROUSEL = { x: 1655, y: 240, r: 44 };
export const BALLOONS = { x: 1655, y: 615 };
export const HONOR = { x: 1125 + OX, y: 470, w: 184, h: 132 };
export const ARCH = { x: 1448, y1: 380, y2: 480 };
export const BENCHES: [number, number, number][] = [
  [560 + OX, 610, 1],
  [840 + OX, 610, 1],
  [700 + OX, 745, 0],
];

export type Blocker =
  | { t: "r"; x: number; y: number; w: number; h: number }
  | { t: "c"; x: number; y: number; r: number }
  | { t: "e"; x: number; y: number; rx: number; ry: number; br?: number; by?: number };

export const blockers: Blocker[] = [
  { t: "e", x: POND.x, y: POND.y, rx: POND.rx, ry: POND.ry, br: 11, by: BRIDGE_Y },
  ...BUILD.map((b): Blocker => ({ t: "r", x: b.x, y: b.y, w: b.w, h: b.h + b.wall - 8 })),
  { t: "c", x: PLAZA.x, y: PLAZA.y, r: 36 },
  ...TREES.map((t): Blocker => ({ t: "c", x: t.x, y: t.y + t.r * 0.25, r: t.r * 0.32 })),
  { t: "c", x: 612 + OX, y: 960, r: 16 },
  { t: "c", x: 788 + OX, y: 960, r: 16 },
  { t: "c", x: 592 + OX, y: 712, r: 12 },
  ...BOOTHS.map((b): Blocker => ({ t: "r", x: b.x, y: b.y, w: b.w, h: b.h })),
  { t: "c", x: CAROUSEL.x, y: CAROUSEL.y, r: CAROUSEL.r - 4 },
  { t: "c", x: BALLOONS.x, y: BALLOONS.y, r: 14 },
  { t: "r", x: HONOR.x - HONOR.w / 2, y: HONOR.y + HONOR.h - 14, w: HONOR.w, h: 8 },
  { t: "c", x: ARCH.x, y: ARCH.y1, r: 9 },
  { t: "c", x: ARCH.x, y: ARCH.y2, r: 9 },
];

export function blocked(x: number, y: number): boolean {
  if (x < 44 + R || x > W - 44 - R || y < 44 + R || y > H - 46) return true;
  if (y > 935 && (x < 620 + OX || x > 780 + OX)) return true;
  for (const b of blockers) {
    if (b.t === "r") {
      const cx = Math.max(b.x, Math.min(x, b.x + b.w));
      const cy = Math.max(b.y, Math.min(y, b.y + b.h));
      if ((x - cx) ** 2 + (y - cy) ** 2 < R * R) return true;
    } else if (b.t === "e") {
      if (b.br && b.by != null && Math.abs(y - b.by) < b.br) continue;
      if (((x - b.x) / (b.rx + R)) ** 2 + ((y - b.y) / (b.ry + R)) ** 2 < 1) return true;
    } else if ((x - b.x) ** 2 + (y - b.y) ** 2 < (b.r + R) ** 2) return true;
  }
  return false;
}

export const NPC_CAMPUS = { x: 592 + OX, y: 712 };

export function zoneOf(x: number, y: number): string {
  for (const b of BOOTHS) if (Math.hypot(x - b.fx, y - b.fy) < 52) return b.id;
  if (Math.hypot(x - HONOR.x, y - (HONOR.y + HONOR.h + 20)) < 62) return "vang";
  if (Math.hypot(x - NPC_CAMPUS.x, y - NPC_CAMPUS.y) < 70) return "ai";
  if (((x - POND.x) / (POND.rx + 34)) ** 2 + ((y - POND.y) / (POND.ry + 26)) ** 2 < 1) return "ho";
  for (const dr of CLASS_DOORS) if (Math.hypot(x - dr.x, y - (BUILD[0].dy + 30)) < 52) return "lop" + dr.lv;
  for (const b of BUILD) if (!b.doors && Math.hypot(x - b.dx, y - (b.dy + 30)) < 85) return b.id;
  if (Math.hypot(x - PLAZA.x, y - PLAZA.y) < PLAZA.r + 20) return "san";
  if (x > 1440) return "choi";
  if (y > 860) return "cong";
  return "khuon";
}

export const ZONES: Record<string, string> = {
  g1: "Gian Nối từ", g2: "Gian Ghép chữ", g3: "Gian Xếp câu", g4: "Gian Nghe thanh điệu",
  vang: "Bảng vàng thành tích", vinh: "Nhà vinh danh 光荣堂", choi: "Khu vui chơi",
  lop1: "Lớp 1 – HSK 1 / Nhập môn 1", lop2: "Lớp 2 – HSK 2 / Nhập môn 2",
  lop3: "Lớp 3 – HSK 3 / Cơ sở", ho: "Hồ sen 荷塘", cd: "Trước Nhà sinh hoạt",
  ai: "Gặp Thầy Vương", lop: "Trước lớp học", thu: "Trước thư viện",
  am: "Trước phòng phát âm", tuvan: "Văn phòng tuyển sinh", san: "Sân trường",
  cong: "Cổng trường", khuon: "Khuôn viên",
};

export const ENTER: Record<string, string> = {
  g1: "Chơi Nối từ", g2: "Chơi Ghép chữ", g3: "Chơi Xếp câu", g4: "Chơi Nghe thanh điệu",
  vang: "Xem bảng thành tích", vinh: "Xem bảng thành tích",
  lop1: "Vào lớp 1", lop2: "Vào lớp 2", lop3: "Vào lớp 3",
  ai: "Hỏi Thầy Vương", ho: "Đọc bia hồ sen", lop: "Vào lớp học",
  thu: "Vào thư viện", am: "Vào phòng phát âm", tuvan: "Vào văn phòng tuyển sinh", cd: "Vào Nhà sinh hoạt",
};

if (GT_ONLY) {
  [1, 2, 3].forEach((l) => {
    ZONES["lop" + l] = "Trước lớp " + GT_CLASS[l].name;
    ENTER["lop" + l] = "Vào lớp " + GT_CLASS[l].name;
  });
}
