/**
 * Phòng phát âm — pron.js `openPron(body,set,fixLv)` as a React body for
 * the shared room dialog. Level tabs → lesson select (day-gated free tier /
 * GT unlock) → mouth-shape stage + syllable buttons + recorder + word list,
 * with the 4-tone review <details> pinned at the bottom.
 */
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { Word } from "@/types/lesson";
import type { PySyllable } from "@/lib/pinyin";
import { pyPlain, pySplit, TONES } from "@/lib/pinyin";
import { speak } from "@/services/tts";
import { callHook } from "@/services/hooks";
import { campusActive } from "@/services/entitlement";
import { C } from "@/config/campus";
import { GT_ONLY, LVS, LVN } from "@/game/world/geometry";
import { gtUnlocked } from "@/features/gt/core/state";
import { Tabs } from "@/features/ui-bits";
import { MV, TONE_TIP, animateMouth, mouthDraw, stopMouth, sylPlan } from "./mouth";
import { pronDay, pronLessons, pronState, type PronLesson } from "./lessons";
import { PronRecorder } from "./PronRecorder";

interface Cur {
  w: Word;
  syl: PySyllable[];
}

const HANZI = /[一-鿿]/;

export function PronDialog({ fixLv }: { fixLv?: number }) {
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const lv = pronState.lv ?? 1;
  const LS = useMemo(pronLessons, []);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const tokenRef = useRef(0);
  const curRef = useRef<Cur | null>(null);
  const [cur, setCur] = useState<Cur | null>(null);
  const [markIdx, setMarkIdx] = useState(-1);
  const [tip, setTip] = useState<PySyllable | null>(null);
  const [pickSeq, setPickSeq] = useState(0);

  const list = useMemo(() => LS.filter((l) => l.lv === lv), [LS, lv]);
  const paid = campusActive() || GT_ONLY;
  const day = pronDay(lv);
  const openN = day + 2;
  // Prefer the canonical hook once registered; else the local gt-core copy
  // (same pattern as features/gt/library `unlocked`).
  const unlocked = (i: number) => callHook<boolean>("gtUnlocked", i) ?? gtUnlocked(i);
  const isOpen = (l: PronLesson) =>
    GT_ONLY ? unlocked(l.gi ?? 0) : paid || l.n <= openN;
  const les = list.find((l) => l.n === pronState.les[lv]) || list[0];
  const open = les ? isOpen(les) : false;
  const tipPlan = useMemo(() => (tip ? sylPlan(tip.base) : null), [tip]);

  const mark = (i: number) => setMarkIdx(i);
  const showTip = (s: PySyllable | null | undefined) => setTip(s ?? null);

  const playAll = () => {
    const c = curRef.current;
    if (!c) return;
    const my = ++tokenRef.current;
    speak(c.w[0]);
    let i = 0;
    const nextS = () => {
      if (my !== tokenRef.current) return;
      if (i >= c.syl.length) {
        mark(-1);
        return;
      }
      mark(i);
      const s = c.syl[i++];
      showTip(s);
      animateMouth(svgRef.current, sylPlan(s.base), 480, nextS);
    };
    nextS();
  };

  const playSyl = (i: number, ms: number, cb?: () => void) => {
    const c = curRef.current;
    if (!c) return;
    const my = ++tokenRef.current;
    const s = c.syl[i];
    const hzs = [...c.w[0]].filter((ch) => HANZI.test(ch));
    mark(i);
    showTip(s);
    speak(hzs.length === c.syl.length ? hzs[i] : c.w[0]);
    animateMouth(svgRef.current, sylPlan(s.base), ms, () => {
      if (my === tokenRef.current && cb) cb();
    });
  };

  const playSlow = () => {
    const c = curRef.current;
    if (!c) return;
    let i = 0;
    const go = () => {
      if (i < c.syl.length) {
        const k = i++;
        playSyl(k, 1300, () => setTimeout(go, 250));
      } else mark(-1);
    };
    go();
  };

  const pick = (w: Word, auto: boolean) => {
    let nh = [...w[0]].filter((c) => HANZI.test(c)).length;
    if (/儿$/.test(w[0]) && /[^eé]r$/i.test(pyPlain(w[1]))) nh--;
    const nc: Cur = { w, syl: pySplit(w[1], nh) };
    curRef.current = nc;
    setCur(nc);
    mark(0);
    showTip(nc.syl[0]);
    setPickSeq((x) => x + 1);
    if (auto) {
      stageRef.current?.scrollIntoView({
        block: "start",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
      playAll();
    }
  };

  // Original render() rebuilds the stage per lesson: rest pose + auto-pick.
  useEffect(() => {
    curRef.current = null;
    setCur(null);
    mark(-1);
    showTip(null);
    mouthDraw(svgRef.current, MV.rest);
    if (les?.w?.length) pick(les.w[0], false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [les]);

  // dlg "close": stop any pending mouth chain.
  useEffect(
    () => () => {
      tokenRef.current++;
      stopMouth();
    },
    [],
  );

  return (
    <div>
      {!fixLv && (
        <Tabs
          tabs={LVS().map((l): [string, string] => [String(l), LVN(l)])}
          active={String(lv)}
          onPick={(k) => {
            pronState.lv = +k;
            rerender();
          }}
        />
      )}
      {!list.length ? (
        <p className="text-[13px] text-[#5B5A7A]">Chưa có dữ liệu bài học.</p>
      ) : (
        <>
          <select
            aria-label="Chọn bài"
            value={les.n}
            onChange={(e) => {
              pronState.les[lv] = +e.target.value;
              rerender();
            }}
            className="mb-2 w-full rounded-xl border-2 border-[#E4E5F0] bg-white px-3 py-2 text-[14px] font-semibold text-[#3D3E5C]"
          >
            {list.map((l) => (
              <option key={l.n} value={l.n}>
                {isOpen(l)
                  ? `Bài ${l.n}: ${l.vi}`
                  : `🔒 Bài ${l.n}: ${l.vi} (mở vào ngày ${l.n - 2})`}
              </option>
            ))}
          </select>
          {!paid && (
            <p className="mb-2 text-[12px] text-[#8A8FA8]">
              {`Bản miễn phí: đã mở ${Math.min(openN, list.length)}/${list.length} bài (3 bài đầu + mỗi ngày thêm 1 bài).`}
            </p>
          )}
          {!open ? (
            <div className="rounded-2xl border-2 border-[#E2B14A] bg-[#FFFBEF] p-4">
              <b className="text-[14px] text-[#050349]">
                {`🔒 Bài ${les.n} mở sau ${les.n - openN} ngày nữa`}
              </b>
              <p className="mt-1 text-[13px] leading-relaxed text-[#5B5A7A]">
                {`Bản miễn phí mở sẵn 3 bài và thêm 1 bài mỗi ngày. Thẻ học viên vĩnh viễn (${Number(C.prices.campus || 69000).toLocaleString("vi-VN")}đ, dùng vĩnh viễn) mở ngay tất cả bài.`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => callHook("openBuy")}
                  className="rounded-xl bg-[#E2B14A] px-4 py-2 text-[13px] font-bold text-[#050349]"
                >
                  Mua thẻ học viên
                </button>
                <button
                  type="button"
                  onClick={() => {
                    pronState.les[lv] = Math.min(openN, list.length);
                    rerender();
                  }}
                  className="rounded-xl border-2 border-[#050349] px-4 py-2 text-[13px] font-bold text-[#050349]"
                >
                  {`Về bài ${Math.min(openN, list.length)}`}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                ref={stageRef}
                className="flex flex-col items-center gap-3 rounded-2xl bg-[#FBF7F0] p-3 sm:flex-row sm:items-start"
              >
                <svg
                  ref={svgRef}
                  className="h-[190px] w-[240px] shrink-0"
                  viewBox="0 0 240 190"
                  role="img"
                  aria-label="Khẩu hình miệng"
                >
                  <defs>
                    <clipPath id="mClip">
                      <path id="mInnerC" />
                    </clipPath>
                  </defs>
                  <ellipse cx={120} cy={40} rx={122} ry={175} fill="#F6D2B5" />
                  <path
                    d="M108 6 Q100 30 104 40"
                    fill="none"
                    stroke="#E2B396"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  <ellipse cx={110} cy={44} rx={5} ry={3} fill="#C98E72" />
                  <ellipse cx={130} cy={44} rx={5} ry={3} fill="#C98E72" />
                  <ellipse cx={44} cy={96} rx={20} ry={12} fill="#F4A6A0" opacity={0.45} />
                  <ellipse cx={196} cy={96} rx={20} ry={12} fill="#F4A6A0" opacity={0.45} />
                  <path id="mOuter" fill="#C9545E" />
                  <path id="mInner" fill="#5A1E2A" />
                  <g clipPath="url(#mClip)">
                    <rect id="mTeeth" fill="#FFFDF8" rx={3} />
                    <ellipse id="mTongue" fill="#E8818C" />
                  </g>
                  <rect id="mBite" fill="#FFFDF8" rx={3} />
                </svg>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div
                    className="font-['Noto_Serif_SC',serif] text-[30px] font-semibold leading-tight text-[#050349]"
                    lang="zh-CN"
                  >
                    {cur?.w[0]}
                  </div>
                  <div className="mt-1 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                    {cur?.syl.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => playSyl(i, 1100)}
                        className={`rounded-lg border-2 px-2.5 py-0.5 text-[15px] font-semibold transition ${
                          i === markIdx
                            ? "border-[#EA0000] bg-[#FFF3EC] text-[#EA0000]"
                            : "border-[#E4E5F0] bg-white text-[#050349] hover:border-[#EA0000]"
                        }`}
                      >
                        {s.show}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 text-[13px] text-[#5B5A7A]">{cur?.w[2]}</div>
                  <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <button
                      type="button"
                      onClick={playAll}
                      className="rounded-xl bg-[#050349] px-4 py-2 text-[13px] font-bold text-white"
                    >
                      ▶ Nghe và xem
                    </button>
                    <button
                      type="button"
                      onClick={playSlow}
                      className="rounded-xl border-2 border-[#E4E5F0] px-4 py-2 text-[13px] font-bold text-[#3D3E5C] hover:border-[#050349]"
                    >
                      🐢 Chậm từng âm
                    </button>
                  </div>
                </div>
              </div>
              <PronRecorder
                key={`${lv}-${les.n}`}
                word={cur?.w ?? null}
                resetKey={pickSeq}
                onModel={playAll}
              />
              <div className="mt-2 rounded-xl bg-[#F6F7FC] px-3 py-2 text-[13px] text-[#3D3E5C] empty:hidden">
                {tip && tipPlan ? (
                  <>
                    <b className="text-[#050349]">{tip.show}</b>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5">
                      {tipPlan.tips.map(([k, v]) => (
                        <li key={k}>
                          <strong>{k}: </strong>
                          {v}
                        </li>
                      ))}
                      <li>
                        <strong>Thanh điệu: </strong>
                        {TONE_TIP[tip.tone] || TONE_TIP[0]}
                      </li>
                    </ul>
                  </>
                ) : null}
              </div>
              <p className="mt-3 text-[13px] text-[#5B5A7A]">
                Chọn một từ để nghe và xem miệng chuyển động. Bấm từng âm tiết để xem riêng âm đó.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(les.w || []).map((w) => (
                  <button
                    key={w[0]}
                    type="button"
                    aria-pressed={cur?.w === w}
                    onClick={() => pick(w, true)}
                    className={`flex flex-col items-center rounded-xl border-2 px-3 py-1.5 transition ${
                      cur?.w === w
                        ? "border-[#EA0000] bg-[#FFF3EC]"
                        : "border-[#E4E5F0] bg-white hover:border-[#EA0000]"
                    }`}
                  >
                    <span
                      className="font-['Noto_Serif_SC',serif] text-[18px] font-semibold leading-snug text-[#14213D]"
                      lang="zh-CN"
                    >
                      {w[0]}
                    </span>
                    <small className="text-[11px] font-medium text-[#5B5A7A]">{w[1]}</small>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
      <details className="mt-4 rounded-2xl border-2 border-[#E4E5F0] p-3 open:border-[#E2B14A]">
        <summary className="cursor-pointer text-[13px] font-bold text-[#050349]">
          Ôn 4 thanh điệu với âm “ma”
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TONES.map(([zh, py, vi, desc, d]) => (
            <button
              key={py}
              type="button"
              aria-label={`${py}, ${vi}, ${desc}`}
              onClick={() => speak(zh)}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-[#E4E5F0] bg-white p-2 text-center transition hover:border-[#EA0000]"
            >
              <svg viewBox="0 0 100 44" aria-hidden="true" className="h-11 w-full text-[#050349]">
                <path
                  d="M2 6H98M2 22H98M2 38H98"
                  stroke="currentColor"
                  strokeOpacity={0.12}
                />
                <path d={d} fill="none" stroke="#EA0000" strokeWidth={4} strokeLinecap="round" />
              </svg>
              <div>
                <span
                  className="font-['Noto_Serif_SC',serif] text-[1.4rem] leading-none text-[#EA0000]"
                  lang="zh-CN"
                >
                  {zh}{" "}
                </span>
                <span className="text-[13px] font-medium text-[#5B5A7A]">{py}</span>
              </div>
              <div className="text-[12px] leading-snug text-[#5B5A7A]">
                {vi}. {desc}
              </div>
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
