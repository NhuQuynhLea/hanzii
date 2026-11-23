/**
 * Bước 2/6 – Xem viết từng nét (bm.js bm.s===1).
 * HanziWriter animates each stroke with the stroke-name caption underneath.
 * Falls back to a plain SVG reveal when stroke data is missing.
 */
import { useEffect, useRef, useState } from "react";
import HanziWriter, { type CharacterJson } from "hanzi-writer";
import type { BmDbEntry } from "@/types/lesson";
import { BM } from "@/data/bm-data";
import { CharSvg } from "./CharSvg";
import { BM_GRID_BG, BM_PY, BM_ROW, BM_VI, BTN_GHOST, strokeName, wbSize } from "./model";

const charData = (x: string, done: (d: CharacterJson) => void) => done(BM.chars[x] as unknown as CharacterJson);

export function StepAnimate({ W }: { W: BmDbEntry }) {
  const [size] = useState(() => wbSize(220));
  const [ci, setCi] = useState(0);
  const [rep, setRep] = useState(0);
  const [cap, setCap] = useState("");
  /** fallback active (no stroke data or writer init failed) */
  const [fb, setFb] = useState(false);
  /** fallback: index of the stroke currently being drawn */
  const [fi, setFi] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const ch = W.chars[ci];

  useEffect(() => {
    let stop = false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    /** fallback: colour the static SVG stroke by stroke (bm.js `fallback`). */
    const startFallback = () => {
      const st = ch.st;
      let i = 0;
      const tick = () => {
        if (stop) return;
        setFi(i);
        setCap(i < st.length ? `Nét ${i + 1}/${st.length}: ${strokeName(st[i])}` : `Xong! ${ch.c} có ${st.length} nét.`);
        if (i < st.length) {
          i++;
          later(tick, 700);
        }
      };
      tick();
    };

    const box = boxRef.current;
    if (!box) return;
    let writer: HanziWriter | null = null;
    if (BM.chars[ch.c] && !fb) {
      try {
        box.innerHTML = "";
        writer = HanziWriter.create(box, ch.c, {
          width: size,
          height: size,
          padding: 12,
          charDataLoader: charData,
          strokeColor: "#050349",
          radicalColor: "#050349",
          outlineColor: "#EFE8DA",
          showCharacter: false,
          strokeAnimationSpeed: 0.9,
          highlightColor: "#EA0000",
        });
      } catch {
        writer = null;
        box.innerHTML = "";
        setFb(true);
      }
    }
    if (writer) {
      let i = 0;
      const nxt = () => {
        if (stop) return;
        if (i >= ch.st.length) {
          setCap(`Xong! ${ch.c} có ${ch.st.length} nét.`);
          return;
        }
        setCap(`Nét ${i + 1}/${ch.st.length}: ${strokeName(ch.st[i])}`);
        writer!.animateStroke(i, {
          onComplete: () => {
            i++;
            later(nxt, 260);
          },
        });
      };
      nxt();
    } else {
      startFallback();
    }
    return () => {
      stop = true;
      timers.forEach((t) => window.clearTimeout(t));
      try {
        writer?.pauseAnimation();
      } catch {
        /* noop */
      }
    };
  }, [ci, rep, ch, size, fb]);

  const showSvg = !BM.chars[ch.c] || fb;
  return (
    <>
      <div className={BM_PY}>
        {W.chars.length > 1 ? `Chữ ${ci + 1}/${W.chars.length}: ${ch.c}` : `${ch.c} – ${ch.st.length} nét`}
      </div>
      <div
        ref={boxRef}
        className="rounded-[14px] border border-[#EADFCB]"
        style={{ width: size, height: size, background: BM_GRID_BG }}
      >
        {showSvg ? (
          <CharSvg
            ch={ch.c}
            size={size - 2}
            fills={(i) => (i < fi ? "#050349" : i === fi ? "#EA0000" : "#EFE8DA")}
          />
        ) : null}
      </div>
      <div className={BM_VI}>{cap}</div>
      <div className={BM_ROW}>
        <button type="button" className={BTN_GHOST} onClick={() => setRep((x) => x + 1)}>
          ↺ Xem lại
        </button>
        {W.chars.length > 1 ? (
          <button type="button" className={BTN_GHOST} onClick={() => setCi((x) => (x + 1) % W.chars.length)}>
            Chữ tiếp theo →
          </button>
        ) : null}
      </div>
    </>
  );
}
