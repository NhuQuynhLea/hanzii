/**
 * SVG icon factory — ported verbatim from game/js/gt/nh-icons.js + gt/icons.js.
 * - `NHIP`  : the big path set (nh-icons.js `NHIP`)
 * - `NHI`   : the small path set (icons.js `NHI`) — `nhIcon` falls back to NHIP
 * - `nhSvg` : inline-SVG span string for emoji replacement (nh-icons.js `nhSvg`)
 * - `nhIconHtml` : `nhIcon(k,cls)` as an HTML string
 * - `NhIcon`: React component version of `nhIcon` (replaces `nhIconize` for React)
 * - `nhStrip`: strip mapped emoji (for canvas text) — nh-icons.js `nhStrip`
 */
import { createElement, type CSSProperties, type ReactElement } from "react";

/* nh-icons.js `NHIP` — inner <svg> path markup, verbatim */
export const NHIP: Record<string, string> = {
  speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  lock: '<rect x="5" y="11" width="14" height="9.5" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/><circle cx="12" cy="15.6" r="1.3" fill="currentColor"/>',
  unlock: '<rect x="5" y="11" width="14" height="9.5" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 6.8-1.2"/><circle cx="12" cy="15.6" r="1.3" fill="currentColor"/>',
  mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v2.5"/><path d="M9 20.5h6"/>',
  books: '<path d="M4 5.5h4.5v14H4z"/><path d="M8.5 7h4.5v12.5H8.5z"/><path d="M14.2 6.6l3.9-1 3.3 12.6-3.9 1z"/>',
  book: '<path d="M5 4.5h10.5a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10.5"/><path d="M9 8.5h6"/>',
  openbook: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v13"/>',
  swords: '<path d="M4 4l9 9"/><path d="M4 4h3.5L14 10.5"/><path d="M20 4l-9 9"/><path d="M20 4h-3.5L10 10.5"/><path d="M6.5 15.5l2 2M15.5 17.5l2-2"/><path d="M5 19l2.5-2.5M19 19l-2.5-2.5"/>',
  flame: '<path d="M12 21c-3.6 0-6-2.4-6-5.7 0-3.6 3-5.4 3.6-9.3 2.6 1.6 3.4 3.9 3.2 5.6 1.1-.7 1.8-1.9 2-3.3 2 1.8 3.2 4.1 3.2 6.8 0 3.4-2.4 5.9-6 5.9z"/>',
  bolt: '<path d="M13.5 3L5.5 13.5H11L10 21l8.5-11H13z"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  bulb: '<path d="M9 17.5h6"/><path d="M10 20.5h4"/><path d="M8.2 14.5A6 6 0 1 1 15.8 14.5c-.9.8-1.3 1.8-1.3 3H9.5c0-1.2-.4-2.2-1.3-3z"/>',
  down: '<path d="M12 4v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19.5h14"/>',
  party: '<path d="M4 20l4.5-12 7.5 7.5z"/><path d="M14 4.5c0 1.5 1 2 2 2"/><path d="M19.5 9.5c-1.5 0-2 1-2 2"/><path d="M17.5 3.5v1.2M20.5 6.5h-1.2M11 3l.6 1.6M21 13l-1.6-.6"/>',
  hand: '<path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 10.5V5a1.5 1.5 0 0 1 3 0v5.5"/><path d="M14 10.5V6.5a1.5 1.5 0 0 1 3 0V14a6.5 6.5 0 0 1-6.5 6.5c-2.5 0-4-1.2-5.4-3.4L4 13.5a1.5 1.5 0 0 1 2.6-1.4L8 14"/>',
  medal: '<path d="M8 3.5l2.5 5M16 3.5l-2.5 5"/><circle cx="12" cy="14.5" r="5.5"/><path d="M12 12v5"/>',
  group: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c0-3.2 2.5-5.6 5.5-5.6s5.5 2.4 5.5 5.6"/><circle cx="16.5" cy="9" r="2.6"/><path d="M15.4 13.6c3 .1 5.1 2.3 5.1 5.4"/>',
  gift: '<rect x="4" y="9" width="16" height="4" rx="1"/><path d="M5.5 13v7h13v-7"/><path d="M12 9v11"/><path d="M12 9C9 9 7.5 7.8 7.5 6.3S9 4 10 4.7 12 9 12 9zm0 0c3 0 4.5-1.2 4.5-2.7S15 4 14 4.7 12 9 12 9z"/>',
  cards: '<rect x="3.5" y="6.5" width="12" height="14" rx="2"/><path d="M8 3.5h10.5a2 2 0 0 1 2 2V17"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/>',
  school: '<path d="M3 10L12 5l9 5"/><path d="M5 10v9.5h14V10"/><path d="M10 19.5v-5h4v5"/><path d="M12 3v2"/>',
  puzzle: '<rect x="3.5" y="4" width="7" height="7" rx="2"/><rect x="13.5" y="13" width="7" height="7" rx="2"/><path d="M10.5 7.5h3a3 3 0 0 1 3 3v2.5"/>',
  star: '<path d="M12 3.5l2.5 5.1 5.6.8-4 3.9 1 5.6L12 16.3 7 18.9l.9-5.6-4-3.9 5.6-.8z"/>',
  trophy: '<path d="M8 4.5h8v5a4 4 0 0 1-8 0z"/><path d="M8 6.5H5a2.5 2.5 0 0 0 3 4M16 6.5h3a2.5 2.5 0 0 1-3 4"/><path d="M12 13.5v3.5"/><path d="M8.5 20h7l-1-3h-5z"/>',
  alarm: '<circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.5 2"/><path d="M4.5 5.5l2.5-2M19.5 5.5l-2.5-2"/>',
  timer: '<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5V10"/><path d="M10 3.5h4"/><path d="M18 7.5l1.5-1.5"/>',
  pen: '<path d="M15 4.5l4.5 4.5L9 19.5H4.5V15z"/><path d="M13 6.5l4.5 4.5"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.5L12 6l2.5-1.5M9.5 19.5L12 18l2.5 1.5"/>',
  cup: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8.5 3.5c-.8 1 .8 2-.1 3M12 3.5c-.8 1 .8 2-.1 3"/>',
  tea: '<path d="M4.5 10h12l-1.2 7a3 3 0 0 1-3 2.5h-3.6a3 3 0 0 1-3-2.5z"/><path d="M16.5 11.5h1.5a2 2 0 0 1 0 4H16"/><path d="M7 6.5h7"/>',
  strong: '<path d="M5 18.5c3.5 1.5 9 1.5 13-1 1.5-3-.5-6-3.5-6.5L13 8.5 10.5 5 8 6l1.5 3.5L7 13z"/>',
  bag: '<rect x="5" y="7.5" width="14" height="13" rx="3"/><path d="M9 7.5V6a3 3 0 0 1 6 0v1.5"/><path d="M5 12.5h14"/><path d="M10.5 12.5v2h3v-2"/>',
  ear: '<path d="M8 9a4 4 0 1 1 8 0c0 3-3 3.5-3 6.5a3 3 0 0 1-5.5 1.6"/><path d="M10.5 9.5a1.5 1.5 0 0 1 3 0"/>',
  map: '<path d="M3.5 6.5l5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
  eyeoff: '<path d="M3.5 12s3-6 8.5-6c1.6 0 3 .5 4.2 1.2M20.5 12s-3 6-8.5 6c-1.6 0-3-.5-4.2-1.2"/><path d="M4 20L20 4"/><path d="M10 12a2 2 0 0 0 2 2"/>',
  eye: '<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  headset: '<path d="M4.5 15v-3a7.5 7.5 0 0 1 15 0v3"/><rect x="3.5" y="14" width="4" height="6" rx="1.5"/><rect x="16.5" y="14" width="4" height="6" rx="1.5"/>',
  xcircle: '<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/>',
  tone: '<path d="M3 15c2.2 0 2.2-6 4.5-6S9.8 18 12 18s2.3-12 4.5-12S18.8 15 21 15"/>',
  heart: '<path d="M12 19.5s-7.5-4.3-7.5-9.5A4 4 0 0 1 12 7.5 4 4 0 0 1 19.5 10c0 5.2-7.5 9.5-7.5 9.5z"/>',
  repeat: '<path d="M17 3.5l3 3-3 3"/><path d="M4 11.5v-1a4 4 0 0 1 4-4h12"/><path d="M7 20.5l-3-3 3-3"/><path d="M20 12.5v1a4 4 0 0 1-4 4H4"/>',
  share: '<path d="M12 15V4"/><path d="M7.5 8.5L12 4l4.5 4.5"/><path d="M5 13v5.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V13"/>',
  slow: '<path d="M4 16.5h13a3 3 0 0 0 0-6c-1 0-1.6.3-2.2.8-1 .9-2.7 1-3.8 0-1.6-1.6-5-1.1-5.9 1.7z"/><path d="M17 10.5l1.5-2.5h2"/><path d="M6.5 16.5v2M14 16.5v2"/>',
  badge: '<circle cx="12" cy="10" r="6"/><path d="M9.5 10l1.7 1.7L14.5 8.5"/><path d="M8.5 15l-1.5 5.5 5-2 5 2-1.5-5.5"/>',
  blocks: '<rect x="4" y="12" width="7" height="7" rx="1.2"/><rect x="13" y="12" width="7" height="7" rx="1.2"/><rect x="8.5" y="4.5" width="7" height="7" rx="1.2"/>',
  chat: '<path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.5 3.5v-3.5h0a2 2 0 0 1-2-2z"/>',
  lantern: '<path d="M12 2.5v2"/><path d="M9 4.5h6M9 19.5h6"/><ellipse cx="12" cy="12" rx="6.5" ry="7.5"/><path d="M12 4.5v15M9 5.2c-1.5 4-1.5 9.6 0 13.6M15 5.2c1.5 4 1.5 9.6 0 13.6"/><path d="M12 19.5v2"/>',
  clap: '<path d="M12 3v2.5M7.5 4.5l1.2 2M16.5 4.5l-1.2 2"/><path d="M8 20.5l-2.5-5a1.5 1.5 0 0 1 2.6-1.4L10 17V10a1.5 1.5 0 0 1 3 0v4l3.5-1a1.5 1.5 0 0 1 1.8 1.1L19 18a3 3 0 0 1-2.4 2.5z"/>',
  gate: '<path d="M3 8.5h18"/><path d="M4.5 5.5h15l-1.5 3h-12z"/><path d="M6.5 8.5v11M17.5 8.5v11"/><path d="M3.5 19.5h17"/><path d="M10 12h4"/>',
  pin: '<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.3"/>',
  coins: '<ellipse cx="9" cy="7.5" rx="5" ry="2.5"/><path d="M4 7.5v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4"/><path d="M10 15.5c.5 1.2 2.6 2 5 2 2.8 0 5-1.1 5-2.5v-4c0-1.4-2.2-2.5-5-2.5"/>',
  drop: '<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z"/>',
  tree: '<path d="M12 21v-6"/><path d="M12 3.5c3.5 0 6 2.8 6 6 0 3-2.4 5.5-6 5.5s-6-2.5-6-5.5c0-3.2 2.5-6 6-6z"/><path d="M12 15l-2.5-2.5M12 13l2.5-2"/>',
  door: '<path d="M6 20.5V4.5h12v16"/><path d="M4 20.5h16"/><circle cx="15" cy="12.5" r="1" fill="currentColor"/>',
  sunset: '<path d="M3.5 17.5h17"/><path d="M7 17.5a5 5 0 0 1 10 0"/><path d="M12 6.5v3M5 10l2 1.5M19 10l-2 1.5"/><path d="M6.5 20.5h11"/>',
  bowl: '<path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0z"/><path d="M9 20h6"/><path d="M14 3.5L10 11M18 4.5L13 11"/>',
  bank: '<path d="M3.5 9L12 4l8.5 5z"/><path d="M5.5 9v8M9.5 9v8M14.5 9v8M18.5 9v8"/><path d="M3.5 20h17M4.5 17h15"/>',
  bed: '<path d="M3.5 18.5v-11M3.5 14.5h17v4"/><path d="M20.5 14.5V12a2.5 2.5 0 0 0-2.5-2.5h-7v5"/><circle cx="7" cy="11.5" r="1.8"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M10.5 18h3"/>',
  file: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4"/><path d="M9 12.5h6M9 15.5h6"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.5 2.4 3.5 5.3 3.5 8.5s-1 6.1-3.5 8.5c-2.5-2.4-3.5-5.3-3.5-8.5s1-6.1 3.5-8.5z"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>',
  thanks: '<path d="M12 20.5l-3.5-3.5V9.5a1.5 1.5 0 0 1 3 0V7a1 1 0 0 1 .5-.9 1 1 0 0 1 .5.9v2.5a1.5 1.5 0 0 1 3 0V17z"/><path d="M8.5 13l-3 3M15.5 13l3 3"/>',
  wave: '<path d="M8 13V7a1.5 1.5 0 0 1 3 0v4.5V5.5a1.5 1.5 0 0 1 3 0V11V7a1.5 1.5 0 0 1 3 0v7a6.5 6.5 0 0 1-12.4 2.7L3.6 13a1.4 1.4 0 0 1 2.4-1.4L8 14"/><path d="M19.5 4c.8.6 1.3 1.5 1.3 2.5"/>',
};

/* icons.js `NHI` — small set (social icons); `nhIcon` falls back to NHIP */
export const NHI: Record<string, string> = {
  group: NHIP.group,
  free: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>',
  quiz: '<path d="M12 3.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>',
  match: '<rect x="3.5" y="4" width="7" height="7" rx="2"/><rect x="13.5" y="13" width="7" height="7" rx="2"/><path d="M10.5 7.5h3a3 3 0 0 1 3 3v2.5"/><path d="M14.8 11.2l1.7 1.8 1.7-1.8"/>',
  tone: NHIP.tone,
  up: '<path d="M4 19h4v-5h4v-4h4V6h4"/><path d="M16.5 3.5L20 6l-2.5 3.4"/>',
  unlock: '<rect x="5" y="11" width="14" height="9.5" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 6.8-1.2"/><circle cx="12" cy="15.6" r="1.4" fill="currentColor"/>',
};

/** icons.js `nhIcon` lookup: NHI first, NHIP fallback. */
export function nhPath(k: string): string {
  return NHI[k] || NHIP[k] || "";
}

/* nh-icons.js `NHI_MAP` — emoji → "icon [color-class]" map, verbatim */
export const NHI_MAP: Record<string, string> = {
  "🔊": "speaker", "🔒": "lock", "🔓": "unlock", "🎙": "mic", "📚": "books", "⚔": "swords",
  "🔥": "flame", "⚡": "bolt", "🎯": "target", "💡": "bulb", "⬇": "down", "🎉": "party",
  "✋": "hand", "👋": "wave", "🥇": "medal g1", "🥈": "medal g2", "🥉": "medal g3",
  "👥": "group", "🎁": "gift", "🗂": "cards", "⏹": "stop", "📖": "openbook", "🏫": "school",
  "🧩": "puzzle", "⭐": "star", "🏆": "trophy", "⏰": "alarm", "✍": "pen", "❄": "snow",
  "☕": "cup", "💪": "strong", "🎒": "bag", "🏅": "badge", "👂": "ear", "🗺": "map",
  "⏱": "timer", "🙈": "eyeoff", "🎧": "headset", "❌": "xcircle", "🎵": "tone", "📕": "book",
  "🙏": "thanks", "🔁": "repeat", "📤": "share", "🐢": "slow", "💯": "badge", "🙋": "hand",
  "🧱": "blocks", "💬": "chat", "🏮": "lantern", "👏": "clap", "🏯": "gate", "📍": "pin",
  "👀": "eye", "💰": "coins", "🍵": "tea", "💧": "drop", "🌳": "tree", "🚪": "door",
  "🌇": "sunset", "🍜": "bowl", "🏦": "bank", "🛏": "bed", "📱": "phone", "📄": "file",
  "🌐": "globe", "🎲": "dice", "🙇": "thanks",
};

const NHI_KEYS = Object.keys(NHI_MAP).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

/* nh-icons.js `NHI_STRIP` — strip mapped emoji (canvas text). */
export const NHI_STRIP = new RegExp("(" + NHI_KEYS.join("|") + ")\\uFE0F?\\s*", "gu");

/** nh-icons.js `nhStrip`. */
export function nhStrip(t: string): string {
  return String(t).replace(NHI_STRIP, "").trim();
}

/** nh-icons.js `nhSvg` — inline-SVG span string ("nhe" wrapper, emoji-replacement style). */
export function nhSvg(key: string): string {
  const [k, c] = key.split(" ");
  return `<span class="nhe${c ? " " + c : ""} nhe-${k}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${NHIP[k] || ""}</svg></span>`;
}

/** icons.js `nhIcon` as an HTML string ("nhi" wrapper, 26px svg). */
export function nhIconHtml(k: string, cls?: string): string {
  return `<span class="nhi ${cls || ""}" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${nhPath(k)}</svg></span>`;
}

/** Tailwind colour classes for the original `.nhi`/`.nhe` colour names. */
export const NH_CLS: Record<string, string> = {
  red: "text-[#EA0000]",
  navy: "text-[#050349]",
  gold: "text-[#E2B14A]",
  jade: "text-[#2E7D4F]",
  on: "text-[#E2B14A]",
  g1: "text-[#E2B14A]",
  g2: "text-[#8A8FA8]",
  g3: "text-[#C97A2B]",
};

/**
 * React version of icons.js `nhIcon(k,cls)` — renders the static SVG string
 * (trusted, ported verbatim) via dangerouslySetInnerHTML.
 */
export function NhIcon({
  name,
  cls = "",
  size = 26,
  className = "",
  style,
}: {
  name: string;
  cls?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}): ReactElement {
  const color = cls
    .split(" ")
    .map((c) => NH_CLS[c])
    .filter(Boolean)
    .join(" ");
  return createElement(
    "span",
    {
      className: `nhi ${cls} inline-flex shrink-0 ${color} ${className}`.replace(/\s+/g, " ").trim(),
      "aria-hidden": true,
      style,
    },
    createElement("svg", {
      viewBox: "0 0 24 24",
      width: size,
      height: size,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.9,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      dangerouslySetInnerHTML: { __html: nhPath(name) },
    }),
  );
}
