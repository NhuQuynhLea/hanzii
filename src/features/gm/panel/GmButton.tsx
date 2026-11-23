/**
 * Streak/goal button in the top brand bar — gm.js `gmBtn` + `gmPaint`
 * (the original inserts it before the points pill; BrandBar mounts it).
 */
import { useEffect, useState } from "react";
import { usePlayer } from "@/stores/player";
import { useGm } from "@/stores/gm";
import { onHook } from "@/services/hooks";
import { gmStreak, gmToday, onGmPaint } from "../state";
import { openGM } from "./GmPanel";

export function GmButton() {
  const entered = usePlayer((s) => s.entered);
  useGm((s) => s.g); // re-render on nh:gm changes
  const [, setTick] = useState(0);

  // original: setInterval(()=>{ if(entered) gmPaint(); },30000) + emitHook("gmPaint")
  useEffect(() => {
    const t = setInterval(() => {
      if (usePlayer.getState().entered) setTick((x) => x + 1);
    }, 30000);
    const off1 = onHook("gmPaint", () => setTick((x) => x + 1));
    const off2 = onGmPaint(() => setTick((x) => x + 1));
    return () => {
      clearInterval(t);
      off1();
      off2();
    };
  }, []);

  if (!entered) return null;
  const s = gmStreak();
  const done = gmToday();

  return (
    <button
      type="button"
      onClick={() => openGM()}
      aria-label={`Chuỗi ${s} ngày, mục tiêu hôm nay ${done ? "đã xong" : "chưa xong"}. Mở hồ sơ và cửa hàng`}
      title="Hồ sơ – chuỗi ngày – cửa hàng"
      className="relative ml-1 flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[13px] font-bold hover:bg-white/25"
    >
      <span className={done ? "" : "opacity-60 grayscale"}>🔥</span>
      <b>{s}</b>
      <span className="rounded-full bg-[#EA0000] px-1.5 text-[10.5px] font-extrabold leading-[1.6] text-white">{done ? "✓" : "0/1"}</span>
    </button>
  );
}
