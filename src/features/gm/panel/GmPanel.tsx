/**
 * Hồ sơ + cửa hàng — gm.js `openGM`. Tabs: Tiến độ / Cửa hàng / Thẻ từ / Giải đấu.
 */
import { useEffect, useRef, useState } from "react";
import { useUi } from "@/stores/ui";
import { usePlayer } from "@/stores/player";
import { useGm, gmGet, gmSave, GM_FREEZE_MAX, GM_FREEZE_PRICE, type GmSlot } from "@/stores/gm";
import { me } from "@/game/engine/state";
import { keys, setTarget } from "@/game/engine/state";
import { lvOf, AV_PER, AV_REWARDS, avatarSvgUri } from "@/game/entities/avatar-svg";
import { callHook, emitHook } from "@/services/hooks";
import { speak } from "@/services/tts";
import { sfx, gmSfxOn, setSfxOn } from "@/services/sfx";
import { ls } from "@/lib/storage";
import { dstr, wkId } from "@/lib/helpers";
import { Tabs, ChipRow } from "@/features/ui-bits";
import { GT_LESSONS, gtLabel } from "@/data/gt-data";
import { gtClassName } from "@/game/world/geometry";
import { gmTitle, gmXu, gmStreak, gmToday, gmAc, GM_SHOP, GM_SLOTS, commDb, commDocs, commUid, wkPoints } from "../state";
import { gmPreview } from "../draw";

export type GmTab = "me" | "shop" | "cards" | "league";

export function openGM(tab?: string): void {
  const lv = lvOf(usePlayer.getState().points);
  keys.clear();
  setTarget(null);
  useUi.getState().openRoom({
    mark: "⭐",
    title: "Hồ sơ học viên",
    sub: `${me.n || "Bạn"} – Lv${lv} – ${gmTitle(lv)}`,
    body: <GmPanel tab={(tab as GmTab) || "me"} />,
    variant: "default",
  });
}

const cardCls = "mb-3 rounded-[14px] border border-[#E4E5F0] bg-white px-4 py-3";
const rowCls = "mb-1.5 font-extrabold text-[#050349]";
const viCls = "my-1 text-[13px] leading-snug text-[#5B5A7A]";
const ctaCls = "mt-2.5 w-full rounded-xl bg-[#EA0000] py-2.5 text-[14px] font-bold text-white disabled:opacity-55";
const ctaNavyCls = "mt-2.5 w-full rounded-xl bg-[#050349] py-2.5 text-[14px] font-bold text-white disabled:opacity-55";

export function GmPanel({ tab }: { tab: GmTab }) {
  const [t, setT] = useState<GmTab>(tab || "me");
  const points = usePlayer((s) => s.points);
  const xu = useGm((s) => (s.g, s.xu()));
  return (
    <div>
      <Tabs
        tabs={[
          ["me", "Tiến độ"],
          ["shop", "Cửa hàng"],
          ["cards", "Thẻ từ"],
          ["league", "Giải đấu"],
        ]}
        active={t}
        onPick={(k) => setT(k as GmTab)}
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span>💰</span>
        <b className="text-[19px]">{xu} xu</b>
        <small className="basis-full text-[12px] text-[#5B5A7A]">Xu = điểm bạn kiếm được. Mua đồ không làm giảm cấp hay thứ hạng.</small>
      </div>
      {t === "me" && <MeTab points={points} />}
      {t === "shop" && <ShopTab />}
      {t === "cards" && <CardsTab />}
      {t === "league" && <LeagueTab />}
    </div>
  );
}

/* ---------------- Tiến độ ---------------- */
function MeTab({ points }: { points: number }) {
  const g = useGm((s) => s.g);
  const lv = lvOf(points);
  const cap = 20;
  const base = (lv - 1) * AV_PER;
  const s = gmStreak();
  const days: { ds: string; on: boolean; today: boolean; wd: string }[] = [];
  for (let k = 6; k >= 0; k--) {
    const d = new Date();
    d.setDate(d.getDate() - k);
    const ds = dstr(d);
    days.push({ ds, on: g.hist.includes(ds), today: k === 0, wd: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()] });
  }
  // missions.js `msFr` — friends table (missions feature when ported)
  const FR = callHook<Record<string, number> & { _n?: Record<string, [string, string, number, number]> }>("msFr");
  const ks = Object.keys(FR?._n || {});
  const tl = g.titles || [];

  return (
    <div>
      <div className={cardCls}>
        <div className={rowCls}>
          Lv{lv} – {gmTitle(lv)}
        </div>
        <div className="my-1.5 h-2 overflow-hidden rounded-full bg-[#E4E5F0]">
          <i className="block h-full rounded-full bg-[#EA0000]" style={{ width: `${lv >= cap ? 100 : Math.min(100, ((points - base) / AV_PER) * 100)}%` }} />
        </div>
        <p className={viCls}>
          {lv >= cap
            ? "Bạn đã đạt cấp cao nhất!"
            : `${Math.round(points - base)}/${AV_PER} điểm để lên Lv${lv + 1}${gmTitle(lv + 1) !== gmTitle(lv) ? " – danh hiệu " + gmTitle(lv + 1) : ""}`}
        </p>
      </div>

      <div className={cardCls}>
        <div className={rowCls}>🔥 Chuỗi {s} ngày – kỷ lục {g.best}</div>
        <div className="my-1.5 grid grid-cols-7 gap-1">
          {days.map((d) => (
            <div
              key={d.ds}
              className={`flex flex-col items-center gap-0.5 rounded-[10px] border py-1.5 text-[17px] ${
                d.on ? "border-[#F5A623] bg-[#FFF3E0]" : "border-[#E4E5F0]"
              } ${d.today ? "shadow-[inset_0_0_0_2px_#050349]" : ""}`}
            >
              <span>{d.on ? "🔥" : "–"}</span>
              <small className="text-[10px] text-[#5B5A7A]">{d.wd}</small>
            </div>
          ))}
        </div>
        <p className={viCls}>{gmToday() ? "✓ Hôm nay đã xong mục tiêu: 1 buổi học." : "Mục tiêu hôm nay: học xong 1 buổi để giữ chuỗi."}</p>
        <p className={viCls}>❄️ Thẻ đóng băng: {g.frz}/{GM_FREEZE_MAX} – tự giữ chuỗi nếu bạn lỡ 1 ngày. Giữ chuỗi mỗi 7 ngày nhận rương 🎁 +50 xu.</p>
        {!gmToday() && (
          <button
            type="button"
            className={ctaCls}
            onClick={() => {
              useUi.getState().closeRoom();
              setTimeout(() => callHook("cbLesson"), 50);
            }}
          >
            🎯 Làm 1 nhiệm vụ ngay
          </button>
        )}
      </div>

      {FR ? (
        <div className={cardCls}>
          <div className={rowCls}>👥 Bạn bè trong khuôn viên – {ks.length}</div>
          {!ks.length && <p className={viCls}>Làm nhiệm vụ để kết thân với Thầy Vương, Minh, Tiểu Tuyết, Tiểu Mỹ…</p>}
          {ks.map((k) => {
            const [nm, zh, h, flv] = FR._n![k];
            return (
              <div key={k} className="flex items-center gap-2.5 py-1">
                <img alt="" src={avatarSvgUri(h, flv, 0)} className="h-[42px] w-8 object-contain" />
                <b>
                  {nm} {zh}
                </b>
                <span className="ml-auto tracking-[1px] text-[#EA0000]">{"❤".repeat(FR[k] || 0) + "♡".repeat(Math.max(0, 5 - (FR[k] || 0)))}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {tl.length ? (
        <div className={cardCls}>
          <div className={rowCls}>⚔ Danh hiệu thắng Thầy Vương</div>
          <ul className="grid gap-1 text-[13px] text-[#5B5A7A]">
            {tl.map((t) => (
              <li key={t} className="font-semibold text-[#14532D]">
                ✓ {t}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={cardCls}>
        <label className="flex items-center gap-1.5 text-[13.5px]">
          <input
            type="checkbox"
            className="h-5 w-5"
            defaultChecked={gmSfxOn()}
            onChange={(e) => {
              setSfxOn(e.target.checked);
              if (e.target.checked) sfx("ok");
            }}
          />
          {" Âm thanh khi trả lời đúng / sai"}
        </label>
      </div>

      <div className={cardCls}>
        <div className={rowCls}>Đồ mở theo cấp (tự mặc)</div>
        <ul className="grid gap-1 text-[13px] text-[#5B5A7A]">
          {AV_REWARDS.map(([l, n]) => (
            <li key={l} className={lv >= l ? "font-semibold text-[#14532D]" : ""}>
              {lv >= l ? "✓" : "🔒"} Lv{l}: {n}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- Cửa hàng ---------------- */
function Preview({ slot, id }: { slot: GmSlot; id: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) gmPreview(ref.current, slot, id);
  }, [slot, id]);
  return <canvas ref={ref} width={120} height={120} className="h-[84px] w-[84px]" />;
}

function ShopTab() {
  const g = useGm((s) => s.g);
  const points = usePlayer((s) => s.points);
  const lv = lvOf(points);
  const xu = useGm((s) => (s.g, s.xu()));

  const equip = (slot: GmSlot, id: number) => {
    const G = { ...gmGet(), eq: { ...gmGet().eq } };
    G.eq[slot] = id;
    gmSave(G);
    me.ac = gmAc();
    emitHook("sendMove", true);
  };

  const buy = (slot: GmSlot, it: [number, string, number, number, (string | undefined)?]) => {
    const [id, name, price] = it;
    if (gmXu() < price) return useUi.getState().toast("Chưa đủ xu");
    const G = { ...gmGet(), eq: { ...gmGet().eq }, own: [...gmGet().own] };
    G.spent += price;
    G.own.push(slot + ":" + id);
    G.eq[slot] = id;
    gmSave(G);
    me.ac = gmAc();
    emitHook("sendMove", true);
    useUi.getState().toast(`Đã mua ${name}!`);
  };

  return (
    <div>
      {GM_SLOTS.map((slot) => {
        const cur = g.eq[slot] || 0;
        const items = ([[0, "Không dùng", 0, 1]] as typeof GM_SHOP.hat.items).concat(GM_SHOP[slot].items);
        return (
          <div key={slot} className={cardCls}>
            <div className={rowCls}>{GM_SHOP[slot].name}</div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5">
              {items.map((it) => {
                const [id, name, price, need] = it;
                const key = slot + ":" + id;
                const own = id === 0 || g.own.includes(key);
                const lock = lv < need;
                const on = cur === id;
                return (
                  <div
                    key={key}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center ${
                      on ? "border-[#2E9E5B] shadow-[inset_0_0_0_2px_#2E9E5B]" : "border-[#E4E5F0]"
                    } ${lock ? "opacity-60" : ""}`}
                  >
                    <Preview slot={slot} id={id} />
                    <b className="text-[13px]">{name}</b>
                    {on ? (
                      <button type="button" disabled className="rounded-xl border border-[#E4E5F0] px-2 py-1.5 text-[12.5px] font-semibold opacity-70">
                        Đang dùng
                      </button>
                    ) : own ? (
                      <button type="button" onClick={() => equip(slot, id)} className="rounded-xl bg-[#050349] px-2 py-1.5 text-[12.5px] font-bold text-white">
                        Dùng
                      </button>
                    ) : lock ? (
                      <button type="button" disabled className="rounded-xl bg-[#EA0000] px-2 py-1.5 text-[12.5px] font-bold text-white opacity-55">
                        🔒 Cần Lv{need}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={xu < price}
                        title={xu < price ? "Chưa đủ xu" : undefined}
                        onClick={() => buy(slot, it)}
                        className="rounded-xl bg-[#EA0000] px-2 py-1.5 text-[12.5px] font-bold text-white disabled:opacity-55"
                      >
                        Mua – {price} xu
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className={cardCls}>
        <div className={rowCls}>Vật phẩm</div>
        <p className={viCls}>❄️ Thẻ đóng băng giữ chuỗi khi lỡ 1 ngày. Đang có {g.frz}/{GM_FREEZE_MAX}.</p>
        <button
          type="button"
          className={ctaNavyCls}
          disabled={g.frz >= GM_FREEZE_MAX || xu < GM_FREEZE_PRICE}
          onClick={() => {
            const G = { ...gmGet() };
            if (G.frz >= GM_FREEZE_MAX || gmXu() < GM_FREEZE_PRICE) return;
            G.spent += GM_FREEZE_PRICE;
            G.frz++;
            gmSave(G);
            useUi.getState().toast("Đã mua 1 thẻ đóng băng ❄️");
          }}
        >
          Mua thẻ đóng băng – {GM_FREEZE_PRICE} xu
        </button>
      </div>
    </div>
  );
}

/* ---------------- Giải đấu tuần theo lớp ---------------- */
function LeagueTab() {
  const lv = Number(ls.get("nh:lv")) || 1;
  const wk = wkId();
  const [cur, setCur] = useState(lv);
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + ((7 - (now.getDay() || 7)) % 7));
  end.setHours(23, 59, 59, 0);
  const ms = +end - +now;
  const dd = Math.floor(ms / 864e5);
  const hh = Math.floor((ms % 864e5) / 36e5);

  const cdb = commDb();
  const cuid = commUid();
  const rows = commDocs()
    .filter((d) => d.week === wk && (Number(d.hsk_level) || 1) === cur)
    .map((d) => ({ id: d.id, nickname: d.nickname || "Học viên", week_points: Number(d.week_points) || 0 }));
  if (cur === lv && !rows.some((r) => r.id === cuid)) rows.push({ id: cuid || "me", nickname: me.n || "Bạn", week_points: wkPoints() });
  rows.sort((a, b) => b.week_points - a.week_points);
  const top = rows.slice(0, 20);

  return (
    <div className={cardCls}>
      <div className={rowCls}>🏆 Giải đấu tuần theo lớp</div>
      <p className={viCls}>
        Xếp hạng theo điểm kiếm được trong tuần này – kết thúc sau {dd} ngày {hh} giờ (Chủ nhật 23:59). Top 3 mỗi lớp lên Nhà vinh danh.
      </p>
      <ChipRow items={[1, 2, 3].map((l): [string, string] => [String(l), gtClassName(l)])} active={String(cur)} onPick={(k) => setCur(+k)} />
      <ol className="mt-2 grid gap-1.5">
        {!cdb && <li className="rounded-[10px] border border-[#E4E5F0] px-3 py-2 text-[13px] text-[#5B5A7A]">Giải đấu cần đăng nhập để thấy bạn cùng lớp. Điểm tuần của bạn vẫn được tính.</li>}
        {top.map((r, i) => (
          <li
            key={r.id}
            className={`grid grid-cols-[2.2rem_1fr_auto] items-center gap-2 rounded-[10px] border px-3 py-1.5 ${
              r.id === cuid || r.id === "me" ? "border-[#EA0000] bg-[#EA0000]/5 font-bold" : "border-[#E4E5F0]"
            }`}
          >
            <span className="text-center font-extrabold">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
            <span>{r.nickname}</span>
            <b>{r.week_points} điểm</b>
          </li>
        ))}
        {!top.length && cdb && <li className="rounded-[10px] border border-[#E4E5F0] px-3 py-2 text-[13px] text-[#5B5A7A]">Chưa có ai trong lớp này tuần này.</li>}
      </ol>
    </div>
  );
}

/* ---------------- bộ sưu tập thẻ ---------------- */
function CardsTab() {
  const c = useGm((s) => s.cards);
  let tot = 0,
    own = 0;
  Object.values(GT_LESSONS).forEach((L) =>
    L.words.forEach((w) => {
      tot++;
      if (c.own[w[0]]) own++;
    }),
  );

  return (
    <div>
      <div className={cardCls}>
        <div className={rowCls}>🃏 Bộ sưu tập thẻ từ – {own}/{tot}</div>
        <p className={viCls}>
          Thẻ sáng lên khi bạn trả lời đúng từ đó trong Thử thách 60 giây, khởi động của Thầy Vương hoặc Cổng thử thách. Nghe ở Từ mới thì thẻ hiện
          mờ. Đủ bộ một bài +20 xu.
        </p>
        <button type="button" className={ctaCls} onClick={() => callHook("gmBlitz")}>
          ⚡ Thử thách 60 giây để sưu tầm
        </button>
      </div>
      {Object.keys(GT_LESSONS)
        .map(Number)
        .sort((a, b) => a - b)
        .map((n) => {
          const L = GT_LESSONS[n];
          const o = L.words.filter((w) => c.own[w[0]]).length;
          return (
            <div key={n} className={cardCls}>
              <div className={rowCls}>
                {gtLabel(n)} – {L.title} – {o}/{L.words.length}
                {c.sets[n] ? " – ✓ Đủ bộ" : ""}
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-1.5">
                {L.words.map((w) => {
                  const st = c.own[w[0]] ? "own" : c.seen[w[0]] ? "seen" : "none";
                  return (
                    <button
                      key={w[0]}
                      type="button"
                      onClick={() => {
                        if (st !== "none") speak(w[0]);
                      }}
                      className={`flex min-h-[96px] flex-col items-center gap-0.5 rounded-xl border px-1 py-2 ${
                        st === "own"
                          ? "border-[#F5A623] bg-gradient-to-b from-[#FFF8E1] to-white shadow-[0_2px_0_#F5A623]"
                          : st === "seen"
                            ? "border-[#E4E5F0] bg-white opacity-60"
                            : "border-[#E4E5F0] bg-white opacity-40"
                      }`}
                    >
                      <span className={`font-['Noto_Serif_SC',serif] text-2xl leading-[1.2] ${st === "none" ? "text-[#5B5A7A]" : "text-[#EA0000]"}`}>
                        {st === "none" ? "?" : w[0]}
                      </span>
                      <small className="text-[10.5px] text-[#5B5A7A]">{st === "own" ? w[1] : st === "seen" ? "đã nghe" : "chưa có"}</small>
                      <i className="text-[11px] not-italic leading-[1.25]">{st === "own" ? w[2] : ""}</i>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
}
