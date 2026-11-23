/**
 * Library dialog (ui.js `renderBooks`/`renderCards`/`openReader`/`unlockBox`).
 * Free in-app books (vocab, grammar), PDF downloads, paid books + unlock form.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { Word, GrammarTopic } from "@/types/lesson";
import { LEVELS, PER_DAY, GRAMMAR, unlocked, getCurLevel } from "@/lib/curriculum";
import { LVN } from "@/game/world/geometry";
import { CAMPUS } from "@/config/campus";
import { campusActive, activate, getEnt, onEntChange } from "@/services/entitlement";
import { usePlayer } from "@/stores/player";
import { useUi } from "@/stores/ui";
import { asset } from "@/lib/utils";
import { ls } from "@/lib/storage";
import { dstr, plain, vnd } from "@/lib/helpers";
import { speak } from "@/services/tts";
import { WordRow, Spk, Tabs, SectH, PayButtons } from "../ui-bits";
import { PDF_LIB, PDF_URLS } from "@/data/games-data";

interface LibDoc {
  lv: number;
  id?: string;
  url?: string;
  free?: boolean;
  pdf?: string;
  inapp?: string;
  title: string;
  zh?: string;
  color?: string;
  kind?: string;
}

export function cardPool(): Word[] {
  let pool: Word[] = [];
  [1, 2, 3].forEach((lv) => {
    if (ls.get("nh:start" + lv)) pool = pool.concat(LEVELS[lv].slice(0, unlocked(lv)));
  });
  return pool.length ? pool : LEVELS[1].slice(0, PER_DAY);
}

export function Library({ startLv }: { startLv?: number }) {
  const [tab, setTab] = useState<"books" | "cards">("books");
  const [lv, setLv] = useState(startLv || getCurLevel());
  const [ent, setEnt] = useState(getEnt());
  useEffect(() => onEntChange(() => setEnt(getEnt())), []);
  const paid = campusActive();
  void ent;

  return (
    <div>
      <Tabs
        tabs={[
          ["books", "Giáo trình"],
          ["cards", "Thẻ từ"],
        ]}
        active={tab}
        onPick={(k) => setTab(k as "books" | "cards")}
      />
      {tab === "books" ? <BookGrid lv={lv} onLv={setLv} paid={paid} /> : <CardPane />}
    </div>
  );
}

/* ---------- books ---------- */
function BookGrid({ lv, onLv, paid }: { lv: number; onLv: (l: number) => void; paid: boolean }) {
  const [reader, setReader] = useState<LibDoc | null>(null);
  const [unlockMsg, setUnlockMsg] = useState("");
  const unlockRef = useRef<HTMLInputElement>(null);
  const paidLinks = paid ? CAMPUS.demoPaid || {} : {};

  const builtin: LibDoc[] = [
    { lv, free: true, inapp: "vocab", title: `Bộ từ vựng ${LVN(lv)}`, zh: "词汇", color: "#0F766E" },
    { lv, free: true, inapp: "grammar", title: `Ngữ pháp ${LVN(lv)}`, zh: "语法", color: "#6D28D9" },
  ];
  const pdfs: LibDoc[] = PDF_LIB.map(([key, kind, title, zh, color, isFree]) => ({
    lv, free: isFree, pdf: `hsk${lv}-${key}`, kind, title: `${title} ${LVN(lv)}`, zh, color,
  }));
  const extra = (CAMPUS.library || [])
    .filter((b) => b.lv === lv && (b.free ? !!b.url : !!(paidLinks[b.id!] || (CAMPUS.demoPaid || {})[b.id!])))
    .map((b): LibDoc => (b.free || b.url || !paid ? b : { ...b, url: paidLinks[b.id!] || (CAMPUS.demoPaid || {})[b.id!] }));
  const free = [...builtin, ...pdfs.filter((b) => b.free)];
  const paidB = pdfs.filter((b) => !b.free);

  if (reader) return <Reader b={reader} onBack={() => setReader(null)} />;

  const needUnlock = () => {
    setUnlockMsg("");
    unlockRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    unlockRef.current?.focus();
  };

  const grid = (list: LibDoc[]) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {list.map((b) => (
        <BookCard key={b.id || b.pdf || b.inapp || b.title} b={b} paid={paid} onReader={setReader} onLocked={needUnlock} />
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-3 flex gap-1.5">
        {[1, 2, 3].map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onLv(l)}
            className={`rounded-full border-2 px-3 py-1 text-[12px] font-bold ${l === lv ? "border-[#050349] bg-[#050349] text-white" : "border-[#E4E5F0] bg-white text-[#3D3E5C]"}`}
          >
            {LVN(l)}
          </button>
        ))}
      </div>
      <SectH title="Tài liệu miễn phí" tag="Ai cũng đọc được" ok />
      {grid(free)}
      {paidB.length ? (
        <>
          <SectH title="Dành cho học viên trả phí" tag={paid ? "Đã mở khoá" : "🔒 Cần mở khoá"} ok={paid} />
          {grid(paidB)}
        </>
      ) : null}
      {!paid && (
        <div className="mt-4 rounded-2xl bg-[#050349] p-4 text-white">
          <b>Mở khoá tài liệu trả phí</b>
          <p className="mt-1 text-[13px] text-white/80">
            Mở bằng Thẻ học viên vĩnh viễn ({vnd(CAMPUS.prices.campus)}, dùng vĩnh viễn) hoặc khi gói tự học website còn hạn. Nhập mã NowHanzi gửi qua Fanpage.
          </p>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const code = (unlockRef.current?.value || "").trim().toUpperCase();
              if (!code) return;
              try {
                const r = activate(code);
                if (!campusActive()) throw new Error("Mã này chưa mở được thư viện.");
                ls.set("nh:code", code);
                useUi.getState().toast("Đã mở khoá tài liệu trả phí");
                setUnlockMsg("");
                void r;
              } catch (err) {
                setUnlockMsg((err as Error).message);
              }
            }}
          >
            <input ref={unlockRef} id="unlockCode" maxLength={40} placeholder="Mã học viên" autoComplete="off" className="flex-1 rounded-xl border-2 border-white/30 bg-white/10 px-3 py-2 text-[13px] font-mono uppercase text-white outline-none placeholder:text-white/50" />
            <button type="submit" className="rounded-xl bg-white px-3.5 py-2 text-[13px] font-bold text-[#050349]">
              Mở khoá
            </button>
          </form>
          {unlockMsg ? <p className="mt-1.5 text-[12px] font-medium text-[#FFB4B4]">{unlockMsg}</p> : null}
          <PayButtons onDark />
        </div>
      )}
      {extra.length ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-[13px] font-semibold text-[#5B5A7A]">Tài liệu bổ sung {LVN(lv)} trên Google Drive ({extra.length})</summary>
          {grid(extra as LibDoc[])}
          <p className="mt-1 text-[12px] text-[#5B5A7A]">Sách mở trong Google Drive của trung tâm. Nếu Drive báo cần quyền truy cập, hãy nhắn trung tâm để được thêm vào.</p>
        </details>
      ) : null}
      <p className="mt-3 text-[12px] text-[#8A8FA8]">
        Mỗi cấp có đủ 4 file PDF: Luyện viết (miễn phí), Giáo trình, Sách bài tập và Đáp án. Bấm vào sách để tải về máy và in ra.
      </p>
    </div>
  );
}

function BookCard({ b, paid, onReader, onLocked }: { b: LibDoc; paid: boolean; onReader: (b: LibDoc) => void; onLocked: () => void }) {
  const award = usePlayer((s) => s.award);
  const locked = !b.free && !paid;
  const cover = (
    <div className="relative flex h-[120px] flex-col items-center justify-center gap-1 rounded-t-xl text-white" style={{ background: b.color || "#EA0000" }}>
      <small className="text-[11px] font-bold opacity-80">{LVN(b.lv)}</small>
      <span className="font-['Noto_Serif_SC',serif] text-3xl font-semibold">{b.zh}</span>
      {b.inapp ? <img src={asset("assets/logo.png")} alt="" className="h-7 w-7 opacity-80" /> : null}
      <span className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${b.free ? "bg-white/90 text-[#2E7D4F]" : "bg-black/30 text-white"}`}>
        {b.free ? "Miễn phí" : "Trả phí"}
      </span>
      {locked ? <div className="absolute inset-0 grid place-items-center rounded-t-xl bg-black/35 text-2xl">🔒</div> : null}
    </div>
  );
  const meta = (
    <div className="flex flex-col p-2 text-left">
      <b className="text-[12.5px] leading-tight text-[#14213D]">{b.title}</b>
      <span className="mt-0.5 text-[11px] text-[#8A8FA8]">{locked ? "Mở khoá để đọc" : b.pdf ? "⬇ Tải PDF" : b.url ? b.kind || "Mở" : b.inapp ? "Đọc ngay" : "Sắp có"}</span>
    </div>
  );

  const savePdf = async () => {
    const url = PDF_URLS[b.pdf!];
    if (!url) {
      useUi.getState().toast("Tài liệu này đang được cập nhật, quay lại sau nhé.");
      return;
    }
    try {
      useUi.getState().toast("Đang chuẩn bị file…");
      const res = await fetch(url);
      if (!res.ok) throw new Error("http " + res.status);
      const blob = await res.blob();
      const head = await blob.slice(0, 5).text();
      if (!head.startsWith("%PDF")) throw new Error("not a pdf");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = b.pdf!.replace(/^hsk/, "NowHanzi-HSK") + ".pdf";
      a.click();
      award(`read:${dstr()}`, 2, "tải tài liệu thư viện");
    } catch {
      useUi.getState().toast("Chưa tải được file. Thử lại sau nhé.");
    }
  };

  if (locked)
    return (
      <button type="button" onClick={onLocked} className="overflow-hidden rounded-xl border border-[#E4E5F0] bg-white text-left shadow-sm" aria-label={b.title + ", cần mở khoá"}>
        {cover}
        {meta}
      </button>
    );
  if (b.pdf)
    return (
      <button type="button" onClick={savePdf} className="overflow-hidden rounded-xl border border-[#E4E5F0] bg-white text-left shadow-sm" aria-label={b.title + ", tải PDF"}>
        {cover}
        {meta}
      </button>
    );
  if (b.inapp)
    return (
      <button type="button" onClick={() => onReader(b)} className="overflow-hidden rounded-xl border border-[#E4E5F0] bg-white text-left shadow-sm">
        {cover}
        {meta}
      </button>
    );
  if (b.url)
    return (
      <a href={b.url} target="_blank" rel="noopener" onClick={() => award(`read:${dstr()}`, 2, "đọc sách trong thư viện")} className="overflow-hidden rounded-xl border border-[#E4E5F0] bg-white text-left shadow-sm">
        {cover}
        {meta}
      </a>
    );
  return (
    <div className="overflow-hidden rounded-xl border border-dashed border-[#E4E5F0] bg-white opacity-70">
      {cover}
      {meta}
    </div>
  );
}

/* ---------- reader ---------- */
function Reader({ b, onBack }: { b: LibDoc; onBack: () => void }) {
  const award = usePlayer((s) => s.award);
  const [q, setQ] = useState("");
  useEffect(() => {
    award(`read:${dstr()}`, 2, "đọc sách trong thư viện");
  }, [award]);

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-2 rounded-full border border-[#E4E5F0] px-3 py-1 text-[12px] font-semibold text-[#3D3E5C]">
        ‹ Về kệ sách
      </button>
      {b.inapp === "vocab" ? (
        <>
          <SectH title={b.title} tag={`${(LEVELS[b.lv] || []).length} từ`} ok />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm chữ Hán, pinyin hoặc nghĩa"
            aria-label="Tìm từ"
            className="mb-3 w-full rounded-xl border-2 border-[#E4E5F0] px-3 py-2 text-[14px] outline-none focus:border-[#EA0000]"
          />
          <VocabList lv={b.lv} q={q} />
        </>
      ) : (
        <GrammarList b={b} />
      )}
    </div>
  );
}

function VocabList({ lv, q }: { lv: number; q: string }) {
  const all = LEVELS[lv] || [];
  const k = plain(q.trim());
  const groups: Word[][] = [];
  for (let g = 0; g < all.length; g += PER_DAY) {
    const grp = all.slice(g, g + PER_DAY).filter((w) => !k || plain(w.join(" ")).includes(k));
    if (grp.length) groups.push(grp);
  }
  if (!groups.length) return <p className="text-[13px] text-[#5B5A7A]">Không tìm thấy từ nào.</p>;
  return (
    <div>
      {groups.map((grp, i) => (
        <div key={i}>
          <h3 className="mt-3 text-[13px] font-bold text-[#050349]">Nhóm {groups.indexOf(grp) + 1}</h3>
          <ul>
            {grp.map((w) => (
              <WordRow key={w[0]} w={w} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function GrammarList({ b }: { b: LibDoc }) {
  const gs: GrammarTopic[] = GRAMMAR[b.lv] || [];
  return (
    <div>
      <SectH title={b.title} tag={`${gs.length} điểm ngữ pháp`} ok />
      {gs.map((g, i) => (
        <details key={i} open={i === 0} className="mb-2 rounded-xl border border-[#E4E5F0] bg-white p-3">
          <summary className="cursor-pointer text-[14px] font-bold text-[#050349]">
            {i + 1}. {g.t}
          </summary>
          <p className="mt-1.5 text-[13px] text-[#3D3E5C]">{g.vi}</p>
          {g.ex.map(([zh, py, vi], j) => (
            <div key={j} className="mt-2 flex items-center gap-3 rounded-lg bg-[#F6F4EF] p-2.5">
              <div className="flex-1">
                <div className="font-['Noto_Serif_SC',serif] text-[16px] font-semibold text-[#14213D]" lang="zh-CN">
                  {zh}
                </div>
                <div className="text-[12px] text-[#A61E22]">{py}</div>
                {vi ? <div className="text-[12px] text-[#5B5A7A]">{vi}</div> : null}
              </div>
              <Spk zh={zh} small />
            </div>
          ))}
        </details>
      ))}
    </div>
  );
}

/* ---------- thẻ từ (flashcards) ---------- */
function CardPane() {
  const CARDS = useMemo(cardPool, []);
  const [i, setI] = useState(() => Math.floor(Math.random() * CARDS.length));
  const [flip, setFlip] = useState(false);
  const [zh, py, vi] = CARDS[i];

  return (
    <div>
      <p className="mb-3 text-[13px] text-[#5B5A7A]">Ôn {CARDS.length} từ bạn đã mở. Bấm vào thẻ để lật.</p>
      <div
        role="button"
        tabIndex={0}
        aria-label="Lật thẻ"
        onClick={() => setFlip((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setFlip((f) => !f);
          }
        }}
        className="relative mx-auto h-[220px] w-[300px] cursor-pointer [perspective:800px]"
      >
        <div className={`absolute inset-0 transition-transform duration-300 [transform-style:preserve-3d] ${flip ? "[transform:rotateY(180deg)]" : ""}`}>
          <div className="absolute inset-0 grid place-items-center rounded-2xl border-2 border-[#E2B14A] bg-white [backface-visibility:hidden]">
            <span className="font-['Noto_Serif_SC',serif] text-5xl font-semibold text-[#14213D]" lang="zh-CN">
              {zh}
            </span>
          </div>
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[#050349] text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="text-center">
              <div className="text-xl font-bold text-[#E2B14A]">{py}</div>
              <div className="mt-1 px-4 text-[14px]">{vi}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => speak(zh)} className="flex-1 rounded-xl border-2 border-[#E4E5F0] py-2 text-[14px] font-semibold">
          🔊 Nghe
        </button>
        <button
          type="button"
          onClick={() => {
            setFlip(false);
            setI((x) => (x + 1 + Math.floor(Math.random() * Math.max(1, CARDS.length - 1))) % CARDS.length);
          }}
          className="flex-1 rounded-xl border-2 border-[#E4E5F0] py-2 text-[14px] font-semibold"
        >
          Thẻ khác
        </button>
      </div>
    </div>
  );
}
