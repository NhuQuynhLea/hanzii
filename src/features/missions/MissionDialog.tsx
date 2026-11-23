/**
 * Mission dialogue UI — React port of missions.js msStart/msBubble/msNote/
 * msScroll/msNext/msEnd. Teacher chat-bubble mission flow rendered into the
 * shared room dialog (`useUi.openRoom`, variant "duo" = original wb+duo).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gtLabel } from "@/data/gt-data";
import type { Word } from "@/types/lesson";
import { dstr, shuffle } from "@/lib/helpers";
import { ls } from "@/lib/storage";
import { avatarSvgUri } from "@/game/entities/avatar-svg";
import { me } from "@/game/engine/state";
import { speak } from "@/services/tts";
import { sfx } from "@/services/sfx";
import { callHook } from "@/services/hooks";
import { useUi } from "@/stores/ui";
import { usePlayer } from "@/stores/player";
import { gtSave, gtState, useGt } from "@/stores/gt";
import { MsLine } from "./MsLine";
import { nhBurst, nhFx } from "./fx";
import {
  duoPlain,
  gtBSteps,
  gtCheckDone,
  gtNS,
  gtPy,
  gtSeen,
  gtStarCheck,
  gtUnlocked,
  msDone,
  msFr,
  msGet,
  msGiftName,
  msIdFor,
  msLastGet,
  msLastSet,
  msNumZh,
} from "./core";
import type { MsLine as MsLineData, MsMission, MsStep } from "./data";

/* ---------- shared Tailwind fragments (approximate gt.css classes) ---------- */

const CHECK =
  "w-full rounded-2xl bg-[#1C1A6B] px-5 py-3.5 text-[15px] font-extrabold text-white shadow-[0_4px_0_#050349] transition enabled:active:translate-y-[3px] enabled:active:shadow-none disabled:bg-[#E4E5F0] disabled:text-[#5B5A7A] disabled:shadow-[0_4px_0_#C9CCE0]";
const SKIP =
  "rounded-2xl border-2 border-b-4 border-[#E4E5F0] bg-transparent px-4 py-3 text-[14px] font-bold text-[#5B5A7A] enabled:active:translate-y-[3px] enabled:active:border-b-2";
const OPT =
  "flex flex-col items-start gap-0.5 rounded-2xl border-2 border-b-4 border-[#E4E5F0] bg-transparent px-3.5 py-2.5 text-left text-[#3D3E5C] enabled:hover:border-[#1C1A6B] disabled:opacity-50";
const OPT_BAD = " border-[#C8102E] bg-[#FDECEE]";
const OPT_HINT = " border-[#58CC02] shadow-[0_0_0_3px_rgba(88,204,2,.25)]";
const TILE =
  "inline-flex flex-col items-center rounded-2xl border-2 border-b-4 border-[#E4E5F0] bg-transparent px-3.5 py-1.5 font-['Noto_Serif_SC',serif] text-[22px] leading-tight text-[#3D3E5C] enabled:active:translate-y-[2px] enabled:active:border-b-2 disabled:opacity-60";
const PLAY_SM =
  "h-14 w-14 self-center rounded-2xl bg-[#1C1A6B] text-2xl text-white shadow-[0_5px_0_#050349] active:translate-y-[3px] active:shadow-none";

const SCENE_BG: Record<string, string> = {
  cafe: "linear-gradient(180deg,#F7E3C3 0 62%,#8A5A3B 62% 66%,#A8704A 66%)",
  gate: "linear-gradient(180deg,#FFE7C2 0 60%,#B9C2CF 60%)",
  yard: "linear-gradient(180deg,#CFEFFF 0 58%,#8FCB6B 58%)",
  class: "linear-gradient(180deg,#F3EEE3 0 62%,#C89B6D 62%)",
  food: "linear-gradient(180deg,#FFE0C7 0 62%,#C0563C 62%)",
  lib: "linear-gradient(180deg,#EDE4D3 0 62%,#7A5333 62%)",
  bank: "linear-gradient(180deg,#E6EEF8 0 62%,#6E7F96 62%)",
  dorm: "linear-gradient(180deg,#EDE7FA 0 62%,#9C86C9 62%)",
  phone: "linear-gradient(180deg,#1C1A6B 0 62%,#050349 62%)",
};
const BILL_COL: Record<number, string> = { 50: "#2E7D4F", 20: "#8A5A3B", 10: "#1F5FB0", 5: "#7A4FA0", 1: "#B07A1E" };

/* ---------- chat message model ---------- */

type Msg =
  | { id: number; k: "b"; who: "npc" | "me"; L: MsLineData; hid?: boolean }
  | { id: number; k: "n"; t: string; cls?: string }
  | { id: number; k: "chip"; w: Word };

interface Api {
  next(): void;
  go(t: number): void;
  later(fn: () => void, t: number): void;
  clearAct(): void;
  bubble(who: "npc" | "me", L: MsLineData, o?: { mute?: boolean; hidden?: boolean }): number;
  reveal(id: number): void;
  note(t: string, cls?: string): void;
  chip(w: Word): void;
  miss(): void;
  listenHit(): void;
  listenOk(): void;
  spoke(): void;
  tapped(): void;
}

/** Minimal SpeechRecognition surface (webkit-prefixed in some browsers). */
interface RecogLike {
  lang: string;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
}
type RecogCtor = new () => RecogLike;
const speechRecog = (): RecogCtor | undefined => {
  const w = window as unknown as { SpeechRecognition?: RecogCtor; webkitSpeechRecognition?: RecogCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
};

/* ================= component ================= */

export function MissionDialog({ id }: { id: string }) {
  const M = useMemo(() => msGet(id), [id]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [actIdx, setActIdx] = useState<number | null>(null);
  const [prog, setProg] = useState(0);
  const [nopy, setNopy] = useState(() => ls.get("nh:mspy") === "0");
  const [end, setEnd] = useState<null | { first: boolean; sec: number; fr: number; gift: string }>(null);

  const seq = useRef(0);
  const st = useRef({ i: -1, miss: 0, t0: Date.now(), tapped: 0, listenN: 0, listenOk: 0, spoke: 0 });
  const timers = useRef<number[]>([]);
  const dead = useRef(false);
  const started = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  const actRef = useRef<HTMLDivElement>(null);

  const later = (fn: () => void, t: number) => {
    const h = window.setTimeout(() => {
      if (!dead.current) fn();
    }, t);
    timers.current.push(h);
  };

  const note = (t: string, cls?: string) =>
    setMsgs((m) => [...m, { id: ++seq.current, k: "n", t, cls }]);
  const bubble = (who: "npc" | "me", L: MsLineData, o: { mute?: boolean; hidden?: boolean } = {}): number => {
    const id = ++seq.current;
    setMsgs((m) => [...m, { id, k: "b", who, L, hid: !!o.hidden }]);
    if (who === "npc" && !o.mute) later(() => speak(L.zh.replace(/……|——/g, "，")), 120);
    return id;
  };
  const reveal = (mid: number) =>
    setMsgs((m) => m.map((x) => (x.id === mid ? { ...x, hid: false } : x)));

  const next = () => {
    if (dead.current || !M) return;
    const i = ++st.current.i;
    const s = M.steps[i];
    setProg(Math.min(100, (i / M.steps.length) * 100));
    setActIdx(null);
    if (!s) return finish();
    if (s.k === "npc") {
      bubble("npc", s);
      return later(next, 1100);
    }
    if (s.k === "auto") {
      bubble("me", s, { mute: true });
      speak(s.zh);
      return later(next, 1300);
    }
    if (s.k === "beat") {
      note(s.t, "beat");
      return later(next, 450);
    }
    if (s.k === "story") note(s.t, "story");
    setActIdx(i);
  };
  const go = (t: number) => later(next, t);

  function finish() {
    if (!M) return;
    const n = M.n,
      b = M.b,
      sec = Math.round((Date.now() - st.current.t0) / 1000),
      first = !msDone()[id];
    useGt.getState().setSession({ buoi: b, buoiFor: n });
    gtBSteps(n, b).forEach((k) => gtSeen(n, k));
    gtCheckDone(n);
    if ((st.current.listenOk || st.current.listenN >= 2) && st.current.miss <= 3) {
      const S = { ...gtState(), listen: { ...(gtState().listen || {}) } };
      if (!S.listen[n]) {
        S.listen[n] = 1;
        gtSave(S);
      }
    }
    const award = usePlayer.getState().award;
    award(`ms:${id}`, 15, `nhiệm vụ “${M.title}”`);
    award(`ms:${id}:${dstr()}`, 5, "chơi lại nhiệm vụ");
    gtStarCheck(n);
    const G = msDone();
    G[id] = (G[id] || 0) + 1;
    ls.set("nh:ms", JSON.stringify(G));
    const FR = msFr();
    FR[M.npcKey] = Math.min(5, ((FR[M.npcKey] as number) || 0) + 1);
    FR._n = FR._n || {};
    FR._n[M.npcKey] = [M.npc.name, M.npc.zh, M.npc.h, M.npc.lv];
    ls.set("nh:fr", JSON.stringify(FR));
    const fr = FR[M.npcKey] as number;
    const gift = msGiftName(n, G);
    setProg(100);
    setActIdx(null);
    setEnd({ first, sec, fr, gift });
    msLastSet(id);
    sfx("win");
    callHook("gtConfetti");
    callHook(
      "fbNudge",
      "buoi-dau",
      "Bạn vừa xong nhiệm vụ đầu tiên! Nhắn NowHanzi để được giáo viên tư vấn lộ trình 1-1 miễn phí.",
    );
  }

  /* mount: tip note + kick off after 350ms (msStart tail) */
  useEffect(() => {
    dead.current = false;
    if (!started.current) {
      started.current = true;
      if (Object.values(msDone()).reduce((a, c) => a + c, 0) < 2)
        note("Chạm vào bất kỳ chữ nào để xem nghĩa – bấm “Dịch” nếu cần", "tip");
    }
    if (st.current.i === -1) later(next, 350);
    return () => {
      dead.current = true;
      timers.current.forEach((h) => window.clearTimeout(h));
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* msScroll: keep last log row above the sticky action area */
  useEffect(() => {
    const h = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const log = logRef.current;
        if (!log?.lastElementChild) return;
        const el = log.lastElementChild as HTMLElement;
        el.style.scrollMarginBottom = `${(actRef.current?.offsetHeight || 0) + 12}px`;
        el.scrollIntoView({ block: "end", behavior: "smooth" });
      }),
    );
    return () => cancelAnimationFrame(h);
  }, [msgs, actIdx, end]);

  if (!M) return null;

  const api: Api = {
    next,
    go,
    later,
    clearAct: () => setActIdx(null),
    bubble,
    reveal,
    note,
    chip: (w) => setMsgs((m) => [...m, { id: ++seq.current, k: "chip", w }]),
    miss: () => st.current.miss++,
    listenHit: () => st.current.listenN++,
    listenOk: () => (st.current.listenOk = 1),
    spoke: () => (st.current.spoke = 1),
    tapped: () => st.current.tapped++,
  };

  const step = actIdx != null ? M.steps[actIdx] : null;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-104px)] w-full max-w-[680px] flex-col gap-2.5">
      {/* progress bar + pinyin toggle (ms-top) */}
      <div className="flex items-center gap-2.5">
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-[#E4E5F0]">
          <i className="block h-full rounded-full bg-[#EA0000] transition-[width] duration-300" style={{ width: prog + "%" }} />
        </div>
        <button
          type="button"
          onClick={() => {
            const v = !nopy;
            setNopy(v);
            ls.set("nh:mspy", v ? "0" : "1");
          }}
          className="whitespace-nowrap rounded-[10px] border-2 border-[#E4E5F0] bg-transparent px-2.5 py-1 text-[13px] font-bold text-[#5B5A7A]"
        >
          Pinyin: {nopy ? "tắt" : "bật"}
        </button>
      </div>

      {/* scene header (ms-scene) */}
      <div className="relative h-[150px] flex-none overflow-hidden rounded-[18px]" style={{ background: SCENE_BG[M.scene.bg] || SCENE_BG.cafe }}>
        {(M.scene.bg === "cafe" || M.scene.bg === "food") && (
          <div
            className="absolute inset-x-0 top-0 h-[18px] rounded-b-xl"
            style={{ background: "repeating-linear-gradient(90deg,#EA0000 0 26px,#FFF8EC 26px 52px)" }}
          />
        )}
        <span className={`absolute bottom-2 left-3 text-[12px] font-bold text-[#FFF8EC] opacity-90`}>{M.scene.place}</span>
        {M.menu ? (
          <div className="absolute left-3.5 top-7 flex items-center gap-1.5 rounded-[10px] bg-[#1C1A6B] px-2.5 py-1.5 text-[#FFF8EC] shadow-[0_3px_0_#050349]">
            <b className="text-[11px] tracking-wider opacity-80 [writing-mode:vertical-rl]">菜单 – Menu</b>
            {M.menu.map(([z, p, ic]) => (
              <MenuItem key={z} z={z} p={p} i={ic} onTap={api.tapped} />
            ))}
          </div>
        ) : (
          <div className="absolute left-[18px] top-[18px] text-[54px] leading-none drop-shadow-[0_3px_0_rgba(0,0,0,.12)]">{M.scene.icon}</div>
        )}
        <img className="absolute bottom-[30px] right-[22%] h-[118px]" alt={M.npc.name} src={avatarSvgUri(M.npc.h, M.npc.lv, 0)} />
        <div className={`absolute right-3 top-[30px] text-right ${M.scene.bg === "phone" ? "text-[#FFF8EC]" : "text-[#5A3A22]"}`}>
          <b className="block text-[14px]">
            {M.npc.name} <span lang="zh-CN">{M.npc.zh}</span>
          </b>
          <small className="text-[11px]">{M.menu ? "nhân viên quầy" : "đang chờ bạn"}</small>
        </div>
      </div>

      {/* chat log (ms-log) */}
      <div ref={logRef} aria-live="polite" className="flex flex-1 flex-col gap-2.5 py-1">
        {msgs.map((m) => (
          <Row key={m.id} m={m} M={M} nopy={nopy} onTap={api.tapped} />
        ))}
      </div>

      {/* action area (ms-act, sticky like the original) */}
      {(step || end) && (
        <div
          ref={actRef}
          className={
            end
              ? "static flex flex-col items-stretch gap-2.5 py-2"
              : "sticky bottom-0 -mx-4 -mb-4 flex flex-col items-stretch gap-2.5 border-t-2 border-[#E4E5F0] bg-white px-4 pb-4 pt-3.5"
          }
        >
          {end ? (
            <EndCard M={M} end={end} miss={st.current.miss} onTap={api.tapped} />
          ) : step ? (
            <Act key={actIdx} s={step} api={api} nopy={nopy} />
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ---------- menu item inside the scene (ms-mi → msPop) ---------- */

function MenuItem({ z, p, i, onTap }: { z: string; p: string; i: string; onTap: () => void }) {
  // tapping a menu item opens the same glossary pop as a word token;
  // reuse MsLine's machinery by rendering a one-token line styled as menu text
  return (
    <div className="flex flex-col items-center px-1.5 py-0.5 leading-[1.15]">
      <span className="text-[14px]">{i}</span>
      <span className="[&_.ms-t]:!border-0 [&>span]:text-[20px]">
        <MsLine zh={z} onTap={onTap} />
      </span>
      <small className="text-[11px] opacity-80">{p}</small>
    </div>
  );
}

/* ---------- chat rows (msBubble / msNote) ---------- */

function Row({ m, M, nopy, onTap }: { m: Msg; M: MsMission; nopy: boolean; onTap: () => void }) {
  if (m.k === "n") {
    const cls =
      m.cls === "story"
        ? "italic text-[#3D3E5C] bg-[#E2B14A]/[.18] border border-dashed border-[#E2B14A]"
        : m.cls === "hint"
          ? "text-[#3D3E5C] bg-[#E2B14A]/[.22] text-left self-stretch max-w-none"
          : m.cls === "beat"
            ? "font-extrabold text-[#3D3E5C] text-[13px] uppercase tracking-wide border-0 border-b-2 border-[#E4E5F0] rounded-none"
            : "";
    return <div className={`max-w-[90%] self-center rounded-xl px-3 py-1.5 text-center text-[14px] text-[#5B5A7A] ${cls}`}>{m.t}</div>;
  }
  if (m.k === "chip") {
    return (
      <div className="max-w-[90%] self-start rounded-xl bg-black/[.08] px-3 py-1.5 text-[14px] text-[#3D3E5C]">
        <MsLine zh={m.w[0]} onTap={onTap} /> {m.w[1]} – {m.w[2]}
      </div>
    );
  }
  const { who, L } = m;
  const blur = m.hid ? "pointer-events-none select-none blur-[7px]" : "";
  return (
    <div className={`flex items-end gap-2 ${who === "me" ? "justify-end" : ""}`}>
      {who === "npc" && <img className="h-[52px] w-10 flex-none object-contain" alt={M.npc.name} src={avatarSvgUri(M.npc.h, M.npc.lv, 0)} />}
      <div
        className={`relative max-w-[min(78%,440px)] rounded-[18px] border-2 bg-white px-3.5 py-2.5 ${
          who === "me" ? "rounded-br-md border-[#1C1A6B] bg-[#F0F1FA]" : "rounded-bl-md border-[#E4E5F0]"
        }`}
      >
        {who === "npc" && <small className="mb-0.5 block text-[12px] font-extrabold text-[#EA0000]">{M.npc.name}</small>}
        <div className={blur}>
          <div className="flex items-start gap-1.5">
            <button
              type="button"
              aria-label="Nghe"
              onClick={() => speak(L.zh.replace(/……|——/g, "，"))}
              className="flex-none border-0 bg-transparent p-0.5 text-[16px]"
            >
              🔊
            </button>
            <MsLine zh={L.zh} onTap={onTap} />
          </div>
          {!nopy && <div className="text-[14px] text-[#5B5A7A]">{L.py}</div>}
          {L.vi ? <ViT vi={L.vi} /> : null}
        </div>
      </div>
      {who === "me" && <img className="h-[52px] w-10 flex-none object-contain" alt="Bạn" src={avatarSvgUri(me.h || 0, 1, 0)} />}
    </div>
  );
}

/** "Dịch" toggle (ms-vi). */
function ViT({ vi }: { vi: string }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOn(true)}
      className={`mt-1 block border-0 bg-transparent p-0 text-left text-[13px] font-bold ${on ? "font-medium text-[#5B5A7A]" : "text-[#1C1A6B]"}`}
    >
      {on ? vi : "Dịch"}
    </button>
  );
}

/* ---------- per-step action UIs (msNext branches) ---------- */

function Act({ s, api, nopy }: { s: MsStep; api: Api; nopy: boolean }) {
  switch (s.k) {
    case "story":
      return (
        <button type="button" autoFocus onClick={api.next} className={CHECK}>
          Tiếp tục
        </button>
      );
    case "lw":
      return <LwAct s={s} api={api} />;
    case "choose":
      return <ChooseAct s={s} api={api} nopy={nopy} />;
    case "build":
      return <BuildAct s={s} api={api} />;
    case "listen":
      return <ListenAct s={s} api={api} />;
    case "pay":
      return <PayAct s={s} api={api} />;
    case "say":
      return <SayAct s={s} api={api} nopy={nopy} />;
    default:
      return null;
  }
}

const Task = ({ children }: { children: ReactNode }) => <p className="m-0 font-extrabold text-[#3D3E5C]">{children}</p>;

/** lw: nghe và chọn chữ theo nghĩa (msNext "lw"). */
function LwAct({ s, api }: { s: Extract<MsStep, { k: "lw" }>; api: Api }) {
  const opts = useMemo(
    () => shuffle([s.w, ...shuffle(s.pool.filter((x) => x[0] !== s.w[0])).slice(0, 2)]),
    [s],
  );
  const [bad, setBad] = useState<Set<number>>(new Set());
  const [miss, setMiss] = useState(0);
  const [done, setDone] = useState(false);
  const spoke = useRef(false);
  useEffect(() => {
    if (spoke.current) return;
    spoke.current = true;
    api.later(() => speak(s.w[0]), 200);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (i: number, el: HTMLElement) => {
    if (done || bad.has(i)) return;
    const o = opts[i];
    callHook("wmHit", [s.w[0]], o === s.w);
    if (o === s.w) {
      setDone(true);
      nhFx(el, true);
      sfx("ok");
      api.listenHit();
      callHook("gmCardOwn", s.w[0]);
      api.chip(s.w);
      api.clearAct();
      api.go(500);
    } else {
      const nm = miss + 1;
      setMiss(nm);
      api.miss();
      nhFx(el, false);
      sfx("bad");
      setBad(new Set([...bad, i]));
      speak(s.w[0]);
    }
  };

  return (
    <>
      <Task>🎧 Nghe và chọn chữ nghĩa là “{s.w[2]}”</Task>
      <button type="button" aria-label="Nghe lại" onClick={() => speak(s.w[0])} className={PLAY_SM}>
        🔊
      </button>
      <div className="grid grid-cols-3 gap-2">
        {opts.map((o, i) => (
          <button
            key={i}
            type="button"
            disabled={done || bad.has(i)}
            onClick={(e) => pick(i, e.currentTarget)}
            className={`${OPT} items-center text-[20px] font-extrabold${bad.has(i) ? OPT_BAD : ""}${miss >= 2 && o === s.w ? OPT_HINT : ""}`}
          >
            <span className="font-['Noto_Serif_SC',serif]" lang="zh-CN">
              {o[0]}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

/** choose: pick the right line to say (msNext "choose"). */
function ChooseAct({ s, api, nopy }: { s: Extract<MsStep, { k: "choose" }>; api: Api; nopy: boolean }) {
  const opts = useMemo(() => shuffle(s.opts.slice()), [s]);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [badIdx, setBadIdx] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [mean, setMean] = useState(!!s.showMeaning);

  const pick = (i: number, el: HTMLElement) => {
    if (busy || removed.has(i)) return;
    const o = opts[i];
    speak(o.zh);
    api.bubble("me", o, { mute: true });
    if (o.ok) {
      setBusy(true);
      nhBurst(el);
      sfx("ok");
      api.clearAct();
      api.go(700);
    } else {
      setBusy(true);
      setBadIdx(i);
      api.miss();
      nhFx(el, false);
      sfx("bad");
      api.later(() => {
        if (o.re) api.bubble("npc", o.re);
        api.later(() => {
          if (o.hint) api.note("💡 Thầy Vương: " + o.hint, "hint");
          setRemoved((r) => new Set([...r, i]));
          setBadIdx(null);
          setBusy(false);
        }, 900);
      }, 600);
    }
  };

  return (
    <>
      <Task>
        🎯 {s.task}
        {s.meaning ? (
          <button
            type="button"
            onClick={() => setMean(true)}
            className={`ml-2 border-0 bg-transparent p-0 text-[13px] font-bold ${mean ? "font-semibold text-[#5B5A7A]" : "text-[#1C1A6B]"}`}
          >
            {mean ? `“${s.meaning}”` : "💡 Ý cần nói"}
          </button>
        ) : null}
      </Task>
      <div className="grid gap-2">
        {opts.map((o, i) =>
          removed.has(i) ? null : (
            <div
              key={i}
              role="button"
              tabIndex={busy ? -1 : 0}
              aria-disabled={busy}
              onClick={(e) => pick(i, e.currentTarget)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  pick(i, e.currentTarget);
                }
              }}
              className={`${OPT}${badIdx === i ? OPT_BAD : ""}`}
            >
              <MsLine zh={o.zh} onTap={api.tapped} />
              {!nopy && <small className="text-[14px] text-[#5B5A7A]">{o.py}</small>}
            </div>
          ),
        )}
      </div>
    </>
  );
}

/** build: arrange word tiles into the sentence (msNext "build"). */
function BuildAct({ s, api }: { s: Extract<MsStep, { k: "build" }>; api: Api }) {
  const bank = useMemo(() => shuffle([...s.ans, ...s.extra]), [s]);
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const TileBtn = ({ i, ghost }: { i: number; ghost?: boolean }) => (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        if (busy) return;
        if (!ghost) speak(bank[i]);
        setPicked((p) => (ghost ? p.filter((x) => x !== i) : [...p, i]));
      }}
      className={TILE}
    >
      <span lang="zh-CN">{bank[i]}</span>
      {gtPy(bank[i]) ? <small className="font-['Be_Vietnam_Pro',sans-serif] text-[12px] font-medium text-[#5B5A7A]">{gtPy(bank[i])}</small> : null}
    </button>
  );

  const check = () => {
    const chosen = picked.map((i) => bank[i]);
    const ok = chosen.join("") === s.ans.join("");
    const L = { zh: chosen.join("") + s.end, py: ok ? s.py : "", vi: ok ? s.vi : "" };
    if (ok) {
      speak(L.zh);
      api.bubble("me", L, { mute: true });
      sfx("ok");
      api.clearAct();
      api.go(700);
    } else {
      api.miss();
      sfx("bad");
      api.bubble("me", { zh: L.zh, py: "…" }, { mute: true });
      setBusy(true);
      api.later(() => {
        api.bubble("npc", { zh: "啊？不好意思……", py: "Á? Bù hǎoyìsi…", vi: "Hả? Xin lỗi, em chưa hiểu…" });
        api.later(() => api.note("💡 Thầy Vương: " + s.hint, "hint"), 800);
        setPicked([]);
        setBusy(false);
      }, 500);
    }
  };

  return (
    <>
      <Task>🎯 {s.task}</Task>
      <div className="flex min-h-[64px] flex-wrap content-start items-start gap-2 border-b-2 border-dashed border-[#E4E5F0] py-2">
        {picked.map((i) => (
          <TileBtn key={i} i={i} ghost />
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {bank.map((z, i) =>
          picked.includes(i) ? (
            <span key={i} className="inline-flex flex-col items-center rounded-2xl bg-[#E4E5F0] px-3.5 py-1.5 font-['Noto_Serif_SC',serif] text-[22px] leading-tight text-transparent" aria-hidden>
              {z}
              {gtPy(z) ? <small className="text-[12px]">{gtPy(z)}</small> : null}
            </span>
          ) : (
            <TileBtn key={i} i={i} />
          ),
        )}
      </div>
      <button type="button" disabled={!picked.length || busy} onClick={check} className={CHECK}>
        Nói câu này
      </button>
    </>
  );
}

/** listen: blurred bubble until the right answer (msNext "listen"). */
function ListenAct({ s, api }: { s: Extract<MsStep, { k: "listen" }>; api: Api }) {
  const [bad, setBad] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const bub = useRef(-1);
  useEffect(() => {
    if (bub.current >= 0) return;
    bub.current = api.bubble("npc", { zh: s.zh, py: s.py, vi: s.vi }, { hidden: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (i: number, el: HTMLElement) => {
    if (done || bad.has(i)) return;
    const o = s.opts[i];
    if (o === s.ans) {
      setDone(true);
      nhBurst(el);
      sfx("ok");
      api.reveal(bub.current);
      api.listenOk();
      api.clearAct();
      api.go(900);
    } else {
      api.miss();
      sfx("bad");
      nhFx(el, false);
      setBad(new Set([...bad, i]));
      speak(s.zh);
      api.note("💡 Thầy Vương: " + s.hint, "hint");
    }
  };

  return (
    <>
      <Task>🎯 {s.task}</Task>
      <button type="button" aria-label="Nghe lại" onClick={() => speak(s.zh)} className={PLAY_SM}>
        🔊
      </button>
      <div className="grid grid-cols-3 gap-2">
        {s.opts.map((o, i) => (
          <button
            key={i}
            type="button"
            disabled={done || bad.has(i)}
            onClick={(e) => pick(i, e.currentTarget)}
            className={`${OPT} items-center text-[20px] font-extrabold${bad.has(i) ? OPT_BAD : ""}`}
          >
            {o} 块
          </button>
        ))}
      </div>
    </>
  );
}

/** pay: drag bills to the counter (msNext "pay"). */
function PayAct({ s, api }: { s: Extract<MsStep, { k: "pay" }>; api: Api }) {
  const [tray, setTray] = useState<number[]>([]);
  const [paid, setPaid] = useState(false);
  const sum = tray.reduce((a, i) => a + s.wallet[i], 0);

  const tog = (i: number) => {
    if (paid) return;
    speak(msNumZh(s.wallet[i])[0] + "块");
    setTray((t) => (t.includes(i) ? t.filter((x) => x !== i) : [...t, i]));
  };

  const Bill = ({ i }: { i: number }) => {
    const v = s.wallet[i];
    return (
      <button
        type="button"
        onClick={() => tog(i)}
        className={`flex items-baseline justify-center gap-1 rounded-lg border-2 border-b-4 border-black/15 px-2 py-2 font-bold text-white ${v === 1 ? "w-12 rounded-3xl" : "w-[72px]"}`}
        style={{ background: BILL_COL[v] || "#5B5A7A" }}
      >
        <b className="text-[20px]">{v}</b>
        <small className="text-[12px] opacity-90">元</small>
      </button>
    );
  };

  const pay = () => {
    setPaid(true);
    api.bubble("me", { zh: "给您。", py: "Gěi nín.", vi: "Gửi chị." }, { mute: true });
    speak("给您");
    api.clearAct();
    api.later(() => {
      const ch = sum - s.price;
      if (!ch) {
        sfx("combo");
        api.bubble("npc", { zh: "正好，谢谢！", py: "Zhènghǎo, xièxie!", vi: "Vừa đủ, cảm ơn chị!" });
      } else {
        const [z, p] = msNumZh(ch);
        api.bubble("npc", { zh: `找您${z}块，谢谢！`, py: `Zhǎo nín ${p} kuài, xièxie!`, vi: `Gửi lại chị ${ch} tệ, cảm ơn chị!` });
        if (ch >= 20)
          api.note("💡 Thầy Vương: Trả dư khá nhiều đấy. Lần sau thử đưa vừa đủ 56 tệ: 50 + 5 + 1.", "hint");
      }
      api.go(1300);
    }, 600);
  };

  return (
    <>
      <Task>🎯 {s.task}</Task>
      <div
        className="flex min-h-[62px] flex-wrap items-center justify-center gap-2 rounded-[14px] p-1.5"
        style={{ background: "repeating-linear-gradient(45deg,rgba(168,112,74,.15) 0 10px,rgba(168,112,74,.08) 10px 20px)" }}
      >
        {tray.map((i) => (
          <Bill key={i} i={i} />
        ))}
      </div>
      <p className="m-0 text-center font-bold text-[#3D3E5C]">
        {sum ? `Đã lấy ${sum} tệ` + (sum < s.price ? "" : " ✓") : "Chạm tờ tiền để đặt lên quầy"}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {s.wallet.map((_v, i) => (tray.includes(i) ? null : <Bill key={i} i={i} />))}
      </div>
      <button type="button" disabled={sum < s.price || paid} onClick={pay} className={CHECK}>
        Trả tiền
      </button>
    </>
  );
}

/** say: speak the line (SpeechRecognition when available) (msNext "say"). */
function SayAct({ s, api, nopy }: { s: Extract<MsStep, { k: "say" }>; api: Api; nopy: boolean }) {
  const SR = useMemo(speechRecog, []);
  const [mic, setMic] = useState<"idle" | "on" | "retry" | "nosr">(SR ? "idle" : "nosr");
  const done = useRef(false);
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    speak(s.zh);
  }, [s.zh]);

  const fin = (heard: string) => {
    if (done.current) return;
    done.current = true;
    api.bubble("me", s, { mute: true });
    if (heard) api.note(`Máy nghe ra: ${heard}`, "tip");
    api.clearAct();
    api.go(700);
  };

  const micGo = () => {
    try {
      const r = new SR!();
      r.lang = "zh-CN";
      setMic("on");
      r.onresult = (ev) => {
        const h = Array.from(ev.results)
          .map((x) => x[0].transcript)
          .join("");
        const want = duoPlain(s.zh);
        const hit = [...want].filter((c) => h.includes(c)).length / want.length;
        if (hit >= 0.5) {
          api.spoke();
          fin(h);
        } else {
          setMic("retry");
          api.note(`Máy nghe ra: ${h || "(không rõ)"} – thử lại hoặc bấm “Tôi đã nói to”`, "tip");
        }
      };
      r.onerror = () => setMic("retry");
      r.onend = () => setMic((m) => (m === "on" ? "idle" : m));
      r.start();
    } catch {
      /* SR unavailable */
    }
  };

  return (
    <>
      <Task>🎯 {s.task}</Task>
      <div className="self-center rounded-2xl border-2 border-[#E4E5F0] px-[18px] py-2 text-center">
        <MsLine zh={s.zh} onTap={api.tapped} />
        {!nopy && <div className="text-[14px] text-[#5B5A7A]">{s.py}</div>}
      </div>
      <div className="flex flex-wrap justify-center gap-2.5">
        <button
          type="button"
          disabled={mic === "nosr"}
          onClick={micGo}
          className={`rounded-2xl px-6 py-4 text-[15px] font-extrabold text-white shadow-[0_5px_0_#050349] disabled:opacity-50 ${mic === "on" ? "bg-[#C8102E] shadow-[0_5px_0_#7A0A1E]" : "bg-[#1C1A6B]"}`}
        >
          {mic === "nosr" ? "🎙 Trình duyệt chưa hỗ trợ" : mic === "on" ? "🎙 Đang nghe…" : mic === "retry" ? "🎙 Thử lại" : "🎙 Nhấn để nói"}
        </button>
        <button
          type="button"
          onClick={() => {
            speak(s.zh);
            fin("");
          }}
          className={SKIP}
        >
          Tôi đã nói to ✓
        </button>
      </div>
    </>
  );
}

/* ---------- end card (msEnd) ---------- */

function EndCard({ M, end, miss, onTap }: { M: MsMission; end: { first: boolean; sec: number; fr: number; gift: string }; miss: number; onTap: () => void }) {
  const n = M.n,
    b = M.b;
  const nb = b < gtNS(n) ? b + 1 : 0;
  const nn = !nb && gtUnlocked(n + 1) && msIdFor(n + 1, 1) ? n + 1 : 0;
  const goNext = () => {
    if (nb) callHook("duoStart", n, nb);
    else if (nn) callHook("duoStart", nn, 1);
    else useUi.getState().closeRoom();
  };
  const mm = Math.floor(end.sec / 60),
    ss = String(end.sec % 60).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="text-[84px] leading-none">{M.scene.icon}</div>
      <h3 className="m-0 text-[22px] font-extrabold text-[#3D3E5C]">{end.first ? "Nhiệm vụ hoàn thành!" : "Lại một ly nữa!"}</h3>
      <div className="grid w-full grid-cols-3 gap-2">
        {[
          ["❤".repeat(end.fr) + "♡".repeat(5 - end.fr), `Thân với ${M.reward.fr}`],
          [M.reward.sticker, end.first ? "Huy hiệu mới" : "Huy hiệu"],
          [`${mm}:${ss}`, miss ? `${miss} lần Thầy gợi ý` : "Không cần gợi ý"],
        ].map(([v, t]) => (
          <div key={t} className="flex flex-col gap-1 rounded-[14px] border-2 border-[#E4E5F0] px-1.5 py-2.5">
            <b className="text-[16px] text-[#EA0000]">{v}</b>
            <small className="text-[12px] text-[#5B5A7A]">{t}</small>
          </div>
        ))}
      </div>
      {end.gift ? (
        <div className="flex w-full flex-col gap-0.5 rounded-[14px] border-2 border-[#EA0000] bg-[#EA0000]/[.06] p-2.5">
          <b>🎁 Quà hoàn thành {gtLabel(n)}: {end.gift}</b>
          <small className="text-[#5B5A7A]">Đã cất vào tủ đồ – Hồ sơ → Cửa hàng → Đeo</small>
        </div>
      ) : null}
      <details className="w-full rounded-[14px] border-2 border-[#E2B14A] bg-[#E2B14A]/10 p-3.5 text-left">
        <summary className="cursor-pointer font-extrabold">💡 {M.tips.length} mẹo nhỏ từ nhiệm vụ này</summary>
        {M.tips.map(([h, d]) => (
          <p key={h} className="mb-0 mt-2">
            <b>
              <MsLine zh={h + ": "} onTap={onTap} />
            </b>
            <MsLine zh={d} onTap={onTap} />
          </p>
        ))}
      </details>
      <div className="flex w-full flex-wrap gap-2.5">
        <button type="button" onClick={() => callHook("msStart", msLastGet())} className={`${SKIP} flex-1`}>
          Chơi lại
        </button>
        <button type="button" autoFocus onClick={goNext} className={`${CHECK} flex-1`}>
          {nb ? `Học Buổi ${nb} →` : nn ? `Sang ${gtLabel(nn)} →` : "Về lớp"}
        </button>
      </div>
    </div>
  );
}
