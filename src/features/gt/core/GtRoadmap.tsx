/**
 * renderGT + gtMap + gtOpenUnlock — the GT roadmap shown inside the
 * "Bài học" dialog GT tab (registered as the `renderGTNode` hook).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { GtState } from "@/stores/gt";
import { useGt } from "@/stores/gt";
import { useUi } from "@/stores/ui";
import { ls } from "@/lib/storage";
import { callHook } from "@/services/hooks";
import { price, permActive, onEntChange } from "@/services/entitlement";
import { GT_LESSONS, GT_STAGES, GT_TITLES, gtLabel } from "@/data/gt-data";
import { GT_CLASS, gtClassName } from "@/game/world/geometry";
import { keys, setTarget } from "@/game/engine/state";
import { enterClass } from "@/game/engine/navigation";
import {
  GT_FREE,
  GT_NEED,
  GT_GATES,
  duoStart,
  gtAllPaid,
  gmGateName,
  gmGateOf,
  gmGateOpenList,
  gmGatePassed,
  gmGateReady,
  gtClassLesson,
  gtCurB,
  gtLockWhy,
  gtNextAct,
  gtNS,
  gtStarTxt,
  gtStars,
  gtUnlocked,
  gtWordStats,
  msGet,
  msIdFor,
  setGtSession,
} from "./state";
import type { GtRange } from "./state";
import { Cta, FbLine, NhIcon, PgGo, VI_SM } from "./bits";
import { GtLesson } from "./GtLesson";

interface MsInfo {
  title: string;
  scene: { icon: string; place: string };
  npc: { name: string };
}

/** renderGT — roadmap body for a class range (C0).
 *  `gtCur` lives in the useGt session store so deep-links (openGTLesson,
 *  openGTClass, libWrite) navigate this component reactively. */
export function GtRoadmap({
  lv,
  onPickLv,
}: {
  lv: number;
  onPickLv?: (l: number) => void;
}) {
  const s = useGt((x) => x.state);
  const cur = useGt((x) => x.cur);
  const [view, setView] = useState(ls.get("nh:gtview") || "map");

  // gtWB(): the GT pane wants the wide whiteboard dialog + 说 header
  useEffect(() => {
    const ui = useUi.getState();
    const only = Number(callHook<number>("gtOnly")) || 0;
    ui.openRoom({
      mark: "说",
      title: only ? `Lớp ${gtClassName(only)}` : "Luyện giao tiếp tiếng Trung cấp tốc",
      sub: "Theo giáo trình 汉语口语速成 – 30 bài Nhập môn + 25 bài Cơ sở",
      body: ui.room.body,
      variant: "wb",
      key: ui.room.key,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const C0: GtRange = GT_CLASS[lv] || { from: 1, to: 55 };
  const isClass = !!GT_CLASS[lv];
  const open = (i: number) => setGtSession({ cur: i, step: "goal" });

  if (cur && GT_LESSONS[cur]) return <GtLesson n={cur} onBack={() => setGtSession({ cur: 0 })} />;

  const inR = (k: number) => k >= C0.from && k <= C0.to;
  const total = C0.to - C0.from + 1;
  const nDone = Object.keys(s.done).map(Number).filter(inR).length;
  const openCount = Object.keys(GT_LESSONS).map(Number).filter(inR).length;
  const ws = gtWordStats(C0);

  const cn = isClass ? gtClassLesson(lv) : 0;
  const cb = cn ? gtCurB(cn) : 0;
  const mid = cn ? msIdFor(cn, cb) : "";
  const M = mid ? msGet<MsInfo>(mid) : undefined;
  const gates = gmGateOpenList().filter((g) => g >= C0.from && g <= C0.to);

  const sn = isClass ? cn : gtWordStats().cur || 1;

  return (
    <div>
      {onPickLv ? (
        <div className="mb-3 flex gap-1.5">
          {[1, 2, 3]
            .filter((l) => GT_CLASS[l])
            .map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onPickLv(l)}
                className={`rounded-full border-2 px-3 py-1 text-[12px] font-bold ${
                  l === lv
                    ? "border-[#050349] bg-[#050349] text-white"
                    : "border-[#E4E5F0] bg-white text-[#3D3E5C]"
                }`}
              >
                {gtClassName(l)}
              </button>
            ))}
        </div>
      ) : null}
      <div className="mb-1.5 flex items-baseline justify-between gap-4">
        <b className="text-[18px] text-[#14213D]">
          {isClass ? `${GT_CLASS[lv].book} – ${total} bài` : "4 quyển – 55 bài"}
        </b>
        <span className="text-[14px] text-[#5B5A7A]">
          {nDone}/{total} bài
        </span>
      </div>
      <div className="my-1.5 mb-3 h-2 overflow-hidden rounded-full bg-[#EFF1F8]">
        <i className="block h-full rounded-full bg-[#EA0000]" style={{ width: `${(nDone / total) * 100}%` }} />
      </div>
      <div className="my-0.5 mb-3 grid grid-cols-4 gap-2 max-[520px]:grid-cols-2">
        {(
          [
            [`${ws.done}/${total}`, "bài đã xong"],
            [`${ws.learned}`, `từ đã học${ws.all ? ` / ${ws.all} từ đã mở` : ""}`],
            [`${ws.stars}★`, `trên ${ws.built * 3} sao`],
            [ws.cur ? gtLabel(ws.cur).replace("Nhập môn – ", "").replace("Cơ sở – ", "CS ") : "—", "đang học"],
          ] as [string, string][]
        ).map(([v, t]) => (
          <div key={t} className="rounded-xl border border-[#E4E5F0] bg-white px-1.5 py-2 text-center">
            <b className="block text-[clamp(1.05rem,2.4vw,1.45rem)] leading-tight text-[#050349]">{v}</b>
            <small className="block text-[11.5px] leading-snug text-[#5B5A7A]">{t}</small>
          </div>
        ))}
      </div>
      <div className="mb-2.5 inline-flex rounded-full border border-[#E4E5F0] bg-white p-[3px]">
        {(
          [
            ["map", "🗺 Bản đồ"],
            ["list", "☰ Danh sách"],
          ] as [string, string][]
        ).map(([k, t]) => (
          <button
            key={k}
            type="button"
            aria-pressed={view === k}
            onClick={() => {
              ls.set("nh:gtview", k);
              setView(k);
            }}
            className={`min-h-[34px] rounded-full border-0 bg-transparent px-3.5 py-1.5 text-[13.5px] font-bold ${
              view === k ? "bg-[#050349] text-white" : "text-[#5B5A7A]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mb-2.5 flex flex-wrap gap-2">
        {gates.map((g) => (
          <Cta key={g} navy className="mt-0" onClick={() => callHook("openGate", g)}>
            ⚔ {gmGateName(g)}
          </Cta>
        ))}
        {M ? (
          <Cta className="mt-0" onClick={() => duoStart(cn, cb)}>
            {gtNextAct(cn, cb) === "ch" ? `▶ Học tiếp: ⚡ Thử thách buổi ${cb}` : `▶ Học tiếp: 🎯 ${M.title}`}
          </Cta>
        ) : null}
        <Cta ghost className="mt-0" onClick={() => callHook("gmBlitz")}>
          ⏱ Đua 60 giây
        </Cta>
      </div>
      {view === "map" ? <GtMap C0={C0} s={s} onOpen={open} /> : null}
      <div className={`my-0.5 mb-4 grid gap-2 ${view === "map" ? "hidden" : ""}`}>
        {GT_STAGES.filter((st) => !isClass || (st.from >= C0.from && st.to <= C0.to)).map((st) => (
          <div key={st.name} className="rounded-[14px] border border-[#E4E5F0] bg-white px-3.5 py-2.5">
            <b className="block text-[15px]">{st.name}</b>
            <small className="text-[#5B5A7A]">{st.sub}</small>
            <ul className="mt-2 flex list-none flex-col gap-1.5 p-0">
              {Array.from({ length: st.to - st.from + 1 }, (_, k) => st.from + k).map((i) => {
                const T = GT_TITLES[i] || ["", "", ""];
                const has = !!GT_LESSONS[i];
                const ok = gtUnlocked(i);
                const done = !!s.done[i];
                const row = (
                  <>
                    <span
                      className={`grid h-8 w-8 flex-none place-items-center rounded-[9px] text-[13.5px] font-extrabold ${
                        done ? "bg-[#2E9E5B] text-white" : ok ? "bg-[#EA0000] text-white" : "bg-[#E4E5F0] text-[#5B5A7A]"
                      }`}
                    >
                      {i - st.off}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[14.5px] font-bold leading-snug ${ok ? "" : "text-[#5B5A7A]"}`}>
                        <span className="font-['Noto_Serif_SC',serif] text-[1.05rem] text-[#EA0000]" lang="zh-CN">
                          {T[0]}
                        </span>
                        {" – "}
                        {T[1]}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-[#5B5A7A]">
                        <b className="inline font-bold text-[#14213D]">Output: </b>
                        {T[2]}
                      </span>
                      {!ok && i > GT_FREE && (has || GT_LESSONS[i - 1]) ? (
                        <span className="mt-0.5 block text-[12.5px] font-semibold text-[#B3261E]">
                          {gtLockWhy(i).replace(" để mở.", "")}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`whitespace-nowrap pt-1 text-[12px] font-bold ${
                        done ? "text-[#2E9E5B]" : ok ? "text-[#EA0000]" : "text-[#5B5A7A]"
                      }`}
                    >
                      {ok ? (has && gtStars(i) ? gtStarTxt(gtStars(i)) : "Học →") : "🔒"}
                    </span>
                  </>
                );
                return (
                  <li key={i}>
                    {ok ? (
                      <button
                        type="button"
                        onClick={() => open(i)}
                        className="grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-2.5 rounded-xl border border-[#E4E5F0] bg-transparent p-2.5 px-3 text-left text-[#14213D] transition hover:border-[#EA0000]"
                      >
                        {row}
                      </button>
                    ) : (
                      <div className="grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-2.5 rounded-xl border border-[#E4E5F0] p-2.5 px-3 text-left text-[#14213D]">
                        {row}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <p className={VI_SM}>
        Đã mở {openCount} bài. Tích đủ {GT_NEED}★ ở mỗi bài để mở bài tiếp theo.
      </p>
      {sn && GT_LESSONS[sn] ? (
        <Cta className="w-full" onClick={() => open(sn)}>
          Học {gtLabel(sn)} – {GT_LESSONS[sn].title}
        </Cta>
      ) : (
        <div className="mt-3.5 flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-dashed border-[#E4E5F0] p-3 px-3.5 text-[14px] text-[#5B5A7A]">
          🔒 Lớp này ra mắt ngày 30/11, hoặc trả 69.000đ để mở khoá toàn bộ. Trong lúc chờ, học lớp Nhập môn 1 nhé!
        </div>
      )}
    </div>
  );
}

/* ---------------- gtMap: serpentine SVG roadmap ---------------- */

function GtMap({ C0, s, onOpen }: { C0: GtRange; s: GtState; onOpen: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const cur = gtWordStats(C0).cur;
  const [sel, setSel] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setW(Math.max(300, (el.clientWidth || Math.min(window.innerWidth - 56, 1000)) - 12));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setSel(cur || C0.from);
  }, [cur, C0.from]);

  const lay = useMemo(() => {
    const W = w || 300;
    const cols = W >= 760 ? 6 : W >= 520 ? 5 : 3;
    const N = C0.to - C0.from + 1;
    const rows = Math.ceil(N / cols);
    const sm = W < 520;
    const VW = W;
    const dx = VW / cols;
    const R = Math.min(30, dx * 0.24);
    const DY = Math.round(Math.max(dx * 0.8, R * 2 + (sm ? 96 : 108)));
    const top = R + 60;
    const VH = top + (rows - 1) * DY + R + 56;
    const pt = (k: number): [number, number] => {
      const r = Math.floor(k / cols);
      const c = k % cols;
      const cc = r % 2 ? cols - 1 - c : c;
      return [dx * (cc + 0.5), top + r * DY];
    };
    let d = "";
    for (let k = 0; k < N; k++) {
      const [x, y] = pt(k);
      if (!k) {
        d += `M${x} ${y}`;
        continue;
      }
      const [px, py] = pt(k - 1);
      if (py === y) d += ` L${x} ${y}`;
      else {
        const side = px > VW / 2 ? 1 : -1;
        const ox = px + side * dx * 0.55;
        d += ` C${ox} ${py} ${ox} ${y} ${x} ${y}`;
      }
    }
    return { W, cols, N, sm, VW, dx, R, DY, top, VH, pt, d };
  }, [w, C0.from, C0.to]);

  const { N, sm, R, VH, pt, d } = lay;
  const nodes: number[] = Array.from({ length: N }, (_, k) => C0.from + k);
  const stageMarks = GT_STAGES.filter((st) => st.from >= C0.from && st.from <= C0.to);
  const gateMarks = GT_GATES.filter((g) => g >= C0.from && g <= C0.to);
  const curPt = cur ? pt(cur - C0.from) : null;

  return (
    <div>
      <div
        ref={ref}
        className="overflow-hidden rounded-2xl border border-[#E4E5F0] bg-gradient-to-b from-[#F7F8FC] to-white p-1.5"
      >
        {w ? (
          <svg viewBox={`0 0 ${lay.VW} ${VH}`} className="block h-auto w-full" role="img" aria-label="Bản đồ lộ trình">
            <path
              d={d}
              fill="none"
              stroke="#E4E5F0"
              strokeWidth={R * 0.9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d={d} fill="none" stroke="#C9CCE0" strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
            {stageMarks.map((st) => {
              const [x, y] = pt(st.from - C0.from);
              const lab = st.sub.split("–")[0].trim();
              const bw = lab.length * 15 + 24;
              return (
                <g key={st.name}>
                  <rect x={x - bw / 2} y={y - R - 46} width={bw} height={24} rx={12} fill="#050349" />
                  <text
                    x={x}
                    y={y - R - 29}
                    textAnchor="middle"
                    fill="#fff"
                    fontFamily="'Noto Serif SC','Be Vietnam Pro',serif"
                    fontSize={sm ? 12 : 14}
                    fontWeight={700}
                  >
                    {lab}
                  </text>
                </g>
              );
            })}
            {nodes.map((i) => {
              const k = i - C0.from;
              const [x, y] = pt(k);
              const L = GT_LESSONS[i];
              const ok = gtUnlocked(i);
              const dn = !!s.done[i];
              const stc = L ? gtStars(i) : 0;
              const state = dn ? "done" : i === cur ? "cur" : ok ? "open" : L ? "lock" : "soon";
              const circ =
                state === "done"
                  ? { fill: "#2E9E5B", stroke: "#fff" }
                  : state === "cur"
                    ? { fill: "#EA0000", stroke: "#fff" }
                    : state === "open"
                      ? { fill: "#fff", stroke: "#EA0000" }
                      : state === "lock"
                        ? { fill: "#E4E5F0", stroke: "#fff" }
                        : { fill: "#fff", stroke: "#C9CCE0", strokeDasharray: "5 5" };
              const numFill =
                state === "open" ? "#EA0000" : state === "lock" || state === "soon" ? "#8A8DA8" : "#fff";
              const vt = GT_TITLES[i][1];
              const mx = sm ? 14 : 17;
              return (
                <g
                  key={i}
                  tabIndex={0}
                  role="button"
                  aria-label={`${gtLabel(i)}: ${GT_TITLES[i][1]}` + (ok ? "" : " (đang khoá)")}
                  className="cursor-pointer outline-none"
                  onClick={() => setSel(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSel(i);
                    }
                  }}
                >
                  <title>{`${gtLabel(i)} – ${GT_TITLES[i][0]} – ${GT_TITLES[i][1]}`}</title>
                  {i === cur ? <circle cx={x} cy={y} r={R + 8} fill="rgba(234,0,0,.15)" /> : null}
                  <circle
                    cx={x}
                    cy={y}
                    r={R}
                    fill={circ.fill}
                    stroke={i === sel ? "#050349" : circ.stroke}
                    strokeWidth={i === sel ? 6 : 4}
                  />
                  <text
                    x={x}
                    y={y + R * 0.36}
                    textAnchor="middle"
                    fontFamily="'Be Vietnam Pro',sans-serif"
                    fontWeight={800}
                    fontSize={R * 0.95}
                    fill={numFill}
                  >
                    {ok || dn ? String(i > 30 ? i - 30 : i) : "🔒"}
                  </text>
                  <text
                    x={x}
                    y={y + R + 20}
                    textAnchor="middle"
                    fontSize={sm ? 14 : 17}
                    fill="#F5A623"
                    letterSpacing={1}
                  >
                    {L ? gtStarTxt(stc) : ""}
                  </text>
                  <text
                    x={x}
                    y={y + R + (L ? 40 : 22)}
                    textAnchor="middle"
                    fontFamily="'Be Vietnam Pro',sans-serif"
                    fontSize={sm ? 12 : 14}
                    fontWeight={600}
                    fill={state === "soon" || state === "lock" ? "#A4A6BC" : "#4B5872"}
                  >
                    {vt.length > mx ? vt.slice(0, mx - 1) + "…" : vt}
                  </text>
                </g>
              );
            })}
            {gateMarks.map((g) => {
              const [x, y] = pt(g - C0.from);
              const gx = x + R * 1.15;
              const gy = y - R * 1.05;
              const st = gmGatePassed(g) ? "pass" : gmGateReady(g) ? "ready" : "lock";
              const circ =
                st === "pass"
                  ? { fill: "#E3F5E9", stroke: "#2E9E5B" }
                  : st === "ready"
                    ? { fill: "#FFF3E0", stroke: "#EA0000" }
                    : { fill: "#E4E5F0", stroke: "#fff" };
              return (
                <g
                  key={g}
                  tabIndex={0}
                  role="button"
                  aria-label={gmGateName(g)}
                  className="cursor-pointer outline-none"
                  onClick={() => setSel(g)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSel(g);
                    }
                  }}
                >
                  <title>
                    {gmGateName(g) +
                      (st === "pass" ? " – đã vượt" : st === "ready" ? " – đã mở" : " – học xong các bài để mở")}
                  </title>
                  <circle cx={gx} cy={gy} r={R * 0.62} fill={circ.fill} stroke={circ.stroke} strokeWidth={3} />
                  <text x={gx} y={gy + R * 0.22} textAnchor="middle" fontSize={R * 0.66}>
                    🏯
                  </text>
                </g>
              );
            })}
            {cur && curPt ? (
              <text x={curPt[0] + R * 0.85} y={curPt[1] - R * 0.55} textAnchor="middle" fontSize={sm ? 24 : 30}>
                📍
              </text>
            ) : null}
          </svg>
        ) : null}
      </div>
      <GtDetail i={sel} s={s} onOpen={onOpen} />
    </div>
  );
}

/** Map detail panel (gtMap `show`). */
function GtDetail({ i, s, onOpen }: { i: number; s: GtState; onOpen: (i: number) => void }) {
  const T = GT_TITLES[i];
  const L = GT_LESSONS[i];
  if (!T) return null;
  const ok = gtUnlocked(i);
  const k = L ? gtStars(i) : 0;
  return (
    <div className="my-2.5 mb-3 rounded-[14px] border border-[#E4E5F0] bg-white px-4 py-3">
      <div className="text-[16px]">
        <b>{gtLabel(i)} – </b>
        <span className="font-['Noto_Serif_SC',serif] text-[1.15rem] text-[#EA0000]" lang="zh-CN">
          {T[0]}
        </span>
        {` – ${T[1]}`}
      </div>
      <p className="my-1.5 text-[14.5px] text-[#5B5A7A]">
        <b className="text-[#14213D]">Học xong bạn sẽ: </b>
        {T[2]}
      </p>
      {L ? (
        <p className="my-1.5 text-[14.5px] font-semibold text-[#5B5A7A]">
          {L.words.length} từ mới – {gtNS(i)} nhiệm vụ – {gtStarTxt(k)}
        </p>
      ) : null}
      {ok ? (
        <div className="flex flex-wrap items-center gap-2">
          <Cta onClick={() => duoStart(i, s.done[i] ? 1 : 0)}>
            {s.done[i] ? "▶ Học lại bài này" : "▶ Học bài này →"}
          </Cta>
          <PgGo onClick={() => onOpen(i)}>📚 Giáo trình chi tiết</PgGo>
        </div>
      ) : (
        <p className="my-1.5 text-[12.5px] font-semibold text-[#B3261E]">{gtLockWhy(i)}</p>
      )}
      {gmGateOf(i) ? (
        <Cta
          navy={!gmGatePassed(i)}
          ghost={gmGatePassed(i)}
          disabled={!gmGateReady(i)}
          onClick={() => callHook("openGate", i)}
        >
          {gmGatePassed(i)
            ? `⚔ Đã thắng ${gmGateName(i)} – làm lại`
            : gmGateReady(i)
              ? `⚔ ${gmGateName(i)}`
              : `⚔ ${gmGateName(i)}: học xong các bài để mở`}
        </Cta>
      ) : null}
    </div>
  );
}

/* ---------------- gtOpenUnlock ---------------- */

/** Dialog body for gtOpenUnlock. */
function GtUnlockBody({ lv }: { lv: number }) {
  const C = GT_CLASS[lv];
  const prev = GT_CLASS[lv - 1];

  // NH.onChange: close + toast when the campus entitlement lands
  useEffect(
    () =>
      onEntChange(() => {
        if (permActive()) {
          useUi.getState().closeRoom();
          useUi.getState().toast("Đã mở khoá toàn bộ bài học!");
        }
      }),
    [],
  );

  return (
    <div>
      <div className="mb-2.5 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        <div className="flex flex-col items-start gap-2 rounded-2xl border-[1.5px] border-[#E4E5F0] bg-white p-4 text-left">
          <NhIcon k="alarm" cls="navy" />
          <b>Ra mắt ngày 30/11</b>
          <small className="text-[#5B5A7A]">
            Lớp {C.name} mở miễn phí từ 30/11. Trong lúc chờ, học tiếp lớp {prev ? prev.name : "trước"} và tích sao
            nhé.
          </small>
          <Cta
            navy
            className="mt-1"
            onClick={() => {
              useUi.getState().closeRoom();
              setTimeout(() => enterClass((lv - 1) || 1), 60);
            }}
          >
            Về lớp {prev ? prev.name : "trước"}
          </Cta>
        </div>
        <div className="flex flex-col items-start gap-2 rounded-2xl border-[1.5px] border-[#E4E5F0] bg-white p-4 text-left">
          <NhIcon k="unlock" cls="red" />
          <b>Học trước – mở khoá toàn bộ – {Number(price("campus") || 69000).toLocaleString("vi-VN")}đ</b>
          <small className="text-[#5B5A7A]">
            Trả một lần, dùng vĩnh viễn: mở mọi bài và mọi lớp không cần chờ tích sao, tải 4 quyển sách giáo khoa
            chuẩn, vào Thư viện và Khu vui chơi.
          </small>
          <Cta className="mt-1" onClick={() => callHook("openBuy")}>
            Mở khoá ngay
          </Cta>
        </div>
      </div>
      <FbLine src={"lop-khoa-" + lv} />
    </div>
  );
}

/** gtOpenUnlock — locked-class paywall dialog (or straight to roadmap when paid). */
export function gtOpenUnlock(lv: number): void {
  const C = GT_CLASS[lv];
  if (!C) return;
  if (gtAllPaid()) {
    // legacy: window._gtMap=1 then openLesson() — openGTClass consumes the
    // flag and resets gt.cur so the roadmap (not a lesson) shows. nh:tab
    // covers the out-of-class LessonList path.
    window._gtMap = 1;
    ls.set("nh:tab", "gt");
    callHook("openLesson");
    return;
  }
  const a = C.from > 30 ? C.from - 30 : C.from;
  const b = C.to > 30 ? C.to - 30 : C.to;
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({
    mark: "🔓",
    title: `Mở lớp ${C.name} – Ra mắt 30/11`,
    sub: `${C.book} – Bài ${a}–${b}`,
    body: <GtUnlockBody lv={lv} />,
    variant: "default",
  });
}
