/** Thầy Vương scripted content (npc-ai.js). */
import { GT_ONLY } from "@/game/world/geometry";

export const AI_NAME = "Thầy Vương";

export const TIPS_PY = [
  "zh, ch, sh, r: uốn lưỡi lên phía vòm miệng. z, c, s: lưỡi để thẳng sau răng. Ví dụ 四 sì (bốn) khác 十 shí (mười).",
  "Hai thanh 3 đi liền nhau thì thanh 3 đầu đọc thành thanh 2. 你好 nǐ hǎo đọc gần như ní hǎo.",
  "不 bù đứng trước thanh 4 đọc thành bú: 不是 bú shì, 不去 bú qù.",
  "一 yī đọc yí trước thanh 4 (一个 yí ge), đọc yì trước thanh 1, 2, 3 (一本 yì běn). Khi đếm số thì giữ yī.",
  "ü đọc như “i” nhưng tròn môi. Sau j, q, x, y viết là u nhưng vẫn đọc ü: 去 qù, 鱼 yú.",
  "p, t, k bật hơi mạnh: đặt tờ giấy trước miệng sẽ thấy giấy rung. b, d, g thì không bật hơi.",
  "c đọc giống “ts” bật hơi, khác chữ c của tiếng Việt: 菜 cài.",
  "Thanh nhẹ đọc ngắn và nhẹ, không mang dấu: 妈妈 māma, 谢谢 xièxie.",
];

export const TIPS_STUDY = [
  "Học 5 từ mỗi ngày đều đặn tốt hơn học 50 từ một lần rồi bỏ.",
  "Đọc to mỗi từ 3 lần, nhớ đọc đúng thanh điệu, đừng chỉ nhìn bằng mắt.",
  "Ôn lại từ cũ sau 1 ngày, 3 ngày và 7 ngày để nhớ lâu.",
  "Tự đặt một câu ngắn với mỗi từ mới, ví dụ 我喝茶。Wǒ hē chá. Tôi uống trà.",
  "Để ý bộ thủ: 女 trong 妈 và 好 đều có nghĩa liên quan đến phụ nữ.",
  "Mỗi ngày nghe tiếng Trung 5 phút, kể cả khi chưa hiểu hết.",
  "Chơi Nối từ và Xếp câu ở khu vui chơi để ôn mà không thấy chán.",
];

export const SAYINGS: [string, string, string][] = [
  ["学而时习之", "xué ér shí xí zhī", "Học rồi thường xuyên ôn luyện."],
  ["温故而知新", "wēn gù ér zhī xīn", "Ôn cái cũ mà biết thêm cái mới."],
  ["熟能生巧", "shú néng shēng qiǎo", "Quen tay hay việc."],
  ["千里之行，始于足下", "qiān lǐ zhī xíng, shǐ yú zú xià", "Đi ngàn dặm bắt đầu từ một bước chân."],
  ["有志者事竟成", "yǒu zhì zhě shì jìng chéng", "Có chí thì nên."],
  ["好好学习，天天向上", "hǎohǎo xuéxí, tiāntiān xiàngshàng", "Học hành chăm chỉ, ngày càng tiến bộ."],
];

export const GUIDE =
  (GT_ONLY
    ? "Giảng đường mái đỏ có 3 lớp Giao tiếp cấp tốc: Nhập môn 1, Nhập môn 2 và Cơ sở. Ngồi vào bàn là mở bài, từ bài 5 trở đi cần 2 sao để mở bài sau. Thư viện có kệ giáo trình của từng lớp: tên bài, output, từ mới, mẫu câu."
    : "Lớp học có 3 cửa HSK 1, 2, 3 ở toà nhà mái đỏ bên trái, mỗi ngày mở 5 từ mới. Thư viện mái xanh bên phải có bộ từ vựng, ngữ pháp và sách.") +
  " Phòng phát âm ở góc trên bên phải. Văn phòng tuyển sinh ở góc dưới bên trái, ngay trước hồ sen. Nhà sinh hoạt ở bên phải, bảng vàng thành tích nằm ngay sau toà này. Đi sang phải qua cổng là khu vui chơi.";

export const pick1 = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
