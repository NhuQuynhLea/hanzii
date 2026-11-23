/**
 * Shared feature dialog — replaces <dialog id="room">.
 * Feature components render into `room.body`; variant applies the
 * original class hooks (wb = lesson whiteboard, duo = challenge mode).
 */
import { useEffect } from "react";
import { useUi } from "@/stores/ui";

export function RoomDialog() {
  const room = useUi((s) => s.room);
  const closeRoom = useUi((s) => s.closeRoom);

  useEffect(() => {
    if (!room.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRoom();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [room.open, closeRoom]);

  if (!room.open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) closeRoom();
      }}
    >
      <div
        role="dialog"
        aria-labelledby="roomTitle"
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
          room.variant === "wb" ? "max-w-4xl" : room.variant === "duo" ? "max-w-2xl" : "max-w-xl"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-[#E4E5F0] bg-[#050349] px-4 py-3 text-white">
          <div className="font-['Noto_Serif_SC',serif] text-2xl font-semibold text-[#E2B14A]">{room.mark}</div>
          <div className="min-w-0 flex-1">
            <h2 id="roomTitle" className="truncate text-[16px] font-bold">
              {room.title}
            </h2>
            <p className="truncate text-[12px] text-white/70">{room.sub}</p>
          </div>
          <button
            type="button"
            onClick={closeRoom}
            aria-label={room.variant === "wb" ? "Về lớp" : "Đóng"}
            className={`grid h-8 place-items-center rounded-full leading-none text-white/80 hover:bg-white/15 ${
              room.variant === "wb" ? "px-3 text-[13px] font-semibold" : "w-8 text-xl"
            }`}
          >
            {room.variant === "wb" ? "← Về lớp" : "×"}
          </button>
        </div>
        <div key={room.key} data-room-body className="flex-1 overflow-y-auto p-4">
          {room.body}
        </div>
      </div>
    </div>
  );
}
