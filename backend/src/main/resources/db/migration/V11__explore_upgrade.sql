-- V11__explore_upgrade.sql

-- 1. Thêm cột created_at vào bảng categories
ALTER TABLE categories ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Xóa các thể loại cũ để đồng bộ danh sách 23 thể loại chuẩn Wattpad
DELETE FROM story_categories;
DELETE FROM categories;

-- 3. Nạp dữ liệu 23 thể loại chuẩn
INSERT INTO categories (name, slug, description, created_at) VALUES
('Lãng mạn', 'lang-man', 'Thể loại lãng mạn tình cảm ngọt ngào hoặc trắc trở.', CURRENT_TIMESTAMP),
('Fanfiction', 'fanfiction', 'Truyện đồng nhân, viết về thần tượng, nhân vật hư cấu có sẵn.', CURRENT_TIMESTAMP),
('Truyện Ngắn', 'truyen-ngan', 'Các câu chuyện ngắn gọn, súc tích.', CURRENT_TIMESTAMP),
('Tiểu Thuyết Chung', 'tieu-thuyet-chung', 'Tiểu thuyết tổng hợp với nhiều chủ đề khác nhau.', CURRENT_TIMESTAMP),
('Ngẫu nhiên', 'ngau-nhien', 'Những chia sẻ ngẫu hứng, nhật ký hoặc nội dung tự do.', CURRENT_TIMESTAMP),
('Hài hước', 'hai-huoc', 'Câu chuyện đem lại tiếng cười và sự giải trí.', CURRENT_TIMESTAMP),
('Tiểu Thuyết Thiếu Niên', 'tieu-thuyet-thieu-nien', 'Những câu chuyện tuổi học trò, thanh xuân vườn trường.', CURRENT_TIMESTAMP),
('Viễn tưởng', 'vien-tuong', 'Thế giới tưởng tượng, kỳ ảo và ma thuật.', CURRENT_TIMESTAMP),
('Phi Tiểu Thuyết', 'phi-tieu-thuyet', 'Hồi ký, tản văn.', CURRENT_TIMESTAMP),
('Kinh dị', 'kinh-di', 'Những câu chuyện rùng rợn, đáng sợ.', CURRENT_TIMESTAMP),
('Bí ẩn', 'bi-an', 'Giải quyết các vụ án, bí ẩn chưa có lời giải.', CURRENT_TIMESTAMP),
('Thriller', 'thriller', 'Kịch tính, giật gân, đấu trí căng thẳng.', CURRENT_TIMESTAMP),
('Phiêu lưu', 'phieu-luu', 'Hành trình khám phá những vùng đất mới.', CURRENT_TIMESTAMP),
('Tiểu Thuyết Lịch Sử', 'tieu-thuyet-lich-su', 'Lấy bối cảnh thời kỳ lịch sử có thật hoặc giả tưởng lịch sử.', CURRENT_TIMESTAMP),
('Siêu nhiên', 'sieu-nhien', 'Các hiện tượng kỳ bí vượt ngoài thế giới tự nhiên.', CURRENT_TIMESTAMP),
('Ma cà rồng', 'ma-ca-rong', 'Thể loại ma cà rồng đầy cuốn hút và bí ẩn.', CURRENT_TIMESTAMP),
('Truyện Tâm Linh', 'truyen-tam-linh', 'Khám phá thế giới tâm linh, huyền bí.', CURRENT_TIMESTAMP),
('ChickLit', 'chicklit', 'Truyện dành riêng cho phụ nữ hiện đại, hài hước lãng mạn.', CURRENT_TIMESTAMP),
('Thơ Ca', 'tho-ca', 'Sáng tác thơ ca, vần điệu cảm xúc.', CURRENT_TIMESTAMP),
('Người sói', 'nguoi-soi', 'Những câu chuyện thần thoại về người sói.', CURRENT_TIMESTAMP),
('Cổ điển', 'co-dien', 'Văn học mang màu sắc cổ điển, có giá trị lâu dài.', CURRENT_TIMESTAMP);

-- 4. Tạo bảng search_history lưu lịch sử tìm kiếm của người dùng
CREATE TABLE search_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    query VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_search_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_search_history_user_id ON search_history(user_id);
