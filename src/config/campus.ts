/** Campus config — ported from game/js/config.js (was `window.CAMPUS`). */

const DRIVE = (id: string) => "https://drive.google.com/open?id=" + id;

export interface LibraryDoc {
  lv: number;
  free: boolean;
  kind: string;
  title: string;
  zh: string;
  color: string;
  url?: string;
  id?: string;
}

export interface CampusConfig {
  name: string;
  tagline: string;
  /** link liên hệ: Fanpage Facebook của trung tâm */
  zalo: string;
  /** link trang đóng học phí (để trống thì nút mở Zalo) */
  payUrl: string;
  siteUrl: string;
  /** link website 48 bài */
  webUrl: string;
  price11: string;
  priceNote: string;
  drive: { hsk1: string; hsk2: string; hsk3: string; all?: string };
  library: LibraryDoc[];
  demoCode?: string;
  /** mọi khu, lớp, bài, thư viện, khu vui chơi đều mở */
  unlockAll?: boolean;
  bank?: { bin: string; account: string; holder: string; name: string };
  prices: { web: number; campus: number; zalo: number; cls: number; one: number };
  demoWebCode?: string;
  codeSalt: string;
  demoPaid: Record<string, string>;
}

export const CAMPUS: CampusConfig = {
  name: "NowHanzi",
  tagline: "Học giao tiếp tiếng Trung 10 phút mỗi ngày, miễn phí",
  zalo: "https://www.facebook.com/tiengtrungNowHanzi/",
  payUrl: "",
  siteUrl: "",
  webUrl: "/",
  price11: "Liên hệ",
  priceNote: "Học thử 1 buổi với giáo viên trước khi đăng ký.",
  drive: { hsk1: "", hsk2: "", hsk3: "" },
  library: [
    { lv: 1, free: true, kind: "Luyện viết", title: "Luyện viết chữ HSK 1", zh: "写字", color: "#A61E22", url: DRIVE("1jDQ8ttGWSLd8RHyt6PqI1_X_OQOUhk6c") },
    { lv: 1, free: true, kind: "Luyện nghe", title: "Tài liệu nghe 听力材料", zh: "听力", color: "#1C1A6B", url: DRIVE("1H2eNPhk6221T2b4LCMvE94-mqqWwo7Wd") },
    { lv: 1, free: false, kind: "Giáo trình", title: "Giáo trình chuẩn HSK 1 (3.0)", zh: "教程", color: "#EA0000", id: "hsk1-giao-trinh" },
    { lv: 1, free: false, kind: "Giáo trình", title: "新HSK教程 1", zh: "新教程", color: "#050349", id: "hsk1-xin-jiaocheng" },
    { lv: 1, free: false, kind: "Sách bài tập", title: "Sách bài tập HSK 1 (3.0)", zh: "练习", color: "#3D7A2E", id: "hsk1-sach-bai-tap" },
    { lv: 1, free: false, kind: "Sách bài tập", title: "学练手册 HSK 1", zh: "学练", color: "#B7791F", id: "hsk1-xuelian" },
    { lv: 1, free: false, kind: "Đáp án", title: "Đáp án bài tập 习题答案", zh: "答案", color: "#5B6782", id: "hsk1-dap-an" },
    { lv: 1, free: false, kind: "Slide", title: "Slide bài giảng NowHanzi", zh: "课件", color: "#C2410C", id: "hsk1-slide" },
    { lv: 2, free: true, kind: "Luyện nghe", title: "Tài liệu nghe HSK 2", zh: "听力", color: "#1C1A6B", url: "" },
    { lv: 2, free: false, kind: "Giáo trình", title: "Giáo trình chuẩn HSK 2", zh: "教程", color: "#EA0000", id: "hsk2-giao-trinh" },
    { lv: 3, free: true, kind: "Luyện nghe", title: "Tài liệu nghe HSK 3", zh: "听力", color: "#1C1A6B", url: "" },
    { lv: 3, free: false, kind: "Giáo trình", title: "Giáo trình chuẩn HSK 3", zh: "教程", color: "#EA0000", id: "hsk3-giao-trinh" },
  ],
  demoCode: "DEMO-NOWHANZI",
  unlockAll: true,
  bank: { bin: "970436", account: "0861003568888", holder: "BUI LINH CHI", name: "Vietcombank" },
  prices: { web: 49000, campus: 69000, zalo: 499000, cls: 0, one: 199000 },
  demoWebCode: "DEMO-WEB49",
  codeSalt: "doi-chuoi-nay-truoc-khi-ban",
  demoPaid: {
    "hsk1-giao-trinh": "https://drive.google.com/open?id=1MJfq1B59qUL4ZfWdP5whOKRcl_nzpKjO",
    "hsk1-xin-jiaocheng": "https://drive.google.com/open?id=1mgE6j_pgWm39rh_wkNASNh83z1NapijL",
    "hsk1-sach-bai-tap": "https://drive.google.com/open?id=16UJzpw0_9Yzu3zpbvPMfzoVS58gaI1ac",
    "hsk1-xuelian": "https://drive.google.com/open?id=1aXQmjjeS4gZbNbhZYLuUE_OeWgVZKlV6",
    "hsk1-dap-an": "https://drive.google.com/open?id=1miB5ayPCC6N3kyFDBsYf5I-Ono2Is36V",
    "hsk1-slide": "https://drive.google.com/open?id=15TkXVVVEhfvMLGc9e0nnVmo6Xjq8OGm6",
    "hsk2-giao-trinh": "",
    "hsk3-giao-trinh": "",
  },
};

/** Merged runtime config (core.js `C`): base defaults overridden by CAMPUS. */
export const C = Object.assign(
  { name: "NowHanzi", tagline: "Trung tâm tiếng Trung online", zalo: "", courseUrl: "", price11: "Liên hệ", priceNote: "" },
  CAMPUS,
);
