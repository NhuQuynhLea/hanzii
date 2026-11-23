/** Minigame content (games.js). */
export const BUILD_CH: [string, string, string, string, string][] = [
  ["好", "hǎo", "tốt", "女", "子"], ["明", "míng", "sáng", "日", "月"], ["林", "lín", "rừng", "木", "木"],
  ["休", "xiū", "nghỉ ngơi", "亻", "木"], ["妈", "mā", "mẹ", "女", "马"], ["吗", "ma", "trợ từ hỏi", "口", "马"],
  ["你", "nǐ", "bạn", "亻", "尔"], ["们", "men", "số nhiều (các, những)", "亻", "门"], ["男", "nán", "nam", "田", "力"],
  ["早", "zǎo", "sớm", "日", "十"], ["字", "zì", "chữ", "宀", "子"], ["安", "ān", "bình an", "宀", "女"],
  ["江", "jiāng", "sông", "氵", "工"], ["想", "xiǎng", "nghĩ, nhớ", "相", "心"],
];

export const PARTS = ["女", "子", "日", "月", "木", "亻", "马", "口", "尔", "门", "田", "力", "十", "宀", "氵", "工", "相", "心", "土", "火"];

export const SENTENCES: Record<number, [string[], string, string[]?][]> = {
  1: [
    [["我", "是", "学生"], "Tôi là học sinh."],
    [["你", "叫", "什么", "名字"], "Bạn tên là gì?"],
    [["我", "明天", "去", "北京"], "Ngày mai tôi đi Bắc Kinh.", ["明天我去北京"]],
    [["他", "不", "是", "老师"], "Anh ấy không phải giáo viên."],
    [["我", "在", "家", "吃饭"], "Tôi ăn cơm ở nhà."],
    [["你", "是", "中国人", "吗"], "Bạn là người Trung Quốc à?"],
    [["我", "妈妈", "很", "好"], "Mẹ tôi rất khỏe."],
  ],
  2: [
    [["我", "买了", "一本", "书"], "Tôi đã mua một quyển sách."],
    [["我", "去过", "中国"], "Tôi từng đến Trung Quốc."],
    [["今天", "比", "昨天", "冷"], "Hôm nay lạnh hơn hôm qua."],
    [["他", "说得", "很好"], "Anh ấy nói rất tốt."],
    [["我", "正在", "看书", "呢"], "Tôi đang đọc sách."],
    [["因为", "下雨", "所以", "我", "没", "去"], "Vì trời mưa nên tôi không đi."],
  ],
  3: [
    [["请", "把", "门", "关上"], "Hãy đóng cửa lại."],
    [["我", "把", "作业", "做完", "了"], "Tôi làm xong bài tập rồi."],
    [["天气", "越来越", "冷", "了"], "Thời tiết càng ngày càng lạnh."],
    [["如果", "明天", "下雨", "我", "就", "不去了"], "Nếu mai trời mưa thì tôi không đi nữa."],
    [["我", "一", "到家", "就", "给你", "打电话"], "Tôi vừa về đến nhà là gọi cho bạn."],
    [["我的", "手机", "被", "弟弟", "拿走了"], "Điện thoại của tôi bị em trai lấy mất rồi."],
  ],
};

export interface GameMeta {
  name: string;
  mark: string;
  sub: string;
  key: "match" | "build" | "order" | "tone";
  lv: boolean;
}

export const GAMES: Record<string, GameMeta> = {
  g1: { name: "Nối từ", mark: "连", sub: "Nối chữ Hán với nghĩa đúng", key: "match", lv: true },
  g2: { name: "Ghép chữ", mark: "拼", sub: "Ghép hai bộ phận thành chữ Hán", key: "build", lv: false },
  g3: { name: "Xếp câu", mark: "排", sub: "Xếp các từ thành câu đúng", key: "order", lv: true },
  g4: { name: "Nghe thanh điệu", mark: "听", sub: "Nghe và chọn đúng thanh điệu", key: "tone", lv: true },
};

/** PDF books in the library (ui.js PDF_LIB + PDF_URLS). */
export const PDF_LIB: [string, string, string, string, string, boolean][] = [
  ["luyen-viet", "Luyện viết", "Luyện viết chữ", "写字", "#A61E22", true],
  ["giao-trinh", "Giáo trình", "Giáo trình NowHanzi", "教程", "#EA0000", false],
  ["sach-bai-tap", "Sách bài tập", "Sách bài tập", "练习", "#3D7A2E", false],
  ["dap-an", "Đáp án", "Đáp án bài tập", "答案", "#5B6782", false],
];

export const PDF_URLS: Record<string, string> = {
  "hsk1-luyen-viet": "/_blob/0158017fa937f9fb287eb297276ecb05",
  "hsk1-giao-trinh": "/_blob/6eb7a5c096dfc3c69982b1e7aff9eaea",
  "hsk1-sach-bai-tap": "/_blob/f6b644d56eca475413b464fda83a6da4",
  "hsk1-dap-an": "/_blob/46cd931fb54250798546736aa0a39f6c",
  "hsk2-luyen-viet": "/_blob/8c5a94f0f3a227def364ffcf86683622",
  "hsk2-giao-trinh": "/_blob/679ce5c7ef5a8e1af04b393946703a2c",
  "hsk2-sach-bai-tap": "/_blob/78e5a8e0c6a63bb7308d805b40f3329c",
  "hsk2-dap-an": "/_blob/7bccfea63f2f8a018f9c0549909348c0",
  "hsk3-luyen-viet": "/_blob/50265077f83ce2995f6aa90b2aa1f8ec",
  "hsk3-giao-trinh": "/_blob/1eb46b5593c4d5144fde2bc10c564426",
  "hsk3-sach-bai-tap": "/_blob/3621f8760e8cb9972ed684d0a1c6bdb1",
  "hsk3-dap-an": "/_blob/ef05a2ccf0ce6728e159badc8c375a89",
};
