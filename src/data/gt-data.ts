import type { GtStage, GtLesson } from "@/types/gt";


/* ===== LỘ TRÌNH GIAO TIẾP CẤP TỐC – 55 BÀI (nội dung NowHanzi tự biên soạn) ===== */
export const GT_STAGES: GtStage[] =[
  {name:"Nhập môn – quyển trên",from:1,to:15,off:0,sub:"入门篇（上）– Bài 1–15"},
  {name:"Nhập môn – quyển dưới",from:16,to:30,off:0,sub:"入门篇（下）– Bài 16–30"},
  {name:"Cơ sở – quyển trên",from:31,to:42,off:30,sub:"基础篇（上）– Bài 1–12"},
  {name:"Cơ sở – quyển dưới",from:43,to:55,off:30,sub:"基础篇（下）– Bài 13–25"}];
export function gtLabel(i: number){ return i>30?`Cơ sở – Bài ${i-30}`:`Nhập môn – Bài ${i}`; }
export const GT_LESSONS: Record<number, GtLesson> ={
 1:{title:"Chào hỏi",zh:"你好！好久不见！",
  goals:["Chào thầy cô, bạn bè và nhiều người theo đúng buổi trong ngày","Hỏi thăm sức khoẻ, đáp lại và hỏi ngược lại","Cảm ơn, xin lỗi, tạm biệt và đáp lại cho tự nhiên","Hiểu các câu thầy cô hay nói trong lớp: 请进, 请坐, 跟我说…"],
  tones:[["妈","mā","Thanh 1","cao, đều, kéo dài"],["麻","má","Thanh 2","đi lên, như hỏi lại “hả?”"],["马","mǎ","Thanh 3","xuống thấp rồi hơi lên"],["骂","mà","Thanh 4","rơi mạnh từ cao xuống"]],
  rules:[
   {t:"Thanh nhẹ",d:"Âm tiết thứ hai đọc nhẹ và ngắn, không đánh dấu thanh.",ex:[["妈妈","māma"],["谢谢","xièxie"],["你们","nǐmen"]]},
   {t:"Thanh 3 + thanh 3",d:"Hai thanh 3 đứng liền nhau: chữ đầu đọc thành thanh 2.",ex:[["你好","nǐ hǎo","→ ní hǎo"],["很好","hěn hǎo","→ hén hǎo"],["我也很好","wǒ yě hěn hǎo","→ wó yě hén hǎo"]]},
   {t:"Biến điệu của 不",d:"不 đứng trước thanh 4 đọc thành bú.",ex:[["不见","bú jiàn"],["不客气","bú kèqi"],["不忙","bù máng","giữ bù"]]}],
  words:[["你","nǐ","bạn, anh, chị (ngôi 2)"],["您","nín","ngài, ông, bà (lịch sự)"],["我","wǒ","tôi"],["你们","nǐmen","các bạn"],["大家","dàjiā","mọi người"],["好","hǎo","tốt, khoẻ"],["很","hěn","rất"],["也","yě","cũng"],["忙","máng","bận"],["吗","ma","(trợ từ hỏi) …không?"],["呢","ne","…thì sao?"],["早上","zǎoshang","buổi sáng"],["晚上","wǎnshang","buổi tối"],["最近","zuìjìn","dạo này"],["老师","lǎoshī","thầy, cô giáo"],["谢谢","xièxie","cảm ơn"],["不客气","bú kèqi","không có gì"],["对不起","duìbuqǐ","xin lỗi"],["没关系","méi guānxi","không sao"],["请","qǐng","mời, xin"],["进","jìn","vào"],["坐","zuò","ngồi"],["好久不见","hǎojiǔ bú jiàn","lâu rồi không gặp"],["再见","zàijiàn","tạm biệt"]],
  dialog:[
   {scene:"Cảnh 1 – 7 giờ sáng, cổng trường. Lan gặp thầy Vương.",lines:[
    ["兰","a","王老师，早上好！","Wáng lǎoshī, zǎoshang hǎo!","Em chào thầy Vương ạ! (chào buổi sáng)"],
    ["王","b","兰兰，早上好！你好吗？","Lánlan, zǎoshang hǎo! Nǐ hǎo ma?","Chào Lan! Em khoẻ không?"],
    ["兰","a","我很好，谢谢老师。您呢？","Wǒ hěn hǎo, xièxie lǎoshī. Nín ne?","Em khoẻ ạ, cảm ơn thầy. Còn thầy ạ?"],
    ["王","b","我也很好。","Wǒ yě hěn hǎo.","Thầy cũng khoẻ."]]},
   {scene:"Cảnh 2 – Trong sân trường, Lan gặp lại Minh.",lines:[
    ["明","b","兰兰！好久不见！","Lánlan! Hǎojiǔ bú jiàn!","Lan! Lâu quá không gặp!"],
    ["兰","a","好久不见！你最近怎么样？","Hǎojiǔ bú jiàn! Nǐ zuìjìn zěnmeyàng?","Lâu quá không gặp! Dạo này cậu thế nào?"],
    ["明","b","我最近很忙。你呢？","Wǒ zuìjìn hěn máng. Nǐ ne?","Dạo này tớ bận lắm. Còn cậu?"],
    ["兰","a","我也很忙。再见！","Wǒ yě hěn máng. Zàijiàn!","Tớ cũng bận. Tạm biệt nhé!"],
    ["明","b","再见！","Zàijiàn!","Tạm biệt!"]]},
   {scene:"Cảnh 3 – Lan đến lớp muộn, gõ cửa.",lines:[
    ["兰","a","对不起，老师！","Duìbuqǐ, lǎoshī!","Em xin lỗi thầy ạ!"],
    ["王","b","没关系。请进！请坐。","Méi guānxi. Qǐng jìn! Qǐng zuò.","Không sao. Mời em vào! Mời ngồi."],
    ["兰","a","谢谢老师！","Xièxie lǎoshī!","Em cảm ơn thầy!"],
    ["王","b","不客气。大家好，跟我说：你好！","Bú kèqi. Dàjiā hǎo, gēn wǒ shuō: nǐ hǎo!","Không có gì. Chào cả lớp, nói theo thầy: 你好!"]]}],
  grammar:[
   {t:"Chào theo người và theo buổi",d:"Chào một người: 你好. Người lớn tuổi, thầy cô: 您好. Nhiều người: 你们好 hoặc 大家好 (không nói 您们好). Theo buổi: thêm 好 sau từ chỉ thời gian.",ex:[["您好","nín hǎo"],["大家好","dàjiā hǎo"],["早上好","zǎoshang hǎo"],["晚上好","wǎnshang hǎo"]]},
   {t:"Câu hỏi với 吗",d:"Thêm 吗 vào cuối câu kể là thành câu hỏi có/không. Trật tự từ giữ nguyên.",ex:[["你好吗？","nǐ hǎo ma?"],["你忙吗？","nǐ máng ma?"],["老师忙吗？","lǎoshī máng ma?"]]},
   {t:"Hỏi lại với 呢 và nói “cũng” với 也",d:"Trả lời xong, hỏi ngược lại bằng “你呢？”. 也 luôn đứng sau chủ ngữ, trước 很 / động từ: 我也很好, không nói 也我很好.",ex:[["我很好，你呢？","wǒ hěn hǎo, nǐ ne?"],["我也很好。","wǒ yě hěn hǎo."],["我也很忙。","wǒ yě hěn máng."]]},
   {t:"Cảm ơn – xin lỗi và cách đáp",d:"谢谢 → đáp 不客气. 对不起 → đáp 没关系. 再见 → đáp lại 再见.",ex:[["谢谢！","xièxie!"],["不客气。","bú kèqi."],["对不起！","duìbuqǐ!"],["没关系。","méi guānxi."]]},
   {t:"Câu thầy cô hay nói trong lớp",d:"请 + động từ = mời / xin hãy… Nghe được những câu này là theo kịp lớp ngay từ buổi đầu.",ex:[["请进","qǐng jìn","mời vào"],["请坐","qǐng zuò","mời ngồi"],["请听","qǐng tīng","hãy nghe"],["请看","qǐng kàn","hãy nhìn"],["请读","qǐng dú","hãy đọc"],["跟我说","gēn wǒ shuō","nói theo tôi"],["再说一遍","zài shuō yí biàn","nói lại lần nữa"],["明白吗？","míngbai ma?","hiểu không?"]]}],
  write:[["你","nǐ","bạn"],["好","hǎo","tốt"],["我","wǒ","tôi"],["很","hěn","rất"],["也","yě","cũng"]],
  quiz:[
   ["7 giờ sáng gặp cô giáo, bạn chào:",["老师，早上好！","老师，晚上好！","你们好！","再见！"],"早上好 dùng cho buổi sáng; 晚上好 dùng buổi tối."],
   ["Chào cả lớp cùng lúc, câu nào ĐÚNG?",["大家好！","您们好！","你好吗！","我很好！"],"Không có 您们. Chào nhiều người: 大家好 hoặc 你们好."],
   ["Bạn được hỏi 你好吗？ Đáp và hỏi lại:",["我很好，你呢？","不客气。","再见。","好久不见。"],"Trả lời rồi hỏi lại bằng 你呢？"],
   ["“Tôi cũng rất bận” là:",["我也很忙。","也我很忙。","我很也忙。","我很忙也。"],"也 đứng sau chủ ngữ, trước 很."],
   ["Gặp lại bạn cũ sau nhiều tháng, câu mở đầu hợp nhất:",["好久不见！","晚上好！","谢谢！","您呢？"],"好久不见 = lâu rồi không gặp."],
   ["Bạn đến lớp muộn, nói 对不起. Thầy đáp:",["没关系。","不客气。","再见。","谢谢。"],"对不起 → 没关系 (không sao)."],
   ["Bạn mình nói 谢谢！ Bạn đáp:",["不客气。","没关系。","对不起。","你呢？"],"谢谢 → 不客气 (không có gì)."],
   ["Thầy nói 请坐。 Thầy muốn bạn:",["ngồi xuống","vào lớp","nghe","nói lại"],"坐 = ngồi; 进 = vào; 听 = nghe."],
   ["你好 đọc thực tế là:",["ní hǎo","nǐ hǎo (giữ nguyên hai thanh 3)","nì hǎo","nǐ háo"],"Thanh 3 + thanh 3: chữ đầu đọc thành thanh 2."]],
  say:[["你好","nǐ hǎo"],["早上好","zǎoshang hǎo"],["老师，您好","lǎoshī, nín hǎo"],["你最近怎么样","nǐ zuìjìn zěnmeyàng"],["我很好，你呢","wǒ hěn hǎo, nǐ ne"],["我也很忙","wǒ yě hěn máng"],["好久不见","hǎojiǔ bú jiàn"],["对不起","duìbuqǐ"],["没关系","méi guānxi"],["不客气","bú kèqi"],["再见","zàijiàn"]],
  task:"Ghi âm khoảng 20 giây: chào một người bạn theo buổi hiện tại, hỏi thăm dạo này thế nào, trả lời khi được hỏi lại, rồi chào tạm biệt. Gửi file cho giáo viên để được sửa thanh điệu."}
};
export const GT_TITLES: Record<number, [string, string, string?]> ={
1:["你好","Xin chào","Chào hỏi, cảm ơn, xin lỗi, tạm biệt; đọc đúng 4 thanh điệu"],
2:["你好吗","Bạn khoẻ không?","Hỏi thăm và đáp lại; đặt câu hỏi có/không với 吗"],
3:["你吃什么","Bạn ăn gì?","Hỏi tên, hỏi “cái gì” với 什么; nói món muốn ăn, uống"],
4:["多少钱？","Bao nhiêu tiền?","Đếm số đến hàng nghìn; hỏi giá và trả tiền khi mua hàng"],
5:["图书馆在哪儿？","Thư viện ở đâu?","Hỏi và chỉ chỗ với 在哪儿 / 在这儿 / 在那儿"],
6:["我来介绍一下","Để tôi giới thiệu","Giới thiệu bản thân và người khác; nói “rất vui được quen”"],
7:["你身体好吗","Bạn có khoẻ không?","Hỏi thăm sức khoẻ, công việc, thời tiết bằng câu hỏi 好不好, 忙不忙"],
8:["你是哪国人？","Bạn là người nước nào?","Hỏi quốc tịch; chỉ đồ vật với 这 / 那 / 哪 + lượng từ"],
9:["你家有几口人","Nhà bạn có mấy người?","Giới thiệu gia đình; nói nhớ, muốn với 想"],
10:["现在几点？","Bây giờ mấy giờ?","Hỏi và nói giờ (点, 分, 半, 刻, 差); hẹn giờ giấc"],
11:["办公楼在教学楼北边","Toà văn phòng ở phía bắc giảng đường","Tả vị trí và phương hướng: đông tây nam bắc, trước sau trái phải"],
12:["要红的还是要蓝的","Lấy màu đỏ hay màu xanh?","Chọn giữa hai thứ với 还是; nói thêm với 还; dùng cấu trúc “…的”"],
13:["您给我介绍介绍","Anh/chị giới thiệu giúp tôi","Nhờ tư vấn khi mua đồ; nói mong muốn với 想 + động từ"],
14:["咱们去尝尝，好吗","Mình đi nếm thử nhé?","Rủ rê, đề nghị với “…好吗”; kể tin nghe được với 听说"],
15:["去邮局怎么走","Đi bưu điện thế nào?","Hỏi đường và chỉ đường: đi thẳng, rẽ trái, rẽ phải"],
16:["他正在等他的爱人呢","Anh ấy đang đợi vợ","Nói việc đang làm với 正在…呢"],
17:["刚才你去哪儿了","Lúc nãy bạn đi đâu?","Kể việc đã làm với 了; kể đồ đã mua"],
18:["秋天了","Mùa thu rồi","Nói về thời tiết và sự thay đổi với 了"],
19:["你游泳游得怎么样","Bạn bơi thế nào?","Nhận xét ai đó làm việc gì giỏi/kém với 得"],
20:["明天我就要回国了","Mai tôi sắp về nước rồi","Nói làm việc gì trong bao lâu; việc sắp xảy ra với 就要…了"],
21:["你去过香山吗","Bạn đã đến Hương Sơn chưa?","Kể trải nghiệm với 过; nhấn thời gian, cách thức với 是…的"],
22:["门开着","Cửa đang mở","Tả trạng thái với 着; xin phép với 我可以…吗"],
23:["你打错了","Bạn gọi nhầm rồi","Gọi và nghe điện thoại; nói kết quả của hành động (错, 完, 好)"],
24:["她出去了","Cô ấy ra ngoài rồi","Nói hướng đi lại: 出去, 回来, 进来"],
25:["他恐怕去不了","E là anh ấy không đi được","Hẹn gặp, từ chối khéo; nói làm được/không được (去不了, 看得懂)"],
26:["西安比北京还热","Tây An còn nóng hơn Bắc Kinh","So sánh hai người, hai nơi với 比"],
27:["你把自行车放哪儿了","Bạn để xe đạp đâu rồi?","Nói đặt, để đồ vật với câu chữ 把"],
28:["快把空调关上","Mau tắt điều hoà đi","Nhờ, yêu cầu người khác làm việc; nói khi bị cảm"],
29:["钱包被小偷偷走了","Ví bị trộm lấy mất rồi","Kể sự cố, báo mất đồ với câu bị động 被"],
30:["祝你一路平安","Chúc bạn thượng lộ bình an","Chia tay, tiễn bạn và gửi lời chúc"],
31:["认识一下","Làm quen","Làm quen trong công việc; giới thiệu nơi làm, công việc được cử đi"],
32:["吃点什么","Ăn gì nhé","Gọi món ở nhà hàng, đọc thực đơn, nói khẩu vị"],
33:["在校园里","Trong khuôn viên trường","Kể hoạt động cuối tuần; tả khuôn viên, nơi đi dạo"],
34:["住的麻烦","Rắc rối chỗ ở","Nói thói quen sinh hoạt; phàn nàn và giải quyết chuyện chỗ ở"],
35:["怎么去好","Đi thế nào thì tốt?","Bàn chọn phương tiện; nói ưu, nhược điểm với 虽然…但是"],
36:["做客","Đến nhà làm khách","Chào hỏi chủ nhà, khen, mời và nhận lời khi làm khách"],
37:["旅行计划","Kế hoạch du lịch","Lên và trình bày kế hoạch một chuyến đi"],
38:["生活服务","Dịch vụ đời sống","Dùng các dịch vụ hằng ngày; giới thiệu với 既…又…, 除了…以外"],
39:["北京的市场","Chợ ở Bắc Kinh","Đi chợ, mặc cả; nói mình mê thứ gì với 迷"],
40:["为了健康","Vì sức khoẻ","Nói thói quen giữ sức khoẻ; khuyên nhủ người khác"],
41:["购物","Mua sắm","Mua sắm, tả sản phẩm, nêu vấn đề khi hàng có lỗi"],
42:["谈论朋友","Nói về bạn bè","Tả tính cách, công việc của bạn bè"],
43:["旅行归来","Đi du lịch về","Kể lại chuyến đi và cảm xúc (感觉, 觉得, 以为)"],
44:["体育健身","Thể thao, rèn luyện","Nói về môn thể thao, thành tích và thói quen tập luyện"],
45:["各有所爱","Mỗi người một sở thích","Nói về phim, ca sĩ, chương trình mình thích"],
46:["理想的职业","Nghề nghiệp lý tưởng","Nói về các nghề, ưu nhược điểm, công việc mơ ước"],
47:["业余爱好","Sở thích lúc rảnh","Kể cách dùng thời gian rảnh và ngày nghỉ"],
48:["中国家庭","Gia đình Trung Quốc","Tả gia đình; so sánh giống nhau với 像"],
49:["看望病人","Thăm người ốm","Thăm hỏi người bệnh, hỏi triệu chứng, chúc mau khoẻ"],
50:["生活习惯","Thói quen sinh hoạt","Nói thói quen hằng ngày; nhắc nhở với 都…了"],
51:["看比赛","Xem thi đấu","Bình luận một trận đấu, kể kết quả"],
52:["春夏秋冬","Xuân hạ thu đông","Nói về bốn mùa, phong tục theo mùa; đánh giá với 值得"],
53:["友好交往","Giao lưu hữu nghị","Giao tiếp xã giao, mời mọc, giữ mối quan hệ"],
54:["你考得怎么样","Bạn thi thế nào?","Nói về thi cử, kết quả và thủ tục thi"],
55:["告别","Tạm biệt","Chia tay, nói lưu luyến (舍不得) và nhìn lại khoá học"]};
export const GT_STEPS: [string, string][] =[["goal","Mục tiêu"],["pron","Phát âm"],["words","Từ mới"],["dlg","Hội thoại"],["gram","Mẫu câu"],["write","Chữ Hán"],["quiz","Luyện tập"],["say","Nói"]];
Object.assign(GT_LESSONS,{
 2:{title:"Bạn khoẻ không?",zh:"你好吗？我很好！",
  goals:["Hỏi thăm một người và trả lời mình đang thế nào","Nói đói, khát, mệt, bận, vui… với 很 / 非常 / 不太 / 不","Hỏi thăm và kể về người trong gia đình, dùng 都 khi nói nhiều người"],
  pronH:"Thanh nhẹ trong tên người thân",pronP:"Âm tiết thứ hai đọc nhẹ, ngắn. Bấm để nghe.",
  tones:[["爸爸","bàba","Bố","4 + nhẹ"],["妈妈","māma","Mẹ","1 + nhẹ"],["哥哥","gēge","Anh trai","1 + nhẹ"],["姐姐","jiějie","Chị gái","3 + nhẹ"]],
  rules:[
   {t:"很 + thanh 3",d:"很 đứng trước một thanh 3 khác thì đọc thành hén.",ex:[["很好","hěn hǎo","→ hén hǎo"],["很渴","hěn kě","→ hén kě"],["很冷","hěn lěng","→ hén lěng"]]},
   {t:"不 + thanh 4 → bú",d:"不 trước thanh 4 đọc bú; trước thanh 1, 2, 3 giữ bù.",ex:[["不太","bú tài"],["不饿","bú è"],["不累","bú lèi"],["不忙","bù máng","giữ bù"],["不冷","bù lěng","giữ bù"]]},
   {t:"他 và 她",d:"Cả hai đều đọc tā. 他 là anh ấy, 她 là cô ấy; số nhiều thêm 们.",ex:[["他","tā"],["她","tā"],["他们","tāmen"]]}],
  words:[["他","tā","anh ấy"],["她","tā","cô ấy"],["他们","tāmen","họ"],["饿","è","đói"],["渴","kě","khát"],["冷","lěng","lạnh"],["热","rè","nóng"],["累","lèi","mệt"],["忙","máng","bận"],["高兴","gāoxìng","vui"],["非常","fēicháng","vô cùng, rất"],["不太","bú tài","không… lắm"],["都","dōu","đều"],["爸爸","bàba","bố"],["妈妈","māma","mẹ"],["爱人","àiren","vợ / chồng"],["哥哥","gēge","anh trai"],["姐姐","jiějie","chị gái"],["弟弟","dìdi","em trai"],["妹妹","mèimei","em gái"]],
  dialog:[
   {scene:"Cảnh 1 – Tan học, Minh gặp Lan.",lines:[
    ["明","b","兰兰，你好吗？","Lánlan, nǐ hǎo ma?","Lan ơi, cậu khoẻ không?"],
    ["兰","a","我很好。你呢？","Wǒ hěn hǎo. Nǐ ne?","Tớ khoẻ. Còn cậu?"],
    ["明","b","我不太好，我很累。","Wǒ bú tài hǎo, wǒ hěn lèi.","Tớ không khoẻ lắm, tớ mệt lắm."],
    ["兰","a","你饿吗？","Nǐ è ma?","Cậu đói không?"],
    ["明","b","我非常饿！","Wǒ fēicháng è!","Tớ đói lắm luôn!"],
    ["兰","a","我也很饿。","Wǒ yě hěn è.","Tớ cũng đói."]]},
   {scene:"Cảnh 2 – Thầy Vương hỏi thăm gia đình Lan.",lines:[
    ["王","b","兰兰，你爸爸妈妈好吗？","Lánlan, nǐ bàba māma hǎo ma?","Lan, bố mẹ em khoẻ không?"],
    ["兰","a","他们都很好，谢谢老师。","Tāmen dōu hěn hǎo, xièxie lǎoshī.","Bố mẹ em đều khoẻ ạ, cảm ơn thầy."],
    ["王","b","他们忙吗？","Tāmen máng ma?","Bố mẹ em có bận không?"],
    ["兰","a","我爸爸很忙，我妈妈不太忙。您爱人好吗？","Wǒ bàba hěn máng, wǒ māma bú tài máng. Nín àiren hǎo ma?","Bố em bận lắm, mẹ em không bận lắm. Cô (vợ thầy) khoẻ không ạ?"],
    ["王","b","她也很好。","Tā yě hěn hǎo.","Cô cũng khoẻ."]]}],
  grammar:[
   {t:"Câu tính từ: chủ ngữ + 很 / 非常 / 不太 / 不 + tính từ",d:"Tiếng Trung không dùng 是 trước tính từ. Nói 我很忙, không nói 我是忙. 很 ở đây gần như chỉ để câu tròn nghĩa, 非常 mới là “rất, vô cùng”.",ex:[["我很忙。","wǒ hěn máng."],["他非常饿。","tā fēicháng è."],["她不太冷。","tā bú tài lěng."],["我不累。","wǒ bú lèi."]]},
   {t:"都 = đều",d:"都 đứng sau chủ ngữ số nhiều, trước tính từ / động từ. Có cả 也 thì 也 đứng trước 都.",ex:[["我们都很好。","wǒmen dōu hěn hǎo."],["他们都很忙。","tāmen dōu hěn máng."],["我们也都很好。","wǒmen yě dōu hěn hǎo."]]},
   {t:"Người thân: 我爸爸, 你妈妈",d:"Với người trong gia đình, nói thẳng đại từ + danh từ, thường không cần thêm 的.",ex:[["我爸爸","wǒ bàba"],["你妈妈","nǐ māma"],["他爱人","tā àiren"]]}],
  write:[["他","tā","anh ấy"],["她","tā","cô ấy"],["忙","máng","bận"],["爸","bà","bố"],["妈","mā","mẹ"]],
  quiz:[
   ["“Tôi rất bận” là:",["我很忙。","我是忙。","我忙很。","很我忙。"],"Không dùng 是 trước tính từ: 我很忙."],
   ["“Bố mẹ tôi đều khoẻ” là:",["我爸爸妈妈都很好。","都我爸爸妈妈很好。","我爸爸妈妈很都好。","我爸爸妈妈很好都。"],"都 đứng sau chủ ngữ, trước 很."],
   ["不太好 nghĩa là:",["không khoẻ lắm","rất không khoẻ","quá khoẻ","không phải khoẻ"],"不太 + tính từ = không… lắm."],
   ["不累 đọc là:",["bú lèi","bù lèi","bū lèi","bǔ lèi"],"累 là thanh 4, nên 不 đọc thành bú."],
   ["Bạn được hỏi 你饿吗？ và muốn nói “không đói lắm”:",["我不太饿。","我太不饿。","我是不饿。","我饿不太。"],"不太 đứng trước tính từ."],
   ["“Cô ấy rất vui” viết là:",["她很高兴。","他很高兴。","她是高兴。","她高兴很。"],"她 là cô ấy (bộ 女), và không dùng 是 trước tính từ."]],
  say:[["你好吗","nǐ hǎo ma"],["我很好，你呢","wǒ hěn hǎo, nǐ ne"],["我不太好","wǒ bú tài hǎo"],["我非常饿","wǒ fēicháng è"],["他们都很忙","tāmen dōu hěn máng"],["我爸爸妈妈都很好","wǒ bàba māma dōu hěn hǎo"]],
  task:"Ghi âm khoảng 20 giây: hỏi thăm một người bạn, nói bạn đang thế nào (đói, mệt, bận, vui…), rồi kể bố mẹ hoặc anh chị em của bạn dạo này ra sao, có dùng 都 hoặc 也."},
 3:{title:"Bạn ăn gì?",zh:"你叫什么名字？你吃什么？",
  goals:["Hỏi tên, tự giới thiệu tên và quốc tịch","Hỏi “cái gì” với 什么: ăn gì, uống gì, mua gì","Nói mình thích hoặc không thích ăn, uống gì với 喜欢"],
  pronH:"Bốn thanh qua đồ ăn uống",pronP:"Mỗi từ một thanh. Bấm để nghe rồi đọc theo.",
  tones:[["喝","hē","Thanh 1","uống"],["茶","chá","Thanh 2","trà"],["水","shuǐ","Thanh 3","nước"],["饭","fàn","Thanh 4","cơm"]],
  rules:[
   {t:"Thanh nhẹ trong từ hai âm tiết",d:"Những từ này âm tiết sau đọc nhẹ, ngắn.",ex:[["什么","shénme"],["名字","míngzi"],["朋友","péngyou"],["喜欢","xǐhuan"]]},
   {t:"Âm uốn lưỡi zh / ch / sh",d:"Đầu lưỡi cong lên chạm ngạc cứng. Đừng đọc thành z / c / s.",ex:[["中国","Zhōngguó"],["吃","chī"],["是","shì"],["什么","shénme"]]},
   {t:"国 và 人 trong tên nước",d:"Tên nước + 人 = người nước đó.",ex:[["中国人","Zhōngguó rén"],["越南人","Yuènán rén"],["美国人","Měiguó rén"]]}],
  words:[["叫","jiào","tên là, gọi là"],["什么","shénme","cái gì"],["名字","míngzi","tên"],["朋友","péngyou","bạn bè"],["是","shì","là"],["哪","nǎ","nào"],["国","guó","nước"],["人","rén","người"],["中国","Zhōngguó","Trung Quốc"],["越南","Yuènán","Việt Nam"],["认识","rènshi","quen biết"],["吃","chī","ăn"],["喝","hē","uống"],["买","mǎi","mua"],["喜欢","xǐhuan","thích"],["米饭","mǐfàn","cơm"],["面条","miàntiáo","mì sợi"],["饺子","jiǎozi","sủi cảo"],["茶","chá","trà"],["咖啡","kāfēi","cà phê"],["水","shuǐ","nước"]],
  dialog:[
   {scene:"Cảnh 1 – Buổi học đầu, Minh làm quen với bạn mới.",lines:[
    ["明","a","你好！我叫阿明。你叫什么名字？","Nǐ hǎo! Wǒ jiào Ā Míng. Nǐ jiào shénme míngzi?","Chào cậu! Tớ là Minh. Cậu tên gì?"],
    ["雪","b","我叫小雪。","Wǒ jiào Xiǎo Xuě.","Tớ tên Tiểu Tuyết."],
    ["明","a","你是哪国人？","Nǐ shì nǎ guó rén?","Cậu là người nước nào?"],
    ["雪","b","我是中国人。你呢？","Wǒ shì Zhōngguó rén. Nǐ ne?","Tớ là người Trung Quốc. Còn cậu?"],
    ["明","a","我是越南人。认识你很高兴！","Wǒ shì Yuènán rén. Rènshi nǐ hěn gāoxìng!","Tớ là người Việt Nam. Rất vui được quen cậu!"],
    ["雪","b","认识你我也很高兴。","Rènshi nǐ wǒ yě hěn gāoxìng.","Tớ cũng rất vui được quen cậu."]]},
   {scene:"Cảnh 2 – Hai bạn vào quán ăn.",lines:[
    ["雪","b","你吃什么？","Nǐ chī shénme?","Cậu ăn gì?"],
    ["明","a","我吃饺子。你也吃饺子吗？","Wǒ chī jiǎozi. Nǐ yě chī jiǎozi ma?","Tớ ăn sủi cảo. Cậu cũng ăn sủi cảo à?"],
    ["雪","b","我不吃饺子，我吃面条。你喝什么？","Wǒ bù chī jiǎozi, wǒ chī miàntiáo. Nǐ hē shénme?","Tớ không ăn sủi cảo, tớ ăn mì. Cậu uống gì?"],
    ["明","a","我喝茶。你喜欢喝咖啡吗？","Wǒ hē chá. Nǐ xǐhuan hē kāfēi ma?","Tớ uống trà. Cậu thích uống cà phê không?"],
    ["雪","b","我非常喜欢！","Wǒ fēicháng xǐhuan!","Tớ thích lắm!"]]}],
  grammar:[
   {t:"Hỏi bằng 什么",d:"Đặt 什么 đúng chỗ của thông tin muốn hỏi, giữ nguyên trật tự câu. Trả lời thì thay 什么 bằng câu trả lời.",ex:[["你叫什么名字？","nǐ jiào shénme míngzi?"],["你吃什么？","nǐ chī shénme?"],["你买什么？","nǐ mǎi shénme?"]]},
   {t:"是 nối hai danh từ",d:"A 是 B = A là B. Phủ định: 不是. Hỏi quốc tịch: 你是哪国人？",ex:[["我是越南人。","wǒ shì Yuènán rén."],["她不是中国人。","tā bú shì Zhōngguó rén."],["你是哪国人？","nǐ shì nǎ guó rén?"]]},
   {t:"喜欢 + (động từ) + danh từ",d:"Thích làm gì: 喜欢 + động từ + tân ngữ. Không thích: 不喜欢.",ex:[["我喜欢喝茶。","wǒ xǐhuan hē chá."],["他不喜欢吃米饭。","tā bù xǐhuan chī mǐfàn."],["你喜欢吃什么？","nǐ xǐhuan chī shénme?"]]}],
  write:[["吃","chī","ăn"],["喝","hē","uống"],["茶","chá","trà"],["人","rén","người"],["国","guó","nước"]],
  quiz:[
   ["Hỏi tên bạn mới, câu đúng là:",["你叫什么名字？","你什么叫名字？","什么你叫名字？","你叫名字什么？"],"什么 đứng trước 名字, trật tự câu giữ nguyên."],
   ["“Tôi là người Việt Nam” là:",["我是越南人。","我越南人是。","我是人越南。","我很越南人。"],"Tên nước + 人, nối bằng 是."],
   ["Được hỏi 你是中国人吗？ và bạn không phải:",["我不是中国人。","我没是中国人。","我不中国人。","我是不中国人。"],"Phủ định của 是 là 不是."],
   ["Ở quán, hỏi bạn muốn uống gì:",["你喝什么？","你吃什么？","你叫什么？","你买什么？"],"喝 = uống."],
   ["“Tôi thích uống trà” là:",["我喜欢喝茶。","我喝喜欢茶。","喜欢我喝茶。","我喜欢茶喝。"],"喜欢 + động từ + tân ngữ."],
   ["认识你很高兴 nghĩa là:",["Rất vui được quen bạn","Tôi biết bạn rất vui","Bạn rất vui","Bạn có vui không?"],"Câu chào khi mới làm quen."]],
  say:[["你叫什么名字","nǐ jiào shénme míngzi"],["我叫小雪","wǒ jiào Xiǎo Xuě"],["你是哪国人","nǐ shì nǎ guó rén"],["我是越南人","wǒ shì Yuènán rén"],["认识你很高兴","rènshi nǐ hěn gāoxìng"],["你喝什么","nǐ hē shénme"],["我喜欢喝茶","wǒ xǐhuan hē chá"]],
  task:"Ghi âm khoảng 30 giây tự giới thiệu: tên, quốc tịch, món bạn thích ăn và đồ uống bạn thích, rồi hỏi lại người nghe tên gì và thích ăn gì."},
 4:{title:"Bao nhiêu tiền?",zh:"一杯咖啡多少钱？",
  goals:["Đếm và đọc số đến hàng trăm","Dùng đúng lượng từ: 杯, 瓶, 本, 碗, 个","Hỏi giá, gọi đồ ở quán và đổi tiền"],
  pronH:"Bốn thanh qua số đếm",pronP:"Bấm để nghe. Số đếm là nơi luyện thanh điệu tốt nhất.",
  tones:[["一","yī","Thanh 1","một"],["十","shí","Thanh 2","mười"],["五","wǔ","Thanh 3","năm"],["四","sì","Thanh 4","bốn"]],
  rules:[
   {t:"Biến điệu của 一",d:"一 trước thanh 1, 2, 3 đọc yì; trước thanh 4 (kể cả 个) đọc yí. Đếm số đứng riêng thì giữ yī.",ex:[["一杯水","yì bēi shuǐ"],["一瓶水","yì píng shuǐ"],["一本书","yì běn shū"],["一个人","yí gè rén"],["一块钱","yí kuài qián"]]},
   {t:"两 hay 二?",d:"Trước lượng từ dùng 两 (hai cái, hai người). Khi đếm hoặc trong số lớn dùng 二.",ex:[["两个人","liǎng gè rén"],["两块钱","liǎng kuài qián"],["十二","shí'èr"],["二十","èrshí"]]},
   {t:"Ghép số",d:"Đọc như tiếng Việt: chục + đơn vị. 百 là trăm.",ex:[["十一","shíyī"],["二十八","èrshíbā"],["九十九","jiǔshíjiǔ"],["一百","yìbǎi"]]}],
  words:[["十","shí","mười"],["百","bǎi","trăm"],["多少","duōshao","bao nhiêu"],["钱","qián","tiền"],["块","kuài","đồng (tệ)"],["毛","máo","hào (1/10 đồng)"],["两","liǎng","hai (trước lượng từ)"],["个","gè","cái, người (lượng từ chung)"],["杯","bēi","cốc, ly"],["瓶","píng","chai"],["本","běn","quyển"],["碗","wǎn","bát"],["书","shū","sách"],["这","zhè","này"],["要","yào","muốn, cần, lấy"],["好的","hǎo de","được, vâng"],["看看","kànkan","xem thử"],["换","huàn","đổi"],["人民币","rénmínbì","nhân dân tệ"],["美元","měiyuán","đô la Mỹ"]],
  dialog:[
   {scene:"Cảnh 1 – Lan gọi đồ ở quán cà phê.",lines:[
    ["员","b","您好，您要什么？","Nín hǎo, nín yào shénme?","Chào chị, chị dùng gì ạ?"],
    ["兰","a","我要一杯咖啡。一杯咖啡多少钱？","Wǒ yào yì bēi kāfēi. Yì bēi kāfēi duōshao qián?","Cho tôi một ly cà phê. Một ly cà phê bao nhiêu tiền?"],
    ["员","b","二十八块。","Èrshíbā kuài.","Hai mươi tám tệ."],
    ["兰","a","我要两杯。","Wǒ yào liǎng bēi.","Cho tôi hai ly."],
    ["员","b","两杯五十六块，谢谢。","Liǎng bēi wǔshíliù kuài, xièxie.","Hai ly năm mươi sáu tệ, cảm ơn chị."],
    ["兰","a","好的。","Hǎo de.","Vâng."]]},
   {scene:"Cảnh 2 – Minh mua sách.",lines:[
    ["明","a","这本书多少钱？","Zhè běn shū duōshao qián?","Quyển sách này bao nhiêu tiền?"],
    ["员","b","我看看……三十五块。","Wǒ kànkan… sānshíwǔ kuài.","Để tôi xem… ba mươi lăm tệ."],
    ["明","a","我买两本。","Wǒ mǎi liǎng běn.","Tôi mua hai quyển."],
    ["员","b","两本七十块。","Liǎng běn qīshí kuài.","Hai quyển bảy mươi tệ."]]},
   {scene:"Cảnh 3 – Minh đổi tiền ở ngân hàng.",lines:[
    ["明","a","您好，我要换钱。","Nín hǎo, wǒ yào huàn qián.","Chào anh, tôi muốn đổi tiền."],
    ["员","b","您换什么钱？","Nín huàn shénme qián?","Anh đổi tiền gì?"],
    ["明","a","我换美元。","Wǒ huàn měiyuán.","Tôi đổi đô la Mỹ."],
    ["员","b","您要换多少？","Nín yào huàn duōshao?","Anh muốn đổi bao nhiêu?"],
    ["明","a","一百美元。","Yìbǎi měiyuán.","Một trăm đô."]]}],
  grammar:[
   {t:"Số + lượng từ + danh từ",d:"Giữa số và danh từ luôn có lượng từ, giống “một ly cà phê”, “hai quyển sách”.",ex:[["一杯咖啡","yì bēi kāfēi"],["两本书","liǎng běn shū"],["三个包子","sān gè bāozi"],["一碗米饭","yì wǎn mǐfàn"],["一瓶水","yì píng shuǐ"]]},
   {t:"Hỏi giá: …多少钱？",d:"Đồ vật + 多少钱？ Có thể thêm 这 + lượng từ để chỉ món trước mặt.",ex:[["多少钱？","duōshao qián?"],["这本书多少钱？","zhè běn shū duōshao qián?"],["一杯茶多少钱？","yì bēi chá duōshao qián?"]]},
   {t:"要 + danh từ / động từ",d:"要 = muốn, lấy, cần. Dùng khi gọi đồ hoặc nói việc muốn làm.",ex:[["我要一杯茶。","wǒ yào yì bēi chá."],["我要喝水。","wǒ yào hē shuǐ."],["我要换钱。","wǒ yào huàn qián."]]}],
  write:[["一","yī","một"],["二","èr","hai"],["三","sān","ba"],["十","shí","mười"],["钱","qián","tiền"]],
  quiz:[
   ["“Hai người” là:",["两个人","二个人","两人个","个两人"],"Trước lượng từ dùng 两, và cần lượng từ 个."],
   ["一杯 đọc là:",["yì bēi","yī bēi","yí bēi","yǐ bēi"],"杯 là thanh 1, nên 一 đọc thành yì."],
   ["一个 đọc là:",["yí gè","yì gè","yī gè","yǐ gè"],"个 là thanh 4, nên 一 đọc thành yí."],
   ["Hỏi giá quyển sách này:",["这本书多少钱？","这个书多少钱？","这本书钱多少？","多少钱这本书？"],"Sách dùng lượng từ 本; 多少钱 đứng cuối."],
   ["58 tệ là:",["五十八块","五八十块","八十五块","五百八块"],"Chục trước, đơn vị sau: 五十 + 八."],
   ["“Một ly cà phê” là 一__咖啡:",["杯","本","瓶","碗"],"杯 = cốc, ly."]],
  say:[["多少钱","duōshao qián"],["一杯咖啡多少钱","yì bēi kāfēi duōshao qián"],["我要两杯","wǒ yào liǎng bēi"],["这本书多少钱","zhè běn shū duōshao qián"],["我要换钱","wǒ yào huàn qián"],["一百美元","yìbǎi měiyuán"]],
  task:"Ghi âm đóng vai khách ở quán: chào, gọi hai món đồ uống với số lượng, hỏi giá từng món, rồi nói tổng số tiền."},
 5:{title:"Thư viện ở đâu?",zh:"请问，图书馆在哪儿？",
  goals:["Hỏi và chỉ chỗ: ở đâu, ở đây, ở kia","Nói đồ của ai với 的, nói mình biết hay không biết với 知道","Gọi điện hỏi bạn đang ở đâu; nói hôm qua, hôm nay, ngày mai đi đâu"],
  pronH:"Bốn thanh qua từ chỉ nơi chốn",pronP:"Bấm để nghe rồi đọc theo.",
  tones:[["家","jiā","Thanh 1","nhà"],["食","shí","Thanh 2","ăn (食堂: căng tin)"],["哪","nǎ","Thanh 3","nào"],["在","zài","Thanh 4","ở"]],
  rules:[
   {t:"Âm cuốn lưỡi 儿",d:"儿 không đọc thành âm riêng, chỉ cong lưỡi ở cuối âm trước.",ex:[["哪儿","nǎr"],["这儿","zhèr"],["那儿","nàr"]]},
   {t:"哪儿 hay 那儿?",d:"Chỉ khác thanh điệu: nǎr (thanh 3) là “ở đâu?”, nàr (thanh 4) là “ở kia”. Đọc sai là sai nghĩa.",ex:[["在哪儿？","zài nǎr?"],["在那儿。","zài nàr."]]},
   {t:"sh / x / s",d:"sh uốn lưỡi, x mặt lưỡi (gần “x” tiếng Việt), s đầu lưỡi thẳng.",ex:[["食堂","shítáng"],["洗手间","xǐshǒujiān"],["宿舍","sùshè"]]}],
  words:[["在","zài","ở, tại"],["哪儿","nǎr","ở đâu"],["这儿","zhèr","ở đây"],["那儿","nàr","ở kia"],["就","jiù","chính là, ngay"],["的","de","của"],["知道","zhīdào","biết"],["请问","qǐngwèn","xin hỏi"],["洗手间","xǐshǒujiān","nhà vệ sinh"],["图书馆","túshūguǎn","thư viện"],["食堂","shítáng","căng tin"],["宿舍","sùshè","ký túc xá"],["教室","jiàoshì","phòng học"],["办公室","bàngōngshì","văn phòng"],["银行","yínháng","ngân hàng"],["超市","chāoshì","siêu thị"],["医院","yīyuàn","bệnh viện"],["去","qù","đi"],["今天","jīntiān","hôm nay"],["明天","míngtiān","ngày mai"],["昨天","zuótiān","hôm qua"],["没","méi","không, chưa (với việc đã qua)"],["喂","wéi","alô"]],
  dialog:[
   {scene:"Cảnh 1 – Lan hỏi đường trong trường.",lines:[
    ["兰","a","请问，图书馆在哪儿？","Qǐngwèn, túshūguǎn zài nǎr?","Cho mình hỏi, thư viện ở đâu?"],
    ["雪","b","图书馆就在那儿。","Túshūguǎn jiù zài nàr.","Thư viện ở ngay kia."],
    ["兰","a","洗手间呢？","Xǐshǒujiān ne?","Còn nhà vệ sinh?"],
    ["雪","b","洗手间在这儿。","Xǐshǒujiān zài zhèr.","Nhà vệ sinh ở đây."],
    ["兰","a","谢谢！","Xièxie!","Cảm ơn bạn!"],
    ["雪","b","不客气。","Bú kèqi.","Không có gì."]]},
   {scene:"Cảnh 2 – Minh tìm điện thoại.",lines:[
    ["明","a","我的手机在哪儿？你知道吗？","Wǒ de shǒujī zài nǎr? Nǐ zhīdào ma?","Điện thoại của tớ đâu rồi? Cậu biết không?"],
    ["兰","b","我不知道。不在这儿。","Wǒ bù zhīdào. Bú zài zhèr.","Tớ không biết. Không có ở đây."],
    ["明","a","也不在那儿……","Yě bú zài nàr…","Cũng không ở kia…"],
    ["兰","b","你看！你的手机就在这儿！","Nǐ kàn! Nǐ de shǒujī jiù zài zhèr!","Nhìn kìa! Điện thoại của cậu ở ngay đây!"]]},
   {scene:"Cảnh 3 – Lan gọi điện cho Minh.",lines:[
    ["兰","a","喂，你在哪儿？","Wéi, nǐ zài nǎr?","Alô, cậu đang ở đâu?"],
    ["明","b","我在食堂。你呢？","Wǒ zài shítáng. Nǐ ne?","Tớ ở căng tin. Còn cậu?"],
    ["兰","a","我在宿舍。明天你去银行吗？","Wǒ zài sùshè. Míngtiān nǐ qù yínháng ma?","Tớ ở ký túc xá. Mai cậu đi ngân hàng không?"],
    ["明","b","不去。昨天我去了。","Bú qù. Zuótiān wǒ qù le.","Không đi. Hôm qua tớ đi rồi."],
    ["兰","a","我昨天没去，明天我去。","Wǒ zuótiān méi qù, míngtiān wǒ qù.","Hôm qua tớ không đi, mai tớ đi."]]}],
  grammar:[
   {t:"Ai / cái gì + 在 + nơi chốn",d:"Hỏi chỗ: …在哪儿？ Trả lời: …在这儿 / 在那儿 / 在 + nơi. Phủ định: 不在. Thêm 就 để nhấn “ngay”.",ex:[["你在哪儿？","nǐ zài nǎr?"],["我在食堂。","wǒ zài shítáng."],["他不在宿舍。","tā bú zài sùshè."],["就在那儿。","jiù zài nàr."]]},
   {t:"的 chỉ sở hữu",d:"Người + 的 + đồ vật = đồ của ai.",ex:[["我的手机","wǒ de shǒujī"],["你的本子","nǐ de běnzi"],["老师的书","lǎoshī de shū"]]},
   {t:"去 + nơi chốn; đã đi: 去…了 / 没去",d:"Việc đã xảy ra thêm 了. Phủ định việc đã qua dùng 没, và bỏ 了. Việc chưa xảy ra hoặc không muốn làm dùng 不.",ex:[["明天我去超市。","míngtiān wǒ qù chāoshì."],["昨天我去医院了。","zuótiān wǒ qù yīyuàn le."],["昨天我没去学校。","zuótiān wǒ méi qù xuéxiào."],["今天我不去。","jīntiān wǒ bú qù."]]}],
  write:[["在","zài","ở"],["哪","nǎ","nào"],["儿","ér","(âm 儿)"],["去","qù","đi"],["的","de","của"]],
  quiz:[
   ["Hỏi lịch sự nhà vệ sinh ở đâu:",["请问，洗手间在哪儿？","洗手间哪儿在？","在哪儿洗手间？","请问，洗手间是哪儿？"],"Nơi chốn: chủ ngữ + 在 + 哪儿."],
   ["“Điện thoại của tôi” là:",["我的手机","的我手机","手机我的","我手机的"],"Người + 的 + đồ vật."],
   ["“Ở đâu?” là:",["哪儿 (nǎr)","那儿 (nàr)","这儿 (zhèr)","在 (zài)"],"哪儿 thanh 3 = ở đâu; 那儿 thanh 4 = ở kia."],
   ["“Hôm qua tôi không đi trường” là:",["昨天我没去学校。","昨天我不去学校了。","昨天我没去学校了。","昨天我去没学校。"],"Việc đã qua: 没 + động từ, không thêm 了."],
   ["明天你去哪儿？ Câu trả lời hợp lý:",["明天我去超市。","昨天我去超市了。","我在超市了。","明天我没去超市。"],"Hỏi về ngày mai thì trả lời bằng 明天 + 去."],
   ["喂 dùng khi nào?",["Khi nghe hoặc gọi điện thoại","Khi chào thầy cô","Khi cảm ơn","Khi xin lỗi"],"喂 (wéi) = alô."]],
  say:[["请问，图书馆在哪儿","qǐngwèn, túshūguǎn zài nǎr"],["就在那儿","jiù zài nàr"],["我的手机在哪儿","wǒ de shǒujī zài nǎr"],["你在哪儿","nǐ zài nǎr"],["我在宿舍","wǒ zài sùshè"],["昨天我没去","zuótiān wǒ méi qù"]],
  task:"Ghi âm một cuộc gọi khoảng 30 giây: alô, hỏi bạn đang ở đâu, nói mình đang ở đâu, kể hôm qua bạn đã đi đâu, rồi hẹn ngày mai cùng đi một nơi."}
});
GT_TITLES[2][2]="Hỏi thăm bản thân và gia đình; nói đói, mệt, bận… với 很 / 非常 / 不太 / 都";
GT_TITLES[3][2]="Hỏi tên, quốc tịch; nói ăn gì, uống gì, thích gì với 什么 và 喜欢";
GT_TITLES[4][2]="Đếm số, dùng lượng từ (杯, 本, 个…); hỏi giá, gọi đồ, đổi tiền";
GT_TITLES[5][2]="Hỏi và chỉ chỗ với 在哪儿; nói đi đâu hôm qua, hôm nay, ngày mai (了 / 没)";

/* ===== Sao bài học: từ bài 5 trở đi, đủ sao mới mở bài tiếp theo ===== */
