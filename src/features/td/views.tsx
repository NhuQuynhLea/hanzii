/**
 * Thách đấu views (td.js `tdPanel`/`tdWait`/`tdCountdown`/`tdStart` panes +
 * `td-inv` invite card). The original mutated a shared dialog body; here each
 * phase is a React node swapped through `useUi.room.body`.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { GAMES } from "@/data/games-data";
import { LVN, LVS } from "@/game/world/geometry";
import { usePresence } from "@/stores/presence";
import { toast } from "@/stores/ui";
import { callHook } from "@/services/hooks";
import { ChipRow } from "@/features/ui-bits";
import { GameOnly } from "@/features/games/Games";
import { NhIcon } from "@/lib/icons";
import { useTd, type TdPeer, type TdState } from "./state";
import { getTd, tdAsync, tdBot, tdDecode, tdHost, tdJoin, tdLeave, tdOpp, tdOppStat, tdPanel, tdSec, tdStart } from "./index";

const CTA_NAVY = "rounded-xl bg-[#050349] px-4 py-2 text-[13px] font-bold text-white";
const CTA_GHOST = "rounded-xl border-2 border-[#E4E5F0] bg-white px-4 py-2 text-[13px] font-bold text-[#3D3E5C] hover:border-[#050349]";
const CARD = "rounded-2xl border border-[#E4E5F0] bg-white p-4";
const MSG = "mt-2 min-h-[16px] text-[12px] font-semibold text-[#C8102E]";

/* ================= tdPanel ================= */

/** td.js `tdPanel` body — "Đấu trực tiếp" + "Gửi mã vượt điểm" cards. */
export function TdPanel({ id, lv0 }: { id: string; lv0: number }) {
  const G = GAMES[id];
  const [lv, setLv] = useState(lv0);
  const [joinMsg, setJoinMsg] = useState("");
  const [codeMsg, setCodeMsg] = useState("");
  const joinRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  // repaint when the online roster changes (peers join/leave)
  usePresence((s) => s.online);

  const on: TdPeer[] = [];
  usePresence.getState().others.forEach((o) => {
    const p = o as TdPeer;
    if (p.nw && o.n) on.push(p);
  });

  const joinSubmit = (e: FormEvent) => {
    e.preventDefault();
    const c = (joinRef.current?.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length !== 4) {
      setJoinMsg("Mã phòng gồm 4 ký tự.");
      return;
    }
    if (!tdJoin(c)) setJoinMsg("Không thấy phòng này. Kiểm tra lại mã, hoặc nhờ bạn tạo phòng mới.");
  };

  const codeSubmit = (e: FormEvent) => {
    e.preventDefault();
    const d = tdDecode(codeRef.current?.value || "");
    if (!d) {
      setCodeMsg("Mã chưa đúng, kiểm tra lại giúp mình nhé.");
      return;
    }
    if (d.id !== id) {
      setCodeMsg(`Mã này của gian ${GAMES[d.id].name}. Ghé gian đó để nhận thách đấu nhé.`);
      return;
    }
    tdAsync(d.id, d.lv, d.seed, { ok: d.ok, tot: d.tot, ms: d.ms });
  };

  return (
    <div>
      <button type="button" onClick={() => callHook("openGame", id)} className="mb-3 text-[13px] font-semibold text-[#5B5A7A] hover:text-[#050349]">
        ← Chơi một mình
      </button>
      {G.lv ? (
        <ChipRow items={LVS().map((l): [string, string] => [String(l), LVN(l)])} active={String(lv)} onPick={(k) => setLv(+k)} />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <b className="text-[15px] text-[#050349]">Đấu trực tiếp</b>
          <p className="mb-3 mt-0.5 text-[12px] text-[#5B5A7A]">
            Hai bạn làm cùng một bộ câu cùng lúc, thấy điểm nhau chạy. Đúng nhiều hơn thắng, bằng nhau thì ai nhanh hơn thắng.
          </p>
          <div className="mb-3 space-y-1">
            {on.length ? (
              <>
                <small className="text-[11px] font-semibold text-[#8A8FA8]">Đang online, bấm để mời:</small>
                {on.slice(0, 8).map((o) => (
                  <button
                    key={o.nw}
                    type="button"
                    onClick={() => tdHost(id, lv, { inv: o.nw, name: o.n })}
                    className="flex w-full items-center gap-2 rounded-xl border-2 border-[#E4E5F0] px-2.5 py-1.5 text-left hover:border-[#EA0000]"
                  >
                    <i className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#050349] text-[12px] font-bold not-italic text-white">
                      {o.n.slice(0, 1).toUpperCase()}
                    </i>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#3D3E5C]">{o.n}</span>
                    <em className="text-[11px] font-bold not-italic text-[#EA0000]">Mời</em>
                  </button>
                ))}
              </>
            ) : (
              <small className="block text-[12px] text-[#8A8FA8]">
                Chưa có bạn nào online lúc này. Tạo phòng rồi gửi mã cho bạn, hoặc đấu với bot.
              </small>
            )}
          </div>
          <div className="mb-2 flex gap-2">
            <button type="button" onClick={() => tdHost(id, lv, {})} className={CTA_NAVY}>
              Tạo phòng
            </button>
            <button type="button" onClick={() => tdBot(id, lv)} className={CTA_GHOST}>
              Đấu với bot
            </button>
          </div>
          <form onSubmit={joinSubmit} className="flex gap-2">
            <input
              ref={joinRef}
              maxLength={4}
              placeholder="Mã phòng 4 ký tự"
              aria-label="Mã phòng"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border-2 border-[#E4E5F0] px-3 py-2 text-[14px] font-semibold uppercase outline-none focus:border-[#050349]"
            />
            <button type="submit" className={CTA_GHOST}>
              Vào phòng
            </button>
          </form>
          <p className={MSG}>{joinMsg}</p>
        </div>
        <div className={CARD}>
          <b className="text-[15px] text-[#050349]">Gửi mã vượt điểm</b>
          <p className="mb-3 mt-0.5 text-[12px] text-[#5B5A7A]">
            Chơi xong nhận một mã. Bạn bè nhập mã ở gian này sẽ gặp đúng bộ câu của bạn và tìm cách vượt điểm, không cần
            online cùng lúc.
          </p>
          <div className="mb-2 flex gap-2">
            <button type="button" onClick={() => tdAsync(id, lv, tdNewSeedV(), null)} className={CTA_NAVY}>
              Chơi lấy mã
            </button>
          </div>
          <form onSubmit={codeSubmit} className="flex gap-2">
            <input
              ref={codeRef}
              maxLength={20}
              placeholder="Mã thách đấu, ví dụ TD-…"
              aria-label="Mã thách đấu"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border-2 border-[#E4E5F0] px-3 py-2 text-[14px] font-semibold uppercase outline-none focus:border-[#050349]"
            />
            <button type="submit" className={CTA_GHOST}>
              Nhận thách đấu
            </button>
          </form>
          <p className={MSG}>{codeMsg}</p>
        </div>
      </div>
    </div>
  );
}

function tdNewSeedV(): number {
  return Math.floor(Math.random() * 60000000) + 1;
}

/* ================= tdWait (host) ================= */

/** td.js `tdWait` body — room code + waiting copy. */
export function TdWait() {
  const S = getTd();
  if (!S) return null;
  const G = GAMES[S.id];
  const copy = () => {
    try {
      void navigator.clipboard
        .writeText(`Vào khuôn viên NowHanzi, gian ${G.name}, bấm Thách đấu rồi nhập mã phòng ${S.code} để đấu với mình nhé!`)
        .then(() => toast("Đã chép lời mời"));
    } catch {
      /* noop */
    }
  };
  return (
    <div>
      <div className="mb-3 flex flex-col items-center gap-1 rounded-2xl bg-[#F6F4EF] p-4">
        <small className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8FA8]">Mã phòng</small>
        <b className="font-mono text-2xl tracking-[0.2em] text-[#050349]">{S.code}</b>
        <button type="button" onClick={copy} className="mt-1 rounded-full bg-[#050349] px-3 py-1 text-[12px] font-bold text-white">
          Chép mã
        </button>
      </div>
      <p className="mb-3 text-center text-[13px] text-[#5B5A7A]">
        {S.oppName
          ? `Đã gửi lời mời tới ${S.oppName}. Bạn ấy nhận lời là trận đấu bắt đầu.`
          : "Bạn của bạn bấm Thách đấu ở gian này rồi nhập mã trên. Đang chờ…"}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => tdBot(S.id, S.lv)} className={CTA_GHOST + " flex-1"}>
          Đấu với bot
        </button>
        <button type="button" onClick={() => tdPanel(S.id, S.lv)} className={CTA_GHOST + " flex-1"}>
          Huỷ
        </button>
      </div>
    </div>
  );
}

/* ================= tdJoin (guest) ================= */

/** td.js `tdJoin` body — joined a host's room. */
export function TdJoined({ host }: { host: string }) {
  const S = getTd();
  return (
    <div>
      <div className="py-4 text-center text-[16px] font-bold text-[#050349]">Đã vào phòng của {host}</div>
      <p className="mb-3 text-center text-[13px] text-[#5B5A7A]">Chờ một chút, trận đấu sắp bắt đầu…</p>
      <button type="button" onClick={() => S && tdPanel(S.id, S.lv)} className={CTA_GHOST + " w-full"}>
        Rời phòng
      </button>
    </div>
  );
}

/* ================= tdCountdown ================= */

/** td.js `tdCountdown` — "3…2…1" then `tdStart`. */
export function TdCountdown({ S }: { S: TdState }) {
  const [n, setN] = useState(() => Math.max(1, Math.ceil(((S.t0 || Date.now()) - Date.now()) / 1000)));
  useEffect(() => {
    const t = setInterval(() => {
      const left = Math.ceil(((S.t0 || 0) - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(t);
        tdStart(S);
      } else setN(left);
    }, 200);
    return () => clearInterval(t);
  }, [S]);
  return (
    <div>
      <div className="py-6 text-center font-['Noto_Serif_SC',serif] text-6xl font-bold text-[#050349]">{n}</div>
      <p className="text-center text-[13px] text-[#5B5A7A]">Chuẩn bị…</p>
    </div>
  );
}

/* ================= tdStart body: vs bar + game/wait/result ================= */

/** td.js `tdStart` body — `td-vs` bar + game pane (swaps to wait/result). */
export function TdPlay() {
  const sub = useTd((s) => s.playSub);
  const S = getTd();
  if (!S) return null;
  return (
    <div>
      <VsBar />
      {sub === "game" ? (
        <GameOnly id={S.id} lv={S.lv} again={() => tdPanel(S.id, S.lv)} board={() => callHook("openBoard")} />
      ) : sub === "wait" ? (
        <WaitMe S={S} />
      ) : (
        <TdResultView S={S} />
      )}
    </div>
  );
}

/** td.js `tdPaintVs` — live progress rows for both sides. */
function VsBar() {
  useTd((s) => s.seq); // repaint on every bump (tdProg/opp updates)
  const S = getTd();
  if (!S) return null;
  const tot = S.tot || 6;
  const ot = tdOppStat(tdOpp());
  const row = (nm: string, k: number, ok: number, dn: number | undefined, me_: boolean) => (
    <div key={me_ ? "me" : "opp"} className={`flex items-center gap-2 rounded-xl px-2 py-1 ${me_ ? "bg-[#F6F4EF]" : ""}`}>
      <span className="w-20 shrink-0 truncate text-[12px] font-bold text-[#3D3E5C]">{nm}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E4E5F0]">
        <i className={`block h-full rounded-full transition-all ${me_ ? "bg-[#EA0000]" : "bg-[#050349]"}`} style={{ width: `${Math.min(100, Math.round((k / tot) * 100))}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right text-[12px] font-semibold text-[#5B5A7A]">{dn ? `${ok}/${tot} ✓` : `${ok} đúng`}</span>
    </div>
  );
  return (
    <div className="mb-3 space-y-1">
      {row("Bạn", S.k || 0, S.ok || 0, S.dn, true)}
      {S.role === "async" ? (
        S.target ? (
          <div className="px-2 text-[12px] font-semibold text-[#8A8FA8]">
            Cần vượt: {S.target.ok}/{S.target.tot} đúng trong {tdSec(S.target.ms)} giây
          </div>
        ) : null
      ) : ot ? (
        row(S.oppName || "Bạn đấu", ot.k || 0, ot.ok || 0, ot.dn, false)
      ) : (
        <div className="px-2 text-[12px] font-semibold text-[#8A8FA8]">Bạn đấu đã rời phòng</div>
      )}
    </div>
  );
}

/** td.js `.td-waitme` — finished, waiting for the opponent. */
function WaitMe({ S }: { S: TdState }) {
  return (
    <div>
      <div className="py-4 text-center text-[16px] font-bold text-[#050349]">
        Bạn xong rồi: {S.ok}/{S.tot} đúng, {tdSec(S.ms)} giây
      </div>
      <p className="text-center text-[13px] text-[#5B5A7A]">Chờ {S.oppName || "bạn đấu"} về đích…</p>
    </div>
  );
}

/** td.js `tdResult` — head, score table, challenge code, replay buttons. */
function TdResultView({ S }: { S: TdState }) {
  const res = useTd((s) => s.res);
  if (!res) return null;
  const copy = () => {
    try {
      void navigator.clipboard.writeText(res.codeText || res.code || "").then(() => toast("Đã chép lời thách đấu"));
    } catch {
      /* noop */
    }
  };
  return (
    <div>
      <div className={`mb-3 flex flex-col items-center gap-1 rounded-2xl p-4 text-center ${res.win ? "bg-[#FFF6E3]" : "bg-[#F6F4EF]"}`}>
        <NhIcon name={res.win ? "trophy" : "swords"} cls={res.win ? "red" : "navy"} />
        <b className="text-[16px] text-[#050349]">{res.head}</b>
        <div className="mt-2 w-full max-w-xs space-y-1">
          {res.rows.map((r) => (
            <div key={r.n} className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-[13px] ${r.me ? "bg-white font-bold" : ""}`}>
              <span className="text-[#3D3E5C]">{r.n}</span>
              <b className="text-[#050349]">
                {r.ok}/{r.tot}
              </b>
              <span className="text-[#5B5A7A]">{tdSec(r.ms)} giây</span>
            </div>
          ))}
        </div>
      </div>
      {res.code ? (
        <div className="mb-3 flex flex-col items-center gap-1 rounded-2xl bg-[#F6F4EF] p-4">
          <small className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8FA8]">{res.codeLabel}</small>
          <b className="font-mono text-[15px] tracking-wider text-[#050349]">{res.code}</b>
          <button type="button" onClick={copy} className="mt-1 rounded-full bg-[#050349] px-3 py-1 text-[12px] font-bold text-white">
            Chép lời thách
          </button>
        </div>
      ) : null}
      <div className="flex gap-2">
        <button type="button" onClick={() => tdPanel(S.id, S.lv)} className={CTA_NAVY + " flex-1"}>
          Thách đấu tiếp
        </button>
        <button
          type="button"
          onClick={() => {
            tdLeave();
            callHook("openGame", S.id);
          }}
          className={CTA_GHOST + " flex-1"}
        >
          Chơi một mình
        </button>
      </div>
    </div>
  );
}

/* ================= td-inv invite card ================= */

/**
 * td.js `tdInvite` card — floating bottom-right card, auto-dismisses after 30s
 * (timeout lives in tdInvite); "Nhận lời" joins the host's room.
 */
export function TdLayer() {
  const inv = useTd((s) => s.invite);
  const setInvite = useTd((s) => s.setInvite);
  if (!inv) return null;
  const close = () => setInvite(null);
  const accept = () => {
    setInvite(null);
    if (callHook("soonLocked", inv.g)) {
      callHook("openSoon", inv.g);
      return;
    }
    tdJoin(inv.r);
  };
  return (
    <div role="status" className="fixed bottom-24 right-4 z-[60] w-72 rounded-2xl border border-[#E4E5F0] bg-white p-4 shadow-2xl">
      <button
        type="button"
        onClick={close}
        aria-label="Đóng"
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-lg text-[#8A8FA8] hover:bg-[#EFF1F8]"
      >
        ×
      </button>
      <div className="flex items-start gap-3">
        <NhIcon name="swords" cls="red" />
        <p className="pr-5 text-[13px] font-semibold text-[#3D3E5C]">
          {inv.n} mời bạn thách đấu {inv.gameName}!
        </p>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={accept} className="flex-1 rounded-xl bg-[#EA0000] px-3 py-2 text-[13px] font-bold text-white">
          Nhận lời
        </button>
        <button type="button" onClick={close} className={CTA_GHOST + " flex-1"}>
          Để sau
        </button>
      </div>
    </div>
  );
}
