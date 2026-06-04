import random
from datetime import datetime, timedelta

users = [
    (4, 'phong.nguyen@gmail.com', 'phongnguyen', 'Nguyễn Phong', 'Tác giả chuyên viết về thể loại tiên hiệp.'),
    (5, 'mai.tran@gmail.com', 'maitran', 'Trần Mai', 'Độc giả trung thành của thể loại ngôn tình.'),
    (6, 'hoang.le@gmail.com', 'hoangle', 'Lê Hoàng', 'Đam mê khám phá các vũ trụ khoa học viễn tưởng.'),
    (7, 'dung.vu@gmail.com', 'dungvu', 'Vũ Dũng', 'Reviewer có tiếng trên diễn đàn Abora.'),
    (8, 'lan.nguyen@gmail.com', 'lannguyen', 'Nguyễn Lan', 'Tác giả mảng truyện kinh dị.'),
    (9, 'anh.pham@gmail.com', 'anhpham', 'Phạm Anh', 'Người chuyên Beta truyện.'),
    (10, 'bao.quoc@gmail.com', 'baoquoc', 'Quốc Bảo', 'Thích viết truyện hài hước.'),
    (11, 'chi.le@gmail.com', 'chile', 'Lê Chi', 'Thích đọc truyện trinh thám.'),
    (12, 'dat.hoang@gmail.com', 'dathoang', 'Hoàng Đạt', 'Thành viên cốt cán của Abora.'),
    (13, 'giang.vo@gmail.com', 'giangvo', 'Võ Giang', 'Tác giả nổi tiếng mảng lịch sử.')
]

# (id, name, slug, description)
categories = [
    (1, 'Tiên hiệp', 'tien-hiep', 'Thế giới tu tiên rực rỡ.'),
    (2, 'Ngôn tình', 'ngon-tinh', 'Chuyện tình yêu lãng mạn.'),
    (3, 'Khoa học viễn tưởng', 'khoa-hoc-vien-tuong', 'Khám phá vũ trụ và công nghệ.'),
    (4, 'Kinh dị', 'kinh-di', 'Những câu chuyện rùng rợn.'),
    (5, 'Trinh thám', 'trinh-tham', 'Phá án ly kỳ hấp dẫn.'),
    (6, 'Lịch sử', 'lich-su', 'Dựa trên các sự kiện lịch sử.'),
    (7, 'Hài hước', 'hai-huoc', 'Mang lại tiếng cười.'),
    (8, 'Võng du', 'vong-du', 'Truyện về thế giới game.')
]

stories = []
# 20 stories
story_titles = [
    "Ma Tôn Tái Thế", "Tình Yêu Nơi Công Sở", "Chuyến Tàu Ngân Hà", "Căn Nhà Số 13", "Hồ Sơ Bí Ẩn",
    "Đại Nam Hùng Thần", "Cười Xuyên Biên Giới", "Vua Trò Chơi", "Cửu Cung Kiếm Tôn", "Tổng Tài Lạnh Lùng",
    "Bí Ẩn Hành Tinh Z", "Tiếng Khóc Trong Đêm", "Thám Tử Tài Ba", "Trận Chiến Cuối Cùng", "Chuyện Làng Vũ Đại",
    "Tuyệt Thế Võ Thần", "Hào Môn Kinh Mộng", "Du Hành Vượt Thời Gian", "Kẻ Sát Nhân Giấu Mặt", "Hoàng Kim Chi Lộ"
]

covers = [
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
    "https://images.unsplash.com/photo-1478147424095-8e3678385db1?q=80&w=800",
    "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?q=80&w=800",
    "https://images.unsplash.com/photo-1618335359732-c651ee3165b6?q=80&w=800",
    "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=800",
    "https://images.unsplash.com/photo-1520038410233-7141be7e6f97?q=80&w=800",
    "https://images.unsplash.com/photo-1499596811824-71bc73f626f4?q=80&w=800"
]

for i in range(1, 21):
    author_id = random.choice([4, 8, 10, 13])
    cat_id = random.choice(categories)[0]
    title = story_titles[i-1]
    slug = title.lower().replace(" ", "-").replace("đ", "d").replace("ô", "o").replace("ơ", "o").replace("ư", "u").replace("ă", "a").replace("â", "a").replace("ê", "e")
    cover = random.choice(covers)
    views = random.randint(100, 50000)
    follows = random.randint(10, 5000)
    status = "PUBLISHED"
    created_at = datetime.now() - timedelta(days=random.randint(10, 300))
    stories.append((i, author_id, title, slug, f'Tóm tắt cho bộ truyện {title}. Đây là một tác phẩm hấp dẫn.', cover, status, views, follows, created_at))

with open("D:\\abora\\backend\\src\\main\\resources\\db\\migration\\V20__full_seed_mock_data.sql", "w", encoding="utf-8") as f:
    f.write("/* Seed Users */\n")
    f.write("INSERT INTO users (id, email, password_hash, username, display_name, bio, role, status, email_verified, created_at, updated_at) VALUES\n")
    user_values = []
    for u in users:
        # Default pass: 'password' -> Hash: '$2b$10$MJLZZgwTDpyaowJkKeVDGOzpZ8Q.hlqEmJlcY.6E3Oa5K67qSVOau'
        user_values.append(f"({u[0]}, '{u[1]}', '$2b$10$MJLZZgwTDpyaowJkKeVDGOzpZ8Q.hlqEmJlcY.6E3Oa5K67qSVOau', '{u[2]}', '{u[3]}', '{u[4]}', 'USER', 'ACTIVE', TRUE, NOW(), NOW())")
    f.write(",\n".join(user_values) + ";\n\n")

    f.write("/* Seed Stories */\n")
    f.write("INSERT INTO stories (id, author_id, title, slug, description, cover_image_url, status, view_count, follow_count, created_at, updated_at) VALUES\n")
    story_values = []
    for s in stories:
        story_values.append(f"({s[0]}, {s[1]}, '{s[2]}', '{s[3]}', '{s[4]}', '{s[5]}', '{s[6]}', {s[7]}, {s[8]}, '{s[9].strftime('%Y-%m-%d %H:%M:%S')}', '{s[9].strftime('%Y-%m-%d %H:%M:%S')}')")
    f.write(",\n".join(story_values) + ";\n\n")

    f.write("/* Seed Story_Category */\n")
    f.write("INSERT INTO story_categories (story_id, category_id) VALUES\n")
    sc_values = []
    for s in stories:
        cat1 = random.choice(categories)[0]
        cat2 = random.choice(categories)[0]
        sc_values.append(f"({s[0]}, {cat1})")
        if cat1 != cat2:
            sc_values.append(f"({s[0]}, {cat2})")
    f.write(",\n".join(sc_values) + ";\n\n")

    f.write("/* Seed Chapters */\n")
    f.write("INSERT INTO chapters (id, story_id, title, chapter_number, content, word_count, status, published_at, created_at, updated_at) VALUES\n")
    ch_values = []
    chapter_id = 1
    for s in stories:
        num_chapters = random.randint(3, 10)
        for c in range(1, num_chapters + 1):
            ch_title = f"Chương {c}: Sự khởi đầu mới" if c == 1 else f"Chương {c}"
            content = f"Nội dung cực kỳ hấp dẫn của {ch_title}. " * 100
            words = 500
            pub = s[9] + timedelta(days=c)
            ch_values.append(f"({chapter_id}, {s[0]}, '{ch_title}', {c}, '{content}', {words}, 'PUBLISHED', '{pub.strftime('%Y-%m-%d %H:%M:%S')}', '{pub.strftime('%Y-%m-%d %H:%M:%S')}', '{pub.strftime('%Y-%m-%d %H:%M:%S')}')")
            chapter_id += 1
    f.write(",\n".join(ch_values) + ";\n\n")

    f.write("/* Seed Reading History */\n")
    f.write("INSERT INTO reading_histories (user_id, story_id, last_read_chapter_id, last_read_at) VALUES\n")
    rh_values = []
    for u in users:
        selected_stories = random.sample(stories, 3)
        for s in selected_stories:
            rh_values.append(f"({u[0]}, {s[0]}, {s[0]*3}, NOW() - INTERVAL {random.randint(1, 10)} DAY)")
    f.write(",\n".join(rh_values) + ";\n\n")

    f.write("/* Seed Forum Posts */\n")
    with open("D:\\abora\\seed_forum.sql", "r", encoding="utf-8") as forum:
        f.write(forum.read() + "\n")
