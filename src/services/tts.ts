/** Chinese text-to-speech (tts.js `speak`/`findVoice`). */

let zhVoice: SpeechSynthesisVoice | null = null;

export function findVoice(): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null;
  const vs = speechSynthesis.getVoices();
  zhVoice = vs.find((v) => /zh[-_]CN/i.test(v.lang)) || vs.find((v) => /^zh/i.test(v.lang)) || null;
  return zhVoice;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  findVoice();
  speechSynthesis.onvoiceschanged = findVoice;
  setTimeout(findVoice, 500);
  setTimeout(findVoice, 1500);
}

export function speak(t: string, rate = 0.8, onend?: () => void): void {
  if (!("speechSynthesis" in window)) {
    if (onend) onend();
    return;
  }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "zh-CN";
    u.rate = rate;
    if (zhVoice || findVoice()) u.voice = zhVoice;
    if (onend) u.onend = onend;
    speechSynthesis.speak(u);
  } catch {
    if (onend) onend();
  }
}
