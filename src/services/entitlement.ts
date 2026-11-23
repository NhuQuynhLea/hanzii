/**
 * Entitlement / activation codes / VietQR — ported from nh.js.
 * UI (BuyDialog) consumes this service; no DOM here.
 */
import { CAMPUS } from "@/config/campus";
import { dmy } from "@/lib/helpers";
import { emitHook } from "./hooks";

const KEY = "nh:ent";
const AL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface Entitlement {
  campus?: boolean;
  webUntil?: number;
}

export interface ParsedCode {
  kind: "campus" | "web";
  until?: number;
}

let mem: Entitlement = {};
let owner = false;
let asLearner = false;
const subs = new Set<() => void>();

export function getEnt(): Entitlement {
  if (CAMPUS.unlockAll) {
    let e: Entitlement = {};
    try {
      e = JSON.parse(localStorage.getItem(KEY) || "null") || {};
    } catch {
      /* noop */
    }
    return Object.assign({}, e, { campus: true, webUntil: Date.UTC(2099, 0, 1) });
  }
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null") || mem;
  } catch {
    return mem;
  }
}

function saveEnt(e: Entitlement): void {
  mem = e;
  try {
    localStorage.setItem(KEY, JSON.stringify(e));
  } catch {
    /* noop */
  }
}

function h32(s: string): number {
  let h = 0x811c9dc5;
  for (const ch of s) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function chk(body: string): string {
  let h = h32((CAMPUS.codeSalt || "nowhanzi") + "|" + body);
  let o = "";
  for (let i = 0; i < 4; i++) {
    o += AL[h % 32];
    h = Math.floor(h / 32);
  }
  return o;
}

function rnd(n: number): string {
  const a = new Uint32Array(n);
  crypto.getRandomValues(a);
  return Array.from(a, (x) => AL[x % 32]).join("");
}

const ymd = (d: Date) =>
  String(d.getFullYear() % 100).padStart(2, "0") +
  String(d.getMonth() + 1).padStart(2, "0") +
  String(d.getDate()).padStart(2, "0");

/** Generate an activation code (owner only). */
export function makeCode(kind: "campus" | "web", days?: number): string {
  if (kind === "campus") {
    const b = "NHK-" + rnd(6);
    return b + "-" + chk(b);
  }
  const b = "NHW-" + ymd(new Date(Date.now() + (days || 30) * 864e5)) + rnd(2);
  return b + "-" + chk(b);
}

export function parseCode(raw: string): ParsedCode {
  const c = String(raw || "")
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!c) throw new Error("Nhập mã kích hoạt trước đã.");
  if (CAMPUS.demoCode && c === String(CAMPUS.demoCode).toUpperCase()) return { kind: "campus" };
  if (CAMPUS.demoWebCode && c === String(CAMPUS.demoWebCode).toUpperCase())
    return { kind: "web", until: Date.now() + 30 * 864e5 };
  let m = /^(NHK-[A-Z2-9]{6})-([A-Z2-9]{4})$/.exec(c);
  if (m && chk(m[1]) === m[2]) return { kind: "campus" };
  m = /^(NHW-(\d\d)(\d\d)(\d\d)[A-Z2-9]{2})-([A-Z2-9]{4})$/.exec(c);
  if (m && chk(m[1]) === m[5]) {
    const until = new Date(2000 + +m[2], +m[3] - 1, +m[4], 23, 59, 59).getTime();
    if (until < Date.now())
      throw new Error("Mã này đã hết hạn ngày " + dmy(until) + ". Nhắn NowHanzi để gia hạn.");
    return { kind: "web", until };
  }
  throw new Error("Mã chưa đúng. Kiểm tra lại từng ký tự hoặc nhắn Fanpage NowHanzi.");
}

export function activate(code: string): ParsedCode {
  const r = parseCode(code);
  const e = Object.assign({}, getEnt());
  if (r.kind === "campus") e.campus = true;
  else e.webUntil = Math.max(e.webUntil || 0, r.until!);
  saveEnt(e);
  notifyEnt();
  return r;
}

export const isOwner = () => owner && !asLearner;
export const setOwner = (v: boolean) => {
  owner = v;
  notifyEnt();
};
export const getAsLearner = () => asLearner;
export const setAsLearner = (v: boolean) => {
  asLearner = v;
  notifyEnt();
};

export const webActive = () => isOwner() || (getEnt().webUntil || 0) > Date.now();
export const campusActive = () => isOwner() || !!getEnt().campus || webActive();
export const permActive = () => isOwner() || !!getEnt().campus;

export function onEntChange(f: () => void): () => void {
  subs.add(f);
  return () => subs.delete(f);
}

export function notifyEnt(): void {
  subs.forEach((f) => {
    try {
      f();
    } catch {
      /* noop */
    }
  });
  emitHook("entChange");
}

export const price = (k: keyof typeof CAMPUS.prices) => CAMPUS.prices[k];
export const zalo = () => CAMPUS.zalo || "";

/* ---------- VietQR (TLV + CRC16), nh.js ---------- */

const tlv = (id: string, v: string) => id + String(v.length).padStart(2, "0") + v;

function crc16(t: string): string {
  let c = 65535;
  for (const ch of t) {
    c ^= ch.charCodeAt(0) << 8;
    for (let i = 0; i < 8; i++) c = c & 32768 ? ((c << 1) ^ 4129) & 65535 : (c << 1) & 65535;
  }
  return c.toString(16).toUpperCase().padStart(4, "0");
}

export function vietQR(opts: { bin: string; account: string; amount?: number; note?: string }): string {
  const { bin, account, amount, note } = opts;
  const g = tlv("00", "A000000727") + tlv("01", tlv("00", bin) + tlv("01", account)) + tlv("02", "QRIBFTTA");
  let r = tlv("00", "01") + tlv("01", amount ? "12" : "11") + tlv("38", g) + tlv("53", "704");
  if (amount) r += tlv("54", String(Math.round(amount)));
  r += tlv("58", "VN");
  if (note) r += tlv("62", tlv("08", note));
  r += "6304";
  return r + crc16(r);
}

/** Payment note builder (nh.js `note`). */
export function payNote(nick: string, discCode?: string): string {
  return ("NOWHANZI THE " + (nick || "HOC VIEN") + (discCode ? " " + discCode : ""))
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, 50);
}
