/** Shared learning-content types (ported from game/js data model). */

/** [chữ Hán, pinyin, nghĩa tiếng Việt] */
export type Word = [string, string, string];

/** Example sentence triple: zh, py, vi (vi optional in some data). */
export type Tri = [string, string, string?];

export interface GrammarTopic {
  /** tiêu đề mẫu câu */
  t: string;
  /** giải thích tiếng Việt */
  vi: string;
  /** câu ví dụ [zh, py, vi?] */
  ex: Tri[];
}

/** One of the 48-lesson curriculum entries (data/lessons.js). */
export interface NhLesson {
  lv: number;
  n: number;
  zh: string;
  vi: string;
  w: Word[];
}

/** ------- Bài học mẫu (data/bm.js) ------- */

export interface BmChar {
  c: string;
  /** stroke names */
  st: string[];
  /** components: [char, pinyin, meaning] */
  comps: Tri[];
  expl: string;
  tip?: string;
  mean: string;
}

export interface BmDbEntry {
  zh: string;
  py: string;
  vi: string;
  chars: BmChar[];
  /** [tokens:[text,py][], translation] */
  ex: [Array<[string, string]>, string];
  word?: string;
}

export interface BmData {
  db: Record<string, BmDbEntry>;
  /** makemeahanzi 1024x1024 stroke path data */
  chars: Record<
    string,
    { strokes: string[]; medians?: [number, number][][]; radStrokes?: number[] } & Record<
      string,
      unknown
    >
  >;
  /** stroke name -> [tên nét, hiển thị] */
  si: Record<string, [string, string[]]>;
  /** basic strokes: tên -> [nét chữ, mô tả cách viết] */
  basic: Record<string, [string, string]>;
  /** teacher avatar svg */
  tch: string;
}
