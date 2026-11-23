/**
 * gtConfetti (gt-class.js) — full-screen falling confetti burst.
 * Original used a CSS keyframe; reimplemented with the Web Animations API so
 * no new stylesheet is needed.
 */
export function gtConfetti(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden";
    document.body.append(box);
    const C = ["#EA0000", "#F5A623", "#2E9E5B", "#050349", "#1F5FB0"];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement("i");
      p.style.cssText = `position:absolute;top:-12px;left:${Math.random() * 100}vw;width:9px;height:14px;border-radius:2px;background:${C[i % 5]};transform:rotate(${Math.random() * 360}deg)`;
      box.append(p);
      p.animate(
        [
          { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
          {
            transform: `translate(${(Math.random() - 0.5) * 160}px,${window.innerHeight + 60}px) rotate(${360 + Math.random() * 360}deg)`,
            opacity: 1,
          },
        ],
        {
          duration: 2600,
          delay: Math.random() * 600,
          easing: "cubic-bezier(.3,.6,.4,1)",
          fill: "forwards",
        },
      );
    }
    setTimeout(() => box.remove(), 3200);
  } catch {
    /* noop */
  }
}
