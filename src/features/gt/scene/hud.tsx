/**
 * gt-hud (gt-class.js) — in-class status strip. The original CSS only shows
 * the strip while a Thầy Vương gate is open for the current class, so the
 * effective content is the lesson line + the "⚔ Đấu Thầy Vương" button.
 * Self-mounts into a fixed container at import time (like the original
 * document.body append + 500ms poller).
 */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { me } from "@/game/engine/state";
import { FLR, GT_CLASS } from "@/game/world/geometry";
import { GT_TITLES, gtLabel } from "@/data/gt-data";
import { useUi } from "@/stores/ui";
import { callHook } from "@/services/hooks";
import { gtClassLesson, gtStars, gtStarTxt } from "./core";

function GtHud() {
  const [, setTick] = useState(0);
  const roomOpen = useUi((s) => s.room.open);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 500);
    return () => clearInterval(t);
  }, []);

  const on = me.sc === 1 && FLR.lop === "gt" && !roomOpen;
  const n = on ? gtClassLesson(me.cl || 1) : 0;
  if (!n) return null;
  const c = GT_CLASS[me.cl || 1];
  const og = (callHook<number[]>("gmGateOpenList") ?? []).filter(
    (g) => c && g >= c.from && g <= c.to,
  );
  if (!og.length) return null;

  return (
    <div
      role="status"
      className="fixed left-3 top-[92px] z-[7] w-max max-w-[calc(100vw-24px)] rounded-2xl border border-[#E4E5F0] bg-white px-3 py-2 shadow-md"
    >
      <div className="flex items-baseline justify-between gap-2.5 text-[14px]">
        <b className="text-[#3D3E5C]">{`${gtLabel(n)} – ${GT_TITLES[n][1]}`}</b>
        <span className="font-extrabold tracking-wide text-[#F5A623]">{gtStarTxt(gtStars(n))}</span>
      </div>
      <div className="mb-1 mt-1.5 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => callHook("openGate", og[0])}
          className="min-h-[36px] flex-1 rounded-full bg-[#EA0000] px-3 py-1 text-[13px] font-bold text-white"
        >
          ⚔ Đấu Thầy Vương
        </button>
      </div>
    </div>
  );
}

let mounted = false;

/** Mount the HUD once (imported by the scene index). */
export function mountGtHud(): void {
  if (mounted || typeof document === "undefined") return;
  mounted = true;
  const el = document.createElement("div");
  el.id = "gtHudRoot";
  document.body.append(el);
  createRoot(el).render(<GtHud />);
}
