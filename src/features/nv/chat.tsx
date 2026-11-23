/**
 * Trò chuyện hằng ngày với Thầy Vương: dùng 5 từ hôm nay trong câu
 * (nv-quest.js `nvOpenChat`).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BM } from "@/data/bm-data";
import type { BmDbEntry } from "@/types/lesson";
import { todayWords, getCurLevel } from "@/lib/curriculum";
import { ls } from "@/lib/storage";
import { dstr } from "@/lib/helpers";
import { speak } from "@/services/tts";
import { useUi } from "@/stores/ui";
import { usePlayer } from "@/stores/player";
import { emitHook } from "@/services/hooks";
import { HzButton } from "@/features/ui-bits";
import { openNvRoom } from "./room";

export function nvOpenChat(): void {
  openNvRoom("师", "Trò chuyện cùng Thầy Vương", "Dùng 5 từ hôm nay trong câu thật", <NvChat />);
}

interface Msg {
  who: "t" | "u";
  node: ReactNode;
}

function NvChat() {
  const ws = useMemo(
    () =>
      todayWords(getCurLevel())
        .words.map((w) => BM.db[w[0]])
        .filter((x): x is BmDbEntry => !!x),
    [],
  );
  if (!ws.length) {
    return <p className="text-[14px] text-[#3D3E5C]">Hôm nay chưa có từ mới để luyện.</p>;
  }
  return <NvChatFlow ws={ws} />;
}

function NvChatFlow({ ws }: { ws: BmDbEntry[] }) {
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    {
      who: "t",
      node: `你好！Hôm nay mình dùng ${ws.length} từ mới trong câu nhé. Thầy nói, con chọn từ còn thiếu.`,
    },
  ]);
  const [k, setK] = useState(-1); // -1 = chờ lượt đầu (setTimeout(turn,400))
  const [optsOn, setOptsOn] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const okRef = useRef(0);
  const turned = useRef(-1);
  const timers = useRef<number[]>([]);
  const listRef = useRef<HTMLUListElement>(null);
  const closeRoom = useUi((s) => s.closeRoom);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => later(() => setK(0), 400), []);

  const say = (who: "t" | "u", node: ReactNode) => setMsgs((m) => [...m, { who, node }]);

  /* lượt thứ k: câu của thầy có chỗ trống + các từ chọn */
  useEffect(() => {
    if (k < 0 || turned.current === k) return;
    turned.current = k;
    if (k >= ws.length) {
      say("t", `太棒了！Con dùng đúng ${okRef.current}/${ws.length} từ. 明天见！Mai gặp lại nhé.`);
      ls.set("nh:q:chat", dstr());
      usePlayer.getState().award(`nv:chat:${dstr()}`, 3, "trò chuyện cùng thầy");
      emitHook("nvPaint");
      setOptsOn(false);
      return;
    }
    const W = ws[k];
    const toks = W.ex[0];
    let hit = false;
    const line = toks.map(([t, p], j) => {
      if (!hit && p && (t === W.zh || t.includes(W.zh))) {
        hit = true;
        return (
          <span
            key={j}
            lang="zh-CN"
            className="border-b-2 border-dashed border-[#F4C95D] font-['Noto_Serif_SC',serif] text-[22px] font-semibold leading-[1.15] text-[#F4C95D]"
          >
            {t.replace(W.zh, "＿＿")}
          </span>
        );
      }
      return (
        <span key={j} lang="zh-CN" className="inline-flex flex-col font-['Noto_Serif_SC',serif]">
          <span className="text-[22px] font-semibold leading-[1.15] text-white">{t}</span>
          {p ? <span className="text-[12px] text-[#C9C8F2]">{p}</span> : null}
        </span>
      );
    });
    say(
      "t",
      <div>
        <div className="flex flex-wrap items-start gap-1.5">{line}</div>
        <small className="mt-1 block text-[12px] opacity-80">{W.ex[1]}</small>
      </div>,
    );
    setPicked(null);
    setOptsOn(true);
  }, [k, ws]);

  const W = k >= 0 && k < ws.length ? ws[k] : null;
  const pool = useMemo(
    () => (W ? [W, ...ws.filter((x) => x !== W)].slice(0, 4).sort(() => Math.random() - 0.5) : []),
    [W, ws],
  );

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ block: "end" });
  }, [msgs, optsOn]);

  const pick = (o: BmDbEntry) => {
    if (!W || picked) return;
    const right = o === W;
    if (right) okRef.current++;
    setPicked(o.zh);
    const full = W.ex[0].map((x) => x[0]).join("");
    later(() => {
      setOptsOn(false);
      say("u", <span lang="zh-CN" className="font-['Noto_Serif_SC',serif]">{full}</span>);
      speak(full);
      say(
        "t",
        right ? (
          "对！Đúng rồi."
        ) : (
          <>
            Gần đúng! Từ cần dùng là{" "}
            <b lang="zh-CN" className="font-['Noto_Serif_SC',serif]">
              {W.zh}
            </b>{" "}
            ({W.py}).
          </>
        ),
      );
      later(() => setK((x) => x + 1), 900);
    }, 500);
  };

  return (
    <div>
      <ul ref={listRef} className="m-0 flex list-none flex-col gap-2.5 p-0">
        {msgs.map((m, i) => (
          <li
            key={i}
            className={
              m.who === "t"
                ? "max-w-[88%] self-start rounded-2xl rounded-bl bg-[#050349] px-3.5 py-2.5 leading-relaxed text-white"
                : "max-w-[88%] self-end rounded-2xl rounded-br bg-[#FCE6E1] px-3.5 py-2.5 text-[1.2rem] text-[#050349]"
            }
          >
            {m.node}
          </li>
        ))}
      </ul>
      {optsOn && W ? (
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {pool.map((o) => (
            <HzButton
              key={o.zh}
              t={o.zh}
              py={o.py}
              disabled={picked != null}
              className={
                picked === o.zh
                  ? o === W
                    ? "!border-[#3BB273] !bg-[#E3F5E9] !text-[#14532D]"
                    : "!border-[#EA0000] !bg-[#FDE8E8] !text-[#7F1D1D]"
                  : ""
              }
              onClick={() => pick(o)}
            />
          ))}
        </div>
      ) : null}
      {k >= ws.length ? (
        <button
          type="button"
          onClick={closeRoom}
          className="mt-2.5 rounded-xl bg-[#EA0000] px-4 py-2 text-[14px] font-bold text-white"
        >
          Xong
        </button>
      ) : null}
    </div>
  );
}
