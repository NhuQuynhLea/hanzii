/**
 * "Luyện nói: ghi âm và so sánh" — pron.js `pronRecorder()` as a React
 * component. MediaRecorder + mic level meter + optional zh-CN
 * SpeechRecognition + share/save/send-to-teacher flow.
 *
 * Original API was `{el, reset(w)}` + a `pmodel` CustomEvent; here `word`
 * is a prop (reset fires on change / re-pick via `resetKey`) and `pmodel`
 * is the `onModel` callback (plays the model audio + mouth animation).
 */
import { useEffect, useRef, useState } from "react";
import type { Word } from "@/types/lesson";
import { usePlayer } from "@/stores/player";
import { C } from "@/config/campus";
import { dstr } from "@/lib/helpers";

/* Minimal SpeechRecognition surface (zh-CN), matching the original usage. */
interface SrItem {
  0: { transcript: string };
}
interface SrEventLike {
  results: ArrayLike<SrItem>;
}
interface SpeechRecog {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SrEventLike) => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type SrCtor = new () => SpeechRecog;
interface ClaudeDownloads {
  save(o: { filename: string; data: Blob }): Promise<unknown>;
}

/** pron.js `pronRecActive` — one recording at a time across the app. */
let recActive: ((silent?: boolean) => void) | null = null;

export function PronRecorder({
  word,
  resetKey,
  onModel,
}: {
  word: Word | null;
  /** bump on every pick() — recr.reset(w) equivalent */
  resetKey: number;
  /** `pmodel` event → playAll() */
  onModel: () => void;
}) {
  const award = usePlayer((s) => s.award);
  const [msg, setMsg] = useState("");
  const [heard, setHeard] = useState("");
  const [done, setDone] = useState(false); // showResult block
  const [recOn, setRecOn] = useState(false); // recording in progress
  const [once, setOnce] = useState(false); // "Ghi âm giọng bạn" → "Ghi âm lại"
  const [meterOn, setMeterOn] = useState(false);
  const [zalo, setZalo] = useState(false);
  const lvlRef = useRef<HTMLElement | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const urlRef = useRef("");
  const wordRef = useRef<Word | null>(word);
  wordRef.current = word;

  /** pron.js `clear()` — revoke object URL, drop result + message. */
  const clear = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = "";
    blobRef.current = null;
    setHeard("");
    setDone(false);
    setMsg("");
    setZalo(false);
  };

  // recr.reset(w): stop an active take, then clear — on word/pick change.
  useEffect(() => {
    if (recActive) recActive(true);
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, resetKey]);

  // dlg "close" → stop(true): unmount (room closed) aborts the take.
  useEffect(() => () => { if (recActive) recActive(true); }, []);

  const waitSpeech = (cb: () => void) => {
    const t0 = performance.now();
    const tick = () => {
      if (
        !("speechSynthesis" in window) ||
        (!speechSynthesis.speaking && performance.now() - t0 > 350) ||
        performance.now() - t0 > 4000
      )
        cb();
      else setTimeout(tick, 120);
    };
    setTimeout(tick, 200);
  };

  const playMine = () => {
    if (!urlRef.current) return;
    const a = new Audio(urlRef.current);
    a.play().catch(() => {
      setMsg("Trình duyệt không phát được bản ghi này.");
    });
  };

  const compare = () => {
    if (!wordRef.current || !urlRef.current) return;
    setMsg("Giọng mẫu…");
    onModel();
    waitSpeech(() => {
      setMsg("Giọng của bạn…");
      playMine();
      setTimeout(() => {
        setMsg((m) => (m === "Giọng của bạn…" ? "" : m));
      }, 2500);
    });
  };

  const send = async () => {
    const blob = blobRef.current,
      w = wordRef.current;
    if (!blob || !w) return;
    const ext = /mp4|aac/.test(blob.type) ? "m4a" : /ogg/.test(blob.type) ? "ogg" : "webm";
    const name = `NowHanzi-${w[0]}-${dstr()}.${ext}`;
    try {
      const f = new File([blob], name, { type: blob.type || "audio/webm" });
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        await navigator.share({
          files: [f],
          title: "Nhờ giáo viên sửa phát âm",
          text: `Em đọc từ ${w[0]} (${w[1]}). Thầy cô sửa giúp em với ạ.`,
        });
        award(`send:${w[0]}:${dstr()}`, 5, "gửi bài đọc cho giáo viên");
        return;
      }
    } catch (e) {
      if (e && (e as DOMException).name === "AbortError") return;
    }
    let dl: ClaudeDownloads | null = null;
    try {
      const cl = (window as { claude?: { use?: (k: string) => Promise<ClaudeDownloads> } }).claude;
      dl = cl && cl.use ? await cl.use("downloads") : null;
    } catch {
      /* noop */
    }
    if (dl) {
      try {
        await dl.save({ filename: name, data: blob });
        award(`send:${w[0]}:${dstr()}`, 5, "gửi bài đọc cho giáo viên");
        setMsg("Đã lưu file ghi âm. Mở Zalo và gửi file này cho giáo viên nhé.");
        if (C.zalo) setZalo(true);
        return;
      } catch {
        /* noop */
      }
    }
    setMsg("Thiết bị này chưa gửi được file. Bạn có thể ghi âm trực tiếp trong Zalo và gửi cho giáo viên.");
  };

  const recClick = async () => {
    if (recActive) {
      recActive();
      return;
    }
    const w = wordRef.current;
    if (!w) return;
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setMsg("Trình duyệt này chưa hỗ trợ ghi âm. Hãy thử Chrome hoặc Safari mới.");
      return;
    }
    clear();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (e) {
      setMsg(
        e && (e as DOMException).name === "NotAllowedError"
          ? "Bạn chưa cho phép dùng micro. Bấm vào biểu tượng ổ khoá trên thanh địa chỉ để bật micro rồi thử lại."
          : "Không mở được micro trên thiết bị này.",
      );
      return;
    }
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    const chunks: Blob[] = [];
    let mr: MediaRecorder;
    try {
      mr = new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setMsg("Không ghi âm được trên trình duyệt này.");
      return;
    }
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    };
    let ac: AudioContext | null = null,
      an: AnalyserNode | null = null,
      raf = 0,
      sr: SpeechRecog | null = null,
      stopped = false,
      cancelled = false;
    try {
      const AC =
        window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        ac = new AC();
        an = ac.createAnalyser();
        an.fftSize = 512;
        ac.createMediaStreamSource(stream).connect(an);
      }
    } catch {
      /* noop */
    }
    const buf = an ? new Uint8Array(an.fftSize) : null;
    const loop = () => {
      if (an && buf) {
        an.getByteTimeDomainData(buf);
        let m = 0;
        for (const v of buf) m = Math.max(m, Math.abs(v - 128));
        if (lvlRef.current) lvlRef.current.style.width = Math.min(100, (m / 90) * 100) + "%";
      }
      raf = requestAnimationFrame(loop);
    };
    const SR =
      (window as { SpeechRecognition?: SrCtor }).SpeechRecognition ||
      (window as { webkitSpeechRecognition?: SrCtor }).webkitSpeechRecognition;
    if (SR) {
      try {
        sr = new SR();
        sr.lang = "zh-CN";
        sr.interimResults = true;
        sr.maxAlternatives = 1;
        sr.onresult = (e) => {
          setHeard(Array.from(e.results).map((x) => x[0].transcript).join(""));
        };
        sr.onerror = () => {};
        sr.start();
      } catch {
        sr = null;
      }
    }
    const syl = w[1].trim().split(/[\s']+/).length || 1,
      maxMs = Math.min(6000, 1800 + syl * 900);
    const timer = setTimeout(() => stop(), maxMs);
    function stop(silent?: boolean) {
      if (stopped) return;
      stopped = true;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      recActive = null;
      try {
        if (mr.state !== "inactive") mr.stop();
      } catch {
        /* noop */
      }
      try {
        if (sr) sr.stop();
      } catch {
        /* noop */
      }
      stream.getTracks().forEach((t) => t.stop());
      try {
        if (ac) ac.close();
      } catch {
        /* noop */
      }
      setMeterOn(false);
      setRecOn(false);
      setOnce(true);
      if (silent) cancelled = true;
    }
    mr.onstop = () => {
      if (cancelled) return;
      if (!chunks.length) {
        setMsg("Chưa ghi được tiếng. Thử lại và đọc gần micro hơn.");
        return;
      }
      blobRef.current = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
      urlRef.current = URL.createObjectURL(blobRef.current);
      setTimeout(() => {
        setMsg("");
        setDone(true);
        award(`say:${w[0]}:${dstr()}`, 3, "luyện nói " + w[0]);
      }, sr ? 500 : 0);
    };
    recActive = stop;
    mr.start();
    setMeterOn(true);
    loop();
    setRecOn(true);
    setMsg("Đang ghi… đọc to: " + w[0] + " (" + w[1] + ")");
  };

  const want = (word?.[0] || "").replace(/[^一-鿿]/g, "");
  const got = heard.replace(/[^一-鿿]/g, "");
  const ok = !!got && (got === want || got.includes(want));

  return (
    <div className="mt-3 rounded-2xl border-2 border-[#E4E5F0] p-3">
      <div className="flex flex-col gap-0.5">
        <b className="text-[14px] font-bold text-[#050349]">Luyện nói: ghi âm và so sánh</b>
        <span className="text-[12px] text-[#5B5A7A]">
          Đọc to từ đang chọn, rồi nghe lại cạnh giọng mẫu.
        </span>
      </div>
      <button
        type="button"
        onClick={recClick}
        className={`mt-2.5 rounded-xl px-4 py-2 text-[13px] font-bold text-white transition ${
          recOn ? "bg-[#050349]" : "bg-[#EA0000] hover:bg-[#C80000]"
        }`}
      >
        {recOn ? "⏹ Dừng" : once ? "🎙 Ghi âm lại" : "🎙 Ghi âm giọng bạn"}
      </button>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EFF1F8]"
        hidden={!meterOn}
        aria-hidden="true"
      >
        <i ref={lvlRef} className="block h-full w-0 bg-[#EA0000] transition-[width] duration-75" />
      </div>
      <p role="status" className="mt-2 min-h-0 text-[13px] font-medium text-[#5B5A7A] empty:hidden">
        {msg}
      </p>
      {done && (
        <div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={compare}
              className="rounded-xl bg-[#050349] px-4 py-2 text-[13px] font-bold text-white"
            >
              ▶ Nghe so sánh
            </button>
            <button
              type="button"
              onClick={playMine}
              className="rounded-xl border-2 border-[#E4E5F0] px-4 py-2 text-[13px] font-bold text-[#3D3E5C] hover:border-[#050349]"
            >
              🔁 Giọng mình
            </button>
            <button
              type="button"
              onClick={send}
              className="rounded-xl border-2 border-[#E4E5F0] px-4 py-2 text-[13px] font-bold text-[#3D3E5C] hover:border-[#050349]"
            >
              📤 Gửi giáo viên
            </button>
          </div>
          {heard ? (
            <>
              <p className={`mt-2 text-[13px] font-semibold ${ok ? "text-[#2E7D4F]" : "text-[#C8102E]"}`}>
                {ok
                  ? `✓ Máy nghe ra: ${heard}. Khớp với từ mẫu.`
                  : `Máy nghe ra: ${heard || "(không rõ)"}. Chưa khớp ${want}, thử đọc lại chậm và rõ hơn.`}
              </p>
              <small className="mt-1 block text-[11px] text-[#8A8FA8]">
                Máy nghe chỉ để gợi ý và có thể nhầm. Giáo viên mới sửa được chính xác thanh điệu và
                khẩu hình.
              </small>
            </>
          ) : null}
        </div>
      )}
      {zalo && C.zalo ? (
        <a
          href={C.zalo}
          target="_blank"
          rel="noopener"
          className="mt-2 inline-block rounded-xl bg-[#050349] px-4 py-2 text-[13px] font-bold text-white"
        >
          Mở Zalo
        </a>
      ) : null}
    </div>
  );
}
