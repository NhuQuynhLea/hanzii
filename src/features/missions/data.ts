/**
 * Mission data — ported verbatim from game/js/gt/missions.js
 * (MS_GLOSS, MISSIONS cafe, MS_FOR, MS_NPC, MS_ROLE, MS_SCN, MS_GIFT, MS_RE)
 * plus GM_SHOP from gm.js (needed for mission-completion gift names).
 */
import type { Word } from "@/types/lesson";

/** Word gloss: zh → [pinyin, nghĩa] (MS_GLOSS). */
export const MS_GLOSS: Record<string, [string, string]> = {
  您: ["nín", "anh/chị (lịch sự)"], 咖啡: ["kāfēi", "cà phê"], 喝: ["hē", "uống"], 我们: ["wǒmen", "chúng tôi"], 的: ["de", "của (trợ từ)"], 很: ["hěn", "rất"], 好喝: ["hǎohē", "ngon (đồ uống)"],
  啊: ["á", "hả, à"], 别: ["bié", "đừng"], 走: ["zǒu", "đi"], 呀: ["ya", "(trợ từ cảm thán)"], 对: ["duì", "đúng"], 吧: ["ba", "nhỉ, nhé"], 卖: ["mài", "bán"], 找: ["zhǎo", "trả lại (tiền thừa)"], 欢迎: ["huānyíng", "chào mừng"],
  再: ["zài", "lại"], 来: ["lái", "đến"], 学生: ["xuéshēng", "học sinh"], 再见: ["zàijiàn", "tạm biệt"], 谢谢: ["xièxie", "cảm ơn"], 不: ["bù", "không"], 是: ["shì", "là"], 我: ["wǒ", "tôi"], 哦: ["ò", "ồ"],
  给: ["gěi", "đưa, cho"], 懂: ["dǒng", "hiểu"], 嗯: ["ńg", "ừm"], 不懂: ["bù dǒng", "không hiểu"], 正好: ["zhènghǎo", "vừa đúng"], 茶: ["chá", "trà"], 水: ["shuǐ", "nước"], 您好: ["nín hǎo", "chào anh/chị"], 什么: ["shénme", "gì, cái gì"], 一: ["yī", "một"], 二: ["èr", "hai (khi đếm)"],
  三: ["sān", "ba"], 四: ["sì", "bốn"], 五: ["wǔ", "năm"], 六: ["liù", "sáu"], 七: ["qī", "bảy"], 八: ["bā", "tám"], 九: ["jiǔ", "chín"], 好: ["hǎo", "tốt, được"], 要: ["yào", "muốn, cần, lấy"],
};

/* ---------- mission step / shape types ---------- */

export interface MsNpc {
  name: string;
  zh: string;
  h: number;
  lv: number;
  key?: string;
}

export interface MsLine {
  zh: string;
  py: string;
  vi?: string;
}

export interface MsChooseOpt extends MsLine {
  ok?: number;
  re?: MsLine;
  hint?: string;
}

export type MsStep =
  | ({ k: "npc" } & MsLine)
  | ({ k: "auto" } & MsLine)
  | { k: "beat"; t: string }
  | { k: "story"; t: string }
  | { k: "lw"; w: Word; pool: Word[] }
  | { k: "choose"; task: string; meaning?: string; showMeaning?: boolean; opts: MsChooseOpt[] }
  | { k: "build"; task: string; ans: string[]; extra: string[]; end: string; py: string; vi: string; hint: string }
  | ({ k: "listen"; task: string; opts: string[]; ans: string; hint: string } & MsLine)
  | { k: "pay"; price: number; wallet: number[]; task: string }
  | ({ k: "say"; task: string } & MsLine);

export interface MsMission {
  n: number;
  b: number;
  title: string;
  place: string;
  npc: MsNpc;
  npcKey: string;
  scene: { bg: string; icon: string; place: string };
  menu?: [string, string, string][];
  steps: MsStep[];
  tips: [string, string][];
  reward: { fr: string; sticker: string };
}

/* ---------- static mission: quầy cà phê ---------- */

export const MISSIONS: Record<string, MsMission> = {
  cafe: {
    n: 4, b: 1, title: "Gọi cà phê ở quầy", place: "Quầy cà phê – khuôn viên NowHanzi", npc: { name: "Tiểu Mỹ", zh: "小美", h: 3, lv: 2 },
    menu: [["咖啡", "kāfēi", "☕"], ["茶", "chá", "🍵"], ["水", "shuǐ", "💧"]],
    steps: [
      { k: "npc", zh: "您好！欢迎！您要喝什么？", py: "Nín hǎo! Huānyíng! Nín yào hē shénme?", vi: "Chào chị! Chào mừng! Chị muốn uống gì ạ?" },
      {
        k: "choose", task: "Gọi một ly cà phê", opts: [
          { zh: "我要一杯咖啡。", py: "Wǒ yào yì bēi kāfēi.", vi: "Cho tôi một ly cà phê.", ok: 1 },
          { zh: "我是学生。", py: "Wǒ shì xuéshēng.", vi: "Tôi là học sinh.", re: { zh: "啊？……您要喝什么？", py: "Á? … Nín yào hē shénme?", vi: "Hả? … Chị muốn uống gì ạ?" }, hint: "Câu vừa rồi là “Tôi là học sinh”. Muốn gọi đồ thì mở đầu bằng 我要…" },
          { zh: "谢谢，再见！", py: "Xièxie, zàijiàn!", vi: "Cảm ơn, tạm biệt!", re: { zh: "别走呀！我们的咖啡很好喝！", py: "Bié zǒu ya! Wǒmen de kāfēi hěn hǎohē!", vi: "Đừng đi mà! Cà phê bên em ngon lắm!" }, hint: "Chưa gọi gì mà đã chào về rồi! Thử 我要 + một ly + cà phê." },
        ],
      },
      { k: "npc", zh: "好的，一杯咖啡。", py: "Hǎo de, yì bēi kāfēi.", vi: "Vâng, một ly cà phê." },
      { k: "build", task: "Hỏi giá: “Một ly cà phê bao nhiêu tiền?”", ans: ["一", "杯", "咖啡", "多少", "钱"], extra: ["本", "什么", "两"], end: "？", py: "Yì bēi kāfēi duōshao qián?", vi: "Một ly cà phê bao nhiêu tiền?", hint: "Thứ tự giống tiếng Việt: số + lượng từ + đồ vật, rồi 多少钱 ở cuối." },
      { k: "listen", zh: "二十八块。", py: "Èrshíbā kuài.", vi: "Hai mươi tám tệ.", task: "Tiểu Mỹ nói giá bao nhiêu?", opts: ["28", "18", "82"], ans: "28", hint: "二十八 = hai-mươi-tám: 二 (2) + 十 (10) + 八 (8). Bấm 🔊 nghe lại nhé." },
      { k: "story", t: "Minh chạy tới quầy, cũng muốn uống cà phê. Gọi thêm cho Minh: tổng cộng hai ly." },
      {
        k: "choose", task: "Gọi hai ly", opts: [
          { zh: "我要两杯。", py: "Wǒ yào liǎng bēi.", vi: "Cho tôi hai ly.", ok: 1 },
          { zh: "我要二杯。", py: "Wǒ yào èr bēi.", vi: "(sai) Cho tôi “nhị” ly.", re: { zh: "哦——两杯，对吧？", py: "Ò — liǎng bēi, duì ba?", vi: "Ồ — hai ly, đúng không ạ?" }, hint: "Trước lượng từ (杯, 本, 个…), “hai” là 两 chứ không phải 二." },
          { zh: "我要两本。", py: "Wǒ yào liǎng běn.", vi: "Cho tôi hai quyển.", re: { zh: "两本？我们不卖书呀！", py: "Liǎng běn? Wǒmen bú mài shū ya!", vi: "Hai quyển? Bên em đâu có bán sách!" }, hint: "本 là lượng từ cho sách. Đồ uống trong ly dùng 杯." },
        ],
      },
      { k: "npc", zh: "两杯五十六块。", py: "Liǎng bēi wǔshíliù kuài.", vi: "Hai ly năm mươi sáu tệ." },
      { k: "pay", price: 56, wallet: [50, 20, 10, 5, 1, 1], task: "Lấy tiền trong ví ra trả" },
      { k: "npc", zh: "这是您的咖啡。", py: "Zhè shì nín de kāfēi.", vi: "Cà phê của chị đây ạ." },
      { k: "say", task: "Cảm ơn và chào tạm biệt", zh: "谢谢！再见！", py: "Xièxie! Zàijiàn!", vi: "Cảm ơn! Tạm biệt!" },
      { k: "npc", zh: "欢迎再来！", py: "Huānyíng zài lái!", vi: "Lần sau lại ghé nhé!" },
    ],
    tips: [
      ["一 đổi thanh", "一 đứng trước 杯 (thanh 1) đọc là yì: 一杯 yì bēi. Trước thanh 4 thì đọc yí: 一块 yí kuài."],
      ["两 hay 二?", "Có lượng từ phía sau thì dùng 两: 两杯, 两本, 两个. Đếm số hoặc số lớn mới dùng 二: 十二, 二十八."],
      ["Hỏi giá", "Đồ vật + 多少钱？ Ví dụ: 这本书多少钱？ (Quyển sách này bao nhiêu tiền?)"],
    ],
    reward: { fr: "Tiểu Mỹ", sticker: "☕ Khách quen quầy cà phê" },
    scene: { bg: "cafe", icon: "☕", place: "Quầy cà phê – khuôn viên NowHanzi" },
    npcKey: "mei",
  },
};

/** Bài → nhiệm vụ viết tay (MS_FOR). */
export const MS_FOR: Record<string, string> = { "4:1": "cafe" };

export const MS_NPC: Record<string, MsNpc> = {
  王: { name: "Thầy Vương", zh: "王老师", h: 1, lv: 9, key: "wang" },
  明: { name: "Minh", zh: "阿明", h: 2, lv: 3, key: "ming" },
  雪: { name: "Tiểu Tuyết", zh: "小雪", h: 3, lv: 4, key: "xue" },
  兰: { name: "Lan", zh: "兰兰", h: 3, lv: 2, key: "lan" },
};

export const MS_ROLE: Record<string, string> = { 兰: "Lan", 明: "Minh", 雪: "Tiểu Tuyết", 王: "Thầy Vương" };

/** "n:b" → [title, place, icon, bg, npc?] (MS_SCN). */
export const MS_SCN: Record<string, [string, string, string, string, MsNpc?]> = {
  "1:1": ["Chào thầy ở cổng trường", "Cổng trường – 7 giờ sáng", "🏫", "gate"],
  "1:2": ["Gặp lại bạn cũ", "Sân trường", "🌳", "yard"],
  "1:3": ["Đến lớp muộn", "Cửa lớp học", "🚪", "class"],
  "2:1": ["Hỏi thăm bạn lúc tan học", "Sân trường – tan học", "🌇", "yard"],
  "2:2": ["Thầy hỏi thăm gia đình", "Hành lang khu lớp học", "🏫", "class"],
  "3:1": ["Làm quen bạn mới", "Lớp học – buổi đầu", "🎒", "class"],
  "3:2": ["Gọi món ở căng tin", "Căng tin", "🍜", "food"],
  "4:2": ["Mua sách", "Hiệu sách", "📚", "lib", { name: "Cô bán sách", zh: "售货员", h: 3, lv: 5, key: "shop" }],
  "4:3": ["Đổi tiền ở ngân hàng", "Ngân hàng", "🏦", "bank", { name: "Anh nhân viên", zh: "职员", h: 1, lv: 8, key: "bank" }],
  "5:1": ["Hỏi đường đến thư viện", "Sân trường – tìm thư viện", "🗺", "yard"],
  "5:2": ["Tìm điện thoại", "Ký túc xá", "🛏", "dorm"],
  "5:3": ["Gọi điện hẹn bạn", "Gọi điện thoại", "📱", "phone"],
};

/** Quà khi xong đủ nhiệm vụ của bài (MS_GIFT). */
export const MS_GIFT: Record<number, string> = { 1: "tag:1", 2: "glass:1", 3: "pet:1", 4: "hat:1", 5: "hat:2" };

/** NPC “không hiểu” replies khi chọn sai (MS_RE). */
export const MS_RE: MsLine[] = [
  { zh: "啊？", py: "Á?", vi: "Hả?" },
  { zh: "嗯？什么？", py: "Ńg? Shénme?", vi: "Ừm? Gì cơ?" },
  { zh: "对不起，我不懂。", py: "Duìbuqǐ, wǒ bù dǒng.", vi: "Xin lỗi, mình không hiểu." },
];

/** Cửa hàng phụ kiện (gm.js `GM_SHOP`) — dùng để tra tên quà nhiệm vụ. */
export const GM_SHOP: Record<string, { name: string; items: [number, string, number, number, (string | number)?][] }> = {
  hat: { name: "Mũ", items: [[1, "Mũ lưỡi trai", 40, 1], [2, "Nón lá", 60, 1], [3, "Mũ tốt nghiệp", 120, 5], [4, "Vương miện", 250, 10]] },
  glass: { name: "Kính", items: [[1, "Kính tròn", 30, 1], [2, "Kính râm", 50, 1]] },
  pet: { name: "Thú cưng", items: [[1, "Mèo con", 80, 1, "🐱"], [2, "Cún con", 80, 1, "🐶"], [3, "Gấu trúc", 150, 6, "🐼"], [4, "Rồng nhỏ", 300, 12, "🐉"]] },
  tag: { name: "Khung tên", items: [[1, "Khung vàng", 60, 1, "#C9952F"], [2, "Khung ngọc", 60, 1, "#0F766E"], [3, "Khung tím", 100, 8, "#6D28D9"]] },
};
