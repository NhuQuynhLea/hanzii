/**
 * Progress pill (hud.js `progBtn`/`progData`) — bottom-left "tiến độ" button.
 * Recomputes on a slow interval like the original 1.5s progPaint.
 */
import { useEffect, useState } from "react";
import { usePlayer, ledger } from "@/stores/player";
import { getCurLevel } from "@/lib/curriculum";
import { LEVELS } from "@/data/curriculum";
import { FLR } from "@/game/world/geometry";
import { callHook } from "@/services/hooks";
import { ls } from "@/lib/storage";

interface ProgData {
  lv: Record<number, { done: number; total: number }>;
  strong: number;
  chars: number;
  speak: number;
  acc: Record<string, [number, number]>;
  web: { done: number; total: number } | null;
}

export function progData(): ProgData {
  const L = ledger();
  const learned = new Set<string>();
  const written = new Set<string>();
  let speak = 0;
  for (const k in L) {
    const p = k.split(":");
    if (p[0] !== "bm" || p.length < 4) continue;
    const w = p.slice(2, -1).join(":");
    if (p[1] === "tu") learned.add(w);
    else if (p[1] === "viet") written.add(w);
    else if (p[1] === "noi") speak++;
  }
  const S = (callHook<Record<string, { b?: number }>>("nvSrs") as Record<string, { b?: number }>) || {};
  let strong = 0;
  for (const w in S) if ((S[w].b || 0) >= 2) strong++;
  const chars = new Set<string>();
  written.forEach((w) => [...w].forEach((ch) => chars.add(ch)));
  let acc: Record<string, [number, number]> = {};
  try {
    acc = JSON.parse(ls.get("nh:acc") || "{}");
  } catch {
    /* noop */
  }
  let web: ProgData["web"] = null;
  try {
    const st = JSON.parse(localStorage.getItem("nowhanzi-learner-v1") || "null");
    const total = 48;
    if (st) web = { done: Object.values(st.lessons || {}).filter((x) => (x as { status?: string })?.status === "completed").length, total };
  } catch {
    /* noop */
  }
  const lv: ProgData["lv"] = {};
  [1, 2, 3].forEach((l) => {
    const all = LEVELS[l] || [];
    lv[l] = { done: all.filter((w) => learned.has(w[0])).length, total: all.length };
  });
  return { lv, strong, chars: chars.size, speak, acc, web };
}

export function ProgressPill() {
  const entered = usePlayer((s) => s.entered);
  const scene = usePlayer((s) => (s.meSeq, s.me.sc));
  const points = usePlayer((s) => s.points);
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1500);
    return () => clearInterval(t);
  }, []);
  if (!entered || scene !== 0) return null;

  let txt: string;
  let pct: number;
  if (FLR.lop === "gt") {
    const ws = callHook<{ done: number; learned: number; stars: number }>("gtWordStats") || { done: 0, learned: 0, stars: 0 };
    txt = `Giao tiếp – ${ws.done}/55 bài\n${ws.learned} từ đã học – ${ws.stars}★`;
    pct = Math.max((ws.done / 55) * 100, ws.learned ? 2 : 0);
  } else {
    const d = progData();
    const lv = getCurLevel();
    const x = d.lv[lv];
    txt = `HSK ${lv} – ${x.done}/${x.total} từ`;
    pct = x.total ? (x.done / x.total) * 100 : 0;
  }
  void points;

  return (
    <button
      type="button"
      onClick={() => callHook("openProgress")}
      title="Bấm để xem tiến độ từng kỹ năng"
      className="fixed bottom-3 left-3 z-40 w-[210px] rounded-2xl bg-[#050349]/90 p-2.5 text-left shadow-lg"
    >
      <span className="block whitespace-pre-line text-[11px] font-semibold leading-snug text-white">{txt}</span>
      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/20">
        <i className="block h-full rounded-full bg-[#E2B14A]" style={{ width: `${pct}%` }} />
      </span>
    </button>
  );
}
