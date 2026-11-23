/**
 * Static stroke-order SVG (bm.js `bmSvg`): makemeahanzi 1024x1024 paths,
 * flipped to writing coordinates.
 */
import { BM } from "@/data/bm-data";

/** bm.js fill rule: highlighted stroke red, hi<0 all navy, else pale beige. */
function bmFill(hi: number): (i: number) => string {
  return (i) => (i === hi ? "#EA0000" : hi < 0 ? "#050349" : "#E3DACB");
}

export function CharSvg({
  ch,
  hi = -1,
  size = 56,
  fills,
}: {
  ch: string;
  hi?: number;
  size?: number;
  /** custom per-stroke colour resolver (overrides hi rule) */
  fills?: (i: number) => string;
}) {
  const d = BM.chars[ch];
  if (!d || !d.strokes)
    return (
      <span lang="zh-CN" className="font-['Noto_Serif_SC',serif] text-[#050349]" style={{ fontSize: size * 0.6, lineHeight: 1 }}>
        {ch}
      </span>
    );
  const f = fills ?? bmFill(hi);
  return (
    <svg viewBox="0 0 1024 1024" width={size} height={size} aria-hidden="true">
      <g transform="scale(1,-1) translate(0,-900)">
        {d.strokes.map((p, i) => (
          <path key={i} d={p} fill={f(i)} />
        ))}
      </g>
    </svg>
  );
}
