/** Transient point/info toast — queue driven by ui store. */
import { useEffect, useState } from "react";
import { useUi } from "@/stores/ui";

export function Toast() {
  const text = useUi((s) => s.toastText);
  const seq = useUi((s) => s.toastSeq);
  const hide = useUi((s) => s.hideToast);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!text) {
      setShown(false);
      return;
    }
    setShown(true);
  }, [text, seq]);

  if (!text) return null;
  return (
    <button
      type="button"
      onClick={hide}
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 top-16 z-50 -translate-x-1/2 rounded-full bg-[#050349]/95 px-4 py-2 text-[13px] font-semibold text-[#FFE7A8] shadow-lg transition-all duration-200 ${
        shown ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      {text}
    </button>
  );
}
