/**
 * Bảng thành tích (hud.js `openBoard`) — badges, weekly league, group, online.
 * League/group tabs delegate to community hooks (Phase 8).
 */
import { useState } from "react";
import { usePlayer, stats, streak, BADGES } from "@/stores/player";
import { usePresence } from "@/stores/presence";
import { callHook } from "@/services/hooks";
import { Tabs } from "../ui-bits";
import type { ReactNode } from "react";

export function Board({ tab }: { tab?: string }) {
  const [t, setT] = useState(tab || "huy");
  const points = usePlayer((s) => s.points);
  const S = stats();

  return (
    <div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          [points, "điểm"],
          [streak(S) + " 🔥", "ngày liên tiếp"],
          [`${Object.keys(S.badges).length}/${BADGES.length}`, "huy hiệu"],
        ].map(([v, l], i) => (
          <div key={i} className="rounded-xl bg-[#F6F4EF] p-2.5 text-center">
            <b className="block text-[17px] text-[#050349]">{v}</b>
            <span className="text-[11px] text-[#5B5A7A]">{l}</span>
          </div>
        ))}
      </div>
      <Tabs
        tabs={[
          ["huy", "Huy hiệu"],
          ["tuan", "Hạng tuần"],
          ["nhom", "Nhóm học"],
          ["hang", "Đang online"],
        ]}
        active={t}
        onPick={setT}
      />
      {t === "huy" && <BadgeGrid />}
      {t === "tuan" && (callHook<ReactNode>("weekBoard") ?? <CommunityNote />)}
      {t === "nhom" && (callHook<ReactNode>("gpRender") ?? <CommunityNote />)}
      {t === "hang" && <OnlineList />}
    </div>
  );
}

function CommunityNote() {
  return <p className="py-6 text-center text-[13px] text-[#8A8FA8]">Kết nối máy chủ trung tâm để xem mục này.</p>;
}

function BadgeGrid() {
  const S = stats();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {BADGES.map((b) => {
        const ok = !!S.badges[b.id];
        const [c, n] = b.v(S);
        return (
          <div key={b.id} className={`rounded-xl border p-3 text-center ${ok ? "border-[#E2B14A] bg-[#FFFBEF]" : "border-[#E4E5F0] opacity-60"}`}>
            <div className="text-2xl">{b.e}</div>
            <b className="mt-1 block text-[12.5px] text-[#14213D]">{b.t}</b>
            <small className="mt-0.5 block text-[11px] leading-snug text-[#8A8FA8]">
              {ok ? `Đạt ngày ${S.badges[b.id].split("-").reverse().join("/")}` : b.d}
            </small>
            {!ok && n > 1 ? (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#EFF1F8]">
                <i className="block h-full bg-[#E2B14A]" style={{ width: `${Math.min(100, (c / n) * 100)}%` }} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function OnlineList() {
  const others = usePresence((s) => s.others);
  const me = usePlayer((s) => s.me);
  const points = usePlayer((s) => s.points);
  const entered = usePlayer((s) => s.entered);
  const badgeCount = usePlayer((s) => s.badgeCount);

  const rows: { n: string; c?: string; p: number; b: number; me?: boolean }[] = [];
  others.forEach((o) => rows.push({ n: o.n, c: o.c, p: o.p || 0, b: Array.isArray(o.b) ? o.b.length : +(o.b || 0) }));
  if (entered) rows.push({ n: me.n, c: me.c, p: points, b: badgeCount, me: true });
  rows.sort((a, b) => b.p - a.p);

  return (
    <div>
      <p className="mb-2 text-[12px] text-[#8A8FA8]">Những người đang online trong trung tâm.</p>
      <ul className="mb-3 space-y-1">
        {rows.map((r, i) => (
          <li key={i} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] ${r.me ? "bg-[#FFFBEF] font-bold" : ""}`}>
            <span className="w-6 text-center">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.c || "#999" }} />
            <span className="flex-1 truncate">
              {r.n}
              {r.me ? " (bạn)" : ""}
            </span>
            <b>
              {r.p} điểm, 🏅 {r.b}
            </b>
          </li>
        ))}
      </ul>
      <h3 className="mb-1 text-[14px] font-bold text-[#050349]">Cách tích điểm</h3>
      <ul className="list-disc space-y-1 pl-5 text-[13px] text-[#3D3E5C]">
        {[
          "Điểm danh mỗi ngày: +5",
          "Nghe đủ các từ mới trong ngày: +10 mỗi cấp",
          "Kiểm tra nhanh: +2 mỗi câu đúng, một lần mỗi ngày mỗi cấp",
          "Mở sách trong thư viện: +2 mỗi ngày",
          "Mỗi trò chơi ở khu vui chơi: +5 lần đầu mỗi ngày",
          "Trả lời đúng câu đố của Thầy Vương: +1 mỗi câu, tối đa 5 điểm mỗi ngày",
          "Mỗi huy hiệu mới: +10",
        ].map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
