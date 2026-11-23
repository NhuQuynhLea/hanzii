/**
 * Join gate — nickname + hair pick + live avatar preview (drawPreview → DOM).
 */
import { useEffect, useState } from "react";
import { COLORS } from "@/types/player";
import { avatarSvgUri, lvOf } from "@/game/entities/avatar-svg";
import { usePlayer } from "@/stores/player";
import { ls } from "@/lib/storage";
import { speak } from "@/services/tts";
import { asset } from "@/lib/utils";

const HAIRS = ["Tóc ngắn", "Tóc dài", "Tóc xoăn", "Tóc buộc"];
const DIRS: (0 | 1 | 2)[] = [0, 2, 3 as unknown as 0, 1];

export function Gate() {
  const entered = usePlayer((s) => s.entered);
  const join = usePlayer((s) => s.join);
  const [nick, setNick] = useState(ls.get("nh:n") || "");
  const [hair, setHair] = useState(() => {
    const h = Number(ls.get("nh:h"));
    return [0, 1, 2, 3].includes(h) ? h : Math.floor(Math.random() * 4);
  });
  const [color] = useState(ls.get("nh:c") || COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 700);
    return () => clearInterval(t);
  }, []);

  if (entered) return null;

  const view = DIRS[tick % 4] as 0 | 1 | 2;
  const uri = avatarSvgUri(hair, lvOf(0), view === (3 as unknown as 0) ? 2 : view);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#3F6B33]/95 backdrop-blur-sm">
      <form
        className="w-[340px] rounded-2xl border-2 border-[#E2B14A]/60 bg-[#FFF8EC] p-6 text-center shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          const n = nick.trim().slice(0, 20);
          if (!n) return;
          join(n, color, hair);
          speak("你好");
        }}
      >
        <div className="mb-3 flex items-center justify-center gap-2">
          <img src={asset("assets/logo.png")} alt="" className="h-10 w-10" />
          <img src={asset("assets/word-dark.png")} alt="NowHanzi" className="h-7" />
        </div>
        <div className="relative mx-auto mb-2 h-[130px] w-[130px]">
          <div className="absolute inset-x-2 bottom-2 h-6 rounded-[50%] bg-[#9CC46F]/60" />
          <img src={uri} alt="" className="absolute inset-0 m-auto h-[130px]" draggable={false} />
        </div>
        <p className="mb-3 text-[13px] font-medium text-[#5C5E80]">Trung tâm tiếng Trung online</p>
        <label htmlFor="nick" className="mb-1 block text-left text-[13px] font-semibold text-[#050349]">
          Tên của bạn
        </label>
        <input
          id="nick"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          maxLength={20}
          required
          autoComplete="nickname"
          placeholder="Ví dụ: Lan Anh"
          className="mb-3 w-full rounded-xl border-2 border-[#E4E5F0] bg-white px-3 py-2 text-[15px] outline-none focus:border-[#EA0000]"
        />
        <span className="mb-1 block text-left text-[13px] font-semibold text-[#050349]">Kiểu tóc</span>
        <div className="mb-4 grid grid-cols-4 gap-1.5" role="radiogroup">
          {HAIRS.map((t, i) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={i === hair}
              onClick={() => setHair(i)}
              className={`rounded-lg border-2 px-1 py-1.5 text-[12px] font-medium ${
                i === hair ? "border-[#EA0000] bg-[#EA0000]/10 text-[#A61E22]" : "border-[#E4E5F0] bg-white text-[#5C5E80]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button type="submit" className="w-full rounded-xl bg-[#EA0000] py-2.5 text-[15px] font-bold text-white shadow-md transition hover:bg-[#C80000]">
          Vào trung tâm
        </button>
        <p className="mt-3 text-[11px] text-[#8A8FA8]">Mọi người trong khuôn viên sẽ thấy tên và nhân vật của bạn.</p>
      </form>
    </div>
  );
}
