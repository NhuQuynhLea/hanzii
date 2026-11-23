/**
 * 📚 Giáo trình — lesson-cover shelf per class level (lib.js `libBooks`).
 */
import { useState } from "react";
import { GT_CLASS } from "@/game/world/geometry";
import { GT_LESSONS, GT_TITLES, gtLabel } from "@/data/gt-data";
import { useGt } from "@/stores/gt";
import { useUi } from "@/stores/ui";
import { callHook } from "@/services/hooks";
import { gtStarTxt, gtStars, gtUnlocked, gtLockWhy } from "./data";
import { libReview } from "./flow";

const COLS = ["#C8102E", "#1C1A6B", "#0F766E", "#7A4FA0", "#B4541E"];

/* Prefer canonical hooks once the gt-core port registers them; else local copies. */
const unlockedN = (i: number) => callHook<boolean>("gtUnlocked", i) ?? gtUnlocked(i);
const starsN = (i: number) => callHook<number>("gtStars", i) ?? gtStars(i);
const starTxtN = (k: number) => callHook<string>("gtStarTxt", k) ?? gtStarTxt(k);
const lockWhyN = (i: number) => callHook<string>("gtLockWhy", i) ?? gtLockWhy(i);

export function LibBooks({ startLv }: { startLv: number }) {
  const [lv, setLv] = useState(startLv);
  const s = useGt((st) => st.state);
  const C = GT_CLASS[lv] || GT_CLASS[1];

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {Object.entries(GT_CLASS).map(([k, c]) => (
          <button
            key={k}
            type="button"
            onClick={() => setLv(+k)}
            className={`rounded-full border-2 px-3 py-1 text-[12px] font-bold ${
              +k === lv ? "border-[#050349] bg-[#050349] text-white" : "border-[#E4E5F0] bg-white text-[#3D3E5C]"
            }`}
          >
            {c.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => callHook("openGTLib", lv)}
          className="rounded-full border-2 border-[#E4E5F0] bg-white px-3 py-1 text-[12px] font-bold text-[#3D3E5C] hover:border-[#050349]"
        >
          📖 Tra cứu đầy đủ
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: C.to - C.from + 1 }, (_, k) => C.from + k).map((i) => {
          const T = GT_TITLES[i],
            L = GT_LESSONS[i],
            ok = !!L && unlockedN(i);
          return (
            <div
              key={i}
              className={`flex flex-col overflow-hidden rounded-xl border border-[#E4E5F0] text-white shadow-sm ${ok ? "" : "opacity-70"}`}
              style={{ background: COLS[(i - 1) % COLS.length] }}
            >
              <div className="flex-1 p-2.5">
                <small className="block text-[11px] font-bold opacity-80">Bài {i > 30 ? i - 30 : i}</small>
                <b className="font-['Noto_Serif_SC',serif] text-lg leading-tight" lang="zh-CN">
                  {T[0]}
                </b>
                <span className="block text-[12px] leading-snug opacity-90">{T[1]}</span>
                <em className="mt-1 block text-[11px] font-semibold not-italic text-[#FFE7A8]">
                  {L ? starTxtN(starsN(i)) + (s.done[i] ? " – ✓" : "") : i > 15 ? "Ra mắt 30/11" : "🔒 Tích sao để mở"}
                </em>
                {!ok && L ? <em className="mt-0.5 block text-[11px] not-italic opacity-90">🔒 {lockWhyN(i).replace("🔒 ", "")}</em> : null}
              </div>
              {ok && L ? (
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => libReview(L.words.map((w) => w[0]), `Từ ${gtLabel(i)}`, "book")}
                    className="flex-1 bg-black/25 py-1.5 text-[12px] font-bold hover:bg-black/35"
                  >
                    Ôn từ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      useUi.getState().closeRoom();
                      setTimeout(() => callHook("duoStart", i), 40);
                    }}
                    className="flex-1 bg-white/90 py-1.5 text-[12px] font-bold text-[#050349] hover:bg-white"
                  >
                    Học
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
