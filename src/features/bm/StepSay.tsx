/**
 * Bước 5/6 – Nói và ghi âm (bm.js bm.s===4).
 * MediaRecorder captures up to 6s; blobs persist in IndexedDB (recordings
 * service) under `<zh>:first` / `<zh>:last`; saving awards
 * `bm:noi:<zh>:<date>` +2.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { BmDbEntry } from "@/types/lesson";
import { usePlayer } from "@/stores/player";
import { dstr } from "@/lib/helpers";
import { recGet, recPut } from "@/services/recordings";
import { SpeakBtn } from "./steps";
import { BM_ROW, BM_VI, BTN_CTA } from "./model";

interface Play {
  lb: string;
  url: string;
}

export function StepSay({ W }: { W: BmDbEntry }) {
  const [st, setSt] = useState(`Bấm Ghi âm, đọc “${W.zh} ${W.py}” rồi bấm Dừng.`);
  const [recLabel, setRecLabel] = useState("🎙 Ghi âm");
  const [plays, setPlays] = useState<Play[]>([]);
  const mrRef = useRef<MediaRecorder | null>(null);
  const urlsRef = useRef<string[]>([]);
  const aliveRef = useRef(true);
  const award = usePlayer((s) => s.award);

  const show = useCallback(async () => {
    const out: Play[] = [];
    const urls: string[] = [];
    for (const [k, lb] of [
      ["first", "Lần ghi đầu tiên"],
      ["last", "Lần ghi gần nhất"],
    ] as const) {
      const v = await recGet(W.zh + ":" + k);
      if (!v) continue;
      const url = URL.createObjectURL(v.b);
      urls.push(url);
      out.push({ lb: `${lb} – ${v.d}`, url });
    }
    if (!aliveRef.current) {
      urls.forEach((u) => URL.revokeObjectURL(u));
      return;
    }
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = urls;
    setPlays(out);
  }, [W.zh]);

  useEffect(() => {
    aliveRef.current = true;
    show();
    return () => {
      aliveRef.current = false;
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsRef.current = [];
      try {
        mrRef.current?.stop();
      } catch {
        /* noop */
      }
      mrRef.current = null;
    };
  }, [show]);

  const onRec = async () => {
    if (mrRef.current) {
      mrRef.current.stop();
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(s);
      const parts: Blob[] = [];
      mrRef.current = mr;
      mr.ondataavailable = (e) => parts.push(e.data);
      mr.onstop = async () => {
        s.getTracks().forEach((t) => t.stop());
        mrRef.current = null;
        if (!aliveRef.current) return;
        setRecLabel("🎙 Ghi lại");
        const b = new Blob(parts, { type: mr.mimeType || "audio/webm" });
        const v = { b, d: new Date().toLocaleDateString("vi-VN") };
        if (!(await recGet(W.zh + ":first"))) await recPut(W.zh + ":first", v);
        await recPut(W.zh + ":last", v);
        if (!aliveRef.current) return;
        setSt("Đã lưu. Nghe lại và so với giọng mẫu nhé.");
        award(`bm:noi:${W.zh}:${dstr()}`, 2, "luyện nói " + W.zh);
        show();
      };
      mr.start();
      setRecLabel("⏹ Dừng");
      setSt("Đang ghi âm… đọc to và rõ.");
      window.setTimeout(() => {
        if (mrRef.current === mr) mr.stop();
      }, 6000);
    } catch {
      setSt("Không mở được micro. Em có thể bỏ qua bước này và đọc to theo giọng mẫu.");
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className={BM_ROW}>
        <SpeakBtn zh={W.zh} label="🔊 Nghe mẫu" />
        <button type="button" className={BTN_CTA} onClick={onRec}>
          {recLabel}
        </button>
      </div>
      <div className={BM_VI}>{st}</div>
      {plays.map((p) => (
        <div key={p.url}>
          <div className="text-left text-[0.8rem] text-[#5B5A7A]">{p.lb}</div>
          <audio controls src={p.url} className="w-full" />
        </div>
      ))}
    </div>
  );
}
