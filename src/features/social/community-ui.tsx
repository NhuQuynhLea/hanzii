/**
 * community.js React UI — bảng hạng tuần (weekBoard), trang nhóm (gpRender),
 * bảng tin Nhà sinh hoạt (cdBoard), hộp thoại bàn nhóm (cdOpenTable),
 * thẻ chào bạn mới (paintGreet).
 */
import { useEffect, useState } from "react";
import { me } from "@/game/engine/state";
import { usePlayer } from "@/stores/player";
import { useUi, toast } from "@/stores/ui";
import { dstr, wkId } from "@/lib/helpers";
import { speak } from "@/services/tts";
import { emote } from "@/services/emotes";
import { sendPresence } from "@/services/presence/runtime";
import { callHook, onHook } from "@/services/hooks";
import { GT_ONLY } from "@/game/world/geometry";
import {
  COMM, GP_MAX, GP_CHEERS, GP, gpSet, gpReset, gpSave, gpNewCode, gpPeek, gpOwnerDoc,
  gpStats, gpOnline, gpWhere, gpCheer, cdJoin, cdGroups,
  league, wkPoints, commDocs, hasComm, cuidNow, greetQ, greetDone, useSocial,
  type GreetItem, type GpRow, type HvDoc,
} from "./community";
import { cdSit } from "./cdq";

/* ================= hạng tuần ================= */
export function WeekBoard() {
  useSocial((s) => s.seq);
  const points = usePlayer((s) => s.points);
  const myL = league(points);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {COMM.leagues.map((L) => (
          <span
            key={L[1]}
            className={`rounded-full border px-2.5 py-1 text-[12px] font-semibold ${
              L === myL ? "border-[#E2B14A] bg-[#FFFBEF] text-[#050349]" : "border-[#E4E5F0] text-[#8A8FA8]"
            }`}
          >{`${L[2]} ${L[1]} – từ ${L[0]} điểm`}</span>
        ))}
      </div>
      {!hasComm() ? (
        <p className="py-4 text-[13px] text-[#5B5A7A]">{`Bảng hạng tuần cần kết nối mạng. Bạn đang ở hạng ${myL[1]} với ${wkPoints()} điểm tuần này.`}</p>
      ) : (
        <WeekRows myL={myL} />
      )}
    </div>
  );
}

function WeekRows({ myL }: { myL: [number, string, string] }) {
  const rows = commDocs()
    .filter((d) => league(Number(d.total_points) || 0) === myL)
    .sort((a, b) => (b.week_points || 0) - (a.week_points || 0))
    .slice(0, 20);
  return (
    <div>
      <p className="mb-2 text-[12.5px] text-[#5B5A7A]">{`Hạng ${myL[1]}: bạn thi đấu với những người cùng trình độ. Mỗi thứ Hai bảng làm mới từ đầu.`}</p>
      <ul className="space-y-1">
        {rows.map((r, i) => (
          <li key={r.id || i} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] ${r.id === cuidNow() ? "bg-[#FFFBEF] font-bold" : ""}`}>
            <span className="w-6 text-center">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color || "#EA0000" }} />
            <b className="flex-1 truncate">{String(r.nickname || "Học viên").slice(0, 20) + (r.id === cuidNow() ? " (bạn)" : "")}</b>
            <span className="text-[#5B5A7A]">{`${r.week_points || 0} điểm tuần`}</span>
          </li>
        ))}
        {!rows.length ? <li className="py-3 text-center text-[13px] text-[#8A8FA8]">Chưa có ai trong hạng này tuần này. Học ngay để đứng đầu!</li> : null}
      </ul>
    </div>
  );
}

/* ================= trang nhóm học ================= */
export function GroupPanel() {
  useSocial((s) => s.seq);
  if (!hasComm())
    return <p className="py-4 text-[13px] text-[#5B5A7A]">Nhóm học cần kết nối mạng và đăng nhập. Hãy mở khuôn viên qua đường link chia sẻ khi có mạng.</p>;
  return GP.code ? <GpMine /> : <GpJoin />;
}

function GpJoin() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const award = usePlayer((s) => s.award);
  const create = () => {
    const n = name.trim().slice(0, 24);
    if (!n) return;
    gpSet({ code: gpNewCode(), name: n, owner: true, kick: [], joined: Date.now(), pub: true });
    gpSave();
    award(`gp:tao:${GP.code}`, 5, "lập nhóm học");
    toast("Đã tạo nhóm. Gửi mã cho bạn bè nhé!");
  };
  const join = async () => {
    const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(c)) {
      setMsg("Mã gồm 6 chữ hoặc số.");
      return;
    }
    setBusy(true);
    setMsg("Đang tìm nhóm…");
    const docs = await gpPeek(c);
    setBusy(false);
    if (!docs) {
      setMsg("Không kết nối được. Thử lại sau nhé.");
      return;
    }
    const own = gpOwnerDoc(docs),
      kick = own && Array.isArray(own.kicked_members) ? own.kicked_members : [],
      mem = docs.filter((m) => !kick.includes(m.id) && m.id !== cuidNow());
    if (!docs.length) {
      setMsg("Không tìm thấy nhóm với mã này.");
      return;
    }
    if (kick.includes(cuidNow())) {
      setMsg("Bạn đã được mời ra khỏi nhóm này nên không vào lại được.");
      return;
    }
    if (mem.length >= GP_MAX) {
      setMsg(`Nhóm đã đủ ${GP_MAX} người.`);
      return;
    }
    gpSet({ code: c, name: (own && own.group_name) || "Nhóm học", owner: false, kick: [], joined: Date.now() });
    gpSave();
    award(`gp:vao:${c}`, 3, "vào nhóm học");
    toast("Đã vào nhóm " + GP.name);
  };
  return (
    <div>
      <p className="mb-3 text-[13px] text-[#5B5A7A]">{`Lập nhóm tối đa ${GP_MAX} người để học cùng nhau: thấy bạn đang ở đâu, cùng đạt mục tiêu tuần và cổ vũ nhau.`}</p>
      <div className="mb-3 rounded-2xl border border-[#E4E5F0] p-3.5">
        <b className="mb-2 block text-[14px] text-[#14213D]">Tạo nhóm mới</b>
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-[#E4E5F0] px-3 py-2 text-[14px] outline-none focus:border-[#EA0000]"
            maxLength={24}
            placeholder={GT_ONLY ? "Tên nhóm, ví dụ: Nhóm Nhập môn 1 tối" : "Tên nhóm, ví dụ: Nhóm HSK 1 tối"}
            aria-label="Tên nhóm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="button" className="shrink-0 rounded-xl bg-[#EA0000] px-4 py-2 text-[13.5px] font-bold text-white" onClick={create}>
            Tạo nhóm
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-[#E4E5F0] p-3.5">
        <b className="mb-2 block text-[14px] text-[#14213D]">Vào nhóm bằng mã mời</b>
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-[#E4E5F0] px-3 py-2 text-[14px] uppercase outline-none focus:border-[#EA0000]"
            maxLength={6}
            placeholder="Mã 6 ký tự"
            aria-label="Mã nhóm"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button type="button" disabled={busy} className="shrink-0 rounded-xl bg-[#050349] px-4 py-2 text-[13.5px] font-bold text-white disabled:opacity-50" onClick={join}>
            Vào nhóm
          </button>
        </div>
        {msg ? <p className="mt-2 text-[12px] text-[#C8102E]">{msg}</p> : null}
      </div>
    </div>
  );
}

function GpMine() {
  useSocial((s) => s.seq);
  return <GpMineBody st={gpStats()} />;
}

function GpMineBody({ st }: { st: ReturnType<typeof gpStats> }) {
  const today = dstr(),
    wk = wkId();
  const copyInvite = () => {
    const s = `Vào nhóm học "${GP.name}" của mình trong khuôn viên NowHanzi: Bảng thành tích → Nhóm học → nhập mã ${GP.code}`;
    try {
      navigator.clipboard.writeText(s).then(
        () => toast("Đã sao chép lời mời"),
        () => toast("Mã nhóm: " + GP.code),
      );
    } catch {
      toast("Mã nhóm: " + GP.code);
    }
  };
  return (
    <div>
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div>
          <b className="block text-[15px] text-[#14213D]">{GP.name || "Nhóm học"}</b>
          <span className="text-[12px] text-[#5B5A7A]">{`${st.members.length || 1}/${GP_MAX} thành viên${GP.owner ? " – bạn là trưởng nhóm" : ""}`}</span>
        </div>
        <button type="button" title="Bấm để sao chép mã" className="rounded-lg border border-[#E2B14A] bg-[#FFFBEF] px-2.5 py-1 text-[12.5px] font-bold tracking-widest text-[#050349]" onClick={copyInvite}>
          {`Mã: ${GP.code}`}
        </button>
      </div>
      <div className="mb-3 rounded-2xl bg-[#F6F6FA] p-3">
        <div className="mb-1.5 flex justify-between text-[12.5px] text-[#3D3E5C]">
          <span>{`Mục tiêu tuần: ${Math.min(st.week_points, st.goal)}/${st.goal} điểm`}</span>
          <span>{`Hôm nay ${st.active_today}/${st.members.length || 1} bạn đã học`}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#E4E5F0]">
          <i className="block h-full rounded-full bg-[#EA0000]" style={{ width: `${Math.min(100, (st.week_points / st.goal) * 100)}%` }} />
        </div>
      </div>
      <ul className="mb-3 space-y-1">
        {(st.members.length ? st.members : [{ id: cuidNow(), nickname: me.n, is_group_owner: GP.owner ? 1 : 0 } as unknown as HvDoc]).map((m) => {
          const isMe = m.id === cuidNow(),
            on = isMe ? me : gpOnline(m.id);
          return (
            <li key={m.id || "me"} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5">
              <i className={`h-2.5 w-2.5 shrink-0 rounded-full ${on ? "bg-[#2E9E5B]" : "bg-[#D4D6E4]"}`} />
              <div className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13.5px] font-semibold text-[#14213D]">
                  {(m.nickname || "Học viên") + (isMe ? " (bạn)" : "") + (m.is_group_owner ? " – trưởng nhóm" : "")}
                </span>
                <span className="block text-[11.5px] text-[#8A8FA8]">
                  {[
                    on ? gpWhere(on) : "Không online",
                    m.last_seen && dstr(new Date(m.last_seen)) === today ? "hôm nay đã học" : "hôm nay chưa học",
                    `${m.week === wk ? Number(m.week_points) || 0 : 0} điểm tuần`,
                  ].join(" – ")}
                </span>
              </div>
              {GP.owner && !isMe ? (
                <button
                  type="button"
                  className="shrink-0 text-[12px] font-semibold text-[#5B5A7A] underline"
                  onClick={() => {
                    if (!confirm(`Mời ${m.nickname || "bạn này"} ra khỏi nhóm?`)) return;
                    GP.kick = [...new Set([...(GP.kick || []), m.id])].slice(-30);
                    gpSave();
                  }}
                >
                  Mời ra
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[12.5px] text-[#5B5A7A]">Cổ vũ cả nhóm:</span>
        {GP_CHEERS.map(([k, txt]) => (
          <button key={k} type="button" className="rounded-full border border-[#E4E5F0] px-2.5 py-1 text-[12.5px] font-semibold text-[#14213D] hover:border-[#EA0000]" onClick={() => gpCheer(k)}>
            {txt}
          </button>
        ))}
      </div>
      {GP.owner ? (
        <label className="mb-3 flex items-center gap-2 text-[12.5px] text-[#3D3E5C]">
          <input
            type="checkbox"
            checked={GP.pub !== false}
            onChange={(e) => {
              GP.pub = e.target.checked;
              gpSave();
              toast(e.target.checked ? "Nhóm đã hiện trong Nhà sinh hoạt" : "Nhóm đã chuyển sang riêng tư");
            }}
          />
          Hiện nhóm trong Nhà sinh hoạt (ai cũng vào được khi còn chỗ)
        </label>
      ) : null}
      <button
        type="button"
        className="text-[13px] font-semibold text-[#C8102E] underline"
        onClick={() => {
          if (!confirm("Rời khỏi nhóm " + GP.name + "?")) return;
          gpReset();
          gpSave();
        }}
      >
        Rời nhóm
      </button>
      <p className="mt-3 text-[11.5px] text-[#8A8FA8]">Nhóm gắn với tài khoản của bạn. Ai có mã đều vào được, trưởng nhóm có thể mời người khác ra.</p>
    </div>
  );
}

/* ================= nhà sinh hoạt ================= */
export function cdBoard(): void {
  useUi.getState().openRoom({
    mark: "社",
    title: "Bảng tin – Nhóm học",
    sub: `Lập nhóm tối đa ${GP_MAX} người, gửi mã cho bạn bè, rồi cùng ngồi một bàn để chơi`,
    body: <GroupPanel />,
    variant: "default",
  });
}

export function cdOpenTable(i: number): void {
  const g = cdGroups()[i];
  if (!g) {
    callHook("openBoard", "nhom");
    return;
  }
  useUi.getState().openRoom({
    mark: "社",
    title: g.name,
    sub: g.mine ? "Nhóm của bạn" : "Nhóm học công khai – Nhà sinh hoạt",
    body: <CdTableView g={g} i={i} />,
    variant: "default",
  });
}

function CdTableView({ g, i }: { g: GpRow; i: number }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const closeRoom = useUi((s) => s.closeRoom);
  return (
    <div>
      <div className="mb-3 flex justify-between rounded-2xl bg-[#F6F6FA] px-3.5 py-2.5 text-[12.5px] text-[#3D3E5C]">
        <span>{`${g.member_count} bạn học tuần này – ${g.online_count} đang online`}</span>
        <span>{`${g.week_points} điểm tuần`}</span>
      </div>
      {g.mine ? (
        <button
          type="button"
          className="mb-2 w-full rounded-xl bg-[#EA0000] px-4 py-2.5 text-[14px] font-bold text-white"
          onClick={() => {
            closeRoom();
            callHook("openBoard", "nhom");
          }}
        >
          Mở trang nhóm
        </button>
      ) : GP.code ? (
        <p className="mb-2 text-[13px] text-[#5B5A7A]">{`Bạn đang ở nhóm "${GP.name}". Mỗi người chỉ ở một nhóm; hãy rời nhóm hiện tại trước nếu muốn đổi.`}</p>
      ) : (
        <>
          <button
            type="button"
            disabled={busy}
            className="mb-2 w-full rounded-xl bg-[#EA0000] px-4 py-2.5 text-[14px] font-bold text-white disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              setMsg("Đang vào nhóm…");
              const err = await cdJoin(g);
              setBusy(false);
              if (err) setMsg(err);
              else closeRoom();
            }}
          >
            Vào nhóm này
          </button>
          {msg ? <p className="mb-2 text-[12px] text-[#C8102E]">{msg}</p> : null}
        </>
      )}
      <button type="button" className="w-full rounded-xl border border-[#E4E5F0] px-4 py-2.5 text-[14px] font-bold text-[#050349] hover:border-[#EA0000]" onClick={() => cdSit(i)}>
        Ngồi vào bàn này
      </button>
    </div>
  );
}

/* ================= thẻ chào bạn mới ================= */
export function paintGreet(): void {
  const g = greetQ[0];
  if (!g) {
    useUi.getState().hideGreet();
    return;
  }
  useUi.getState().setGreet(<GreetCard g={g} />);
}

function GreetCard({ g }: { g: GreetItem }) {
  const award = usePlayer((s) => s.award);
  useEffect(() => {
    const t = setTimeout(() => {
      if (greetQ[0] === g) {
        greetQ.shift();
        paintGreet();
      }
    }, 25000);
    return () => clearTimeout(t);
  }, [g]);
  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-[#E4E5F0] bg-white p-2.5 pl-3.5 shadow-xl">
      <span className="text-[13px] font-semibold text-[#14213D]">{`🎉 ${g.name} vừa nhập học!`}</span>
      <button
        type="button"
        className="rounded-xl bg-[#EA0000] px-3 py-1.5 text-[12.5px] font-bold text-white"
        onClick={() => {
          greetDone(g);
          greetQ.shift();
          emote(me, "wave");
          speak("你好");
          sendPresence({ a: { k: "wave", t: Date.now() }, gr: { tok: g.token, t: Date.now() } });
          award(`chao:${g.token}`, 2, "chào bạn mới");
          paintGreet();
        }}
      >
        👋 Chào bạn mới
      </button>
      <button
        type="button"
        className="text-[12.5px] font-semibold text-[#8A8FA8]"
        onClick={() => {
          greetQ.shift();
          paintGreet();
        }}
      >
        Để sau
      </button>
    </div>
  );
}

/** Mount point: renders ui.greet card bottom-center + wires commGreet listener. */
export function GreetHost() {
  const greet = useUi((s) => s.greet);
  const visible = useUi((s) => s.greetVisible);
  useEffect(() => onHook("commGreet", () => paintGreet()), []);
  if (!visible) return null;
  return <div className="pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2">{greet}</div>;
}
