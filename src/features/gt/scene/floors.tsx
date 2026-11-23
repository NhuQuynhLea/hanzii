/**
 * GT floors (gt-floors.js) — floor picker dialog, floor switch, library floor
 * overlay painter, GT bookshelf dialog, GT_ONLY data bootstrap.
 */
import type { ReactNode } from "react";
import { FLR, GT_CLASS, GT_ONLY, gtClassName, LVS } from "@/game/world/geometry";
import { CW, LSHELF, LTABLE, type SceneZone } from "@/game/scenes/geometry-rooms";
import { classPill } from "@/game/render/painters";
import { me, keys, setTarget } from "@/game/engine/state";
import { navState, enterClass, leaveRoomScene } from "@/game/engine/navigation";
import { sendMove } from "@/services/presence/runtime";
import { callHook, emitHook } from "@/services/hooks";
import { useUi, toast } from "@/stores/ui";
import { usePlayer } from "@/stores/player";
import { ls } from "@/lib/storage";
import { getCurLevel, setCurLevel } from "@/lib/curriculum";
import { GT_LESSONS, GT_TITLES, gtLabel } from "@/data/gt-data";
import { LEVELS } from "@/data/curriculum";
import { NH_LESSONS } from "@/data/nh-lessons";
import { SENTENCES } from "@/data/games-data";
import type { NhLesson, Word } from "@/types/lesson";
import { gtState, useGt } from "@/stores/gt";
import { WordRow } from "@/features/ui-bits";
import { GtHzButton } from "./bits";
import { GT_NEED, gtUnlocked, gtLockWhy } from "./core";

/* local copies of lib.js shelf/table labels — used until/unless lib registers
 * the label hooks (navigation already calls them for zone labels). */
const LIB_TABLE = ["❌ Ôn từ hay sai", "🎧 Nghe hội thoại", "🎵 Luyện thanh điệu", "✍ Tập viết"];
const LIB_SHELF = ["🗂 Từ của tôi", "📚 Giáo trình", "⬇ Tài liệu"];

function open(mark: string, title: string, sub: string, body: ReactNode): void {
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({ mark, title, sub, body, variant: "default" });
}

/* ---------- flBtn / askFloor / setFloor (gt-floors.js) ----------
 * flBtn has no DOM counterpart: BottomBar renders the ⇅ button from FLR.lop
 * and hides it under GT_ONLY; setFloor bumps meSeq so it re-renders. */
export function askFloor(b: string): void {
  const lv = me.cl || getCurLevel();
  open(
    "梯",
    (b === "lop" ? `Giảng đường – Lớp ${lv}` : "Thư viện") + " – chọn tầng",
    "Tầng 1 học theo HSK, tầng 2 học Giao tiếp cấp tốc",
    <FloorOpts b={b} lv={lv} />,
  );
}

function FloorOpts({ b, lv }: { b: string; lv: number }) {
  const opts: [string, string, string, string][] =
    b === "lop"
      ? [
          ["hsk", "1", "Tầng 1 – HSK", `Lớp HSK ${lv}: từ mới HSK theo ngày, bài học trên bảng`],
          [
            "gt",
            "2",
            "Tầng 2 – Giao tiếp",
            `Lớp ${gtClassName(lv)}: ${GT_CLASS[lv].book}, bài ${
              GT_CLASS[lv].from > 30 ? GT_CLASS[lv].from - 30 : GT_CLASS[lv].from
            }–${GT_CLASS[lv].to > 30 ? GT_CLASS[lv].to - 30 : GT_CLASS[lv].to}`,
          ],
        ]
      : [
          ["hsk", "1", "Tầng 1 – HSK", "Kệ HSK 1, 2, 3: giáo trình, luyện viết, thẻ từ"],
          ["gt", "2", "Tầng 2 – Giao tiếp", "Kệ Nhập môn 1, Nhập môn 2, Cơ sở: tên bài, output, từ và mẫu câu"],
        ];
  const cur = (FLR as Record<string, string>)[b];
  return (
    <div className="grid gap-2.5">
      {opts.map(([k, n, t, d], i) => {
        const on = cur === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => {
              setFloor(b, k);
              useUi.getState().closeRoom();
            }}
            className={`grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-2xl border p-4 text-left ${
              on ? "border-[#050349] shadow-[inset_0_0_0_2px_#050349]" : "border-[#E4E5F0] hover:border-[#EA0000]"
            }`}
          >
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl text-[15px] font-bold text-white ${
                i === 0 ? "bg-[#EA0000]" : "bg-[#050349]"
              }`}
            >
              {n}
            </span>
            <span>
              <b className="block text-[17px] text-[#3D3E5C]">{t}</b>
              <small className="block text-[13.5px] leading-snug text-[#5B5A7A]">{d}</small>
            </span>
            <span className={`whitespace-nowrap text-[13px] font-bold ${on ? "text-[#5B5A7A]" : "text-[#EA0000]"}`}>
              {on ? "Đang ở đây" : "Đi →"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function setFloor(b: string, k: string): void {
  (FLR as Record<string, string>)[b] = k;
  ls.set("nh:fl:" + b, k);
  me.fl = k as "hsk" | "gt";
  if (b === "lop") {
    navState.cz = { k: "_" } as SceneZone;
    toast(
      k === "gt"
        ? `Tầng 2 – Lớp ${gtClassName(me.cl || 1)}. Ngồi vào bàn hoặc đến bảng để học.`
        : `Tầng 1 – Lớp HSK ${me.cl || 1}. Ngồi vào bàn hoặc đến bảng để học.`,
    );
  } else {
    navState.rz = { k: "_" } as SceneZone;
    toast(
      k === "gt"
        ? "Tầng 2 – Giáo trình Giao tiếp. Đi tới kệ để xem bài."
        : "Tầng 1 – Tài liệu HSK. Đi tới kệ HSK 1, 2 hoặc 3.",
    );
  }
  usePlayer.getState().setMe({}); // meSeq → BottomBar pills re-read FLR
  sendMove(true);
  emitHook("progPaint");
  emitHook("nvPaint");
}

/* ---------- drawLibFloor (library overlay painter, sc===3) ---------- */
export function drawLibFloor(ctx: CanvasRenderingContext2D, _now: number): void {
  const gt = FLR.thu === "gt";
  if (gt) {
    LTABLE.forEach((t, i) => {
      const label = callHook<string>("libTableLabel", i) || LIB_TABLE[i];
      if (label) classPill(ctx, label, t.x, t.y + 46);
    });
    LSHELF.forEach((s, i) => {
      const t = callHook<string>("libShelfLabel", i) || LIB_SHELF[i] || gtClassName(i + 1);
      ctx.font = '700 12px "Be Vietnam Pro",sans-serif';
      const w = Math.max(80, ctx.measureText(t).width + 22);
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.roundRect(s.x + 100 - w / 2, 196, w, 24, 12);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t, s.x + 100, 208.5);
    });
  }
  if (GT_ONLY) {
    ctx.textBaseline = "alphabetic";
    return;
  }
  ctx.fillStyle = gt ? "#050349" : "#EA0000";
  ctx.beginPath();
  ctx.roundRect(CW / 2 + 130, 14, 130, 22, 11);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = '700 11px "Be Vietnam Pro",sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(gt ? "Tầng 2 – Giao tiếp" : "Tầng 1 – HSK", CW / 2 + 195, 25.5);
  /* cầu thang */
  const sx = 800,
    sy = 540;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? "#8A5A34" : "#9A6436";
    ctx.fillRect(sx + i * 12, sy + i * 14, 90 - i * 12, 14);
  }
  ctx.fillStyle = "#5A3820";
  ctx.fillRect(sx - 4, sy - 6, 4, 76);
  classPill(ctx, gt ? "⇩ Tầng 1 – HSK" : "⇧ Tầng 2 – Giao tiếp", sx + 45, sy - 16);
  ctx.textBaseline = "alphabetic";
}

/* ---------- openGTLib (library shelf → GT books dialog) ---------- */
export function openGTLib(lv: number): boolean {
  const c = GT_CLASS[lv];
  if (!c) return false;
  open(
    "书",
    "Giáo trình " + c.name,
    `${c.book} – tên bài, output, từ mới và mẫu câu`,
    <GtLib lv={lv} />,
  );
  return true;
}

function GtLib({ lv }: { lv: number }) {
  const c = GT_CLASS[lv];
  const s = gtState();
  const items: ReactNode[] = [];
  for (let i = c.from; i <= c.to; i++) {
    const T = GT_TITLES[i];
    const L = GT_LESSONS[i];
    items.push(
      <details key={i} open={i === c.from} className="rounded-xl border border-[#E4E5F0] px-3 py-2">
        <summary className="cursor-pointer text-[14.5px] font-semibold text-[#3D3E5C]">
          {`Bài ${i > 30 ? i - 30 : i} – `}
          <span className="font-['Noto_Serif_SC',serif]">{T[0]}</span>
          {` – ${T[1]}` + (L ? (s.done[i] ? " ✓" : "") : " 🔒")}
        </summary>
        <p className="mt-1 text-[13.5px] text-[#3D3E5C]">
          <b>Output: </b>
          {T[2]}
        </p>
        {L ? (
          <>
            <ul className="mt-1">
              {L.words.map((w: Word) => (
                <WordRow key={w[0]} w={w} />
              ))}
            </ul>
            {(L.grammar || []).map((g, gi) => (
              <div key={gi} className="mt-2 rounded-xl bg-[#F6F7FB] p-2.5">
                <b className="block text-[14px] text-[#050349]">{g.t}</b>
                <span className="block text-[13px] text-[#5B5A7A]">{g.d}</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {g.ex.map((e, ei) => (
                    <GtHzButton key={ei} zh={e[0]} py={e[1]} extra={e[2]} />
                  ))}
                </div>
              </div>
            ))}
            {!gtUnlocked(i) ? (
              <p className="mt-1 text-[13px] text-[#5B5A7A]">{`🔒 Cần ${GT_NEED}★ ở ${gtLabel(i - 1)} để học bài này.`}</p>
            ) : (
              <button
                type="button"
                className="mt-2 rounded-xl bg-[#EA0000] px-4 py-2 text-[13.5px] font-bold text-white"
                onClick={() => {
                  useUi.getState().closeRoom();
                  if (me.sc === 3) leaveRoomScene();
                  FLR.lop = "gt";
                  ls.set("nh:fl:lop", "gt");
                  window._flSkip = 1;
                  enterClass(lv);
                  setTimeout(() => {
                    useGt.getState().setSession({ cur: i, step: "goal" as unknown as number });
                    callHook("openGTClass", lv);
                  }, 500);
                }}
              >
                Lên lớp học bài này
              </button>
            )}
          </>
        ) : (
          <p className="mt-1 text-[13px] text-[#5B5A7A]">{gtLockWhy(i)}</p>
        )}
      </details>,
    );
  }
  return <div className="grid gap-2">{items}</div>;
}

/* ---------- GT_ONLY data bootstrap (gt-floors.js tail block) ----------
 * Rewrites the HSK curriculum structures to GT content, as the original did.
 * PYMAP patching is covered by the duo engine's own gtPy lookup. */
export function bootGtOnly(): void {
  if (!GT_ONLY) return;
  const cls = (i: number) => (i <= 15 ? 1 : i <= 30 ? 2 : 3);
  const built = Object.keys(GT_LESSONS)
    .map(Number)
    .sort((a, b) => a - b);
  const nh = built.map(
    (i) =>
      ({
        lv: cls(i),
        n: i > 30 ? i - 30 : i,
        gi: i,
        zh: GT_TITLES[i][0],
        vi: GT_TITLES[i][1],
        w: GT_LESSONS[i].words,
      }) as unknown as NhLesson,
  );
  NH_LESSONS.length = 0;
  NH_LESSONS.push(...nh);
  [1, 2, 3].forEach((k) => {
    const seen = new Set<string>();
    const arr: Word[] = [];
    built
      .filter((i) => cls(i) === k)
      .forEach((i) =>
        GT_LESSONS[i].words.forEach((w: Word) => {
          if (!seen.has(w[0])) {
            seen.add(w[0]);
            arr.push(w.slice(0, 3) as Word);
          }
        }),
      );
    LEVELS[k].length = 0;
    LEVELS[k].push(...(arr.length ? arr : LEVELS[1]));
  });
  const SG: [string[], string][] = [
    [["我", "很", "好"], "Tôi rất khoẻ."],
    [["我", "也", "很", "饿"], "Tôi cũng rất đói."],
    [["我们", "都", "很", "忙"], "Chúng tôi đều rất bận."],
    [["你", "叫", "什么", "名字"], "Bạn tên là gì?"],
    [["我", "是", "越南人"], "Tôi là người Việt Nam."],
    [["我", "喜欢", "喝", "茶"], "Tôi thích uống trà."],
    [["一杯", "咖啡", "多少", "钱"], "Một ly cà phê bao nhiêu tiền?"],
    [["我", "要", "两本", "书"], "Tôi lấy hai quyển sách."],
    [["图书馆", "在", "哪儿"], "Thư viện ở đâu?"],
    [["昨天", "我", "没", "去", "银行"], "Hôm qua tôi không đi ngân hàng."],
    [["我的", "手机", "在", "这儿"], "Điện thoại của tôi ở đâu."],
  ];
  [1, 2, 3].forEach((k) => {
    SENTENCES[k] = SG;
  });
  if (!LVS().includes(getCurLevel())) setCurLevel(1);
  emitHook("progPaint");
  emitHook("nvPaint");
}

