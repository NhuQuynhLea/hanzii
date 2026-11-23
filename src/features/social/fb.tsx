/**
 * fb.js — nút/hộp thoại nhắn Fanpage NowHanzi, mã giảm thẻ vĩnh viễn,
 * lời mời đúng lúc (fbNudge, mỗi loại 1 lần), dòng mời trong hộp khoá (fbLine).
 */
import { useEffect, useState, type ReactNode } from "react";
import { create } from "zustand";
import { CAMPUS } from "@/config/campus";
import { me } from "@/game/engine/state";
import { usePlayer } from "@/stores/player";
import { useUi, toast } from "@/stores/ui";
import { ls } from "@/lib/storage";
import { dstr } from "@/lib/helpers";
import { keys, setTarget } from "@/game/engine/state";
import { gtClassLesson, gtWordStats, gmStreak, gtLabel } from "./gt-share";
import { gtState } from "@/stores/gt";
import { NhIcon } from "./bits";

export const FB_URL = (CAMPUS && CAMPUS.zalo) || "https://www.facebook.com/tiengtrungNowHanzi/";
export const FB_SLUG = (FB_URL.match(/facebook\.com\/([^/?#]+)/) || [])[1] || "tiengtrungNowHanzi";
export const FB_MSG_URL = "https://m.me/" + FB_SLUG;
export const FB_CODE = "CAMPUS20";
export const FB_OFF = 20000;

export function fbStat(k: string, f: string): void {
  try {
    const S = JSON.parse(ls.get("nh:fbc") || "{}");
    S[k] = S[k] || { s: 0, c: 0 };
    S[k][f]++;
    ls.set("nh:fbc", JSON.stringify(S));
  } catch {
    /* noop */
  }
}

export function fbProgress(): string {
  try {
    const s = gtState(),
      done = Object.keys(s.done).length,
      n = gtClassLesson(me.cl || 1) || 1,
      ws = gtWordStats({ from: 1, to: 55 });
    return `đang học ${gtLabel(n)}, xong ${done} bài, ${ws.learned} từ, chuỗi ${gmStreak()} ngày`;
  } catch {
    return "mới bắt đầu học";
  }
}

export function fbText(kind: string, src: string): string {
  const nm = (me && me.n) || "học viên";
  return kind === "code"
    ? `Chào NowHanzi, em là ${nm}. Em muốn dùng mã ${FB_CODE} để mua Thẻ học viên vĩnh viễn (giảm ${FB_OFF.toLocaleString("vi-VN")}đ). [${src}]`
    : `Chào NowHanzi, em là ${nm}. Em ${fbProgress()} trong khuôn viên NowHanzi. Em muốn được tư vấn lộ trình 1-1 miễn phí ạ. [${src}]`;
}

export async function fbGo(kind: string, src: string): Promise<void> {
  const t = fbText(kind, src);
  fbStat(src, "c");
  try {
    usePlayer.getState().award(`fb:${dstr()}`, 3, "nhắn Fanpage NowHanzi");
  } catch {
    /* noop */
  }
  let ok = false;
  try {
    await navigator.clipboard.writeText(t);
    ok = true;
  } catch {
    /* noop */
  }
  window.open(FB_MSG_URL, "_blank", "noopener");
  toast(ok ? "Đã chép sẵn tin nhắn, dán vào Messenger rồi gửi nhé!" : "Mở Messenger của NowHanzi…");
}

export function fbOpen(src?: string): void {
  src = src || "menu";
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({
    mark: "社",
    title: "Nhắn NowHanzi",
    sub: "Fanpage Tiếng Trung NowHanzi – trả lời qua Messenger",
    body: <FbView src={src} />,
    variant: "default",
  });
}

function FbView({ src }: { src: string }) {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-2xl border border-[#E4E5F0] p-4">
          <NhIcon k="chat" cls="red" />
          <b className="text-[15px] text-[#14213D]">Tư vấn lộ trình 1-1 miễn phí</b>
          <small className="text-[12px] text-[#5B5A7A]">Giáo viên xem tiến độ của bạn trong khuôn viên và gợi ý lộ trình phù hợp mục tiêu.</small>
          <p className="rounded-xl bg-[#F6F6FA] p-2.5 text-[12px] italic text-[#5B5A7A]">{fbText("tv", src)}</p>
          <button type="button" className="mt-auto rounded-xl bg-[#EA0000] px-4 py-2 text-[13.5px] font-bold text-white" onClick={() => fbGo("tv", src)}>
            Nhắn qua Messenger
          </button>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-[#E4E5F0] p-4">
          <NhIcon k="gift" cls="navy" />
          <b className="text-[15px] text-[#14213D]">{`Mã giảm ${FB_OFF.toLocaleString("vi-VN")}đ thẻ vĩnh viễn`}</b>
          <small className="text-[12px] text-[#5B5A7A]">{`Thẻ học viên vĩnh viễn còn ${Number(CAMPUS.prices.campus - FB_OFF).toLocaleString("vi-VN")}đ khi nhắn Fanpage kèm mã.`}</small>
          <button
            type="button"
            title="Bấm để sao chép mã"
            className="rounded-lg border border-dashed border-[#E2B14A] bg-[#FFFBEF] px-3 py-1.5 text-center text-[15px] font-bold tracking-[.2em] text-[#050349]"
            onClick={() => {
              try {
                navigator.clipboard.writeText(FB_CODE).then(() => toast("Đã chép mã " + FB_CODE));
              } catch {
                /* noop */
              }
            }}
          >
            {FB_CODE}
          </button>
          <button type="button" className="mt-auto rounded-xl bg-[#050349] px-4 py-2 text-[13.5px] font-bold text-white" onClick={() => fbGo("code", src)}>
            Nhắn kèm mã
          </button>
        </div>
      </div>
      <a
        className="mt-3 inline-block text-[13px] font-semibold text-[#5B5A7A] underline"
        href={FB_URL}
        target="_blank"
        rel="noopener"
        onClick={() => fbStat(src, "c")}
      >
        Xem Fanpage Tiếng Trung NowHanzi ↗
      </a>
    </div>
  );
}

/* ---------- lời mời đúng lúc ---------- */
export interface FbSeenMap {
  [k: string]: string;
}
export function fbSeen(): FbSeenMap {
  try {
    return JSON.parse(ls.get("nh:fbp") || "{}");
  } catch {
    return {};
  }
}

interface FbQ {
  key: string;
  msg: string;
  t: number;
}
interface FbStore {
  card: FbQ | null;
  setCard(c: FbQ | null): void;
}
export const useFb = create<FbStore>((set) => ({ card: null, setCard: (card) => set({ card }) }));

let fbQ: FbQ | null = null;

export function fbNudge(key: string, msg: string): void {
  const S = fbSeen();
  if (S[key]) return;
  S[key] = dstr();
  try {
    ls.set("nh:fbp", JSON.stringify(S));
  } catch {
    /* noop */
  }
  fbQ = { key, msg, t: Date.now() };
}

/* vòng lặp kiểm tra như setInterval 1200ms của bản gốc */
setInterval(() => {
  if (!fbQ || !usePlayer.getState().entered) return;
  const ui = useUi.getState();
  if (ui.room.open || ui.buyOpen || ui.acadOpen) {
    if (Date.now() - fbQ.t > 120000) fbQ = null;
    return;
  }
  const q = fbQ;
  fbQ = null;
  fbStat(q.key, "s");
  useFb.getState().setCard(q);
}, 1200);

setTimeout(() => {
  try {
    if (usePlayer.getState().entered && gmStreak() >= 3)
      fbNudge("chuoi-3", `Chuỗi ${gmStreak()} ngày rồi, giỏi quá! Nhắn NowHanzi để được giáo viên tư vấn lộ trình 1-1 miễn phí nhé.`);
  } catch {
    /* noop */
  }
}, 8000);

/** Thẻ nudge góc màn hình (`.fb-card panel`) — mount ở App. */
export function FbNudgeHost() {
  const card = useFb((s) => s.card);
  const setCard = useFb((s) => s.setCard);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    setLeaving(false);
    if (!card) return;
    const t1 = setTimeout(() => setLeaving(true), 20000);
    const t2 = setTimeout(() => setCard(null), 20400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [card, setCard]);
  if (!card) return null;
  const close = () => setCard(null);
  return (
    <div
      role="status"
      className={`fixed bottom-24 right-3 z-50 w-72 rounded-2xl border border-[#E4E5F0] bg-white p-4 shadow-2xl transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}
    >
      <button type="button" aria-label="Đóng" className="absolute right-2 top-2 text-lg leading-none text-[#8A8FA8]" onClick={close}>
        ×
      </button>
      <NhIcon k="chat" cls="red" />
      <p className="my-2 text-[13.5px] leading-snug text-[#14213D]">{card.msg}</p>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-xl bg-[#EA0000] px-3.5 py-1.5 text-[12.5px] font-bold text-white"
          onClick={() => {
            close();
            fbOpen(card.key);
          }}
        >
          Nhắn trung tâm
        </button>
        <button type="button" className="rounded-xl border border-[#E4E5F0] px-3.5 py-1.5 text-[12.5px] font-bold text-[#5B5A7A]" onClick={close}>
          Để sau
        </button>
      </div>
    </div>
  );
}

/* ---------- dòng mời trong các hộp bị khoá ---------- */
export function fbLine(src: string): ReactNode {
  return (
    <p className="text-[12px] text-[#8A8FA8]">
      {`Nhắn Fanpage NowHanzi để nhận mã giảm ${FB_OFF.toLocaleString("vi-VN")}đ hoặc tư vấn 1-1 miễn phí. `}
      <button type="button" className="font-semibold text-[#EA0000] underline" onClick={() => fbOpen(src)}>
        Nhắn ngay →
      </button>
    </p>
  );
}
