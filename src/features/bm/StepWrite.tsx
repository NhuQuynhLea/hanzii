/**
 * Bước 4/6 – Viết theo nét (bm.js bm.s===3).
 * HanziWriter quiz per character: pointer strokes are graded in order,
 * mistakes flash hints; finishing all chars awards `bm:viet:<zh>:<date>` +2.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import HanziWriter, { type CharacterJson } from "hanzi-writer";
import type { BmDbEntry } from "@/types/lesson";
import { BM } from "@/data/bm-data";
import { usePlayer } from "@/stores/player";
import { dstr } from "@/lib/helpers";
import { BM_GRID_BG, BM_PY, BM_ROW, BM_VI, BTN_GHOST, wbSize } from "./model";

const charData = (x: string, done: (d: CharacterJson) => void) => done(BM.chars[x] as unknown as CharacterJson);

export function StepWrite({ W }: { W: BmDbEntry }) {
  const chs = useMemo(() => W.chars.map((x) => x.c), [W]);
  const [size] = useState(() => wbSize(240));
  const [k, setK] = useState(0);
  const [msg, setMsg] = useState("Đang chuẩn bị bảng viết…");
  const boxRef = useRef<HTMLDivElement>(null);
  const wRef = useRef<HanziWriter | null>(null);
  const qRef = useRef<() => void>(() => {});
  const award = usePlayer((s) => s.award);

  const missing = !BM.chars[chs[k]];

  useEffect(() => {
    const box = boxRef.current;
    if (!box || missing) return;
    box.innerHTML = "";
    let w: HanziWriter | null = null;
    try {
      w = HanziWriter.create(box, chs[k], {
        width: size,
        height: size,
        padding: 14,
        charDataLoader: charData,
        showCharacter: false,
        showOutline: true,
        strokeColor: "#050349",
        drawingColor: "#EA0000",
        highlightColor: "#F4C95D",
        outlineColor: "#E3DACB",
        drawingWidth: 14,
        showHintAfterMisses: 2,
      });
    } catch {
      setMsg("Không tải được bảng viết. Em hãy viết ra giấy theo thứ tự nét ở bước 2 nhé.");
      return;
    }
    wRef.current = w;
    const q = () => {
      setMsg("Viết nét 1.");
      w!.quiz({
        onCorrectStroke: (d) => setMsg(d.strokesRemaining ? `Đúng rồi! Còn ${d.strokesRemaining} nét.` : ""),
        onMistake: () => setMsg("Chưa đúng, thử lại nét này nhé."),
        onComplete: (d) => {
          setMsg(
            (d.totalMistakes ? `Xong! Sai ${d.totalMistakes} lần.` : "Tuyệt vời, không sai nét nào!") +
              (k < chs.length - 1 ? " Sang chữ tiếp theo…" : ""),
          );
          if (k < chs.length - 1) window.setTimeout(() => setK((x) => x + 1), 1200);
          else award(`bm:viet:${W.zh}:${dstr()}`, 2, "tập viết " + W.zh);
        },
      });
    };
    qRef.current = q;
    q();
    return () => {
      wRef.current = null;
      qRef.current = () => {};
      try {
        w!.cancelQuiz();
      } catch {
        /* noop */
      }
    };
  }, [k, chs, missing, size, W.zh, award]);

  return (
    <>
      <div className={BM_PY}>{chs.length > 1 ? `Chữ ${k + 1}/${chs.length}: ${chs[k]}` : ""}</div>
      <div
        ref={boxRef}
        className="rounded-[14px] border border-[#EADFCB]"
        style={{ width: size, height: size, background: BM_GRID_BG, touchAction: "none" }}
      />
      <div className={BM_VI}>
        {missing ? "Không tải được bảng viết. Em hãy viết ra giấy theo thứ tự nét ở bước 2 nhé." : msg}
      </div>
      <div className={BM_ROW}>
        <button
          type="button"
          className={BTN_GHOST}
          onClick={() => {
            try {
              wRef.current?.cancelQuiz();
            } catch {
              /* noop */
            }
            qRef.current();
          }}
        >
          Viết lại
        </button>
        <button
          type="button"
          className={BTN_GHOST}
          onClick={() => {
            const w = wRef.current;
            if (!w) return;
            try {
              w.cancelQuiz();
            } catch {
              /* noop */
            }
            w.showCharacter();
            w.animateCharacter({
              onComplete: () => {
                w.hideCharacter();
                qRef.current();
              },
            });
          }}
        >
          Xem gợi ý
        </button>
      </div>
    </>
  );
}
