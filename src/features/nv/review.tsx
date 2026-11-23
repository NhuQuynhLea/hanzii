/** Ôn giãn cách "Ôn 3 phút" (nv-quest.js `nvOpenReview`). */
import { useEffect, useMemo, useRef, useState } from "react";
import { ls } from "@/lib/storage";
import { dstr } from "@/lib/helpers";
import { speak } from "@/services/tts";
import { useUi } from "@/stores/ui";
import { usePlayer } from "@/stores/player";
import { emitHook } from "@/services/hooks";
import { NV_GAP, nvAddDays, nvDue, nvSrs, type SrsEntry, type SrsMap } from "./srs";
import { openNvRoom } from "./room";

export function nvOpenReview(): void {
  openNvRoom("复", "Ôn 3 phút", "Tự nhớ lại trước khi xem đáp án", <NvReview />);
}

const cta =
  "rounded-xl bg-[#EA0000] px-4 py-2 text-[14px] font-bold text-white";
const ghost =
  "rounded-xl border-2 border-[#E4E5F0] bg-transparent px-4 py-2 text-[14px] font-semibold text-[#3D3E5C] hover:border-[#050349]";

function NvReview() {
  const due = useMemo(() => nvDue(), []);
  const S = useRef<SrsMap>(nvSrs());
  const [i, setI] = useState(0);
  const [forgot, setForgot] = useState(0);
  const [shown, setShown] = useState(false);
  const closeRoom = useUi((s) => s.closeRoom);
  const finished = due.length > 0 && i >= due.length;

  /* không có từ đến hạn: đánh dấu đã ôn ngay */
  useEffect(() => {
    if (due.length === 0) {
      ls.set("nh:q:rev", dstr());
      emitHook("nvPaint");
    }
  }, [due.length]);

  /* xong hết thẻ: lưu SRS + thưởng */
  useEffect(() => {
    if (!finished) return;
    ls.set("nh:q:rev", dstr());
    ls.set("nh:srs", JSON.stringify(S.current));
    usePlayer.getState().award(`nv:rev:${dstr()}`, 3, "ôn 3 phút");
    emitHook("nvPaint");
  }, [finished]);

  if (due.length === 0) {
    return (
      <p className="text-[14px] text-[#3D3E5C]">
        Hôm nay không có từ nào đến hạn ôn. Từ của các ngày trước sẽ tự quay lại đúng lúc bạn sắp quên.
      </p>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-2.5 py-2.5 text-center">
        <div className="text-[2.6rem] font-extrabold leading-none text-[#EA0000]">
          {due.length - forgot}/{due.length}
        </div>
        <p className="m-0 text-[14px] text-[#3D3E5C]">
          {forgot > due.length / 2
            ? "Hôm nay quên khá nhiều. Những từ này sẽ quay lại ngay ngày mai, và bài mới hôm nay nhẹ nhàng thôi nhé."
            : "Tốt lắm! Từ nhớ được sẽ giãn ra lâu hơn mới phải ôn lại."}
        </p>
        <button type="button" onClick={closeRoom} className={cta}>
          Tiếp tục
        </button>
      </div>
    );
  }

  const w = due[i];
  const answer = (remembered: boolean) => {
    if (!remembered) {
      setForgot((f) => f + 1);
      S.current[w[0]] = { b: 0, due: nvAddDays(1) };
    } else {
      const lv = Math.min(NV_GAP.length - 1, ((S.current[w[0]] as SrsEntry | undefined)?.b ?? -1) + 1);
      S.current[w[0]] = { b: lv, due: nvAddDays(NV_GAP[lv]) };
    }
    setI((x) => x + 1);
    setShown(false);
  };

  return (
    <div className="flex flex-col items-center gap-2.5 py-2.5 text-center">
      <small className="text-[12px] text-[#5B5A7A]">
        Thẻ {i + 1}/{due.length}
      </small>
      <div
        lang="zh-CN"
        className="font-['Noto_Serif_SC',serif] text-[72px] font-bold leading-[1.1] text-[#EA0000]"
      >
        {w[0]}
      </div>
      <p className="m-0 text-[14px] text-[#3D3E5C]">
        Từ này đọc và nghĩa là gì? Nghĩ trong đầu rồi bấm xem.
      </p>
      {!shown ? (
        <button
          type="button"
          className={cta}
          onClick={() => {
            speak(w[0]);
            setShown(true);
          }}
        >
          Xem đáp án
        </button>
      ) : (
        <>
          <div className="text-[1.4rem] font-extrabold text-[#050349]">{w[1]}</div>
          <div className="text-[14px] text-[#3D3C5C]">{w[2]}</div>
          <div className="flex gap-2">
            <button type="button" className={ghost} onClick={() => answer(false)}>
              Chưa nhớ
            </button>
            <button type="button" className={cta} onClick={() => answer(true)}>
              Nhớ rồi
            </button>
          </div>
        </>
      )}
    </div>
  );
}
