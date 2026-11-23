/**
 * renderGTLesson + gtLessonHome + the per-step sections of gt-core.js
 * (gtGoal / gtPron / gtWords / gtDlg / gtGram / gtWrite / gtQuiz / gtSay /
 * gtListen), as a React step machine inside the whiteboard room dialog.
 *
 * Session state (gtCur / gtStep / gtBuoi / gtBuoiFor) lives in the useGt
 * store so deep-links (library "Tập viết", openGTClass, _gtNext) work the
 * same way as the original globals.
 *
 * MODE mapping matches the original: only "book" and "write" are content
 * modes; every other step key renders the buổi home (the Thử thách/Nhiệm vụ
 * cards own teaching — duo.js marks the step keys seen).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import HanziWriter, { type CharacterJson } from "hanzi-writer";
import { BM } from "@/data/bm-data";
import { GT_LESSONS, GT_TITLES, gtLabel } from "@/data/gt-data";
import type { GtQuizItem } from "@/types/gt";
import type { Word } from "@/types/lesson";
import { useGt } from "@/stores/gt";
import { usePlayer } from "@/stores/player";
import { useUi } from "@/stores/ui";
import { useWm } from "@/stores/wm";
import { callHook } from "@/services/hooks";
import { speak } from "@/services/tts";
import { shuffle } from "@/lib/helpers";
import { WordRow } from "@/features/ui-bits";
import {
  GT_FREE,
  GT_NEED,
  chDone,
  duoStart,
  gtBDone,
  gtBMin,
  gtBSteps,
  gtCheckDone,
  gtCurB,
  gtIsSeen,
  gtL,
  gtNS,
  gtSeen,
  gtSlice,
  gtStarCheck,
  gtStarInfo,
  gtStarInit,
  gtStarTxt,
  msGet,
  msIdFor,
  msPlayed,
  setGtSession,
  type GtSlice,
} from "./state";
import { Cta, GT_H, GT_P, PgGo, RuleBox, VI_SM, speakAll } from "./bits";

/* ============================== renderGTLesson ============================== */

export function GtLesson({ n, onBack }: { n: number; onBack: () => void }) {
  const L0 = gtL(n);
  const s = useGt((x) => x.state);
  const step = String(useGt((x) => x.step));
  const buoi = useGt((x) => x.buoi);
  const buoiFor = useGt((x) => x.buoiFor);
  const NB = L0 ? gtNS(n) : 1;
  const b = buoiFor === n && buoi >= 1 && buoi <= NB ? buoi : gtCurB(n);
  const [starsOpen, setStarsOpen] = useState(false);

  // gtWB() — the lesson wants the wide whiteboard dialog
  useEffect(() => {
    useUi.getState().setRoomVariant("wb");
  }, []);

  // `if(gtBuoiFor!==n||gtBuoi<1||gtBuoi>NB){ gtBuoi=gtCurB(n); gtBuoiFor=n; }`
  useEffect(() => {
    if (buoiFor !== n || buoi < 1 || buoi > NB) setGtSession({ buoi: gtCurB(n), buoiFor: n });
  }, [n, buoi, buoiFor, NB]);

  const steps = gtBSteps(n, b);
  const MODE: "home" | "book" | "write" =
    step === "book" ? "book" : step === "write" ? "write" : "home";

  // `if(!steps.includes(gtStep)) gtStep=steps.find(k=>!gtIsSeen(n,b,k))||steps[0];`
  // (skipped while a content mode is open — the original keeps MODE for that render)
  useEffect(() => {
    if (MODE === "home" && !steps.includes(step))
      setGtSession({ step: steps.find((k) => !gtIsSeen(n, b, k)) || steps[0] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MODE, step, n, b]);

  // `if(MODE==="write") gtSeen(n,"write");`
  useEffect(() => {
    if (MODE === "write") gtSeen(n, "write", b);
  }, [MODE, n, b]);

  // renderGTLesson tail: `gtStarLast[n]??=` + gtCheckDone + gtStarCheck
  const doneN = !!s.done[n];
  useEffect(() => {
    gtStarInit(n);
    gtCheckDone(n);
    gtStarCheck(n);
  }, [n, doneN]);

  if (!L0) return null;
  const Ls = gtSlice(L0, n, b);
  const si = gtStarInfo(n);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-4">
        <b className="text-[1.15rem] text-[#14213D]">{`${gtLabel(n)} – ${L0.title}`}</b>
        <PgGo
          onClick={() => {
            setGtSession({ cur: 0 });
            onBack();
          }}
        >
          ← Lộ trình
        </PgGo>
      </div>
      {/* .gt-buoi — buổi tablist */}
      <div role="tablist" className="mb-2.5 flex flex-wrap gap-1.5">
        {Array.from({ length: NB }, (_, i) => i + 1).map((bb) => {
          const Lb = gtSlice(L0, n, bb);
          const d = gtBDone(n, bb);
          const sel = bb === b;
          return (
            <button
              key={bb}
              type="button"
              role="tab"
              aria-selected={sel}
              onClick={() => {
                const st = gtBSteps(n, bb);
                setGtSession({
                  buoi: bb,
                  buoiFor: n,
                  step: st.find((k) => !gtIsSeen(n, bb, k)) || st[0],
                });
              }}
              className={`flex min-h-12 flex-[1_1_120px] flex-col items-start gap-0.5 rounded-xl border bg-white px-3.5 py-2 text-left text-[#14213D] ${
                sel ? "border-[#050349] shadow-[inset_0_0_0_2px_#050349]" : "border-[#E4E5F0]"
              }`}
            >
              <b className={`text-[0.92rem] ${d ? "text-[#2E9E5B]" : ""}`}>
                {(d ? "✓ " : "") + `Buổi ${bb}`}
              </b>
              <small className="text-[0.75rem] text-[#5B5A7A]">{`${Lb.words.length} từ – ~${gtBMin(n, bb)} phút`}</small>
            </button>
          );
        })}
      </div>
      {/* .gt-stars — how to earn ★ (ul/small hidden unless .open) */}
      <div className="mb-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 rounded-[14px] border border-[#E4E5F0] bg-white px-3.5 py-2.5">
        <span className="text-[1.35rem] tracking-wider text-[#F5A623]">{gtStarTxt(si.n)}</span>
        <button
          type="button"
          onClick={() => setStarsOpen((o) => !o)}
          className="ml-2 border-0 bg-transparent text-[0.8rem] font-bold text-[#5B5A7A]"
        >
          {starsOpen ? "Thu gọn ▴" : "Cách lấy sao ▾"}
        </button>
        {starsOpen ? (
          <ul className="m-0 flex list-none flex-wrap gap-x-3.5 gap-y-0.5 p-0 text-[0.82rem] text-[#5B5A7A]">
            {si.parts.map(([t, ok, c], i) => (
              <li key={i} className={ok ? "font-bold text-[#B7791F]" : ""}>
                {(ok ? "★ " : "☆ ") + t + (c ? ` (${c})` : "")}
              </li>
            ))}
          </ul>
        ) : null}
        {starsOpen && n >= GT_FREE && GT_TITLES[n + 1] ? (
          <small className="basis-full text-[0.8rem] text-[#5B5A7A]">
            {si.n >= GT_NEED
              ? GT_LESSONS[n + 1]
                ? `Đã đủ ${GT_NEED}★: ${gtLabel(n + 1)} đã mở.`
                : `Đã đủ ${GT_NEED}★. Học tiếp để mở ${gtLabel(n + 1)}.`
              : `Cần ${GT_NEED}★ để mở ${gtLabel(n + 1)}.`}
          </small>
        ) : null}
      </div>
      {MODE === "home" ? (
        <GtHome n={n} b={b} Ls={Ls} />
      ) : (
        <div>
          <PgGo onClick={() => setGtSession({ step: "home" })}>← Về buổi học</PgGo>
          {MODE === "write" ? (
            <GtWriteSec n={n} L={Ls} />
          ) : (
            <div>
              <GtWordsSec n={n} L={Ls} />
              <GtGramSec L={Ls} />
              <GtDlgSec L={Ls} />
            </div>
          )}
        </div>
      )}
      {doneN ? (
        <div className="mt-4 rounded-2xl bg-[#2E9E5B1a] p-4 text-center">
          <b className="block text-[1.15rem] text-[#14213D]">{`🎉 Bạn đã học hết ${NB} buổi của bài`}</b>
          <span className={VI_SM}>Ôn lại bất cứ phần nào bằng các nút phía trên.</span>
        </div>
      ) : gtBDone(n, b) && b < NB ? (
        <div className="mt-4 rounded-2xl bg-[#2E9E5B1a] p-4 text-center">
          <b className="block text-[1.15rem] text-[#14213D]">{`✓ Xong Buổi ${b}/${NB}`}</b>
          <span className={VI_SM}>Nghỉ một chút hoặc học tiếp buổi sau. Tiến độ được lưu lại.</span>
        </div>
      ) : null}
    </div>
  );
}

/* ============================== gtLessonHome ============================== */

interface MsInfo {
  title: string;
  scene: { icon: string; place: string };
  npc: { name: string };
}

function GtHome({ n, b, Ls }: { n: number; b: number; Ls: GtSlice }) {
  const L0 = GT_LESSONS[n];
  const mid = msIdFor(n, b);
  const M = mid ? msGet<MsInfo>(mid) : undefined;
  const played = mid ? msPlayed(mid) : false;
  const cd = chDone(n, b);
  const HC =
    "grid grid-cols-[auto_1fr] grid-rows-[auto_auto] items-center gap-x-3.5 rounded-2xl border-0 p-4 px-[18px] text-left font-inherit text-white transition active:translate-y-[3px] active:shadow-none";
  return (
    <div className="my-3 grid gap-3">
      {/* ① Thử thách — .gt-hc.ch (done → navy) */}
      <button
        type="button"
        onClick={() => duoStart(n, b, true)}
        className={`${HC} ${cd ? "bg-[#1C1A6B] shadow-[0_4px_0_#050349]" : "bg-[#EA0000] shadow-[0_4px_0_#A61E22]"}`}
      >
        <span className="row-span-2 text-[36px]">⚡</span>
        <b className="text-[1.05rem]">{`① Thử thách: học & luyện${cd ? " ✓" : ""}`}</b>
        <small className="opacity-90">
          {`${Ls.words.length} từ mới` +
            (b === 1 && L0.tones ? " – thanh điệu" : "") +
            (Ls.grammar.length ? " – mẫu câu" : "") +
            " – học xong làm ngay"}
        </small>
      </button>
      {/* ② Nhiệm vụ — .gt-hc.ms (red once the challenge is done, .later before) */}
      {M ? (
        <button
          type="button"
          onClick={() => callHook("msStart", mid)}
          className={`${HC} ${cd ? "bg-[#EA0000] shadow-[0_4px_0_#A61E22]" : "bg-[#1C1A6B] opacity-[0.82] shadow-[0_4px_0_#050349]"}`}
        >
          <span className="row-span-2 text-[36px]">{M.scene.icon}</span>
          <b className="text-[1.05rem]">{`② Nhiệm vụ: ${M.title}${played ? " ✓" : ""}`}</b>
          <small className="opacity-90">
            {cd ? `${M.scene.place} – nói chuyện với ${M.npc.name}` : "Dùng ngay những gì vừa học trong Thử thách"}
          </small>
        </button>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {Ls.write && Ls.write.length ? (
          <PgGo onClick={() => setGtSession({ step: "write" })}>✍ Tập viết chữ Hán</PgGo>
        ) : null}
        <PgGo onClick={() => setGtSession({ step: "book" })}>📖 Sổ tay buổi này</PgGo>
      </div>
    </div>
  );
}

/* ============================== step sections ============================== */

/** gtGoal — lesson goals list (step "goal"). */
export function GtGoalSec({ L }: { L: GtSlice }) {
  return (
    <div>
      <h3 className={GT_H}>{L.zh}</h3>
      <p className={GT_P}>Học xong bài này, bạn sẽ:</p>
      <ul className="my-1 mb-4 grid list-none gap-1.5 p-0">
        {L.goals.map((g, i) => (
          <li key={i} className="rounded-xl border border-[#E4E5F0] px-3 py-2.5 text-[#14213D] before:content-['🎯_']">
            {g}
          </li>
        ))}
      </ul>
      <p className={GT_P}>
        {`Bài chia ${L.nb} buổi ngắn, mỗi buổi khoảng 10–15 phút. Xong mỗi buổi +5 điểm, xong cả bài +20 điểm.`}
      </p>
    </div>
  );
}

/** gtPron — tone grid + pronunciation rules (step "pron", buổi 1 only). */
export function GtPronSec({ L }: { L: GtSlice }) {
  return (
    <div>
      <h3 className={GT_H}>{L.pronH || "Bốn thanh điệu"}</h3>
      <p className={GT_P}>{L.pronP || "Bấm từng ô để nghe. Cùng âm “ma” nhưng đổi thanh là đổi nghĩa."}</p>
      <div className="my-1 mb-4 grid grid-cols-4 gap-1.5 max-[460px]:grid-cols-2">
        {L.tones.map(([zh, py, t, d], i) => (
          <button
            key={i}
            type="button"
            onClick={() => speak(zh)}
            className="flex flex-col items-center gap-0.5 rounded-xl border border-[#E4E5F0] bg-transparent px-0.5 py-2 font-inherit text-[#14213D] transition hover:border-[#EA0000]"
          >
            <span className="font-['Noto_Serif_SC',serif] text-[1.6rem] leading-none text-[#EA0000]" lang="zh-CN">
              {zh}
            </span>
            <b className="text-[13px]">{py}</b>
            <small className="text-[11.5px] text-[#5B5A7A]">{t}</small>
            <small className="text-[11.5px] text-[#5B5A7A]">{d}</small>
          </button>
        ))}
      </div>
      <h3 className={GT_H}>Ba quy tắc cần nhớ</h3>
      {L.rules.map((r, i) => (
        <RuleBox key={i} t={r.t} d={r.d} ex={r.ex} />
      ))}
    </div>
  );
}

/** gtWords — word list of the buổi (step "words" / Sổ tay). */
export function GtWordsSec({ n, L }: { n: number; L: GtSlice }) {
  const heard = useRef(new Set<string>());
  const more = (GT_LESSONS[n] as { wordsMore?: Word[] } | undefined)?.wordsMore;
  return (
    <div>
      <h3 className={GT_H}>{`${L.words.length} từ mới`}</h3>
      <p className={GT_P}>Danh sách từ của buổi này để tra lại.</p>
      <ul className="m-0 list-none p-0">
        {L.words.map((w) => (
          <WordRow
            key={w[0]}
            w={w}
            onPlay={(zh) => {
              heard.current.add(zh);
              callHook("gmCardSeen", zh);
              useWm.getState().seen([zh]);
              if (heard.current.size >= L.words.length)
                usePlayer.getState().award(`gt:words:${n}:${L.buoi || 1}`, 10, "nghe đủ từ mới");
            }}
          />
        ))}
      </ul>
      {more && more.length && (L.buoi || 1) === (L.nb || 1) ? (
        <details className="mt-3.5 rounded-xl border border-dashed border-[#E4E5F0] px-3 py-2">
          <summary className="cursor-pointer font-bold text-[#5B5A7A]">
            {`Từ mở rộng của cả bài – ${more.length} từ (không bắt buộc)`}
          </summary>
          <ul className="m-0 list-none p-0">
            {more.map((w) => (
              <WordRow key={w[0]} w={w} />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

/** gtGram — grammar patterns of the buổi (step "gram" / Sổ tay). */
export function GtGramSec({ L }: { L: GtSlice }) {
  return (
    <div>
      <h3 className={GT_H}>Mẫu câu & ngữ pháp</h3>
      {L.grammar.map((r, i) => (
        <RuleBox key={i} t={r.t} d={r.d} ex={r.ex} />
      ))}
    </div>
  );
}

/** gtDlg — dialogue scenes with play-all + blur toggle (step "dlg" / Sổ tay). */
export function GtDlgSec({ L }: { L: GtSlice }) {
  const [hide, setHide] = useState(false);
  const lines = L.dialog.flatMap((sc) => sc.lines.map((l) => l[2]));
  const blur = hide ? " blur-[5px]" : "";
  return (
    <div>
      <h3 className={GT_H}>Hội thoại</h3>
      <div className="flex flex-wrap gap-2">
        <Cta navy className="mt-0" onClick={() => speakAll(lines)}>
          ▶ Nghe cả hội thoại
        </Cta>
        <Cta ghost className="mt-0" onClick={() => setHide((h) => !h)}>
          {hide ? "👀 Hiện phiên âm & nghĩa" : "🙈 Ẩn phiên âm & nghĩa"}
        </Cta>
      </div>
      <div>
        {L.dialog.map((sc, i) => (
          <div key={i}>
            <p className="mb-1 mt-3 text-[0.85rem] font-bold text-[#5B5A7A]">{sc.scene}</p>
            <ul className="mb-4 flex list-none flex-col gap-2 p-0">
              {sc.lines.map(([who, side, zh, py, vi], j) => (
                <li
                  key={j}
                  className={`grid grid-cols-[2.8rem_1fr_auto] items-start gap-2.5 rounded-[14px] p-2.5 px-4 ${
                    side === "b" ? "bg-[#ea00000f]" : "bg-[#7f7f7f14]"
                  }`}
                >
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-full font-['Noto_Serif_SC',serif] text-[1.1rem] font-extrabold text-white ${
                      side === "b" ? "bg-[#EA0000]" : "bg-[#050349]"
                    }`}
                    lang="zh-CN"
                  >
                    {who}
                  </span>
                  <div>
                    <div className="font-['Noto_Serif_SC',serif] text-[clamp(1.4rem,3vw,2.1rem)] leading-snug" lang="zh-CN">
                      {zh}
                    </div>
                    <div className={`text-[clamp(0.9rem,1.6vw,1.1rem)] font-semibold text-[#B3261E]${blur}`}>{py}</div>
                    <div className={`text-[clamp(0.9rem,1.5vw,1.05rem)] text-[#3D3E5C]${blur}`}>{vi}</div>
                  </div>
                  <button
                    type="button"
                    aria-label={"Nghe " + py}
                    onClick={() => speak(zh)}
                    className="grid h-11 w-11 place-items-center rounded-full border border-[#E4E5F0] bg-transparent text-[16px] hover:bg-[#7f7f7f1f]"
                  >
                    🔊
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className={GT_P}>Mẹo: ẩn phiên âm, nghe từng câu rồi nói theo trước khi bấm hiện lại.</p>
    </div>
  );
}

/** gtWrite — pick a character, watch strokes, quiz mode (+3 điểm per char). */
export function GtWriteSec({ n, L }: { n: number; L: GtSlice }) {
  const [cur, setCur] = useState<Word | null>(null);
  const [err, setErr] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const wRef = useRef<HanziWriter | null>(null);

  // pick() — create the writer once the box is mounted + data exists
  useEffect(() => {
    const box = boxRef.current;
    if (!box || !cur) return;
    wRef.current = null;
    setErr(false);
    if (!BM.chars[cur[0]]) {
      setErr(true);
      return;
    }
    const sz = Math.round(box.getBoundingClientRect().width) || 240;
    const w = HanziWriter.create(box, cur[0], {
      width: sz,
      height: sz,
      padding: 14,
      charDataLoader: (x: string, done: (d: CharacterJson) => void) =>
        done(BM.chars[x] as unknown as CharacterJson),
      strokeColor: "#050349",
      outlineColor: "#E3DACB",
      highlightColor: "#EA0000",
      drawingColor: "#EA0000",
      drawingWidth: 14,
      showHintAfterMisses: 2,
      strokeAnimationSpeed: 0.9,
    });
    wRef.current = w;
    w.animateCharacter();
    speak(cur[0]);
  }, [cur]);

  const item = cur || L.write[0] || null;
  useEffect(() => {
    if (!cur && item) setCur(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h3 className={GT_H}>Tập viết 5 chữ</h3>
      <p className={GT_P}>Chọn chữ, xem thứ tự nét, rồi tự viết theo khung. Viết đúng một chữ được +3 điểm.</p>
      <div className="my-1 mb-3 flex flex-wrap gap-2">
        {L.write.map((it) => (
          <button
            key={it[0]}
            type="button"
            aria-label={`${it[0]} ${it[1]}`}
            aria-pressed={item === it || cur === it}
            onClick={() => setCur(it)}
            className={`h-[68px] w-[68px] rounded-xl border font-['Noto_Serif_SC',serif] text-[2.1rem] font-semibold text-[#050349] max-[460px]:h-14 max-[460px]:w-14 max-[460px]:text-[1.7rem] ${
              item === it || cur === it ? "border-[#EA0000] bg-[#ea00000f]" : "border-[#E4E5F0] bg-transparent"
            }`}
            lang="zh-CN"
          >
            {it[0]}
          </button>
        ))}
      </div>
      <div className="my-1 mb-4 flex flex-col items-center gap-2">
        <div
          ref={boxRef}
          className="grid h-[min(300px,70vw)] w-[min(300px,70vw)] place-items-center rounded-[14px] border border-[#E4E5F0] bg-white max-[460px]:h-[210px] max-[460px]:w-[210px]"
        >
          {err ? (
            <p className="px-4 text-center text-[13px] text-[#5B5A7A]">
              Chưa tải được bộ tập viết. Kiểm tra mạng rồi thử lại.
            </p>
          ) : null}
        </div>
        <div className="text-center">
          {item ? (
            <>
              <b className="block text-[1.1rem] text-[#14213D]">{`${item[0]} – ${item[1]}`}</b>
              <div className="text-[14px] text-[#5B5A7A]">{item[2]}</div>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Cta
            navy
            className="mt-0"
            onClick={() => {
              const w = wRef.current;
              if (w) {
                w.showCharacter();
                w.animateCharacter();
              }
            }}
          >
            ▶ Xem nét
          </Cta>
          <Cta
            ghost
            className="mt-0"
            onClick={() => {
              const w = wRef.current;
              const it = cur;
              if (!w || !it) return;
              w.quiz({
                onComplete: () =>
                  usePlayer.getState().award(`gt:write:${n}:${it[0]}`, 3, "viết đúng chữ " + it[0]),
              });
            }}
          >
            ✍ Tự viết
          </Cta>
        </div>
      </div>
    </div>
  );
}

/** gtQuiz — situational quiz; first-try correct answers feed the ★ check. */
export function GtQuizSec({ n, L }: { n: number; L: GtSlice }) {
  const [seed, setSeed] = useState(0);
  const si = gtStarInfo(n).parts[1];
  return (
    <div>
      <h3 className={GT_H}>Luyện tập theo tình huống</h3>
      <p className={GT_P}>
        {L.quizIdx
          ? `Phần luyện tập của Buổi ${L.buoi}. Mỗi câu đúng ngay lần đầu được +2 điểm.`
          : "Mỗi câu đúng ngay lần đầu được +2 điểm."}
      </p>
      {/* .gm-combo — gm.js gmComboHit rewrites this badge in place */}
      <div className="gm-combo my-1 text-[13px] font-bold text-[#5B5A7A]">
        Combo: trả lời đúng liên tiếp để nhân thưởng
      </div>
      <div key={seed}>
        {L.quiz.map((item, qn) => (
          <GtQuizItem key={qn} n={n} item={item} qn={qn} qi={L.quizIdx ? L.quizIdx[qn] : qn} />
        ))}
      </div>
      <Cta ghost onClick={() => setSeed((x) => x + 1)}>
        {si[1] ? "Làm lại để ôn" : `Làm lại (đã đúng ngay lần đầu ${si[2]} câu cần cho ★)`}
      </Cta>
      <Cta navy onClick={() => callHook("gmBlitz")}>
        ⚡ Thử thách 60 giây
      </Cta>
    </div>
  );
}

function GtQuizItem({ n, item, qn, qi }: { n: number; item: GtQuizItem; qn: number; qi: number }) {
  const [q, opts, why] = item;
  const [shuffled] = useState(() => shuffle(opts.map((t, i) => [t, i] as [string, number])));
  const [bad, setBad] = useState<Set<number>>(new Set());
  const [okFound, setOkFound] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [whyTxt, setWhyTxt] = useState("");
  const hz = /đọc/.test(q) && /[一-鿿]/.test(q) ? (q.match(/[一-鿿]+/) || [""])[0] : "";
  return (
    <div className="my-2 rounded-[14px] border border-[#E4E5F0] bg-white px-3.5 py-3">
      <p className="mb-2 font-semibold text-[#14213D]">{`${qn + 1}. ${q}`}</p>
      {hz ? (
        <Cta ghost className="mb-2.5 mt-0 inline-flex min-h-10 w-auto px-3.5 py-1.5" onClick={() => speak(hz)}>
          {`🔊 Nghe ${hz} trước khi chọn`}
        </Cta>
      ) : null}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-2.5">
        {shuffled.map(([t, i]) => {
          const ok = i === 0;
          const cls = okFound
            ? ok
              ? "border-[#3BB273] bg-[#E3F5E9] text-[#14532D]"
              : "border-[#E4E5F0] opacity-60"
            : bad.has(i)
              ? "border-[#EA0000] bg-[#FDE8E8] text-[#7F1D1D]"
              : "border-[#E4E5F0] hover:bg-[#7f7f7f14]";
          return (
            <button
              key={i}
              type="button"
              disabled={bad.has(i) || (okFound && !ok)}
              onClick={(e) => {
                if (answered && okFound) return;
                if (/[一-鿿]/.test(t)) speak(t.replace(/\(.*\)/, ""));
                if (ok) {
                  setOkFound(true);
                  callHook("gmPop", e.currentTarget);
                } else setBad((x) => new Set(x).add(i));
                if (!answered) {
                  setAnswered(true);
                  callHook("gmComboHit", ok, null, n, qi);
                  if (ok) {
                    usePlayer.getState().award(`gt:q:${n}:${qi}`, 2, "trả lời đúng");
                    const S = { ...useGt.getState().state };
                    S.quiz = { ...(S.quiz || {}) };
                    S.quiz[n] = { ...(S.quiz[n] || {}) };
                    if (!S.quiz[n][qi]) {
                      S.quiz[n][qi] = 1;
                      useGt.getState().save(S);
                      gtStarCheck(n);
                    }
                  }
                  setWhyTxt((ok ? "✓ " : "✗ ") + why);
                }
              }}
              className={`rounded-[14px] border-[1.5px] p-3 text-left font-inherit font-medium text-[#14213D] transition ${cls}`}
            >
              {/[一-鿿]/.test(t) ? (
                <span className="font-['Noto_Serif_SC',serif] text-[1.1rem]" lang="zh-CN">
                  {t}
                </span>
              ) : (
                t
              )}
            </button>
          );
        })}
      </div>
      {whyTxt ? <p className="mb-0 mt-2 text-[0.88rem] text-[#5B5A7A]">{whyTxt}</p> : null}
    </div>
  );
}

/** gtSay — pick a phrase, hear it, record yourself; includes gtListen + the
 *  🎙 speaking task on the last buổi. The recorder is pron.js `pronRecorder`
 *  rendered by the pron feature through the "pronRecorder" hook. */
export function GtSaySec({ n, L }: { n: number; L: GtSlice }) {
  const [cur, setCur] = useState<[string, string] | null>(L.say[0] || null);
  const [resetKey, setResetKey] = useState(0);
  // pronRecorder takes a Word triple; say pairs are [zh, py] → pad with "".
  const recWord: Word | null = cur ? [cur[0], cur[1], ""] : null;
  const rec = callHook<React.ReactNode>("pronRecorder", recWord, resetKey, () => {
    if (cur) speak(cur[0]);
  });
  return (
    <div>
      <h3 className={GT_H}>Luyện nói</h3>
      <p className={GT_P}>Chọn một câu, nghe mẫu, rồi ghi âm giọng bạn để so sánh.</p>
      <div className="my-3.5 flex flex-wrap gap-1.5">
        {L.say.map((it, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={cur === it || (!cur && i === 0)}
            onClick={() => {
              setCur(it);
              setResetKey((k) => k + 1);
              speak(it[0]);
            }}
            className={`min-h-[38px] rounded-[10px] border px-3.5 py-1.5 text-[0.85rem] text-[#14213D] ${
              cur === it || (!cur && i === 0)
                ? "border-[#050349] bg-[#050349] text-white"
                : "border-[#E4E5F0] bg-transparent hover:bg-[#7f7f7f1a]"
            }`}
          >
            <span className="font-['Noto_Serif_SC',serif]" lang="zh-CN">
              {it[0]}
            </span>
          </button>
        ))}
      </div>
      <div onClick={() => setTimeout(() => gtStarCheck(n), 2500)}>{rec}</div>
      <GtListenSec n={n} />
      {(!L.buoi || L.buoi === L.nb) && L.task ? (
        <div className="my-2 rounded-[14px] border border-[#E4E5F0] bg-white px-3.5 py-2.5">
          <b className="mb-0.5 block text-[15px] text-[#14213D]">🎙 Nhiệm vụ nói cuối bài</b>
          <span className="text-[14px] text-[#5B5A7A]">{L.task}</span>
        </div>
      ) : null}
    </div>
  );
}

/** gtListen — "no mic?" fallback: hear a phrase, pick the right one, 3 rounds.
 *  3/3 correct counts the speaking ★ (+5 điểm once per lesson). */
function GtListenSec({ n }: { n: number }) {
  const s = useGt((x) => x.state);
  const done = !!(s.listen && s.listen[n]);
  const all = GT_LESSONS[n]?.say || [];
  const [qs, setQs] = useState<[string, string][]>(() => shuffle(all.slice()).slice(0, 3));
  const [k, setK] = useState(0);
  const [ok, setOk] = useState(0);
  const [phase, setPhase] = useState<"idle" | "q" | "end">("idle");
  const [picked, setPicked] = useState<[string, string] | null>(null);

  // `setTimeout(()=>speak(w[0]),150)` when a question shows
  useEffect(() => {
    if (phase === "q" && qs[k]) {
      setPicked(null);
      const w = qs[k];
      const t = setTimeout(() => speak(w[0]), 150);
      return () => clearTimeout(t);
    }
  }, [phase, k, qs]);

  // finish → persist + award + star check
  useEffect(() => {
    if (phase !== "end" || ok < 3) return;
    const S = { ...useGt.getState().state };
    S.listen = { ...(S.listen || {}) };
    if (!S.listen[n]) {
      S.listen[n] = 1;
      useGt.getState().save(S);
      usePlayer.getState().award(`gt:listen:${n}`, 5, "nghe-chọn đúng 3 câu");
      gtStarCheck(n);
    }
  }, [phase, ok, n]);

  const restart = () => {
    setQs(shuffle(all.slice()).slice(0, 3));
    setK(0);
    setOk(0);
    setPhase("q");
  };

  // stable option order per question — shuffling inside render would
  // rearrange buttons every re-render (incl. right after picking)
  const curOpts = useMemo(
    () => (qs[k] ? shuffle([qs[k], ...shuffle(all.filter((x) => x !== qs[k])).slice(0, 2)]) : []),
    [qs, k, all],
  );

  return (
    <div className="my-2 rounded-[14px] border border-[#E4E5F0] bg-white px-3.5 py-2.5">
      <b className="mb-0.5 block text-[15px] text-[#14213D]">👂 Không ghi âm được? Nghe và chọn câu đúng</b>
      <span className="text-[14px] text-[#5B5A7A]">
        {done
          ? "Bạn đã làm đúng đủ 3 câu, sao Luyện nói đã được tính."
          : "Đúng đủ 3 câu cũng được tính sao Luyện nói, không cần micro."}
      </span>
      <div className="mt-2">
        {done ? null : phase === "idle" ? (
          <Cta ghost className="mt-2" onClick={() => setPhase("q")}>
            Bắt đầu nghe-chọn
          </Cta>
        ) : phase === "end" ? (
          <div>
            <p className="my-2 text-[0.88rem] font-semibold text-[#5B5A7A]">
              {ok >= 3 ? "✓ Đúng cả 3 câu!" : `Đúng ${ok}/3. Làm lại để đủ 3 câu nhé.`}
            </p>
            {ok >= 3 ? null : (
              <Cta ghost className="mt-0" onClick={restart}>
                Làm lại
              </Cta>
            )}
          </div>
        ) : qs[k] ? (
          <div>
            <Cta navy className="mt-0 mb-2" onClick={() => speak(qs[k][0])}>
              {`🔊 Nghe câu ${k + 1}/3`}
            </Cta>
            <div className="grid gap-2">
              {curOpts.map((o, i) => {
                const right = o === qs[k];
                const cls = picked
                  ? right
                    ? "border-[#3BB273] bg-[#E3F5E9] text-[#14532D]"
                    : o === picked
                      ? "border-[#EA0000] bg-[#FDE8E8] text-[#7F1D1D]"
                      : "border-[#E4E5F0] opacity-60"
                  : "border-[#E4E5F0] hover:bg-[#7f7f7f14]";
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!!picked}
                    onClick={() => {
                      if (picked) return;
                      setPicked(o);
                      if (right) setOk((x) => x + 1);
                      setTimeout(() => {
                        if (k + 1 >= qs.length) setPhase("end");
                        else setK(k + 1);
                      }, 900);
                    }}
                    className={`rounded-[14px] border-[1.5px] p-3 text-left font-medium ${cls}`}
                  >
                    <span className="font-['Noto_Serif_SC',serif]" lang="zh-CN">
                      {o[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Step key → section (one component per GT_STEPS entry). The original's
 *  renderGTLesson maps everything except "book"/"write" to the home view;
 *  GtStepContent is exposed for callers that render a single step. */
export function GtStepContent({ n, L, step }: { n: number; L: GtSlice; step: string }) {
  switch (step) {
    case "goal":
      return <GtGoalSec L={L} />;
    case "pron":
      return <GtPronSec L={L} />;
    case "words":
      return <GtWordsSec n={n} L={L} />;
    case "dlg":
      return <GtDlgSec L={L} />;
    case "gram":
      return <GtGramSec L={L} />;
    case "write":
      return <GtWriteSec n={n} L={L} />;
    case "quiz":
      return <GtQuizSec n={n} L={L} />;
    case "say":
      return <GtSaySec n={n} L={L} />;
    default:
      return null;
  }
}
