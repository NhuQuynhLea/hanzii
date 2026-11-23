/**
 * Mirror mode (scene-pron.js TRAINER_TPL "mirror" mode): camera mirror +
 * sample mouth animation per initial group, read-along word chips.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { LEVELS } from "@/lib/curriculum";
import { GROUPS, INI_TIP, LIPTIP, TITLE, sylls } from "./sylls";
import { MouthView, type MouthHandle } from "./Mouth";

const btnBase =
  "min-h-[46px] rounded-full px-[18px] font-bold transition disabled:cursor-not-allowed disabled:opacity-45";
const btnRed = `${btnBase} bg-[#EA0000] text-white enabled:hover:bg-[#C90000]`;

export function MirrorTrainer() {
  const vocab = useMemo(
    () => [...(LEVELS[1] || []), ...(LEVELS[2] || []), ...(LEVELS[3] || [])],
    [],
  );
  const [gi, setGi] = useState(5); // GROUPS[5] = "zh ch sh r" (loadGroup default)
  const [camOn, setCamOn] = useState(false);
  const [camFail, setCamFail] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mouthM = useRef<MouthHandle>(null);

  const [name, pose, inis] = GROUPS[gi];
  const ex = useMemo(
    () =>
      vocab
        .filter((v) => {
          const s = sylls(v[1])[0];
          return s && inis.includes(s.ini);
        })
        .slice(0, 8),
    [vocab, inis],
  );
  const tips = useMemo(
    () => [LIPTIP[pose], ...inis.filter((i) => INI_TIP[i]).slice(0, 4).map((i) => INI_TIP[i])],
    [pose, inis],
  );

  /* loadGroup: phát động tác miệng mẫu cho nhóm âm (kể cả lúc mở) */
  useEffect(() => {
    mouthM.current?.play(pose, ex.length ? ex[0][0] : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ex derived from gi
  }, [gi]);

  const onCam = async () => {
    if (camOn) return;
    try {
      const st = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = st;
      if (videoRef.current) videoRef.current.srcObject = st;
      setCamOn(true);
    } catch {
      setCamFail(true);
    }
  };

  useEffect(
    () => () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      try {
        speechSynthesis.cancel();
      } catch {
        /* tts unavailable */
      }
    },
    [],
  );

  return (
    <div className="px-0.5 pb-4 pt-1.5">
      <div className="grid grid-cols-1 gap-3.5 min-[700px]:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-2 rounded-[22px] bg-[#0B0A3B] p-3 text-white">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="aspect-[4/3] w-full -scale-x-100 rounded-[14px] bg-black object-cover"
          />
          {!camOn ? (
            <p className="m-0 text-[15px] text-[#C9C8F2]">
              {camFail
                ? "Không mở được camera. Bạn có thể dùng gương thật hoặc camera trước của điện thoại, vừa xem hình mẫu bên cạnh vừa đọc theo."
                : "Bấm “Bật gương” để soi khẩu hình của bạn bằng camera. Hình chỉ hiện trên máy bạn, không ghi lại và không gửi đi đâu."}
            </p>
          ) : null}
          {!camOn ? (
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <button type="button" className={btnRed} onClick={() => void onCam()}>
                📷 Bật gương
              </button>
            </div>
          ) : null}
        </div>
        <figure className="m-0 rounded-2xl border border-[#E4E5F0] bg-white p-3">
          <h3 className="mb-1 text-[18px] font-bold text-[#050349]">
            <em className="not-italic text-[#EA0000]">{name}</em>: {TITLE[pose]}
          </h3>
          <MouthView ref={mouthM} ariaLabel="Hình động khẩu hình mẫu" />
          <ul className="m-0 mt-3.5 grid list-none gap-2 p-0">
            {tips.map((t, i) => (
              <li
                key={i}
                className="border-l-4 border-[#EA0000] py-1 pl-3"
                dangerouslySetInnerHTML={{ __html: t }}
              />
            ))}
          </ul>
        </figure>
      </div>
      <h3 className="mb-2 mt-4 text-base font-bold text-[#050349]">Chọn nhóm âm để soi</h3>
      <nav className="mb-3.5 flex flex-wrap gap-2" aria-label="Chọn nhóm âm">
        {GROUPS.map((g, i) => (
          <button
            key={g[0]}
            type="button"
            aria-pressed={i === gi}
            onClick={() => setGi(i)}
            className={`flex min-h-[52px] flex-col items-center rounded-2xl border-2 px-3 py-1.5 leading-[1.15] ${
              i === gi
                ? "border-[#EA0000] bg-[#FDE7E7]"
                : "border-[#E4E5F0] bg-white text-[#050349]"
            }`}
          >
            <b className="font-['Noto_Serif_SC',serif] text-[24px] font-bold leading-[1.1]">{g[0]}</b>
          </button>
        ))}
      </nav>
      <h3 className="mb-2 mt-3 text-base font-bold text-[#050349]">
        Đọc theo, vừa nói vừa nhìn miệng mình
      </h3>
      <div className="flex flex-wrap gap-2">
        {ex.length ? (
          ex.map((v) => (
            <button
              key={v[0]}
              type="button"
              onClick={() => mouthM.current?.play(pose, v[0])}
              className="flex min-h-[52px] flex-col items-center rounded-2xl border-2 border-[#E4E5F0] bg-white px-3 py-1.5 leading-[1.15] text-[#050349]"
            >
              <b lang="zh" className="font-['Noto_Serif_SC',serif] text-[24px] font-bold leading-[1.1]">
                {v[0]}
              </b>
              <span className="text-[13px] font-semibold">{v[1]}</span>
            </button>
          ))
        ) : (
          <p className="text-[#5B5A7A]">Chưa có từ ví dụ ở cấp này.</p>
        )}
      </div>
    </div>
  );
}
