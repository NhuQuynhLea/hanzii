import type { Tri, Word } from "./lesson";

/** GT stage (4 textbook stages). */
export interface GtStage {
  name: string;
  from: number;
  to: number;
  off: number;
  sub: string;
}

/** Dialogue line: [speaker char, "a"|"b" (a = player role), zh, py, vi] */
export type GtDialogLine = [string, "a" | "b", string, string, string];

export interface GtDialogScene {
  scene: string;
  lines: GtDialogLine[];
}

export interface GtRule {
  t: string;
  d: string;
  ex: Tri[];
}

/** Quiz item: [question, options (options[0] is the correct answer, shuffled at render), explanation] */
export type GtQuizItem = [string, string[], string];

export interface GtLesson {
  title: string;
  zh: string;
  goals: string[];
  tones: [string, string, string, string][];
  rules: GtRule[];
  words: Word[];
  dialog: GtDialogScene[];
  grammar: GtRule[];
  write: Word[];
  quiz: GtQuizItem[];
  say: [string, string][];
  task?: string;
}
