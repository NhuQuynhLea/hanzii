/**
 * Lesson dialog body (games.js `openLesson`/`renderLevel`/`runQuiz`).
 * HSK tabs per level; GT tab via `renderGT` hook (Phase 7).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Word } from "@/types/lesson";
import { LEVELS, PER_DAY, levelDay, unlocked, getCurLevel, setCurLevel } from "@/lib/curriculum";
import { campusActive } from "@/services/entitlement";
import { usePlayer } from "@/stores/player";
import { useUi } from "@/stores/ui";
import { ls } from "@/lib/storage";
import { dstr, shuffle, vnd } from "@/lib/helpers";
import { speak } from "@/services/tts";
import { callHook } from "@/services/hooks";
import { WordRow, Spk, Hz, Tabs } from "../ui-bits";
import { GT_ONLY, LVN } from "@/game/world/geometry";
import { CAMPUS } from "@/config/campus";

export function LessonList() {
  const paid = campusActive();
  const initTab = GT_ONLY ? "gt" : ls.get("nh:tab") === "gt" ? "gt" : "hsk";
  const [tab, setTab] = useState<"hsk" | "gt">(initTab as "hsk" | "gt");
  const [lv, setLv] = useState(getCurLevel());
  const [quiz, setQuiz] = useState(false);

  return (
    <div>
      <Tabs
        tabs={[
          ["hsk", "HSK 1 · 2 · 3"],
          ["gt", "Giao tiếp (mới)"],
        ]}
        active={tab}
        onPick={(k) => {
          setTab(k as "hsk" | "gt");
          ls.set("nh:tab", k);
        }}
      />
      {tab === "gt" ? (
        <GtTab lv={lv} onPickLv={setLv} />
      ) : quiz ? (
        <Quiz lv={lv} onBack={() => setQuiz(false)} />
      ) : (
        <LevelView lv={lv} paid={paid} onLv={setLv} onQuiz={() => setQuiz(true)} />
      )}
    </div>
  );
}

function GtTab({ lv, onPickLv }: { lv: number; onPickLv: (l: number) => void }) {
  const node = callHook<ReactNode>("renderGTNode", lv, onPickLv);
  return <div>{node}</div>;
}

function LevelView({ lv, paid, onLv, onQuiz }: { lv: number; paid: boolean; onLv: (l: number) => void; onQuiz: () => void }) {
  const [, force] = useState(0);
  const all = LEVELS[lv] || [];
  const day = levelDay(lv, true);
  const n = unlocked(lv);
  const st = paid ? Math.max(0, Math.ceil(n / PER_DAY) - 1) * PER_DAY : (day - 1) * PER_DAY;
  const done = paid ? false : st >= all.length;
  const today = all.slice(st, n);
  const heard = useRef(new Set<string>());
  const key = paid ? `learn:${lv}:g${st / PER_DAY}` : `learn:${lv}:${dstr()}`;
  const award = usePlayer((s) => s.award);
  const setBuy = useUi((s) => s.setBuyOpen);

  useEffect(() => {
    setCurLevel(lv);
  }, [lv]);

  const heardRef = heard.current;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <b className="text-[15px] text-[#050349]">
          {done ? `Đã học hết phần miễn phí ${LVN(lv)}` : paid ? `${LVN(lv)}, nhóm ${Math.ceil(n / PER_DAY)}` : `${LVN(lv)}, ngày ${day}`}
        </b>
        <span className="text-[12px] font-semibold text-[#5B5A7A]">
          {n}/{all.length} từ
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#EFF1F8]">
        <i className="block h-full rounded-full bg-[#EA0000]" style={{ width: `${(n / Math.max(1, all.length)) * 100}%` }} />
      </div>
      <div className="mb-3 flex gap-1.5">
        {[1, 2, 3].map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onLv(l)}
            className={`rounded-full border-2 px-3 py-1 text-[12px] font-bold ${l === lv ? "border-[#050349] bg-[#050349] text-white" : "border-[#E4E5F0] bg-white text-[#3D3E5C]"}`}
          >
            {LVN(l)}
          </button>
        ))}
      </div>
      {!done && (
        <>
          <ul>
            {today.map((w) => (
              <WordRow
                key={w[0]}
                w={w}
                onPlay={(zh) => {
                  heardRef.add(zh);
                  if (heardRef.size >= today.length) award(key, 10, "nghe đủ nhóm từ mới");
                }}
              />
            ))}
          </ul>
          <p className="mt-1.5 text-[12px] text-[#5B5A7A]">Bấm 🔊 nghe đủ {today.length} từ này để nhận +10 điểm.</p>
          {paid ? (
            n < all.length ? (
              <button
                type="button"
                className="mt-3 rounded-xl bg-[#EA0000] px-4 py-2 text-[14px] font-bold text-white"
                onClick={() => {
                  ls.set("nh:max" + lv, String(Math.min(all.length, n + PER_DAY)));
                  force((x) => x + 1);
                }}
              >
                Học 5 từ tiếp theo
              </button>
            ) : (
              <div className="mt-3 rounded-xl bg-[#F0F7F1] p-3 text-[14px] font-semibold text-[#2E7D4F]">🎉 Bạn đã mở hết {all.length} từ {LVN(lv)}.</div>
            )
          ) : n < all.length ? (
            <div className="mt-3 rounded-xl bg-[#FFF3EC] p-3 text-[14px] text-[#8A5A20]">🔒 {PER_DAY} từ tiếp theo sẽ mở vào ngày mai.</div>
          ) : null}
        </>
      )}
      <button type="button" onClick={onQuiz} className="mt-3 w-full rounded-xl bg-[#050349] py-2.5 text-[14px] font-bold text-white">
        Kiểm tra nhanh (+2 điểm mỗi câu đúng)
      </button>
      {(() => {
        const prev = all.slice(0, done ? n : st);
        return prev.length ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-[13px] font-semibold text-[#5B5A7A]">Ôn lại {prev.length} từ đã học</summary>
            <ul>
              {prev.map((w) => (
                <WordRow key={w[0]} w={w} />
              ))}
            </ul>
          </details>
        ) : null;
      })()}
      {!paid && (
        <div className="mt-4 rounded-2xl bg-[#050349] p-4 text-white">
          <b>{done ? "Học tiếp trọn bộ " + LVN(lv) : "Không muốn chờ từng ngày?"}</b>
          <p className="mt-1 text-[13px] text-white/80">
            Thẻ học viên vĩnh viễn ({vnd(CAMPUS.prices.campus)}) cho bạn học bao nhiêu từ mỗi ngày cũng được, kèm toàn bộ tài liệu trong thư viện.
          </p>
          <div className="mt-2.5 flex gap-2">
            <button type="button" onClick={() => setBuy(true)} className="rounded-xl bg-white px-3.5 py-1.5 text-[13px] font-bold text-[#050349]">
              Mua thẻ học viên
            </button>
            <button type="button" onClick={() => useUi.getState().setAcad(true)} className="rounded-xl border border-white/50 px-3.5 py-1.5 text-[13px] font-bold text-white">
              Học lộ trình 48 bài
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Quick quiz (runQuiz) — 5 câu trắc nghiệm từ pool đã mở. */
function Quiz({ lv, onBack }: { lv: number; onBack: () => void }) {
  const pool = LEVELS[lv].slice(0, Math.max(PER_DAY, unlocked(lv)));
  const [qs, setQs] = useState<Word[]>(() => shuffle(pool).slice(0, 5));
  const [k, setK] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const award = usePlayer((s) => s.award);
  const bump = usePlayer((s) => s.bump);
  const doneAwarded = useRef(false);

  const reset = () => {
    setQs(shuffle(pool).slice(0, 5));
    setK(0);
    setScore(0);
    setPicked(null);
    doneAwarded.current = false;
  };

  const done = qs.length > 0 && k >= qs.length;
  // award in an effect — bump()/award() mutate stores; calling them inside
  // render crashes the whole tree ("Cannot update while rendering").
  useEffect(() => {
    if (!done || doneAwarded.current) return;
    doneAwarded.current = true;
    if (score === qs.length)
      bump((S) => {
        S.quizPerfect++;
      });
    award(`quiz:${lv}:${dstr()}`, score * 2, `kiểm tra nhanh ${LVN(lv)}`);
  }, [done, score, qs.length, lv, bump, award]);

  // stable per-question options — shuffling in render would rearrange the
  // buttons on every re-render. Must stay above the early returns below
  // (hook order) — compute an empty list once the quiz is done.
  const viKey = qs[k]?.[2];
  const opts = useMemo(
    () =>
      viKey === undefined
        ? []
        : shuffle([viKey, ...shuffle(LEVELS[lv].filter((w) => w[2] !== viKey)).slice(0, 3).map((w) => w[2])]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qs, k, lv],
  );

  if (!qs.length) return null;

  if (k >= qs.length) {
    return (
      <div>
        <div className="my-4 rounded-2xl bg-[#050349] p-5 text-center text-white">
          <b className="block text-3xl">
            {score}/{qs.length}
          </b>
          <span className="text-[13px] text-white/75">câu đúng</span>
        </div>
        {score > 0 ? null : null}
        <div className="flex gap-2">
          <button type="button" onClick={reset} className="flex-1 rounded-xl border-2 border-[#E4E5F0] py-2 text-[14px] font-semibold">
            Làm lại
          </button>
          <button type="button" onClick={onBack} className="flex-1 rounded-xl border-2 border-[#E4E5F0] py-2 text-[14px] font-semibold">
            Về bài học
          </button>
        </div>
      </div>
    );
  }

  const [zh, py, vi] = qs[k];

  return (
    <div>
      <div className="mb-2 flex justify-between text-[12px] font-semibold text-[#5B5A7A]">
        <span>
          Câu {k + 1}/{qs.length}
        </span>
        <span>Đúng {score}</span>
      </div>
      <div className="mb-3 flex items-center justify-center gap-3 rounded-2xl bg-[#F6F4EF] py-5">
        <Hz t={zh} py={py} className="text-3xl" />
        <Spk zh={zh} />
      </div>
      <p className="mb-2 text-[13px] text-[#5B5A7A]">Chọn nghĩa đúng:</p>
      <div className="grid gap-2">
        {opts.map((t) => {
          const isPick = picked === t;
          const cls = picked
            ? t === vi
              ? "border-[#2E7D4F] bg-[#F0F7F1] text-[#2E7D4F]"
              : isPick
                ? "border-[#C8102E] bg-[#FFF3EC] text-[#C8102E]"
                : "border-[#E4E5F0] opacity-60"
            : "border-[#E4E5F0] hover:border-[#EA0000]";
          return (
            <button
              key={t}
              type="button"
              disabled={!!picked}
              onClick={() => {
                setPicked(t);
                if (t === vi) setScore((x) => x + 1);
                speak(zh);
                setTimeout(() => {
                  setPicked(null);
                  setK((x) => x + 1);
                }, 900);
              }}
              className={`rounded-xl border-2 px-4 py-2.5 text-left text-[14px] font-semibold ${cls}`}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}
