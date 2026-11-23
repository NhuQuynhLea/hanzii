/** Thầy Vương scripted chat (npc-ai.js `openAI`). */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LEVELS, PER_DAY, unlocked, todayWords, getCurLevel } from "@/lib/curriculum";
import { LVN, clsName } from "@/game/world/geometry";
import { CAMPUS } from "@/config/campus";
import { TIPS_PY, TIPS_STUDY, SAYINGS, GUIDE, pick1 } from "@/data/npc-tips";
import { me } from "@/game/engine/state";
import { usePlayer } from "@/stores/player";
import { speak } from "@/services/tts";
import { callHook } from "@/services/hooks";
import { ledger } from "@/stores/player";
import { dstr, shuffle } from "@/lib/helpers";
import { WordRow, Spk } from "../ui-bits";

interface Msg {
  who: "a" | "u";
  node: ReactNode;
}

export function TeacherChat() {
  const lv = me.cl || getCurLevel();
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    { who: "a", node: `你好！Chào ${me.n || "con"}, thầy là Thầy Vương. Con đang ở lớp ${clsName(lv)}. Con muốn thầy giúp gì nào?` },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const bump = usePlayer((s) => s.bump);
  const award = usePlayer((s) => s.award);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ block: "end" });
  }, [msgs]);

  const say = (who: "a" | "u", node: ReactNode) => setMsgs((m) => [...m, { who, node }]);

  const ACTIONS: [string, () => void][] = [
    [
      "Từ hôm nay của con",
      () => {
        const t = todayWords(lv);
        say(
          "a",
          <div>
            <div className="mb-1 text-[13px]">
              {LVN(lv)}, ngày {t.day}. Bấm 🔊 để nghe:
            </div>
            <ul>{t.words.map((w) => <WordRow key={w[0]} w={w} />)}</ul>
          </div>,
        );
      },
    ],
    [
      "Đố vui một câu",
      () => {
        const pool = LEVELS[lv].slice(0, Math.max(PER_DAY, unlocked(lv)));
        const [zh, py, vi] = pick1(pool);
        const wrong = shuffle(LEVELS[lv].filter((x) => x[2] !== vi)).slice(0, 3).map((x) => x[2]);
        const opts = shuffle([vi, ...wrong]);
        say(
          "a",
          <div>
            <div className="mb-1.5">Chữ {zh} nghĩa là gì?</div>
            <div className="grid gap-1.5">
              {opts.map((t) => (
                <QuizOpt key={t} t={t} vi={vi} onPick={(ok) => {
                  speak(zh);
                  if (ok) {
                    say("a", `Đúng rồi! ${zh} ${py}: ${vi}. 很好！`);
                    bump((S) => {
                      S.ai++;
                    });
                    const L = ledger();
                    for (let i = 0; i < 5; i++) {
                      if (!L[`ai:${dstr()}:${i}`]) {
                        award(`ai:${dstr()}:${i}`, 1, "trả lời đúng câu đố");
                        break;
                      }
                    }
                  } else say("a", `Chưa đúng rồi. ${zh} ${py} nghĩa là “${vi}”. Thử câu khác nhé!`);
                }} />
              ))}
            </div>
          </div>,
        );
      },
    ],
    ["Mẹo phát âm", () => say("a", pick1(TIPS_PY))],
    ["Mẹo học nhanh", () => say("a", pick1(TIPS_STUDY))],
    [
      "Câu nói hay",
      () => {
        const [zh, py, vi] = pick1(SAYINGS);
        say(
          "a",
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Noto_Serif_SC',serif] text-[19px] font-semibold text-[#A61E22]" lang="zh-CN">
                {zh}
              </span>
              <Spk zh={zh} small />
            </div>
            <div className="text-[12px] text-[#A61E22]">{py}</div>
            <div className="text-[13px]">{vi}</div>
          </div>,
        );
      },
    ],
    ["Các khu trong trung tâm", () => say("a", GUIDE)],
    [
      "Học 1-1 với giáo viên",
      () =>
        say(
          "a",
          <div>
            <div className="mb-1.5">Thầy giới thiệu con học riêng với giáo viên của trung tâm, được sửa phát âm trực tiếp và có lộ trình riêng.</div>
            <a href={CAMPUS.zalo || "#"} target="_blank" rel="noopener" className="inline-block rounded-xl bg-[#EA0000] px-3.5 py-1.5 text-[13px] font-bold text-white">
              Nhắn Fanpage trung tâm
            </a>
          </div>,
        ),
    ],
  ];

  return (
    <div>
      <button
        type="button"
        onClick={() => callHook("nvOpenChat")}
        className="mb-3 w-full rounded-xl bg-[#050349] py-2.5 text-[14px] font-bold text-white"
      >
        💬 Trò chuyện hôm nay bằng 5 từ mới
      </button>
      <div ref={listRef} className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed ${
              m.who === "a" ? "mr-auto rounded-bl-sm bg-[#F0F1F8] text-[#1C1A6B]" : "ml-auto rounded-br-sm bg-[#050349] text-white"
            }`}
          >
            {m.node}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ACTIONS.map(([t, fn]) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              say("u", t);
              fn();
            }}
            className="rounded-full border-2 border-[#E4E5F0] bg-white px-3 py-1 text-[12px] font-bold text-[#3D3E5C] hover:border-[#EA0000]"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuizOpt({ t, vi, onPick }: { t: string; vi: string; onPick: (ok: boolean) => void }) {
  const [state, setState] = useState<"idle" | "ok" | "bad" | "dim">("idle");
  const done = useRef(false);
  return (
    <button
      type="button"
      disabled={state !== "idle"}
      onClick={() => {
        if (done.current) return;
        done.current = true;
        const ok = t === vi;
        setState(ok ? "ok" : "bad");
        onPick(ok);
      }}
      className={`rounded-xl border-2 px-3 py-2 text-left text-[13px] font-semibold ${
        state === "ok" ? "border-[#2E7D4F] bg-[#F0F7F1] text-[#2E7D4F]" : state === "bad" ? "border-[#C8102E] bg-[#FFF3EC] text-[#C8102E]" : "border-[#E4E5F0] hover:border-[#EA0000]"
      }`}
    >
      {t}
    </button>
  );
}
