/**
 * Buy/activation dialog (nh.js `paintBuy`) — campus pass: Fanpage discount,
 * VietQR bank transfer, activation code, owner code generator.
 */
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { CAMPUS } from "@/config/campus";
import {
  vietQR, payNote, activate, getEnt, isOwner, onEntChange, makeCode,
} from "@/services/entitlement";
import { useUi } from "@/stores/ui";
import { usePlayer } from "@/stores/player";
import { dmy } from "@/lib/helpers";
import { ls } from "@/lib/storage";
import { toast } from "@/stores/ui";

const vnd = (n: number) => Number(n).toLocaleString("vi-VN") + "đ";
const FB_OFF = 20000;
const FB_CODE = "CAMPUS20";

export function BuyDialog() {
  const open = useUi((s) => s.buyOpen);
  const setBuy = useUi((s) => s.setBuyOpen);
  const nick = usePlayer((s) => (s.meSeq, s.me.n));
  const [ent, setEnt] = useState(getEnt());
  const [disc, setDisc] = useState(ls.get("nh:fbdisc") === "1");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok?: boolean; t: string } | null>(null);
  const [qr, setQr] = useState("");
  const [genDays, setGenDays] = useState("30");
  const [genOut, setGenOut] = useState("");

  useEffect(() => onEntChange(() => setEnt(getEnt())), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuy(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setBuy]);

  const full = CAMPUS.prices.campus;
  const amt = disc ? full - FB_OFF : full;
  const note = payNote(nick, disc ? FB_CODE : undefined);
  const B = CAMPUS.bank;

  useEffect(() => {
    if (!B?.account || !B.bin) return;
    QRCode.toDataURL(vietQR({ bin: B.bin, account: B.account, amount: amt, note }), { margin: 1, width: 220 })
      .then(setQr)
      .catch(() => setQr(""));
  }, [amt, note, B]);

  const owner = useMemo(isOwner, [ent]);
  if (!open) return null;

  const copy = async (v: string, what: string) => {
    try {
      await navigator.clipboard.writeText(v);
      toast("Đã chép " + what);
    } catch {
      toast("Không chép được — hãy bôi đen và chép tay");
    }
  };

  const submitCode = () => {
    try {
      const r = activate(code);
      setCode("");
      setMsg({ ok: true, t: r.kind === "campus" ? "Đã mở Thẻ học viên vĩnh viễn. Cảm ơn bạn!" : "Đã gia hạn website tới " + dmy(r.until!) });
    } catch (e) {
      setMsg({ ok: false, t: (e as Error).message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3" onPointerDown={(e) => e.target === e.currentTarget && setBuy(false)}>
      <div role="dialog" aria-labelledby="buyTitle" className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[#E4E5F0] bg-[#050349] px-4 py-3 text-white">
          <div className="font-['Noto_Serif_SC',serif] text-2xl font-semibold text-[#E2B14A]">钥</div>
          <div className="flex-1">
            <h2 id="buyTitle" className="text-[16px] font-bold">Thẻ học viên</h2>
            <p className="text-[12px] text-white/70">Trả một lần, mở toàn bộ khuôn viên mãi mãi</p>
          </div>
          <button type="button" onClick={() => setBuy(false)} aria-label="Đóng" className="grid h-8 w-8 place-items-center rounded-full text-xl text-white/80 hover:bg-white/15">
            ×
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <ul className="text-[13px]">
            <li className={owner || ent.campus ? "font-semibold text-[#2E7D4F]" : "text-[#5C5E80]"}>
              {owner ? "✓ Thẻ học viên: mở sẵn vì bạn là chủ trang" : ent.campus ? "✓ Thẻ học viên: đã có, dùng vĩnh viễn" : "Thẻ học viên: chưa có"}
            </li>
          </ul>
          <div className="text-[15px]">
            <b className="text-[#A61E22]">
              {disc && <s className="mr-1.5 font-normal text-[#8A8FA8]">{vnd(full)}</s>}
              {vnd(amt)}, trả một lần
            </b>
            <span className="ml-2 text-[13px] text-[#5C5E80]">mọi lớp, bài học, thư viện, khu vui chơi</span>
          </div>

          <ol className="list-decimal space-y-4 pl-5 text-[14px]">
            <li className={disc ? "rounded-xl bg-[#F0F7F1] p-2.5" : ""}>
              <b>Nhắn Fanpage, giảm {vnd(FB_OFF)}</b>
              <p className="text-[13px] text-[#5C5E80]">
                Gửi tin nhắn kèm mã {FB_CODE} cho Fanpage NowHanzi, thẻ còn {vnd(full - FB_OFF)}. Trung tâm gửi mã kích hoạt cho bạn qua Messenger.
              </p>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-[#EA0000] px-3 py-1.5 text-[13px] font-bold text-white"
                  onClick={() => {
                    setDisc(true);
                    ls.set("nh:fbdisc", "1");
                    window.open(CAMPUS.zalo || "https://www.facebook.com/tiengtrungNowHanzi/", "_blank", "noopener");
                  }}
                >
                  {disc ? "Nhắn lại Fanpage" : `Nhắn Fanpage, lấy giá ${vnd(full - FB_OFF)}`}
                </button>
                {disc && (
                  <button
                    type="button"
                    className="rounded-xl border border-[#E4E5F0] px-3 py-1.5 text-[13px] font-semibold"
                    onClick={() => {
                      setDisc(false);
                      ls.remove("nh:fbdisc");
                    }}
                  >
                    Bỏ giảm giá
                  </button>
                )}
              </div>
              {disc && <p className="mt-1 text-[12px] font-medium text-[#2E7D4F]">Đã áp dụng mã {FB_CODE}: chuyển {vnd(full - FB_OFF)}. Nhớ gửi tin nhắn trên Messenger để trung tâm đối chiếu nhé.</p>}
            </li>
            <li>
              <b>Quét mã để chuyển khoản</b>
              <p className="text-[13px] text-[#5C5E80]">Mở app ngân hàng, quét mã. Số tiền và nội dung đã điền sẵn.</p>
              <div className="mt-2 flex gap-4">
                {qr ? (
                  <img src={qr} alt={"Mã VietQR chuyển khoản " + vnd(amt)} className="h-[150px] w-[150px] rounded-lg border border-[#E4E5F0]" />
                ) : (
                  <div className="grid h-[150px] w-[150px] place-items-center rounded-lg border border-[#E4E5F0] text-[12px] text-[#5C5E80]">Không tạo được QR</div>
                )}
                <dl className="flex-1 space-y-1.5 text-[13px]">
                  {[
                    ["Ngân hàng", B?.name || "", ""],
                    ["Số tài khoản", B?.account || "", B?.account || ""],
                    ["Chủ tài khoản", B?.holder || "", ""],
                    ["Số tiền", vnd(amt), ""],
                    ["Nội dung", note, note],
                  ].map(([k, v, cp]) => (
                    <div key={k} className="flex items-baseline gap-1.5">
                      <dt className="w-[110px] shrink-0 text-[#8A8FA8]">{k}</dt>
                      <dd className="flex items-center gap-1 font-medium">
                        <span className="break-all">{v}</span>
                        {cp ? (
                          <button type="button" onClick={() => copy(cp, k.toLowerCase())} className="rounded bg-[#EFF1F8] px-1.5 py-0.5 text-[11px] font-semibold text-[#050349]">
                            Chép
                          </button>
                        ) : null}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </li>
            <li>
              <b>Nhập mã kích hoạt</b>
              <p className="text-[13px] text-[#5C5E80]">Chuyển khoản xong, NowHanzi gửi mã qua Messenger/Zalo.</p>
              <div className="mt-1.5 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitCode()}
                  placeholder="NHK-XXXXXX-XXXX"
                  className="flex-1 rounded-xl border-2 border-[#E4E5F0] px-3 py-2 font-mono text-[14px] uppercase outline-none focus:border-[#EA0000]"
                />
                <button type="button" onClick={submitCode} className="rounded-xl bg-[#050349] px-4 py-2 text-[14px] font-bold text-white">
                  Kích hoạt
                </button>
              </div>
              {msg && <p className={`mt-1.5 text-[13px] font-medium ${msg.ok ? "text-[#2E7D4F]" : "text-[#C8102E]"}`}>{msg.t}</p>}
            </li>
          </ol>

          {owner && (
            <div className="rounded-xl border border-dashed border-[#E2B14A] bg-[#FFFBEF] p-3">
              <b className="text-[13px] text-[#050349]">Chủ trang: tạo mã</b>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px]">
                <button type="button" className="rounded-lg bg-[#EA0000] px-2.5 py-1 font-bold text-white" onClick={() => setGenOut(makeCode("campus"))}>
                  Mã thẻ vĩnh viễn
                </button>
                <input value={genDays} onChange={(e) => setGenDays(e.target.value.replace(/\D/g, ""))} className="w-14 rounded-lg border border-[#E4E5F0] px-2 py-1 text-center" />
                <span>ngày</span>
                <button type="button" className="rounded-lg bg-[#050349] px-2.5 py-1 font-bold text-white" onClick={() => setGenOut(makeCode("web", +genDays || 30))}>
                  Mã website
                </button>
              </div>
              {genOut && (
                <p className="mt-2 font-mono text-[14px] font-bold text-[#A61E22]">
                  {genOut}{" "}
                  <button type="button" className="ml-1 rounded bg-[#EFF1F8] px-1.5 py-0.5 font-sans text-[11px] font-semibold text-[#050349]" onClick={() => copy(genOut, "mã")}>
                    Chép
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
