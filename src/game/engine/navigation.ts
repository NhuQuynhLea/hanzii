/**
 * Scene navigation + zone actions (nav.js + per-scene zone/action fns).
 * Feature entry points (openLesson, openAI, openRoom, games, gt hooks…) are
 * resolved via the hook registry so this module stays feature-free.
 */
import { me, keys, setTarget, target, setZoneNow } from "./state";
import {
  ENTER, BUILD, BOOTHS, CLASS_DOORS, blocked,
  GT_ONLY, GT_CLASS, FLR,
} from "@/game/world/geometry";
import {
  SEATS, BOARD, DOOR, NPC_CLASS,
  PBOOTH, RPT, RS, RID, LSHELF, LTABLE, MAI, CCH, CDT, CDNB,
  type SceneZone,
} from "@/game/scenes/geometry-rooms";
import { usePlayer } from "@/stores/player";
import { usePresence } from "@/stores/presence";
import { useUi } from "@/stores/ui";
import { callHook } from "@/services/hooks";
import { sendMove } from "@/services/presence/runtime";
import { getCurLevel, setCurLevel, levelDay } from "@/lib/curriculum";

export const AUTO_ENTER = new Set([
  "lop1", "lop2", "lop3", "am", "thu", "tuvan", "cd", "g1", "g2", "g3", "g4",
]);

/* Auto-enter / auto-leave bookkeeping (nav.js globals). */
export const navState = {
  autoSkip: "",
  autoFired: false,
  zoneT: 0,
  outT: 0,
  outSkip: false,
  cz: null as SceneZone | null,
  pz: null as SceneZone | null,
  rz: null as SceneZone | null,
  campusPos: null as { x: number; y: number } | null,
};

/** người chơi đang chủ động đi về phía đó */
export function pushing(dir: string): boolean {
  if (keys.has(dir)) return true;
  if (!target) return false;
  return dir === "u" ? target.y < me.y - 2 : dir === "d" ? target.y > me.y + 2 : dir === "l" ? target.x < me.x - 2 : target.x > me.x + 2;
}

export function outReady(skip: boolean): boolean {
  return !skip && !useUi.getState().room.open && ((me.d === 0 && pushing("d")) || (me.d === 1 && pushing("l")));
}

function classCount(lv: number): number {
  let n = 0;
  usePresence.getState().others.forEach((o) => {
    if (o.sc === 1 && o.cl === lv) n++;
  });
  return n;
}

export function enterText(z: string): string {
  if (z === "am") {
    let n = 0;
    usePresence.getState().others.forEach((o) => {
      if (o.sc === 2) n++;
    });
    return ENTER.am + (n ? ` (${n} người đang luyện)` : "");
  }
  const m = /^lop(\d)$/.exec(z);
  if (!m) return ENTER[z];
  const n = classCount(+m[1]);
  return ENTER[z] + (n ? ` (${n} người đang học)` : "");
}

export function doorPt(z: string): { x: number; y: number } | null {
  const m = /^lop(\d)$/.exec(z);
  if (m) {
    const dr = CLASS_DOORS[+m[1] - 1];
    return dr ? { x: dr.x, y: BUILD[0].dy + 7 } : null;
  }
  const b = BUILD.find((q) => q.id === z);
  if (b) return { x: b.dx, y: b.dy + 7 };
  const g = BOOTHS.find((q) => q.id === z);
  return g ? { x: g.fx, y: g.fy - 10 } : null;
}

export function atDoor(z: string): boolean {
  const d = doorPt(z);
  if (!d) return true;
  return Math.abs(me.x - d.x) < 30 && me.y <= d.y + 12 && blocked(me.x, me.y - 6);
}

/** Nút "Vào…" / phím E */
export function enterClick(): void {
  const zoneNow = useUi.getState().zone;
  if (me.sc === 0 && AUTO_ENTER.has(zoneNow) && !atDoor(zoneNow)) {
    const d = doorPt(zoneNow);
    if (d) setTarget({ x: d.x, y: d.y - 20 });
    return;
  }
  doEnter();
}

export function doEnter(): void {
  const zoneNow = useUi.getState().zone;
  if (me.sc === 0 && callHook("soonLocked", zoneNow)) return callHook("openSoon", zoneNow) as void;
  if (me.sc === 0 && callHook("nvLocked", zoneNow)) {
    useUi.getState().toast(String(callHook("nvLockMsg", zoneNow) || ""));
    return;
  }
  if (me.sc === 1) return classAction();
  if (me.sc === 2) return pronAction();
  if (me.sc >= 3) return roomAction();
  if (zoneNow === "thu" || zoneNow === "tuvan" || zoneNow === "cd") return enterRoomScene(zoneNow);
  if (zoneNow === "am") return enterPron();
  if (/^g\d$/.test(zoneNow)) return callHook("openGame", zoneNow) as void;
  if (zoneNow === "vang" || zoneNow === "vinh") return callHook("openBoard") as void;
  const m = /^lop(\d)$/.exec(zoneNow);
  if (m) return enterClass(+m[1]);
  if (zoneNow === "ai") callHook("openAI");
  else if (zoneNow === "ho") callHook("openLotus");
  else if (ENTER[zoneNow]) callHook("openRoom", zoneNow);
}

/* ---------- Lớp học ---------- */
export function enterClass(lv: number): void {
  navState.outSkip = true;
  lv = [1, 2, 3].includes(lv) ? lv : getCurLevel();
  me.cl = lv;
  setCurLevel(lv);
  usePlayer.getState().bump((S) => {
    if (!S.classes.includes(String(lv))) S.classes.push(String(lv));
  });
  navState.campusPos = { x: me.x, y: me.y };
  me.sc = 1;
  me.seat = -1;
  me.x = DOOR.x + DOOR.w / 2 + 30 + Math.random() * 56 - 28;
  me.y = 560 + Math.random() * 24 - 12;
  me.d = 3;
  me.m = 0;
  setTarget(null);
  keys.clear();
  navState.cz = { k: "_" };
  levelDay(lv, true);
  me.fl = FLR.lop;
  usePlayer.getState().setMe({}); // bump meSeq → React re-reads scene
  sendMove(true);
  if (GT_ONLY) {
    useUi.getState().toast(`Đã vào lớp ${gtClassName(lv)}. Bấm vào bảng hoặc nút "Học tiếp" để bắt đầu.`);
  } else {
    setTimeout(() => {
      if (me.sc === 1 && !useUi.getState().room.open) callHook("askFloor", "lop");
    }, 350);
  }
}

export function leaveClass(): void {
  navState.autoSkip = "lop" + me.cl;
  const b = BUILD[0];
  const dr = CLASS_DOORS.find((d) => d.lv === me.cl) || { x: b.dx };
  me.sc = 0;
  me.seat = -1;
  me.cl = 0;
  me.x = dr.x;
  me.y = b.dy + 34;
  me.d = 0;
  setZoneNow("");
  useUi.getState().setZone("");
  setTarget(null);
  usePlayer.getState().setMe({});
  sendMove(true);
}

export function classZone(): SceneZone | null {
  const x = me.x,
    y = me.y;
  if (me.seat >= 0) return { k: "stand", label: "Đứng dậy" };
  if (Math.hypot(x - (DOOR.x + DOOR.w / 2), y - 600) < 46) return { k: "out", label: "Ra ngoài" };
  if (FLR.lop === "gt") {
    const gz = callHook<SceneZone | null>("gtClassZone", x, y);
    if (gz) return gz;
  }
  if (Math.hypot(x - NPC_CLASS.x, y - NPC_CLASS.y) < 72) return { k: "ai", label: "Hỏi Thầy Vương" };
  const tk = takenSeats();
  for (let i = 0; i < SEATS.length; i++) {
    const p = SEATS[i];
    if (!tk.has(i) && Math.hypot(x - p.x, y - (p.y + 18)) < 38) return { k: "sit", seat: i, label: "Ngồi vào bàn" };
  }
  if (x > 730 && y > 190 && y < 490) return { k: "drive", label: "Mở tủ tài liệu" };
  if (y < 262 && x > BOARD.x && x < BOARD.x + BOARD.w)
    return { k: "board", label: FLR.lop === "gt" ? "Bảng lớn: từ mới, hội thoại" : "Xem bài trên bảng" };
  return null;
}

export function classAction(z?: SceneZone): void {
  z = z || navState.cz || undefined;
  if (!z) return;
  if (FLR.lop === "gt" && callHook<boolean>("gtClassAct", z)) return;
  if (z.k === "stand") {
    const p = SEATS[me.seat];
    me.seat = -1;
    me.x = p.x;
    me.y = p.y + 44;
    me.d = 0;
    sendMove(true);
  } else if (z.k === "sit") {
    me.seat = z.seat!;
    me.d = 3;
    me.sitT = performance.now();
    setTarget(null);
    keys.clear();
    sendMove(true);
    setTimeout(() => {
      if (me.sc === 1 && me.seat >= 0 && !useUi.getState().room.open) callHook("openLesson");
    }, 650);
  } else if (z.k === "out") leaveClass();
  else if (z.k === "ai") callHook("openAI");
  else if (z.k === "board") callHook("openLesson");
  else if (z.k === "drive") callHook("driveOrLibrary");
}

export function classClick(x: number, y: number): void {
  if (x >= BOARD.x - 12 && x <= BOARD.x + BOARD.w + 12 && y >= BOARD.y - 12 && y <= BOARD.y + BOARD.h + 20)
    return callHook("openLesson") as void;
  if (Math.hypot(x - NPC_CLASS.x, y - (NPC_CLASS.y - 14)) < 26) return callHook("openAI") as void;
  const tk = takenSeats();
  for (let i = 0; i < SEATS.length; i++) {
    const p = SEATS[i];
    if (!tk.has(i) && Math.hypot(x - p.x, y - (p.y + 18)) < 38) {
      setTarget({ x: p.x, y: p.y + 34 });
      return;
    }
  }
  setTarget({ x, y });
}

/* ---------- Phòng phát âm ---------- */
export function enterPron(): void {
  navState.outSkip = true;
  me.sc = 2;
  me.cl = 0;
  me.seat = -1;
  me.x = DOOR.x + DOOR.w / 2 + 30 + Math.random() * 56 - 28;
  me.y = 560 + Math.random() * 24 - 12;
  me.d = 3;
  me.m = 0;
  setTarget(null);
  keys.clear();
  navState.pz = { k: "_" };
  usePlayer.getState().setMe({});
  sendMove(true);
  useUi
    .getState()
    .toast(
      GT_ONLY
        ? "Đã vào phòng phát âm. Đi tới khu Nhập môn 1 để luyện từ của các bài Giao tiếp."
        : "Đã vào phòng phát âm. Đi tới khu HSK 1, 2 hoặc 3 để luyện.",
    );
}

export function leavePron(): void {
  navState.autoSkip = "am";
  const b = BUILD.find((x) => x.id === "am")!;
  me.sc = 0;
  me.seat = -1;
  me.cl = 0;
  me.x = b.dx;
  me.y = b.dy + 34;
  me.d = 0;
  setZoneNow("");
  useUi.getState().setZone("");
  setTarget(null);
  usePlayer.getState().setMe({});
  sendMove(true);
}

export function pronZone(): SceneZone | null {
  const x = me.x,
    y = me.y;
  if (Math.abs(x - RPT.x) < 125 && y > RPT.y - 52 && y < RPT.y + 72) return { k: "rp", label: "Hoàn thành hội thoại" };
  if (Math.hypot(x - (DOOR.x + DOOR.w / 2), y - 600) < 46) return { k: "out", label: "Ra ngoài" };
  for (const b of PBOOTH)
    if (((x - b.x) / 118) ** 2 + ((y - 330) / 80) ** 2 < 1 || (Math.abs(x - b.x) < 90 && y < 290))
      return { k: "lv", lv: b.lv, label: "Luyện phát âm " + lvName(b.lv) };
  return null;
}

export function pronAction(z?: SceneZone): void {
  z = z || navState.pz || undefined;
  if (!z) return;
  if (z.k === "out") leavePron();
  else if (z.k === "lv") callHook("openTrainer", "level", z.lv);
  else if (z.k === "mirror") callHook("openTrainer", "mirror");
  else if (z.k === "rp") callHook("openRoleplay");
}

export function pronClick(x: number, y: number): void {
  for (const b of PBOOTH)
    if (Math.abs(x - b.x) < 62 && y > 44 && y < 240) {
      setTarget({ x: b.x, y: 300 });
      return;
    }
  setTarget({ x, y });
}

/* ---------- Phòng chung ---------- */
export function enterRoomScene(id: string): void {
  navState.campusPos = { x: me.x, y: me.y };
  me.sc = RS[id].sc as 0 | 1 | 2 | 3 | 4 | 5;
  me.cl = 0;
  me.seat = -1;
  me.x = DOOR.x + DOOR.w / 2 + 40 + Math.random() * 56 - 28;
  me.y = 520 + Math.random() * 24 - 12;
  me.d = 3;
  me.m = 0;
  setTarget(null);
  keys.clear();
  navState.rz = { k: "_" };
  navState.outSkip = true;
  if (id === "thu") {
    me.fl = FLR.thu;
    usePlayer.getState().setMe({});
    sendMove(true);
    if (GT_ONLY) {
      useUi
        .getState()
        .toast(
          callHook<string>("thuToast") ||
            "Đã vào thư viện. Kệ: Từ của tôi – Giáo trình – Tài liệu. Bàn đọc là các trò ôn 1–2 phút.",
        );
    } else {
      setTimeout(() => {
        if (me.sc === 3 && !useUi.getState().room.open) callHook("askFloor", "thu");
      }, 350);
    }
    return;
  }
  usePlayer.getState().setMe({});
  sendMove(true);
  useUi
    .getState()
    .toast(
      id === "cd"
        ? "Đã vào Nhà sinh hoạt. Ngồi vào bàn để chơi với nhóm (nhập mã nhóm) hoặc chơi tự do, rồi chọn trò: Đố nhanh, Ghép cặp tốc độ, Nghe đoán thanh."
        : "Đã vào văn phòng tuyển sinh. Ngồi vào ghế trước quầy hoặc lại gần cô Mai để được tư vấn.",
    );
}

export function leaveRoomScene(): void {
  const id = RID[me.sc] || "thu";
  const b = BUILD.find((x) => x.id === id)!;
  navState.autoSkip = id;
  me.sc = 0;
  me.seat = -1;
  me.cl = 0;
  me.x = b.dx;
  me.y = b.dy + 34;
  me.d = 0;
  setZoneNow("");
  useUi.getState().setZone("");
  setTarget(null);
  usePlayer.getState().setMe({});
  sendMove(true);
}

export function roomZone(): SceneZone | null {
  const x = me.x,
    y = me.y;
  if (Math.hypot(x - (DOOR.x + DOOR.w / 2), y - 600) < 46) return { k: "out", label: "Ra ngoài" };
  if (me.sc === 5) {
    for (let i = 0; i < CDT.length; i++) {
      const t = CDT[i];
      if (((x - t.x) / 80) ** 2 + ((y - t.y) / 62) ** 2 < 1) {
        const label = callHook<string>("cdTableLabel", i) || "Ngồi vào bàn";
        return { k: "cdq", i, label };
      }
    }
    if (x > CDNB.x - 20 && x < CDNB.x + CDNB.w + 20 && y < 260) return { k: "cdnb", label: "Lập nhóm mới" };
    return null;
  }
  if (me.sc === 3) {
    if (!GT_ONLY && x > 770 && y > 520)
      return { k: "stair", label: FLR.thu === "gt" ? "Xuống tầng 1 – HSK" : "Lên tầng 2 – Giao tiếp" };
    if (FLR.thu === "gt")
      for (let i = 0; i < LTABLE.length; i++) {
        const t = LTABLE[i];
        const label = callHook<string>("libTableLabel", i);
        if (label && Math.abs(x - t.x) < 120 && y > t.y - 60 && y < t.y + 70) return { k: "ltab", i, label };
      }
    for (let i = 0; i < LSHELF.length; i++) {
      const s = LSHELF[i];
      if (x > s.x - 10 && x < s.x + 210 && y < 280)
        return {
          k: "lib",
          lv: i + 1,
          label:
            FLR.thu === "gt"
              ? callHook<string>("libShelfLabel", i) || "Giáo trình " + gtClassName(i + 1)
              : "Tài liệu HSK " + (i + 1),
        };
    }
  } else {
    for (let i = 0; i < CCH.length; i++)
      if (Math.hypot(x - CCH[i].x, y - CCH[i].y) < 24) return { k: "sitc", i, label: "Ngồi tư vấn" };
    if (Math.hypot(x - MAI.x, y - MAI.y) < 78) return { k: "mai", label: "Nói chuyện với cô Mai" };
  }
  return null;
}

export function roomAction(z?: SceneZone): void {
  z = z || navState.rz || undefined;
  if (!z) return;
  if (z.k === "out") leaveRoomScene();
  else if (z.k === "cdt") callHook("cdOpenTable", z.i);
  else if (z.k === "cdq") callHook("cdSit", z.i);
  else if (z.k === "cdnb") callHook("cdBoard");
  else if (z.k === "stair") callHook("askFloor", "thu");
  else if (z.k === "ltab") callHook("libTable", z.i);
  else if (z.k === "lib") {
    if (FLR.thu === "gt" && callHook<boolean>("openLibShelf", (z.lv || 1) - 1)) return;
    if (FLR.thu === "gt" && callHook<boolean>("openGTLib", z.lv || 1)) return;
    callHook("openRoomLib", z.lv || 0);
  } else if (z.k === "mai") callHook("openRoom", "tuvan");
  else if (z.k === "sitc") {
    me.rsit = z.i;
    me.sitT = performance.now();
    keys.clear();
    setTarget(null);
    me.d = 3;
    setTimeout(() => {
      if (me.rsit === z.i && me.sc === 4 && !useUi.getState().room.open) callHook("openRoom", "tuvan");
    }, 650);
  }
}

/* ---------- helpers ---------- */
function takenSeats(): Set<number> {
  const t = new Set<number>();
  usePresence.getState().others.forEach((o) => {
    if (o.sc === 1 && o.cl === me.cl && (o.fl || "hsk") === (me.fl || "hsk") && o.seat >= 0) t.add(o.seat);
  });
  return t;
}

export function lvName(lv: number): string {
  return GT_ONLY ? gtClassName(lv) : "HSK " + lv;
}

export function gtClassName(cl: number): string {
  return GT_CLASS[cl]?.name || "Lớp " + cl;
}
