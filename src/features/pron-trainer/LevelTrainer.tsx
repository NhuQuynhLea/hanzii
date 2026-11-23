/**
 * Level-mode pronunciation trainer (scene-pron.js TRAINER_TPL "level" mode):
 * day picker → word picker → 3 steps (Nghe và xem / Nói thử / Kiểm tra tai)
 * with getUserMedia pitch tracking, per-syllable judging and self-rating.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { Word } from "@/types/lesson";
import { LEVELS, PER_DAY, todayWords } from "@/lib/curriculum";
import { usePlayer } from "@/stores/player";
import { dstr } from "@/lib/helpers";
import { speak } from "@/services/tts";
import { buildWord, TONE_TITLE, TITLE, type BuiltWord } from "./sylls";
import {
  toneTarget, tMean, pitch, toCurve, judge, fakeCurve,
  type CurveResult, type PitchPoint,
} from "./tone";
import { MouthView, CAPS, type MouthHandle } from "./Mouth";
import { ToneChart } from "./ToneChart";

const btnBase =
  "min-h-[46px] rounded-full px-[18px] font-bold transition disabled:cursor-not-allowed disabled:opacity-45";
const btnRed = `${btnBase} bg-[#EA0000] text-white enabled:hover:bg-[#C90000]`;
const btnGhost = `${btnBase} border-2 border-[#E4E5F0] bg-transparent text-[#050349] enabled:hover:border-[#050349]`;
const panel = "rounded-[22px] border border-[#E4E5F0] bg-white p-5";
const noteCls = (k: "ok" | "warn") =>
  `mt-3 rounded-[14px] px-3.5 py-2.5 ${k === "ok" ? "bg-[#E3F4EA] text-[#1F7A4D]" : "bg-[#FFF2D9] text-[#9A5B00]"}`;
const pickerBtn = (on: boolean) =>
  `flex min-h-[52px] flex-col items-center rounded-2xl border-2 px-3 py-1.5 leading-[1.15] ${
    on ? "border-[#EA0000] bg-[#FDE7E7]" : "border-[#E4E5F0] bg-white text-[#050349]"
  }`;

interface Attempt {
  curve: PitchPoint[] | null;
  dur: number;
  url: string | null;
  label: string;
}

interface QState {
  started: boolean;
  n: number;
  score: number;
  ans: number;
  pick: number;
  lock: boolean;
  fin: boolean;
}

export function LevelTrainer({ lv }: { lv: number }) {
  const L = useMemo(() => LEVELS[lv] || [], [lv]);
  const days = useMemo(() => {
    const d: Word[][] = [];
    for (let i = 0; i < L.length; i += PER_DAY) d.push(L.slice(i, i + PER_DAY));
    return d;
  }, [L]);
  const startDay = Math.min(Math.max(0, days.length - 1), Math.max(0, (todayWords(lv).day || 1) - 1));
  const [dayIdx, setDayIdx] = useState(startDay);
  const [word, setWord] = useState<Word | null>(() => (days[startDay] || [])[0] || null);
  const dayWords = days[dayIdx] || [];
  const w = useMemo(() => (word ? buildWord(word, L) : null), [word, L]);

  const pickDay = (i: number) => {
    setDayIdx(i);
    setWord((days[i] || [])[0] || null);
  };

  return (
    <div className="px-0.5 pb-4 pt-1.5">
      {days.length > 1 ? (
        <nav className="mb-2 flex gap-1.5 overflow-x-auto pb-1" aria-label="Chọn ngày học">
          {days.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={i === dayIdx}
              onClick={() => pickDay(i)}
              className={`min-h-[38px] flex-none rounded-full border-2 px-3 font-bold ${
                i === dayIdx
                  ? "border-[#050349] bg-[#050349] text-white"
                  : "border-[#E4E5F0] bg-white text-[#050349]"
              }`}
            >
              Ngày {i + 1}
            </button>
          ))}
        </nav>
      ) : null}
      <nav className="mb-3.5 flex flex-wrap gap-2" aria-label="Chọn từ để luyện">
        {dayWords.map((x) => (
          <button
            key={x[0]}
            type="button"
            aria-pressed={w ? x[0] === w.zh : false}
            onClick={() => setWord(x)}
            className={pickerBtn(w ? x[0] === w.zh : false)}
          >
            <b lang="zh" className="font-['Noto_Serif_SC',serif] text-[24px] font-bold leading-[1.1]">{x[0]}</b>
            <span className="text-[13px] font-semibold">{x[1]}</span>
          </button>
        ))}
      </nav>
      <div className="grid grid-cols-1 gap-[18px] min-[880px]:grid-cols-[340px_minmax(0,1fr)]">
        {w ? <WordCard w={w} /> : null}
        {w ? <WordSession key={`${dayIdx}:${w.zh}`} w={w} /> : null}
      </div>
    </div>
  );
}

function WordCard({ w }: { w: BuiltWord }) {
  const fs = w.zh.length > 2 ? 72 : w.zh.length > 1 ? 92 : 112;
  return (
    <section
      aria-label="Từ đang luyện"
      className="flex items-center gap-[18px] self-start rounded-[22px] border border-[#E4E5F0] bg-white p-[18px] min-[880px]:flex-col min-[880px]:text-center"
    >
      <div
        lang="zh"
        className="font-['Noto_Serif_SC',serif] font-bold leading-none text-[#EA0000]"
        style={{ fontSize: fs }}
      >
        {w.zh}
      </div>
      <div>
        <div className="text-[32px] font-extrabold tracking-[0.02em] text-[#050349]">{w.py}</div>
        <div className="text-[#5B5A7A]">
          {w.vi} – {w.S.map((s) => (s.t === 5 ? "thanh nhẹ" : "thanh " + s.t)).join(", ")}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2 min-[880px]:justify-center">
          <button type="button" className={btnRed} onClick={() => speak(w.zh, 0.85)}>
            🔊 Nghe mẫu
          </button>
          <button type="button" className={btnGhost} onClick={() => speak(w.zh, 0.5)}>
            Nghe chậm
          </button>
        </div>
      </div>
    </section>
  );
}

function WordSession({ w }: { w: BuiltWord }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [dot0, setDot0] = useState(-1);
  const [dispCurve, setDispCurve] = useState<PitchPoint[] | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [fb, setFb] = useState<{ kind: "ok" | "warn"; msg: string } | null>(null);
  const [rateSel, setRateSel] = useState(0);
  const [recOn, setRecOn] = useState(false);
  const [didRec, setDidRec] = useState(false);

  const cur = attempts[0] ?? null;
  const POOL = w.quiz;

  const mouthA = useRef<MouthHandle>(null);
  const mouthB = useRef<MouthHandle>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const dotRaf = useRef(0);
  const stopTimer = useRef(0);
  const urlsRef = useRef<string[]>([]);

  const [q, setQ] = useState<QState>({ started: false, n: 0, score: 0, ans: -1, pick: -1, lock: false, fin: false });
  const qRef = useRef(q);
  const qSet = (f: (x: QState) => QState) => {
    qRef.current = f(qRef.current);
    setQ(qRef.current);
  };
  const [qMsg, setQMsg] = useState<{ kind: "ok" | "warn"; html: string } | null>(null);
  const qTimers = useRef<number[]>([]);

  const doneAdd = (i: number) =>
    setDone((d) => {
      const n = new Set(d);
      n.add(i);
      return n;
    });

  /* ---------- ghi âm / chấm điểm ---------- */
  const addAttempt = (r: CurveResult | null, url: string | null, label: string) => {
    const a: Attempt = { curve: r ? r.curve : null, dur: r ? r.dur : 0, url, label };
    if (url) urlsRef.current.push(url);
    setAttempts((prev) => [a, ...prev]);
    const [ok, msg] = judge(w.S, r);
    setDispCurve(r ? r.curve : null);
    setFb({ kind: ok ? "ok" : "warn", msg });
    doneAdd(1);
    if (ok)
      usePlayer
        .getState()
        .award(`pa:${w.zh.slice(0, 8)}:${dstr()}`, 1, "phát âm đúng " + w.zh.slice(0, 8));
  };

  const onRec = async () => {
    if (recRef.current) {
      recRef.current.stop();
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      setFb({
        kind: "warn",
        msg: "Không mở được micro. Hãy cho phép trình duyệt dùng micro, hoặc mở “Xem ví dụ” bên dưới.",
      });
      return;
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = new AC();
    const src = ac.createMediaStreamSource(stream);
    const an = ac.createAnalyser();
    an.fftSize = 2048;
    src.connect(an);
    const buf = new Float32Array(an.fftSize);
    const raw: PitchPoint[] = [];
    const t0 = performance.now();
    let alive = true;
    const chunks: Blob[] = [];
    let mr: MediaRecorder | null = null;
    try {
      mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.start();
    } catch {
      /* MediaRecorder optional — pitch curve still works */
    }
    setRecOn(true);
    setFb(null);
    const loop = () => {
      if (!alive) return;
      an.getFloatTimeDomainData(buf);
      raw.push([(performance.now() - t0) / 1000, pitch(buf, ac.sampleRate)]);
      const r = toCurve(raw);
      setDispCurve(r ? r.curve : null);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    const stop = () => {
      if (!alive) return;
      alive = false;
      recRef.current = null;
      setRecOn(false);
      setDidRec(true);
      const fin = () => {
        stream.getTracks().forEach((t) => t.stop());
        ac.close();
        const url = chunks.length
          ? URL.createObjectURL(new Blob(chunks, { type: (mr && mr.mimeType) || "audio/webm" }))
          : null;
        addAttempt(toCurve(raw), url, "Lần ghi");
      };
      if (mr && mr.state !== "inactive") {
        mr.onstop = fin;
        mr.stop();
      } else fin();
    };
    recRef.current = { stop };
    stopTimer.current = window.setTimeout(stop, 1800 + w.S.length * 900);
  };

  const onAb = () =>
    speak(w.zh, 0.85, () => {
      const u = cur?.url;
      if (u) setTimeout(() => void new Audio(u).play(), 300);
    });

  const exGood = () => {
    const m = tMean(w.S);
    addAttempt(fakeCurve(w.S, (t) => toneTarget(w.S, Math.min(0.999, t)) - m + 3), null, "Ví dụ đúng");
  };
  const exBad = () =>
    addAttempt(fakeCurve(w.S, (t) => 3 + 0.2 * Math.sin(t * 3)), null, "Ví dụ đọc ngang");

  /* ---------- kiểm tra tai ---------- */
  const qNext = () => {
    qSet((x) => ({ ...x, started: true, lock: false, pick: -1 }));
    setQMsg(null);
    if (POOL.length < 2) {
      qSet((x) => ({ ...x, ans: -1 }));
      setQMsg({ kind: "warn", html: "Chưa đủ từ gần âm để làm bài nghe." });
      return;
    }
    if (qRef.current.n >= 4) {
      const score = qRef.current.score;
      qSet((x) => ({ ...x, fin: true, ans: -1 }));
      setQMsg({
        kind: score >= 3 ? "ok" : "warn",
        html: `Bạn đúng ${score}/4. ${
          score >= 3
            ? "Tai bạn đã phân biệt tốt."
            : "Xem lại hình lưỡi ở bước 1 rồi thử lại nhé."
        }`,
      });
      doneAdd(2);
      if (score >= 3)
        usePlayer
          .getState()
          .award(`pq:${w.zh.slice(0, 8)}:${dstr()}`, 1, "nghe phân biệt " + w.zh.slice(0, 8));
      return;
    }
    const ans = qRef.current.n === 0 ? 0 : Math.floor(Math.random() * POOL.length);
    qSet((x) => ({ ...x, ans, n: x.n + 1 }));
    qTimers.current.push(
      window.setTimeout(() => {
        if (qRef.current.ans === ans) speak(POOL[ans][0], 0.8);
      }, 250),
    );
  };

  const onPick = (i: number) => {
    if (qRef.current.lock) return;
    const ans = qRef.current.ans;
    const ok = i === ans;
    qSet((x) => ({ ...x, lock: true, pick: i, score: x.score + (ok ? 1 : 0) }));
    const a = POOL[ans];
    setQMsg({
      kind: ok ? "ok" : "warn",
      html: `${ok ? "Chính xác!" : "Chưa đúng."} Từ vừa phát là <b>${a[0]} ${a[1]}</b>${
        ans === 0 ? "" : ": " + a[2]
      }.`,
    });
    qTimers.current.push(window.setTimeout(qNext, 1700));
  };

  const onQuizAgain = () => {
    qSet((x) => ({ ...x, n: 0, score: 0, fin: false }));
    qNext();
  };

  /* ---------- điều hướng bước ---------- */
  const go = (i: number) => {
    setStep(i);
    if (i === 0) setDot0(-1);
    if (i === 1) setDispCurve(cur ? cur.curve : null);
    if (i === 2 && !qRef.current.started) qNext();
  };

  const onPlay0 = () => {
    doneAdd(0);
    mouthA.current?.play(w.pose, w.zh, () => {
      const t0 = performance.now(),
        dur = 700 * w.S.length;
      const tick = () => {
        const t = Math.min(1, (performance.now() - t0 - 150) / dur);
        setDot0(Math.max(0, t));
        if (t < 1) dotRaf.current = requestAnimationFrame(tick);
      };
      dotRaf.current = requestAnimationFrame(tick);
    });
  };

  /* cleanup: dừng micro, huỷ rAF/timer, thu hồi blob URL, dừng TTS */
  useEffect(
    () => () => {
      cancelAnimationFrame(dotRaf.current);
      clearTimeout(stopTimer.current);
      if (recRef.current) recRef.current.stop();
      qTimers.current.forEach((t) => clearTimeout(t));
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      try {
        speechSynthesis.cancel();
      } catch {
        /* tts unavailable */
      }
    },
    [],
  );

  const toneTitle =
    w.S.length > 1 ? "Đường thanh điệu từng âm" : TONE_TITLE[w.S[0] ? w.S[0].t : 5];
  const STEPS = ["1. Nghe và xem", "2. Nói thử", "3. Kiểm tra tai"];

  return (
    <main>
      <nav className="mb-3 flex gap-1.5 overflow-x-auto pb-1" aria-label="Các bước luyện">
        {STEPS.map((t, s) => (
          <button
            key={s}
            type="button"
            aria-current={step === s ? "step" : undefined}
            onClick={() => go(s)}
            className={`min-h-[42px] flex-none rounded-full border-2 px-[14px] font-semibold ${
              step === s
                ? "border-[#050349] bg-[#050349] text-white"
                : "border-[#E4E5F0] bg-white text-[#050349]"
            }`}
          >
            {done.has(s) ? (
              <span className={step === s ? "text-[#E2B14A]" : "text-[#1F7A4D]"}>✓ </span>
            ) : null}
            {t}
          </button>
        ))}
      </nav>

      {/* ---- 1. Nghe và xem ---- */}
      <section hidden={step !== 0} className={panel}>
        <h2 className="mb-1.5 text-[21px] font-bold text-[#050349]">
          Nghe, nhìn thanh điệu và cách đặt lưỡi
        </h2>
        <div className="grid grid-cols-1 gap-3 min-[700px]:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[22px] bg-[#0B0A3B] p-4 text-[#C9C8F2]">
            <div className="flex flex-wrap items-baseline justify-between gap-2.5">
              <b className="text-base text-white">{toneTitle}</b>
            </div>
            <ToneChart S={w.S} dot={dot0} ariaLabel="Biểu đồ thanh điệu mẫu" />
          </div>
          <figure className="m-0 rounded-2xl border border-[#E4E5F0] bg-white p-3">
            <h3 className="mb-1 text-[18px] font-bold text-[#050349]">
              <em className="not-italic text-[#EA0000]">{w.ini || "nguyên âm"}</em>: {TITLE[w.pose]}
            </h3>
            <MouthView
              ref={mouthA}
              pose={w.pose}
              cap={CAPS[w.pose][0]}
              ariaLabel="Hình động vị trí lưỡi"
            />
          </figure>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <button type="button" className={btnRed} onClick={onPlay0}>
            ▶ Nghe và xem
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              doneAdd(0);
              go(1);
            }}
          >
            Tôi thử nói
          </button>
        </div>
        <ul className="m-0 mt-3.5 grid list-none gap-2 p-0">
          {w.tips.map((t, i) => (
            <li
              key={i}
              className="border-l-4 border-[#EA0000] py-1 pl-3"
              dangerouslySetInnerHTML={{ __html: t }}
            />
          ))}
        </ul>
        {w.cmp ? (
          <details className="mt-3">
            <summary className="cursor-pointer">
              Hay nhầm với <span dangerouslySetInnerHTML={{ __html: w.cmp.label }} />? Xem so sánh
            </summary>
            <figure className="m-0 mt-2.5 rounded-2xl border border-[#E4E5F0] p-3">
              <h3 className="mb-1 text-[18px] font-bold text-[#050349]">
                <em className="not-italic text-[#EA0000]">
                  {w.cmp.ini === "hv" ? "h" : w.cmp.ini}
                </em>
                : {TITLE[w.cmp.pose]}
              </h3>
              <MouthView
                ref={mouthB}
                pose="rest"
                cap={CAPS[w.cmp.pose][0]}
                ariaLabel="Hình động âm hay bị nhầm"
              />
              <button
                type="button"
                className={`${btnGhost} mt-2 w-full`}
                onClick={() => {
                  if (w.cmp) mouthB.current?.play(w.cmp.pose, w.cmp.zh);
                }}
              >
                ▶ Xem chuyển động
              </button>
            </figure>
          </details>
        ) : null}
      </section>

      {/* ---- 2. Nói thử ---- */}
      <section hidden={step !== 1} className={panel}>
        <h2 className="mb-1.5 text-[21px] font-bold text-[#050349]">Nói “{w.py}” và so với mẫu</h2>
        <p className="mb-3.5 max-w-[62ch] text-[#5B5A7A]">
          Bấm Ghi âm, đọc một lần to và rõ. Đường xanh là giọng bạn, dải đỏ là thanh điệu chuẩn.
        </p>
        <div className="rounded-[22px] bg-[#0B0A3B] p-4 text-[#C9C8F2]">
          <div className="flex flex-wrap items-baseline justify-between gap-2.5">
            <b className="text-base text-white">Giọng bạn so với mẫu</b>
            <div className="flex flex-wrap gap-3.5 text-[14px]">
              <span>
                <i
                  className="mr-1.5 inline-block h-[6px] w-[22px] rounded-[3px] align-middle"
                  style={{ background: "rgba(234,0,0,.75)" }}
                />
                Chuẩn
              </span>
              <span>
                <i
                  className="mr-1.5 inline-block h-[6px] w-[22px] rounded-[3px] align-middle"
                  style={{ background: "#7FD6FF" }}
                />
                Giọng bạn
              </span>
            </div>
          </div>
          <ToneChart
            S={w.S}
            curve={dispCurve}
            ariaLabel="Biểu đồ so sánh giọng bạn với thanh điệu chuẩn"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <button type="button" className={btnRed} onClick={() => void onRec()}>
            {recOn ? "⏹ Dừng" : didRec ? "🎙 Ghi lại" : "🎙 Ghi âm"}
          </button>
          <button type="button" className={btnGhost} disabled={!attempts.length} onClick={onAb}>
            ▶ Mẫu rồi tới tôi
          </button>
          <span
            className={`items-center gap-2 font-bold text-[#EA0000] ${recOn ? "flex" : "hidden"}`}
          >
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#EA0000]" />
            Đang nghe…
          </span>
        </div>
        <div aria-live="polite">{fb ? <div className={noteCls(fb.kind)}>{fb.msg}</div> : null}</div>
        {attempts.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Tự chấm">
            {[
              [1, "Chưa giống"],
              [2, "Gần giống"],
              [3, "Giống rồi"],
            ].map(([r, t]) => (
              <button
                key={r}
                type="button"
                aria-pressed={rateSel === r}
                onClick={() => setRateSel(Number(r))}
                className={`min-h-[42px] rounded-full border-2 px-[14px] font-semibold ${
                  rateSel === r
                    ? "border-[#050349] bg-[#050349] text-white"
                    : "border-[#E4E5F0] bg-white text-[#050349]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        ) : null}
        <div aria-live="polite">
          {rateSel === 3 ? (
            <div className={noteCls("ok")}>Tuyệt! Chọn từ tiếp theo ở hàng trên nhé.</div>
          ) : rateSel === 2 ? (
            <div className={noteCls("warn")}>Gần rồi. Ghi âm thêm 1–2 lần nữa nhé.</div>
          ) : rateSel === 1 ? (
            <div className={noteCls("warn")}>
              Không sao. Xem lại hình lưỡi ở bước 1 rồi thử lại nhé.
            </div>
          ) : null}
        </div>
        <div className="mt-3.5 grid gap-2">
          {attempts.length >= 2
            ? attempts.slice(0, 5).map((a, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[14px] border border-[#E4E5F0] px-2.5 py-2"
                >
                  <ToneChart
                    S={w.S}
                    curve={a.curve}
                    small
                    className="h-[44px] w-[110px] rounded-lg"
                  />
                  <div>
                    <b>{i === attempts.length - 1 ? "Lần đầu tiên" : a.label}</b>
                    <br />
                    <span className="text-[#5B5A7A]">
                      {a.curve
                        ? judge(w.S, { curve: a.curve, dur: a.dur })[0]
                          ? "Đạt"
                          : "Chưa đạt"
                        : "Chưa bắt được giọng"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={btnGhost}
                    aria-label="Nghe lần thử này"
                    disabled={!a.url}
                    onClick={() => {
                      if (a.url) void new Audio(a.url).play();
                    }}
                  >
                    ▶
                  </button>
                </div>
              ))
            : null}
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer">Không có micro? Xem ví dụ</summary>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <button type="button" className={btnGhost} onClick={exGood}>
              Ví dụ đọc đúng
            </button>
            <button type="button" className={btnGhost} onClick={exBad}>
              Ví dụ đọc sai
            </button>
          </div>
        </details>
      </section>

      {/* ---- 3. Kiểm tra tai ---- */}
      <section hidden={step !== 2} className={panel}>
        <h2 className="mb-1.5 text-[21px] font-bold text-[#050349]">
          Tai bạn có phân biệt được không?
        </h2>
        <p className="mb-3.5 max-w-[62ch] text-[#5B5A7A]">
          Nghe rồi chọn từ đúng. Các lựa chọn là những từ dễ nghe nhầm với nhau.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            className={btnRed}
            onClick={() => {
              const a = POOL[qRef.current.ans];
              if (a) speak(a[0], 0.8);
            }}
          >
            🔊 Nghe lại
          </button>
          <span className="text-[#5B5A7A]" aria-live="polite">
            {q.fin ? "" : q.n ? `Câu ${q.n}/4` : ""}
          </span>
        </div>
        {q.ans >= 0 && !q.fin ? (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {POOL.map((o, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPick(i)}
                className={`rounded-2xl border-2 p-2.5 text-center text-[#050349] ${
                  q.lock && i === q.ans
                    ? "border-[#1F7A4D] bg-[#E3F4EA]"
                    : q.lock && i === q.pick
                      ? "border-[#EA0000] bg-[#FDE7E7]"
                      : "border-[#E4E5F0] bg-white"
                }`}
              >
                <b
                  lang="zh"
                  className="block font-['Noto_Serif_SC',serif] text-[34px] font-bold leading-[1.15]"
                >
                  {o[0]}
                </b>
                <span className="font-bold">{o[1]}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div aria-live="polite">
          {qMsg ? (
            <div className={noteCls(qMsg.kind)} dangerouslySetInnerHTML={{ __html: qMsg.html }} />
          ) : null}
          {q.fin ? (
            <button type="button" className={`${btnGhost} mt-2.5`} onClick={onQuizAgain}>
              Làm lại
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
