/**
 * Khoá khu vực (nv-quest.js): NV_LOCK rỗng (mọi khu mở ngay từ ngày đầu)
 * + các khu "sắp mở" khoá tới 30/11 trừ học viên trả phí.
 */
import type { ReactNode } from "react";
import { callHook } from "@/services/hooks";
import { useUi } from "@/stores/ui";
import { usePlayer } from "@/stores/player";
import { campusActive, isOwner } from "@/services/entitlement";
import { nvDay } from "./srs";
import { openNvRoom } from "./room";

interface NvLockDef {
  day: number;
  pts: number;
  vi: string;
}

/** mọi khu mở ngay từ ngày đầu */
export const NV_LOCK: Record<string, NvLockDef> = {};

/* Khu sắp mở: khoá tới 30/11 trừ học viên trả phí */
export const SOON_AT = new Date(2026, 10, 30, 0, 0, 0).getTime();
export const SOON_Z: Record<string, string> = {
  thu: "Thư viện",
  tuvan: "Văn phòng tuyển sinh",
  g1: "Khu vui chơi",
  g2: "Khu vui chơi",
  g3: "Khu vui chơi",
  g4: "Khu vui chơi",
};

function soonPaid(): boolean {
  try {
    return campusActive();
  } catch {
    return false;
  }
}

export function soonLocked(z: string): boolean {
  return !!SOON_Z[z] && Date.now() < SOON_AT && !soonPaid();
}

export function nvLocked(z: string): boolean {
  const L = NV_LOCK[z];
  if (!L || isOwner()) return false;
  return nvDay() < L.day && usePlayer.getState().points < L.pts;
}

export function nvLockMsg(z: string): string {
  const L = NV_LOCK[z];
  if (!L) return "";
  return `🔒 ${L.vi} mở vào ngày học thứ ${L.day} (hoặc khi bạn đạt ${L.pts} điểm). Hôm nay hãy làm nhiệm vụ trước nhé!`;
}

export function openSoon(z: string): void {
  const fb = callHook<ReactNode>("fbLine", "khu-khoa-" + z);
  openNvRoom(
    "🔒",
    `${SOON_Z[z]} – Ra mắt 30/11`,
    "Sắp mở cho mọi người",
    <div className="grid justify-items-center gap-2.5 px-1.5 py-2.5 text-center">
      <div className="text-[44px] leading-none">🔒</div>
      <b className="text-[15px] text-[#050349]">{SOON_Z[z]} mở cho mọi người từ ngày 30/11</b>
      <p className="m-0 text-[13px] text-[#5B5A7A]">
        Có Thẻ học viên vĩnh viễn (69.000đ) là vào được ngay từ hôm nay.
      </p>
      <div className="flex flex-wrap justify-center gap-2.5">
        <button
          type="button"
          onClick={() => callHook("openBuy")}
          className="rounded-xl bg-[#EA0000] px-4 py-2 text-[14px] font-bold text-white"
        >
          Mua thẻ / nhập mã
        </button>
        <button
          type="button"
          onClick={() => useUi.getState().closeRoom()}
          className="rounded-xl border-2 border-[#E4E5F0] bg-transparent px-4 py-2 text-[14px] font-bold text-[#3D3E5C] hover:border-[#050349]"
        >
          Để sau
        </button>
      </div>
      {fb}
    </div>,
  );
}

