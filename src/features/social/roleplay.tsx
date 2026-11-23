/**
 * roleplay.js — bàn nhập vai trong phòng phát âm: chọn cảnh, nhận vai,
 * điền các câu trống để hoàn thành hội thoại của bài Giao tiếp.
 * DOM → React: danh sách cảnh + phiên chat trong RoomDialog (variant "wb").
 */
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { GT_LESSONS } from "@/data/gt-data";
import { me, keys, setTarget } from "@/game/engine/state";
import { usePlayer } from "@/stores/player";
import { usePresence } from "@/stores/presence";
import { useUi } from "@/stores/ui";
import { ls } from "@/lib/storage";
import { dstr, shuffle } from "@/lib/helpers";
import { speak } from "@/services/tts";
import { sfx } from "@/services/sfx";
import { avatarSvgUri } from "@/game/entities/avatar-svg";
import { sendPresence } from "@/services/presence/runtime";
import { MS_NPC, MS_ROLE, MS_SCN } from "@/features/missions/data";
import { duoTok, duoPlain, gtUnlocked } from "./gt-share";
import { NhStars, DuoTile, MsLine, MsPop, useMsPop, nhFx } from "./bits";
import type { GtDialogLine, GtDialogScene } from "@/types/gt";
import type { CommPeer } from "./community";

/* ---------- nguyên hàm nhỏ ---------- */
interface RpBest {
  [k: string]: number | undefined;
  _seen?: number;
}
export function rpGet(): RpBest {
  try {
    return JSON.parse(ls.get("nh:rp") || "{}");
  } catch {
    return {};
  }
}
export function rpName(z: string): string {
  return MS_ROLE[z] || ({ 员: "Nhân viên", 老: "Thầy cô" } as Record<string, string>)[z] || z;
}
export function rpWho(d: GtDialogScene): string[] {
  return [...new Set(d.lines.map((l) => l[0]))];
}
export function rpTitle(n: number, b: number, d: GtDialogScene): string {
  const C = MS_SCN[n + ":" + b];
  return C ? C[0] : d.scene.replace(/^Cảnh \d+\s*[–-]\s*/, "").replace(/\.$/, "");
}
export function rpPlace(n: number, b: number): string {
  const C = MS_SCN[n + ":" + b];
  return C ? String(C[1]).replace(/\s*·\s*/g, ", ") : "";
}
/** roleplay.js `rpTok` — tách token giữ nguyên cụm từ hay gặp. */
export function rpTok(zh: string): string[] {
  const t = duoTok(zh),
    J = ["怎么样", "什么", "怎么", "这么", "那么", "多少", "一下", "一点儿"],
    out: string[] = [];
  for (let i = 0; i < t.length; i++) {
    const m = J.find(
      (j) =>
        t.slice(i).join("").startsWith(j) &&
        t[i].length < j.length &&
        (() => {
          let a = "",
            k = i;
          while (a.length < j.length && k < t.length) a += t[k++];
          return a === j;
        })(),
    );
    if (m) {
      let a = "",
        k = i;
      while (a.length < m.length) a += t[k++];
      out.push(m);
      i = k - 1;
    } else out.push(t[i]);
  }
  return out;
}

const RP_BG: Record<string, string> = {
  gate: "#2E7D4F", yard: "#4F8B3E", class: "#1C1A6B", food: "#C2410C",
  lib: "#7C2D12", bank: "#1F5FB0", dorm: "#6B4FA0", phone: "#0F766E", cafe: "#7A4A24",
};

/* ---------- màn chọn cảnh ---------- */
export function openRoleplay(): void {
  me.rp = true;
  sendPresence({ rp: 1 });
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({
    mark: "演",
    title: "Nhập vai hoàn thành hội thoại",
    sub: "Chọn cảnh, nhận một vai, điền những câu còn trống cho trọn hội thoại",
    body: <RpList />,
    variant: "default",
  });
}

function RpList() {
  const others = usePresence((s) => s.others);
  const near: string[] = [];
  others.forEach((o) => {
    if (o.sc === 2 && (o as CommPeer).rp) near.push(o.n);
  });
  const best = rpGet();
  let locked = 0;
  const groups: { n: number; title: string; cards: { b: number; d: GtDialogScene; who: string[]; k: number }[] }[] = [];
  Object.keys(GT_LESSONS)
    .map(Number)
    .sort((a, c) => a - c)
    .forEach((n) => {
      const L = GT_LESSONS[n];
      if (!(L.dialog || []).length) return;
      const open = n === 1 || gtUnlocked(n);
      if (!open) {
        locked++;
        return;
      }
      const cards: { b: number; d: GtDialogScene; who: string[]; k: number }[] = [];
      L.dialog.forEach((d, i) => {
        const b = i + 1,
          who = rpWho(d);
        if (who.length < 2) return;
        const k = Math.max(0, ...who.map((z) => best[`${n}:${b}:${z}`] || 0));
        cards.push({ b, d, who, k });
      });
      if (cards.length) groups.push({ n, title: L.title, cards });
    });
  return (
    <div>
      {near.length ? <p className="mb-3 rounded-xl bg-[#FFFBEF] px-3 py-2 text-[13px] text-[#7A5C00]">{`${near.join(", ")} cũng đang nhập vai ở bàn này`}</p> : null}
      {groups.map((g) => (
        <div key={g.n} className="mb-4">
          <h4 className="mb-2 text-[14px] font-bold text-[#050349]">{`Bài ${g.n}: ${g.title}`}</h4>
          {g.cards.map((c) => (
            <div key={c.b} className="mb-2 rounded-2xl border border-[#E4E5F0] p-3.5">
              <div className="mb-0.5 flex items-center justify-between gap-2">
                <b className="text-[14px] text-[#14213D]">{rpTitle(g.n, c.b, c.d)}</b>
                <NhStars k={c.k} />
              </div>
              <small className="text-[12px] text-[#8A8FA8]">{`${rpPlace(g.n, c.b) || "Hội thoại"}, ${c.d.lines.length} câu`}</small>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.who.map((z) => (
                  <button
                    key={z}
                    type="button"
                    className="rounded-xl border border-[#E4E5F0] px-3 py-1.5 text-[13px] font-semibold text-[#050349] hover:border-[#EA0000]"
                    onClick={() => rpRun(g.n, c.b, z)}
                  >
                    {`Vào vai ${rpName(z)}`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
      {locked ? <p className="mt-2 text-[12.5px] text-[#8A8FA8]">{`Còn ${locked} bài nữa có hội thoại để nhập vai. Mở khoá bài mới trong lớp là bàn này có thêm cảnh.`}</p> : null}
    </div>
  );
}

/* ---------- phiên hội thoại ---------- */
interface RpNote {
  id: number;
  row: number;
  text: string;
  kind: "story" | "tip" | "hint";
}
interface RpSession {
  n: number;
  b: number;
  role: string;
  pz: string;
  P: { name: string; zh: string; h: number; lv: number };
  d: GtDialogScene;
  k: number;
  miss: number;
  spoke: number;
  mine: number;
  ended: boolean;
  stars: number;
  heard: Record<number, string>;
}
let rpNoteId = 0;

function rpRun(n: number, b: number, role: string): void {
  useUi.getState().openRoom({
    mark: "演",
    title: `Hoàn thành hội thoại: vai ${rpName(role)}`,
    sub: `Bài ${n}: ${rpTitle(n, b, GT_LESSONS[n].dialog[b - 1])}`,
    variant: "wb",
    body: <RpRunBody n={n} b={b} role={role} />,
  });
}

function RpRunBody({ n, b, role }: { n: number; b: number; role: string }) {
  const d = GT_LESSONS[n].dialog[b - 1],
    who = rpWho(d),
    pz = who.find((z) => z !== role) || who[0],
    P = MS_NPC[pz] || { name: rpName(pz), zh: pz, h: 2, lv: 3, key: "" },
    C = MS_SCN[n + ":" + b] || ([null, "", "💬", "class"] as const);
  const [S] = useState<RpSession>(() => ({
    n, b, role, pz,
    P: { name: P.name, zh: P.zh, h: P.h, lv: P.lv },
    d, k: 0, miss: 0, spoke: 0,
    mine: d.lines.filter((l) => l[0] === role).length,
    ended: false, stars: 0, heard: {},
  }));
  const [tick, setTick] = useState(0);
  const [nopy, setNopy] = useState(() => ls.get("nh:mspy") === "0");
  const [notes, setNotes] = useState<RpNote[]>(() => {
    const out: RpNote[] = [{ id: rpNoteId++, row: -1, text: d.scene.replace(/^Cảnh \d+\s*[–-]\s*/, ""), kind: "story" }];
    if (!rpGet()._seen)
      out.push({
        id: rpNoteId++,
        row: -2,
        text: (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
          (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
          ? "Điền những câu còn trống của bạn: xếp chữ, chọn câu, hoặc bấm 🎙 nói to"
          : "Điền những câu còn trống của bạn: xếp chữ hoặc chọn câu, rồi đọc to theo nhé",
        kind: "tip",
      });
    return out;
  });
  const SRef = useRef(S);
  const logRef = useRef<HTMLDivElement>(null);
  const bump = () => setTick((x) => x + 1);
  void tick;
  const scroll = () => {
    requestAnimationFrame(() => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight + 200;
    });
  };
  const addNote = (row: number, text: string, kind: RpNote["kind"]) => {
    setNotes((ns) => [...ns, { id: rpNoteId++, row, text, kind }]);
    scroll();
  };

  const next = () => {
    if (SRef.current !== S || S.ended) return;
    if (S.k >= S.d.lines.length) {
      end();
      return;
    }
    const l = S.d.lines[S.k];
    bump();
    scroll();
    if (l[0] !== S.role) {
      setTimeout(() => speak(l[2]), 120);
      S.k++;
      setTimeout(next, 1100 + duoPlain(l[2]).length * 230);
    }
  };
  const done = (heard: string) => {
    const l = S.d.lines[S.k];
    if (heard) S.heard[S.k] = heard;
    speak(l[2]);
    S.k++;
    bump();
    setTimeout(next, 900 + duoPlain(l[2]).length * 200);
  };
  const end = () => {
    if (S.ended) return;
    S.ended = true;
    const st = S.miss === 0 ? 3 : S.miss === 1 ? 2 : 1;
    S.stars = st;
    const key = `${S.n}:${S.b}:${S.role}`,
      B = rpGet();
    B[key] = Math.max(B[key] || 0, st);
    B._seen = 1;
    try {
      ls.set("nh:rp", JSON.stringify(B));
    } catch {
      /* noop */
    }
    try {
      usePlayer.getState().award(`rp:${key}:${dstr()}`, st + (S.spoke ? 1 : 0), "nhập vai hội thoại");
    } catch {
      /* noop */
    }
    try {
      sfx("win");
    } catch {
      /* noop */
    }
    bump();
  };
  const wrong = () => {
    try {
      sfx("bad");
    } catch {
      /* noop */
    }
    return S.miss;
  };

  /* chạy lượt đầu + lượt NPC tiếp theo */
  useEffect(() => {
    const t = setTimeout(next, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    scroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S.k, notes.length]);
  useEffect(() => {
    me.rp = true;
    sendPresence({ rp: 1 });
    return () => {
      me.rp = false;
      sendPresence({ rp: 0 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cur = !S.ended && S.k < S.d.lines.length ? S.d.lines[S.k] : null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EFF1F8]">
          <i className="block h-full bg-[#EA0000] transition-[width]" style={{ width: `${Math.round((S.k / S.d.lines.length) * 100)}%` }} />
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full border border-[#E4E5F0] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#5B5A7A]"
          onClick={() => {
            const v = !nopy;
            setNopy(v);
            try {
              ls.set("nh:mspy", v ? "0" : "1");
            } catch {
              /* noop */
            }
          }}
        >
          {"Pinyin: " + (nopy ? "tắt" : "bật")}
        </button>
      </div>
      <div className="flex items-end gap-3 rounded-2xl p-3" style={{ background: RP_BG[C[3]] || "#1C1A6B" }}>
        <div className="flex-1">
          {rpPlace(S.n, S.b) ? <span className="mb-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white">{rpPlace(S.n, S.b)}</span> : null}
          <div className="text-white/90">{C[2]}</div>
          <b className="block text-[15px] text-white">{`${S.P.name} ${S.P.zh}`}</b>
          <small className="text-[11.5px] text-white/80">{`Bạn vào vai ${rpName(S.role)}`}</small>
        </div>
        <img alt={S.P.name} src={avatarSvgUri(S.P.h, S.P.lv, 0)} className="h-16 w-16 shrink-0" />
      </div>
      <div ref={logRef} aria-live="polite" className="flex max-h-[46vh] min-h-40 flex-col gap-2 overflow-y-auto rounded-2xl bg-[#F6F6FA] p-3">
        {notes
          .filter((x) => x.row < 0)
          .map((x) => (
            <RpNoteRow key={x.id} x={x} />
          ))}
        {S.d.lines.map((l, i) => {
          const mine2 = l[0] === S.role;
          const state = i < S.k ? "done" : i === S.k ? "now" : "wait";
          return (
            <div key={i}>
              <RpLineRow l={l} mine={mine2} state={state} P={S.P} nopy={nopy} heard={S.heard[i]} />
              {notes
                .filter((x) => x.row === i)
                .map((x) => (
                  <RpNoteRow key={x.id} x={x} />
                ))}
            </div>
          );
        })}
      </div>
      {!S.ended && cur ? (
        <RpTurn
          key={S.k}
          l={cur}
          S={S}
          bump={bump}
          onDone={done}
          onHint={(txt) => addNote(S.k, txt, "hint")}
          onTip={(txt) => addNote(S.k, txt, "tip")}
          onMiss={() => {
            S.miss++;
            bump();
          }}
          wrongSfx={wrong}
        />
      ) : null}
      {S.ended ? <RpEnd S={S} /> : null}
    </div>
  );
}

function RpNoteRow({ x }: { x: RpNote }) {
  return (
    <div
      className={`rounded-xl px-3 py-1.5 text-center text-[12.5px] ${
        x.kind === "story" ? "bg-white/70 italic text-[#5B5A7A]" : x.kind === "hint" ? "bg-[#FFFBEF] text-[#7A5C00]" : "bg-[#EDF3FF] text-[#3D3E5C]"
      }`}
    >
      {x.kind === "hint" ? <b className="mr-1">Gợi ý: </b> : null}
      {x.text}
    </div>
  );
}

function RpLineRow({ l, mine, state, P, nopy, heard }: { l: GtDialogLine; mine: boolean; state: string; P: { name: string; h: number; lv: number }; nopy: boolean; heard?: string }) {
  const [vi, setVi] = useState(false);
  const [pop, showPop, hidePop] = useMsPop();
  const onPop = (w: string, e: MouseEvent<HTMLButtonElement>) => showPop(w, e);
  const av = <img alt={mine ? "Bạn" : P.name} src={mine ? avatarSvgUri(me.h || 0, 1, 0) : avatarSvgUri(P.h, P.lv, 0)} className="h-9 w-9 shrink-0 rounded-full bg-white" />;
  const blank = mine && state !== "done";
  return (
    <div className={`flex items-end gap-2 ${mine ? "justify-end" : ""} ${state === "wait" ? "opacity-45" : ""}`}>
      {!mine ? av : null}
      <div className={`max-w-[82%] rounded-2xl px-3 py-2 ${mine ? "rounded-br-sm bg-[#EA0000]/[.07]" : "rounded-bl-sm bg-white"} ${blank ? "border-2 border-dashed border-[#E2B14A]" : ""}`}>
        <small className="block text-[10.5px] font-semibold text-[#8A8FA8]">{rpName(l[0]) + (mine ? " (bạn)" : "")}</small>
        {blank ? (
          <>
            <div className="font-['Noto_Serif_SC',serif] text-lg tracking-widest text-[#B9BCCD]">{rpTok(l[2]).map(() => "＿＿").join(" ")}</div>
            <div className="text-[12px] text-[#8A8FA8]">{l[4]}</div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <button type="button" aria-label="Nghe" className="shrink-0 text-[15px]" onClick={() => speak(l[2])}>
                🔊
              </button>
              <MsLine zh={l[2]} onPop={onPop} />
            </div>
            {!nopy ? <div className="text-[11.5px] font-medium text-[#C8102E]">{l[3]}</div> : null}
            <button type="button" className="mt-0.5 text-[11px] font-semibold text-[#5B5A7A] underline" onClick={() => setVi(true)}>
              {vi ? l[4] : "Dịch"}
            </button>
            {heard ? <div className="mt-0.5 text-[11px] italic text-[#8A8FA8]">{`Máy nghe ra: ${heard}`}</div> : null}
          </>
        )}
      </div>
      {mine ? av : null}
      {pop ? <MsPop pop={pop} onClose={hidePop} /> : null}
    </div>
  );
}

/* ---------- lượt của người chơi ---------- */
interface SpeechRecognitionCtor {
  new (): {
    lang: string;
    onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start(): void;
  };
}

function RpTurn({
  l, S, bump, onDone, onHint, onTip, onMiss, wrongSfx,
}: {
  l: GtDialogLine;
  S: RpSession;
  bump: () => void;
  onDone: (heard: string) => void;
  onHint: (t: string) => void;
  onTip: (t: string) => void;
  onMiss: () => void;
  wrongSfx: () => number;
}) {
  const tgt = rpTok(l[2]),
    useTiles = tgt.length >= 2 && tgt.length <= 8;
  const [chosen, setChosen] = useState<string[]>([]);
  const [bank] = useState<string[]>(() => {
    if (!useTiles) return [];
    const extra = shuffle(
      [...new Set((GT_LESSONS[S.n].words || []).map((w) => w[0]).filter((z) => !tgt.includes(z) && z.length <= 3))],
    ).slice(0, Math.max(2, Math.min(4, 9 - tgt.length)));
    return shuffle([...tgt, ...extra]);
  });
  const [opts] = useState<GtDialogLine[]>(() => {
    if (useTiles) return [];
    const all = Object.values(GT_LESSONS)
      .flatMap((G) => (G.dialog || []).flatMap((x) => x.lines))
      .filter((x) => x[2] !== l[2]);
    const near = shuffle(all.filter((x) => Math.abs(duoPlain(x[2]).length - duoPlain(l[2]).length) <= 4));
    return shuffle([l, ...(near.length >= 2 ? near : shuffle(all)).slice(0, 2)]);
  });
  const triesRef = useRef(0);
  const [badOpt, setBadOpt] = useState<GtDialogLine | null>(null);
  const [micOn, setMicOn] = useState(false);
  const SR = (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;

  const wrong = (node?: HTMLElement | null) => {
    triesRef.current++;
    nhFx(node || null, false);
    wrongSfx();
    if (triesRef.current === 1) {
      onHint(l[3]);
      return;
    }
    onMiss();
    onTip("Câu đúng là thế này, mình nói theo nhé");
    onDone("");
  };

  const mic = () => {
    if (!SR) return;
    try {
      const r = new SR();
      r.lang = "zh-CN";
      setMicOn(true);
      r.onresult = (ev) => {
        const h = Array.from(ev.results).map((x) => x[0].transcript).join(""),
          want = duoPlain(l[2]),
          hit = [...want].filter((c) => h.includes(c)).length / want.length;
        if (hit >= 0.6) {
          S.spoke++;
          onDone(h);
        } else {
          onTip(`Máy nghe ra: ${h || "(chưa rõ)"}. Nói lại hoặc ghép câu bên dưới nhé`);
        }
      };
      r.onerror = () => setMicOn(false);
      r.onend = () => setMicOn(false);
      r.start();
    } catch {
      /* noop */
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#E4E5F0] p-3">
      <div className="flex items-baseline gap-2">
        <small className="text-[11.5px] font-semibold text-[#8A8FA8]">Điền câu của bạn</small>
        <b className="text-[13px] text-[#14213D]">{l[4]}</b>
      </div>
      {useTiles ? (
        <>
          <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl bg-[#F6F6FA] p-2">
            {chosen.map((z, i) => (
              <DuoTile
                key={i}
                z={z}
                onClick={() => {
                  const c = chosen.slice();
                  c.splice(i, 1);
                  setChosen(c);
                }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {bank
              .filter((z) => chosen.filter((c) => c === z).length < bank.filter((x) => x === z).length)
              .map((z, i) => (
                <DuoTile
                  key={i}
                  z={z}
                  onClick={() => {
                    setChosen([...chosen, z]);
                    speak(z);
                  }}
                />
              ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          {opts.map((o, i) => (
            <button
              key={i}
              type="button"
              disabled={badOpt === o}
              className={`rounded-xl border px-3 py-2 text-left text-[14px] transition ${
                badOpt === o ? "border-[#C8102E] bg-[#FFF3EC] opacity-50" : "border-[#E4E5F0] bg-white hover:border-[#EA0000]"
              }`}
              onClick={(e) => {
                if (o === l) return onDone("");
                setBadOpt(o);
                wrong(e.currentTarget as HTMLElement);
              }}
            >
              <span className="block font-['Noto_Serif_SC',serif]">{o[2]}</span>
              <small className="text-[11px] text-[#C8102E]">{o[3]}</small>
            </button>
          ))}
        </div>
      )}
      <div className="mt-1 flex items-center gap-2">
        <button type="button" title="Nghe mẫu" aria-label="Nghe mẫu" className="rounded-full border border-[#E4E5F0] px-2.5 py-1.5 text-[15px]" onClick={() => speak(l[2])}>
          🔊
        </button>
        {SR ? (
          <button type="button" title="Nói câu này" className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold ${micOn ? "border-[#EA0000] text-[#EA0000]" : "border-[#E4E5F0] text-[#14213D]"}`} onClick={mic}>
            {micOn ? "🎙 Nghe…" : "🎙 Nói"}
          </button>
        ) : null}
        {useTiles ? (
          <button
            type="button"
            disabled={!chosen.length}
            className="ml-auto rounded-xl bg-[#EA0000] px-4 py-1.5 text-[13px] font-bold text-white disabled:opacity-40"
            onClick={() => {
              if (chosen.join("") === tgt.join("")) return onDone("");
              triesRef.current++;
              nhFx(null, false);
              wrongSfx();
              if (triesRef.current === 1) {
                onHint(l[3]);
                setChosen([]);
                return;
              }
              onMiss();
              onTip("Câu đúng là thế này, mình nói theo nhé");
              onDone("");
              bump();
            }}
          >
            Kiểm tra
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- kết thúc ---------- */
function RpEnd({ S }: { S: RpSession }) {
  return (
    <div className="rounded-2xl border border-[#E2B14A] bg-[#FFFBEF] p-4 text-center">
      <b className="text-[16px] text-[#050349]">{S.stars === 3 ? "太棒了！Hội thoại hoàn chỉnh" : "Đã hoàn thành hội thoại!"}</b>
      <div className="my-1 flex justify-center">
        <NhStars k={S.stars} />
      </div>
      <small className="text-[12.5px] text-[#5B5A7A]">
        {`Bạn đã nói ${S.mine} câu của ${rpName(S.role)}${S.spoke ? `, ${S.spoke} câu bằng giọng nói` : ""}${S.miss ? `, ${S.miss} câu cần xem lại` : ""}`}
      </small>
      <div className="mt-3 flex justify-center gap-2">
        <button type="button" className="rounded-xl border border-[#E4E5F0] bg-white px-4 py-2 text-[13px] font-semibold text-[#14213D]" onClick={() => rpRun(S.n, S.b, S.pz)}>
          {`Đổi sang vai ${rpName(S.pz)}`}
        </button>
        <button type="button" className="rounded-xl border border-[#E4E5F0] bg-white px-4 py-2 text-[13px] font-semibold text-[#14213D]" onClick={() => openRoleplay()}>
          Cảnh khác
        </button>
        <button type="button" className="rounded-xl bg-[#EA0000] px-4 py-2 text-[13px] font-bold text-white" onClick={() => useUi.getState().closeRoom()}>
          Xong
        </button>
      </div>
    </div>
  );
}
