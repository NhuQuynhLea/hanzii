/**
 * cdq.js — trò chơi bàn tròn trong Nhà sinh hoạt (Đố nhanh / Ghép cặp / Nghe đoán thanh).
 * DOM → React: cdSit/cdPickGame/cdPlay mở RoomDialog; ván chơi render theo nhịp 150ms.
 */
import { useEffect, useRef, useState } from "react";
import { me, keys, setTarget } from "@/game/engine/state";
import { usePlayer } from "@/stores/player";
import { useUi } from "@/stores/ui";
import { speak } from "@/services/tts";
import { sfx } from "@/services/sfx";
import { avatarSvgUri, lvOf } from "@/game/entities/avatar-svg";
import { callHook } from "@/services/hooks";
import {
  CDG, CDQ_LEAD, CDQ_BOTS, cdqGet, cdqSet, cdqRand, cdqShuf, cdqBuild,
  cdqActiveAt, cdqHumans, cdqPlayers, cdqSend, cdqLeave, type CdqQ, type CdqPlayerRow,
} from "./cdq-core";
import { GP, gpJoinByCode, gpNameOf } from "./community";
import { NhIcon, DuoTile, nhFx, nhBurst, gtConfetti } from "./bits";
import type { Word } from "@/types/lesson";

/* ---------- nhãn vùng ngồi (scene-lib.js roomZone) ---------- */
export function cdTableLabel(i: number): string {
  const act = cdqActiveAt(i);
  return act ? `Ngồi vào bàn – đang chơi ${(CDG[act.g] || CDG.do).name}` : "Ngồi vào bàn";
}

/* ---------- bước 1: chơi với ai ---------- */
export function cdSit(i: number): void {
  const act = cdqActiveAt(i);
  if (act) return cdPlay(i, false, act.g || "do", act.gm || "");
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({
    mark: "社",
    title: `Bàn ${i + 1} – Bạn chơi với ai?`,
    sub: "Chơi cùng nhóm học bằng mã nhóm, hoặc chơi tự do với người đang ngồi và bạn học ảo",
    body: <CdWho i={i} />,
    variant: "default",
  });
}

function CdWho({ i }: { i: number }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const join = async () => {
    setBusy(true);
    const err = await gpJoinByCode(code);
    setBusy(false);
    if (err) setMsg(err);
    else cdPickGame(i, GP.code);
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-2 rounded-2xl border border-[#E4E5F0] p-4">
        <NhIcon k="group" cls="red" />
        <b className="text-[15px] text-[#14213D]">Chơi với nhóm</b>
        {GP.code ? (
          <>
            <small className="text-[12px] text-[#5B5A7A]">{`Nhóm của bạn: ${GP.name || "Nhóm học"} – mã ${GP.code}`}</small>
            <button type="button" className="mt-auto rounded-xl bg-[#EA0000] px-4 py-2 text-[13.5px] font-bold text-white" onClick={() => cdPickGame(i, GP.code)}>
              {`Chơi với nhóm ${GP.name || ""}`}
            </button>
          </>
        ) : (
          <>
            <small className="text-[12px] text-[#5B5A7A]">Nhập mã 6 ký tự do trưởng nhóm gửi</small>
            <input
              className="w-full rounded-xl border border-[#E4E5F0] px-3 py-2 text-[14px] uppercase outline-none focus:border-[#EA0000]"
              maxLength={6}
              placeholder="Mã nhóm"
              aria-label="Mã nhóm"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") join();
              }}
            />
            <button type="button" disabled={busy} className="rounded-xl bg-[#EA0000] px-4 py-2 text-[13.5px] font-bold text-white disabled:opacity-50" onClick={join}>
              {busy ? "Đang tìm nhóm…" : "Vào nhóm và chơi"}
            </button>
            {msg ? <p className="text-[12px] text-[#C8102E]">{msg}</p> : null}
          </>
        )}
      </div>
      <div className="flex flex-col gap-2 rounded-2xl border border-[#E4E5F0] p-4">
        <NhIcon k="free" cls="navy" />
        <b className="text-[15px] text-[#14213D]">Chơi tự do</b>
        <small className="text-[12px] text-[#5B5A7A]">Không cần mã. Ghép với người đang ngồi ở bàn, vắng thì có bạn học ảo.</small>
        <button type="button" className="mt-auto rounded-xl bg-[#050349] px-4 py-2 text-[13.5px] font-bold text-white" onClick={() => cdPickGame(i, "")}>
          Chơi tự do
        </button>
      </div>
    </div>
  );
}

/* ---------- bước 2: chọn trò ---------- */
export function cdPickGame(i: number, gm: string): void {
  useUi.getState().openRoom({
    mark: "社",
    title: `Bàn ${i + 1} – Chọn trò chơi`,
    sub: gm ? `Chơi với nhóm ${gpNameOf(gm)}` : "Chơi tự do",
    body: (
      <div>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(CDG).map(([k, G]) => (
            <button
              key={k}
              type="button"
              className="flex flex-col items-start gap-1.5 rounded-2xl border border-[#E4E5F0] p-4 text-left transition hover:border-[#EA0000]"
              onClick={() => cdPlay(i, true, k, gm)}
            >
              <NhIcon k={G.ik} cls={{ do: "red", ghep: "navy", thanh: "jade" }[k] || ""} />
              <b className="text-[14.5px] text-[#14213D]">{G.name}</b>
              <small className="text-[12px] leading-snug text-[#5B5A7A]">{G.sub}</small>
            </button>
          ))}
        </div>
        <button type="button" className="mt-3 text-[13px] font-semibold text-[#5B5A7A] underline" onClick={() => cdSit(i)}>
          ← Đổi cách chơi
        </button>
      </div>
    ),
    variant: "default",
  });
}

/* ---------- ván chơi ---------- */
let cdqLastPlay = { i: 0, g: "do", gm: "" };

export function cdPlay(i: number, fresh: boolean, g: string, gm: string): void {
  g = CDG[g] ? g : "do";
  const act = fresh ? null : cdqActiveAt(i);
  if (act) {
    g = CDG[act.g] ? act.g : "do";
    gm = act.gm || "";
  }
  const G = CDG[g],
    seed = act ? act.sd : Math.floor(Math.random() * 1e9),
    t0 = act ? act.t0 : Date.now() + CDQ_LEAD;
  cdqLastPlay = { i, g, gm: gm || "" };
  cdqSet({ i, seed, t0, g, gm: gm || "", N: G.N, T: G.T, Q: cdqBuild(seed, g), cur: -2, score: 0, k1: 0, la: -1, mine: {}, bots: [], miss: 0 });
  cdqFinished = false;
  const cdq = cdqGet()!;
  const hum = cdqHumans().length;
  if (hum < 2) {
    const R = cdqRand(seed ^ 0x5bd1),
      bs = CDQ_BOTS.slice()
        .sort(() => R() - 0.5)
        .slice(0, 2 - hum);
    cdq.bots = bs.map((b) => ({
      ...b,
      score: 0,
      ans: cdq.Q.map(() => (g === "ghep" ? { at: 15000 + R() * 24000, ok: R() < b.sk + 0.12 } : { at: 1600 + R() * 5600, ok: R() < b.sk })),
    }));
  }
  cdqSend();
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({
    mark: "社",
    title: `${G.name} – ` + (cdq.gm ? `Nhóm ${gpNameOf(cdq.gm)}` : `Bàn ${i + 1}`),
    sub: G.sub,
    variant: "duo",
    body: <CdqGame />,
  });
}

export function cdqAnswer(k: number, ok: boolean, bonus: number): void {
  const cdq = cdqGet();
  if (!cdq) return;
  if (cdq.mine[k] !== undefined) return; // already answered this question — don't double-score/overwrite
  cdq.mine[k] = ok ? 1 : 0;
  cdq.k1 = k + 1;
  cdq.la = ok ? 1 : 0;
  if (ok) cdq.score += bonus;
  try {
    sfx(ok ? "ok" : "bad");
  } catch {
    /* noop */
  }
  cdqSend();
}

/* ---------- nhịp ván: cdqLoop/cdqEnd làm việc trên trạng thái module ---------- */
interface CdqUi {
  tick(): void;
  end(rows: CdqPlayerRow[]): void;
}
let cdqUi: CdqUi | null = null,
  cdqFinished = false;

const cdqRows = () => cdqPlayers(lvOf, me.h || 0, me.n, usePlayer.getState().points);

/** cdq.js `cdqEnd` — bảng xếp hạng + thưởng điểm (idempotent mỗi ván). */
export function cdqFinish(): void {
  const cdq = cdqGet();
  if (!cdq || cdqFinished) return;
  cdqFinished = true;
  const rows = cdqRows()
    .slice()
    .sort((a, b) => b.score - a.score);
  cdqUi?.end(rows);
  const rank = rows.findIndex((p) => p.me) + 1,
    pts = 3 + (rank === 1 ? 5 : rank === 2 ? 2 : 0);
  usePlayer.getState().award(`cdq:${cdq.seed}`, pts, rank === 1 ? "thắng ở Nhà sinh hoạt" : "chơi ở Nhà sinh hoạt");
  if (rank === 1) {
    try {
      callHook("fbNudge", "thang-ban-choi", "Bạn vừa thắng ở Nhà sinh hoạt! Nhắn NowHanzi nhận mã giảm 20.000đ Thẻ học viên vĩnh viễn nhé.");
    } catch {
      /* noop */
    }
    try {
      sfx("win");
      gtConfetti();
    } catch {
      /* noop */
    }
  }
}

/** cdq.js `cdqLoop` — một nhịp 150ms kiểm tra tiến độ ván. */
export function cdqLoop(): void {
  const cdq = cdqGet();
  if (!cdq) {
    cdqUi?.tick(); // paint the session-lost fallback instead of a frozen frame
    return;
  }
  const now = Date.now(),
    k = Math.floor((now - cdq.t0) / cdq.T);
  if (now < cdq.t0) {
    if (cdq.cur !== -1) cdq.cur = -1;
    cdqUi?.tick();
    return;
  }
  if (k >= cdq.N || (cdq.cur === cdq.N - 1 && cdqRows().every((p) => p.done))) return cdqFinish();
  if (k !== cdq.cur) cdq.cur = k;
  cdqUi?.tick();
}

export function PlayerStrip({ rows }: { rows: CdqPlayerRow[] }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      {rows.map((p, i) => (
        <div key={i} className={`flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 ${p.me ? "border-[#E2B14A] bg-[#FFFBEF]" : "border-[#E4E5F0] bg-white"}`}>
          <img alt="" src={avatarSvgUri(p.h, p.lv, 0)} className="h-7 w-7 rounded-full" />
          <span className="leading-tight">
            <b className="block max-w-[110px] truncate text-[12px] text-[#14213D]">{p.n + (p.bot ? " – bạn ảo" : "")}</b>
            <span className="block text-[10.5px] text-[#5B5A7A]">{`${p.score} điểm`}</span>
          </span>
          {p.st !== undefined ? (
            <i className={`grid h-4 w-4 place-items-center rounded-full text-[10px] not-italic text-white ${p.st ? "bg-[#2E7D4F]" : "bg-[#C8102E]"}`}>{p.st ? "✓" : "✗"}</i>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CdqGame() {
  const [, setTick] = useState(0);
  const [ended, setEnded] = useState(false);
  const [rankRows, setRankRows] = useState<CdqPlayerRow[] | null>(null);
  useEffect(() => {
    const bound = cdqGet();
    cdqUi = {
      tick: () => setTick((x) => x + 1),
      end: (rows) => {
        setRankRows(rows);
        setEnded(true);
      },
    };
    const t = setInterval(cdqLoop, 150);
    cdqLoop();
    return () => {
      clearInterval(t);
      cdqUi = null;
      // chỉ rời ván nếu đây vẫn là ván của mình (ván mới đã thay thế thì giữ nguyên).
      // Defer: StrictMode's simulated unmount re-runs setup (re-binding cdqUi)
      // synchronously, so only a real unmount leaves the game.
      setTimeout(() => {
        if (cdqUi === null && cdqGet() === bound) cdqLeave();
      }, 0);
    };
  }, []);

  const cdq = cdqGet();
  if (!cdq) {
    // session lost (e.g. module hot-reload reset) — offer a way back instead of a dead panel
    return (
      <div className="py-8 text-center">
        <p className="text-[14px] font-semibold text-[#5B5A7A]">Ván này đã kết thúc hoặc mất trạng thái.</p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            className="rounded-xl border border-[#E4E5F0] px-4 py-2 text-[13px] font-semibold text-[#5B5A7A]"
            onClick={() => useUi.getState().closeRoom()}
          >
            Đóng
          </button>
          <button
            type="button"
            className="rounded-xl bg-[#EA0000] px-4 py-2 text-[13px] font-bold text-white"
            onClick={() => cdPlay(cdqLastPlay.i, true, cdqLastPlay.g, cdqLastPlay.gm)}
          >
            Chơi lại →
          </button>
        </div>
      </div>
    );
  }
  const now = Date.now(),
    rows = cdqPlayers(lvOf, me.h || 0, me.n, usePlayer.getState().points);

  if (ended && rankRows) {
    const rank = rankRows.findIndex((p) => p.me) + 1;
    return (
      <div>
        <PlayerStrip rows={rankRows} />
        <div className="h-1.5 overflow-hidden rounded-full bg-[#EFF1F8]">
          <i className="block h-full bg-[#EA0000]" style={{ width: "0%" }} />
        </div>
        <div className="mt-4 text-center">
          <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-full bg-[#C8102E] font-['Noto_Serif_SC',serif] text-xl font-bold text-[#FFE7A8]">
            {rank === 1 ? "第一" : "加油"}
          </div>
          <h3 className="text-[17px] font-bold text-[#14213D]">{rank === 1 ? "Bạn thắng ván này!" : `Bạn hạng ${rank}/${rankRows.length}`}</h3>
          <ol className="mx-auto mt-3 max-w-xs space-y-1 text-left">
            {rankRows.map((p, i) => (
              <li key={i} className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-[13.5px] ${p.me ? "bg-[#FFFBEF] font-bold" : "bg-[#F6F6FA]"}`}>
                <b className="truncate text-[#14213D]">{p.n}</b>
                <span className="text-[#5B5A7A]">{`${p.score} điểm`}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex justify-center gap-2">
            <button type="button" className="rounded-xl border border-[#E4E5F0] px-4 py-2 text-[13px] font-semibold text-[#5B5A7A]" onClick={() => useUi.getState().closeRoom()}>
              Rời bàn
            </button>
            <button
              type="button"
              className="rounded-xl border border-[#E4E5F0] px-4 py-2 text-[13px] font-semibold text-[#5B5A7A]"
              onClick={() => {
                const i = cdq.i,
                  gm = cdq.gm;
                cdqLeave();
                cdPickGame(i, gm);
              }}
            >
              Đổi trò
            </button>
            <button
              type="button"
              className="rounded-xl bg-[#EA0000] px-4 py-2 text-[13px] font-bold text-white"
              autoFocus
              onClick={() => cdPlay(cdq.i, !cdqActiveAt(cdq.i), cdq.g, cdq.gm)}
            >
              Ván mới →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (now < cdq.t0) {
    return (
      <div>
        <PlayerStrip rows={rows} />
        <div className="h-1.5 overflow-hidden rounded-full bg-[#EFF1F8]">
          <i className="block h-full bg-[#EA0000] transition-[width]" style={{ width: "100%" }} />
        </div>
        <div className="mt-6 text-center">
          <p className="text-[13px] text-[#5B5A7A]">Ván bắt đầu sau</p>
          <div className="my-2 text-4xl font-bold text-[#050349]">{Math.ceil((cdq.t0 - now) / 1000)}</div>
          <p className="text-[13px] text-[#5B5A7A]">{(CDG[cdq.g] || CDG.do).sub}</p>
        </div>
      </div>
    );
  }

  const k = Math.min(cdq.N - 1, Math.max(0, Math.floor((now - cdq.t0) / cdq.T)));
  if (cdq.cur !== k) cdq.cur = k;
  const pct = Math.max(0, 100 - (((now - cdq.t0) % cdq.T) / cdq.T) * 100);
  return (
    <div>
      <PlayerStrip rows={rows} />
      <div className="h-1.5 overflow-hidden rounded-full bg-[#EFF1F8]">
        <i className="block h-full bg-[#EA0000] transition-[width] duration-150" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3">
        <CdqStage k={k} />
      </div>
    </div>
  );
}

/* ---------- từng câu hỏi ---------- */
export function CdqStage({ k }: { k: number }) {
  const cdq = cdqGet();
  if (!cdq) return null;
  const q = cdq.Q[k];
  if (!q) return null;
  const t0 = cdq.t0 + k * cdq.T,
    bonus = () => 100 + Math.max(0, Math.round(((cdq.T - (Date.now() - t0)) / cdq.T) * 100));
  if (q.t === "ghep") return <GhepStage key={k} q={q} k={k} t0={t0} />;
  return <ChoiceStage key={k} q={q} k={k} bonus={bonus} />;
}

function ChoiceStage({ q, k, bonus }: { q: Exclude<CdqQ, { t: "ghep" }>; k: number; bonus: () => number }) {
  const cdq = cdqGet()!;
  const [picked, setPicked] = useState<Word | string | null>(null);
  const [fb, setFb] = useState<string>("");
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    if (q.t !== "mean") {
      const t = setTimeout(() => speak(q.w[0]), 150);
      return () => clearTimeout(t);
    }
  }, [q]);
  const right: Word | string = q.t === "tone" ? q.w[1] : q.w;
  const opts: (Word | string)[] = q.o as (Word | string)[];
  const answered = picked !== null;
  return (
    <div>
      {cdq.N > 1 ? <p className="text-[12px] font-semibold text-[#8A8FA8]">{`Câu ${k + 1}/${cdq.N}`}</p> : null}
      {q.t === "mean" ? (
        <>
          <h3 className="text-[15px] font-bold text-[#14213D]">Chữ này nghĩa là gì?</h3>
          <div className="my-3 text-center">
            <span className="block font-['Noto_Serif_SC',serif] text-3xl font-semibold text-[#14213D]">{q.w[0]}</span>
            <span className="text-[13px] font-medium text-[#C8102E]">{q.w[1]}</span>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-[15px] font-bold text-[#14213D]">{q.t === "tone" ? "Nghe và chọn đúng dấu thanh" : "Nghe và chọn chữ đúng"}</h3>
          <button type="button" className="mx-auto my-2 block rounded-full border border-[#E4E5F0] px-3 py-1.5 text-lg" onClick={() => speak(q.w[0])}>
            🔊
          </button>
          {q.t === "tone" ? <div className="mb-2 text-center font-['Noto_Serif_SC',serif] text-2xl font-semibold text-[#14213D]">{q.w[0]}</div> : null}
        </>
      )}
      <div className="grid grid-cols-2 gap-2">
        {opts.map((o, i) => {
          const isRight = o === right;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              className={`rounded-xl border px-3 py-2.5 text-[14px] transition disabled:opacity-70 ${
                answered && isRight
                  ? "border-[#2E7D4F] bg-[#F0F7F1] font-semibold text-[#2E7D4F]"
                  : answered && o === picked
                    ? "border-[#C8102E] bg-[#FFF3EC] text-[#C8102E]"
                    : "border-[#E4E5F0] bg-white enabled:hover:border-[#EA0000]"
              }`}
              onClick={(e) => {
                if (answered) return;
                const good = o === right;
                setPicked(o);
                setOk(good);
                cdqAnswer(k, good, bonus());
                nhFx(e.currentTarget as HTMLElement, good);
                callHook("wmHit", [q.w[0]], good);
                setFb(good ? "Đúng! Chờ mọi người trả lời…" : `Đáp án: ${q.w[0]} ${q.w[1]} – ${q.w[2]}`);
              }}
            >
              {q.t === "mean" ? <span>{(o as Word)[2]}</span> : q.t === "tone" ? <span>{o as string}</span> : <span className="font-['Noto_Serif_SC',serif] text-lg">{(o as Word)[0]}</span>}
            </button>
          );
        })}
      </div>
      {fb ? <p className={`mt-3 text-center text-[13px] font-semibold ${ok ? "text-[#2E7D4F]" : "text-[#C8102E]"}`}>{fb}</p> : null}
    </div>
  );
}

function GhepStage({ q, k, t0 }: { q: Extract<CdqQ, { t: "ghep" }>; k: number; t0: number }) {
  const cdq = cdqGet()!;
  const [selL, setSelLState] = useState<string | null>(null);
  const [selR, setSelRState] = useState<string | null>(null);
  // ref mirrors: two clicks can land in the same React batch before the
  // selection state flushes — resolve pairs against the live value.
  const selLRef = useRef<string | null>(null);
  const selRRef = useRef<string | null>(null);
  const setSelL = (v: string | null) => {
    selLRef.current = v;
    setSelLState(v);
  };
  const setSelR = (v: string | null) => {
    selRRef.current = v;
    setSelRState(v);
  };
  const [bad, setBad] = useState<string[]>([]);
  const [doneSet, setDoneSet] = useState<Set<string>>(new Set());
  const [fb, setFb] = useState("");
  const rightCol = useRef<Word[] | null>(null);
  if (!rightCol.current) rightCol.current = cdqShuf(q.pairs.slice(), cdqRand(cdq.seed + 7));
  const right = rightCol.current;

  const tryPair = (l: string, r: string) => {
    if (l === r) {
      const el = document.querySelector(`[data-cdq-r="${CSS.escape(r)}"]`);
      nhBurst(el as HTMLElement);
      const nd = new Set(doneSet);
      nd.add(l);
      setDoneSet(nd);
      speak(l);
      callHook("wmHit", [l], true);
      setSelL(null);
      setSelR(null);
      if (nd.size >= q.pairs.length) {
        const sec = (Date.now() - t0) / 1000;
        cdqAnswer(k, true, Math.max(100, 300 + Math.round(cdq.T / 1000 - sec) * 10 - cdq.miss * 20));
        setFb(`Xong sau ${Math.round(sec)} giây! Chờ mọi người…`);
      }
    } else {
      cdq.miss++;
      setBad([l, r]);
      setTimeout(() => {
        setBad([]);
        setSelL(null);
        setSelR(null);
      }, 400);
      try {
        sfx("bad");
      } catch {
        /* noop */
      }
    }
  };

  return (
    <div>
      <h3 className="text-[15px] font-bold text-[#14213D]">Ghép chữ Hán với nghĩa</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {q.pairs.map((w) => (
            <DuoTile
              key={w[0]}
              z={w[0]}
              done={doneSet.has(w[0])}
              bad={bad.includes(w[0])}
              selected={selL === w[0]}
              disabled={doneSet.has(w[0]) || !!fb}
              onClick={() => {
                if (fb) return;
                setSelL(w[0]);
                if (selRRef.current) tryPair(w[0], selRRef.current);
              }}
            />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {right.map((w) => (
            <button
              key={w[0]}
              type="button"
              data-cdq-r={w[0]}
              disabled={doneSet.has(w[0]) || !!fb}
              className={`rounded-xl border-2 px-3 py-2.5 text-[13.5px] transition ${
                doneSet.has(w[0])
                  ? "border-transparent bg-[#F0F7F1] text-[#2E7D4F] opacity-60"
                  : bad.includes(w[0])
                    ? "border-[#C8102E] bg-[#FFF3EC]"
                    : selR === w[0]
                      ? "border-[#EA0000] bg-[#FFF3EC]"
                      : "border-[#E4E5F0] bg-white enabled:hover:border-[#EA0000]"
              }`}
              onClick={() => {
                if (fb) return;
                setSelR(w[0]);
                if (selLRef.current) tryPair(selLRef.current, w[0]);
              }}
            >
              {w[2]}
            </button>
          ))}
        </div>
      </div>
      {fb ? <p className="mt-3 text-center text-[13px] font-semibold text-[#2E7D4F]">{fb}</p> : null}
    </div>
  );
}
