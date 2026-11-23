/**
 * Community core (community.js): weekly league, study groups, nhà sinh hoạt
 * tables data. The original persisted one `hv/<uid>` doc per user through
 * `window.claude` Firestore; here the same doc shape rides inside the
 * presence payload (sticky `hv` field via `sendPresence`), so league/group
 * data covers currently-online players. `commPublish` hook is emitted for
 * a real doc-store backend when one is wired up.
 */
import { create } from "zustand";
import { me } from "@/game/engine/state";
import { usePlayer } from "@/stores/player";
import { usePresence } from "@/stores/presence";
import { toast } from "@/stores/ui";
import { ls } from "@/lib/storage";
import { wkId, dstr, daysBetween } from "@/lib/helpers";
import { clsName } from "@/game/world/geometry";
import { CDT } from "@/game/scenes/geometry-rooms";
import { callHook, emitHook } from "@/services/hooks";
import { hasRoom, sendMove, sendPresence } from "@/services/presence/runtime";
import { emote } from "@/services/emotes";
import type { PlayerState } from "@/types/player";

/* ================= constants ================= */
export const COMM = {
  hour: [20, 21],
  goal: 1000,
  leagues: [
    [0, "Đồng", "🥉"],
    [150, "Bạc", "🥈"],
    [600, "Vàng", "🥇"],
  ] as [number, string, string][],
};

export const GP_MAX = 5;
export const GP_CHEERS: [string, string][] = [
  ["jiayou", "加油! 💪"],
  ["hoc", "Học thôi! 📚"],
  ["gioi", "Giỏi quá! 👏"],
];

/** Player's public card — synced via presence `hv` field and persisted in the
 *  Supabase `hv` table (one row per player, keyed by `id`). */
export interface HvDoc {
  id: string;
  hsk_level: number;
  week: string;
  week_points: number;
  total_points: number;
  nickname: string;
  color: string;
  last_seen: number;
  group_code: string;
  group_name: string;
  is_group_owner: number;
  kicked_members: string[];
  joined_at: number;
  group_is_public: number;
}

export interface GpRow {
  code: string;
  name: string;
  member_count: number;
  week_points: number;
  online_count: number;
  mine: boolean;
  pub: boolean;
}

/** Extra fields community.js/td.js put on remote players. */
export interface CommPeer extends PlayerState {
  peer_uid?: string;
  group_code?: string;
  newbie_token?: string;
  cheer_ts?: number;
  greet_ts?: number;
  hv?: HvDoc;
  qz?: {
    tb: number;
    sd: number;
    t0: number;
    sc: number;
    k: number;
    la: number;
    g: string;
    gm: string;
  } | null;
}

/** Cheap reactivity for presence-derived data (cDocs/gpMembers refresh). */
interface SocialStore {
  seq: number;
  bump(): void;
}
export const useSocial = create<SocialStore>((set) => ({
  seq: 0,
  bump: () => set((s) => ({ seq: s.seq + 1 })),
}));
const bumpSocial = () => useSocial.getState().bump();

/* ================= tokens ================= */
export let cuid: string = ls.get("nh:uid") || "";
/** nh:uid is assigned by supaUid() after this module loads — re-read lazily. */
export const cuidNow = (): string => {
  if (!cuid) cuid = ls.get("nh:uid") || "";
  return cuid;
};
export const myTok: string = (() => {
  let t = ls.get("nh:tok");
  if (!t) {
    t = Math.random().toString(36).slice(2, 10);
    ls.set("nh:tok", t);
  }
  return t;
})();
export const hasComm = () => hasRoom() && !!cuidNow();

/** nv-quest.js `nvDay` — ngày thứ mấy kể từ lần đầu vào (mã chào bạn mới). */
export function nvDay(): number {
  let f = ls.get("nh:first");
  if (!f) {
    f = dstr();
    ls.set("nh:first", f);
  }
  return daysBetween(f, dstr()) + 1;
}

/* ================= league / giờ học chung ================= */
export function league(p: number): [number, string, string] {
  let L = COMM.leagues[0];
  COMM.leagues.forEach((x) => {
    if (p >= x[0]) L = x;
  });
  return L;
}

export function studyHour(): boolean {
  const h = new Date().getHours();
  return h >= COMM.hour[0] && h < COMM.hour[1];
}

function sameClass(o: PlayerState): boolean {
  return o.sc === 1 && o.cl === me.cl && (o.fl || "hsk") === (me.fl || "hsk");
}

export function classMates(): number {
  if (me.sc !== 1) return 0;
  let n = 0;
  usePresence.getState().others.forEach((o) => {
    if (sameClass(o)) n++;
  });
  return n;
}

export function wkPoints(): number {
  let w: { id: string; base: number } | null = null;
  try {
    w = JSON.parse(ls.get("nh:wk") || "null");
  } catch {
    /* noop */
  }
  const id = wkId();
  const points = usePlayer.getState().points;
  if (!w || w.id !== id) {
    w = { id, base: points };
    ls.set("nh:wk", JSON.stringify(w));
  }
  return Math.max(0, points - w.base);
}

/* ================= hv doc sync (db → presence `hv` field) ================= */
export function myHvDoc(): HvDoc {
  const points = usePlayer.getState().points;
  return {
    id: cuidNow() || "me",
    hsk_level: Number(ls.get("nh:lv")) || 1,
    week: wkId(),
    week_points: wkPoints(),
    total_points: Math.round(points),
    nickname: me.n,
    color: me.c || "",
    last_seen: Date.now(),
    group_code: GP.code || "",
    group_name: GP.owner ? GP.name : "",
    is_group_owner: GP.owner ? 1 : 0,
    kicked_members: GP.owner ? GP.kick || [] : [],
    joined_at: GP.joined || 0,
    group_is_public: GP.owner ? (GP.pub === false ? 0 : 1) : 0,
  };
}

/** All hv docs: own doc + online peers + persisted rows (Supabase `hv` table). */
export function commDocs(): HvDoc[] {
  const docs: HvDoc[] = [];
  const seen = new Set<string>();
  const push = (h: HvDoc, id: string) => {
    const k = id || h.id || "";
    if (seen.has(k)) return;
    seen.add(k);
    docs.push({ ...h, id: k });
  };
  if (usePlayer.getState().entered) push(myHvDoc(), cuidNow() || "me");
  usePresence.getState().others.forEach((o) => {
    const h = (o as CommPeer).hv;
    if (h) push(h, (o as CommPeer).peer_uid || h.id || "");
  });
  const dbDocs = callHook<Map<string, HvDoc> | undefined>("scoreDocs");
  if (dbDocs) dbDocs.forEach((h, id) => push(h as HvDoc, id));
  return docs;
}

export function commTotal(): number {
  return commDocs().reduce((a, d) => a + (Number(d.week_points) || 0), 0);
}

let cLast = "",
  cTimer: ReturnType<typeof setTimeout> | null = null;

/** community.js `commSync` — publish my hv doc (2.5s debounce, dedupe by sig). */
export function commSync(): void {
  if (!usePlayer.getState().entered) return;
  if (cTimer) clearTimeout(cTimer);
  cTimer = setTimeout(() => {
    const d = myHvDoc();
    const sig = [
      d.hsk_level, d.week, d.week_points, d.total_points, d.nickname, d.color,
      d.group_code, d.group_name, d.is_group_owner,
      JSON.stringify(d.kicked_members), d.group_is_public, dstr(),
    ].join("|");
    if (sig === cLast) return;
    cLast = sig;
    try {
      sendPresence({ hv: d });
      callHook("commPublish", d);
    } catch {
      cLast = "";
    }
    bumpSocial();
  }, 2500);
}

export function commAfter(): void {
  if (!usePlayer.getState().entered) return;
  const tot = commTotal(),
    wk = wkId();
  if (tot >= COMM.goal && wkPoints() > 0 && ls.get("nh:tuan") !== wk) {
    ls.set("nh:tuan", wk);
    setTimeout(() => {
      usePlayer.getState().award(`tuan:${wk}`, 20, "cả trường đạt thử thách tuần");
      toast("🎉 Cả trường đã đạt mục tiêu tuần! Khuôn viên được trang trí mừng.");
    }, 800);
  }
  callHook("nvPaint");
  bumpSocial();
}

/* ================= nhóm học ================= */
export interface GpState {
  code: string;
  name: string;
  owner: boolean;
  kick: string[];
  joined: number;
  pub?: boolean;
}

export let GP: GpState = (() => {
  try {
    return JSON.parse(ls.get("nh:gp") || "null") || null;
  } catch {
    return null;
  }
})() || { code: "", name: "", owner: false, kick: [], joined: 0 };

export function gpReset(): void {
  GP = { code: "", name: "", owner: false, kick: [], joined: 0 };
}

/** Replace GP (create/join paths that build a fresh state object). */
export function gpSet(g: GpState): void {
  GP = g;
}

export function gpNewCode(): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

export function gpSave(): void {
  ls.set("nh:gp", JSON.stringify(GP));
  cLast = "";
  try {
    commSync();
  } catch {
    /* noop */
  }
  try {
    sendMove(true);
  } catch {
    /* noop */
  }
  gpAfter();
  callHook("nvPaint");
}

/** Members of my group = hv docs sharing my group code. */
export function gpMembers(): HvDoc[] {
  if (!GP.code) return [];
  return commDocs().filter((d) => d.group_code === GP.code);
}

export function gpOwnerDoc(list?: HvDoc[]): HvDoc | undefined {
  return (list || gpMembers()).find((m) => m.is_group_owner);
}

export function gpList(): HvDoc[] {
  const own = gpOwnerDoc(),
    kick = own && Array.isArray(own.kicked_members) ? own.kicked_members : [];
  return gpMembers()
    .filter((m) => !kick.includes(m.id))
    .sort((a, b) => (b.is_group_owner ? 1 : 0) - (a.is_group_owner ? 1 : 0) || (a.joined_at || 0) - (b.joined_at || 0))
    .slice(0, GP_MAX);
}

export function gpAfter(): void {
  if (!GP.code || !cuidNow()) return;
  const own = gpOwnerDoc();
  if (own && own.id !== cuidNow() && Array.isArray(own.kicked_members) && own.kicked_members.includes(cuidNow())) {
    toast("Trưởng nhóm đã mời bạn ra khỏi nhóm " + (own.group_name || GP.name));
    gpReset();
    gpSave();
    return;
  }
  if (own && own.group_name && own.group_name !== GP.name) {
    GP.name = own.group_name;
    ls.set("nh:gp", JSON.stringify(GP));
  }
  if (!own && !GP.owner) {
    const L = gpList();
    if (L.length && L[0].id === cuidNow()) {
      GP.owner = true;
      GP.kick = [];
      toast("Bạn trở thành trưởng nhóm " + GP.name);
      gpSave();
      return;
    }
  }
  callHook("nvPaint");
  bumpSocial();
}

export function gpOnline(id: string): PlayerState | null {
  for (const o of usePresence.getState().others.values())
    if ((o as CommPeer).peer_uid && (o as CommPeer).peer_uid === id) return o;
  return null;
}

export function gpWhere(o: PlayerState | null): string {
  if (!o) return "";
  return o.sc === 1
    ? `Lớp ${clsName(o.cl || 1, o.fl)}`
    : o.sc === 2
      ? "Phòng phát âm"
      : o.sc === 3
        ? "Thư viện"
        : o.sc === 4
          ? "Văn phòng tuyển sinh"
          : "Ngoài sân trường";
}

export function gpStats(): { members: HvDoc[]; week_points: number; active_today: number; goal: number } {
  const members = gpList(),
    wk = wkId(),
    today = dstr();
  const week_points = members.reduce((a, m) => a + (m.week === wk ? Number(m.week_points) || 0 : 0), 0),
    active_today = members.filter((m) => m.last_seen && dstr(new Date(m.last_seen)) === today).length;
  return { members, week_points, active_today, goal: 100 * Math.max(1, members.length) };
}

let gpLastCheer = 0;

export function gpCheer(k: string): void {
  const now = Date.now();
  if (now - gpLastCheer < 10000) {
    toast("Đợi chút rồi cổ vũ tiếp nhé");
    return;
  }
  gpLastCheer = now;
  const txt = (GP_CHEERS.find((c) => c[0] === k) || GP_CHEERS[0])[1];
  me.emo = txt;
  me.emoUntil = performance.now() + 3000;
  sendPresence({ ch: { gp: GP.code, k, t: now } });
  toast("Đã gửi tới bạn cùng nhóm đang online");
}

export function gpAbsorb(o: CommPeer, pr: Record<string, unknown>): void {
  o.peer_uid = typeof pr.u === "string" ? pr.u.slice(0, 80) : "";
  o.group_code = typeof pr.gp === "string" ? pr.gp.slice(0, 8) : "";
  const ch = pr.ch as { gp?: string; k?: string; t?: number } | undefined;
  if (ch && GP.code && ch.gp === GP.code && ch.t !== o.cheer_ts) {
    o.cheer_ts = ch.t;
    const txt = (GP_CHEERS.find((c) => c[0] === ch.k) || GP_CHEERS[0])[1];
    o.emo = txt;
    o.emoUntil = performance.now() + 3500;
    toast(`${o.n} cổ vũ nhóm: ${txt}`);
  }
}

/** community.js `gpPeek` — fetch hv docs of a group code (presence-backed). */
export async function gpPeek(code: string): Promise<HvDoc[] | null> {
  if (!hasRoom() || !cuidNow()) return null;
  await new Promise((r) => setTimeout(r, 700));
  return commDocs().filter((d) => d.group_code === code);
}

/** community.js `gpJoinByCode` → trả về chuỗi lỗi hoặc null nếu thành công. */
export async function gpJoinByCode(raw: string): Promise<string | null> {
  const code = String(raw || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return "Mã gồm 6 chữ hoặc số.";
  if (!hasComm()) return "Nhóm học cần kết nối mạng và đăng nhập.";
  const docs = await gpPeek(code);
  if (!docs) return "Không kết nối được. Thử lại sau nhé.";
  const own = gpOwnerDoc(docs),
    kick = own && Array.isArray(own.kicked_members) ? own.kicked_members : [],
    mem = docs.filter((m) => !kick.includes(m.id) && m.id !== cuidNow());
  if (!docs.length) return "Không tìm thấy nhóm với mã này.";
  if (kick.includes(cuidNow())) return "Bạn đã được mời ra khỏi nhóm này nên không vào lại được.";
  if (mem.length >= GP_MAX) return `Nhóm đã đủ ${GP_MAX} người.`;
  GP = { code, name: (own && own.group_name) || "Nhóm học", owner: false, kick: [], joined: Date.now() };
  gpSave();
  usePlayer.getState().award(`gp:vao:${code}`, 3, "vào nhóm học");
  toast("Đã vào nhóm " + GP.name);
  return null;
}

/** cdq.js `cdJoin` — join a public group shown on a clubhouse table. */
export async function cdJoin(g: GpRow): Promise<string | null> {
  if (!hasComm()) return "Cần kết nối mạng.";
  const docs = await gpPeek(g.code);
  if (!docs) return "Không kết nối được. Thử lại sau nhé.";
  const own = gpOwnerDoc(docs),
    kick = own && Array.isArray(own.kicked_members) ? own.kicked_members : [],
    mem = docs.filter((m) => !kick.includes(m.id) && m.id !== cuidNow());
  if (!own || own.group_is_public === 0) return "Nhóm này đang để riêng tư, cần mã mời của trưởng nhóm.";
  if (kick.includes(cuidNow())) return "Bạn đã được mời ra khỏi nhóm này nên không vào lại được.";
  if (mem.length >= GP_MAX) return `Nhóm đã đủ ${GP_MAX} người.`;
  GP = { code: g.code, name: own.group_name || g.name, owner: false, kick: [], joined: Date.now(), pub: true };
  gpSave();
  usePlayer.getState().award(`gp:vao:${g.code}`, 3, "vào nhóm học");
  toast("Đã vào nhóm " + GP.name);
  return null;
}

/** cdq.js `gpNameOf`. */
export function gpNameOf(code: string): string {
  if (!code) return "";
  if (GP.code === code) return GP.name || "Nhóm học";
  const d = commDocs().find((x) => x.is_group_owner === 1 && x.group_code === code);
  return (d && d.group_name) || "Nhóm học";
}

/** community.js `cdGroups` — nhóm công khai hiện trên các bàn tròn. */
export function cdGroups(): GpRow[] {
  const wk = wkId(),
    mine = GP.code,
    docs = commDocs(),
    others = usePresence.getState().others;
  const rows = docs
    .filter((o) => o.is_group_owner === 1)
    .filter((o) => o.group_code && (o.group_is_public !== 0 || o.group_code === mine))
    .map((o) => {
      const mem = docs.filter(
        (d) => d.group_code === o.group_code && !(Array.isArray(o.kicked_members) && o.kicked_members.includes(d.id)),
      );
      const wp = mem.reduce((a, d) => a + (d.week === wk ? Number(d.week_points) || 0 : 0), 0);
      let on = 0;
      others.forEach((p) => {
        if ((p as CommPeer).group_code === o.group_code) on++;
      });
      if (mine === o.group_code) on++;
      return {
        code: o.group_code,
        name: o.group_name || "Nhóm học",
        member_count: Math.max(1, mem.length),
        week_points: wp,
        online_count: on,
        mine: o.group_code === mine,
        pub: o.group_is_public !== 0,
      };
    });
  rows.sort((a, b) => Number(b.mine) - Number(a.mine) || b.week_points - a.week_points || b.member_count - a.member_count);
  return rows.slice(0, CDT.length);
}

/* ================= chào bạn mới ================= */
export interface GreetItem {
  token: string;
  name: string;
}
export const greetQ: GreetItem[] = [];

function commNewbie(o: CommPeer): void {
  let done: string[] = [];
  try {
    done = JSON.parse(ls.get("nh:greeted") || "[]");
  } catch {
    /* noop */
  }
  if (done.includes(o.newbie_token!) || greetQ.some((x) => x.token === o.newbie_token)) return;
  greetQ.push({ token: o.newbie_token!, name: o.n });
  emitHook("commGreet");
}

export function greetDone(g: GreetItem): void {
  let done: string[] = [];
  try {
    done = JSON.parse(ls.get("nh:greeted") || "[]");
  } catch {
    /* noop */
  }
  done.push(g.token);
  ls.set("nh:greeted", JSON.stringify(done.slice(-200)));
}

/** community.js `commAbsorb` — merge per-peer community fields on each update. */
export function commAbsorb(o: PlayerState, pr: Record<string, unknown>): void {
  const co = o as CommPeer;
  try {
    gpAbsorb(co, pr);
  } catch {
    /* noop */
  }
  try {
    callHook("tdAbsorb", o, pr);
  } catch {
    /* noop */
  }
  co.rp = pr.rp ? true : false;
  co.newbie_token = typeof pr.nw === "string" ? pr.nw.slice(0, 12) : "";
  if (pr.hv && typeof pr.hv === "object") {
    co.hv = pr.hv as HvDoc;
    try {
      gpAfter();
    } catch {
      /* noop */
    }
    commAfter();
  }
  const gr = pr.gr as { tok?: string; t?: number } | undefined;
  if (gr && gr.tok === myTok && gr.t !== co.greet_ts) {
    co.greet_ts = gr.t;
    toast(`👋 ${o.n} chào bạn! 你好！`);
    usePlayer.getState().award(`duocchao:${o.n}:${dstr()}`, 1, "được bạn học chào");
    emote(o, "wave");
  }
  if (co.newbie_token && co.newbie_token !== myTok) commNewbie(co);
  bumpSocial();
}

/** Hook payload for sendMove — current group code on the wire. */
export const gpCode = () => GP.code || "";
export const newbieTok = () => (nvDay() === 1 ? myTok : "");
