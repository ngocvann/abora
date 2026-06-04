import React, { useState } from 'react';
import { HelpCircle, Book, MessageCircle, FileText, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import './HelpPage.css';

interface FAQ {
  id: string;
  question: string;
  answer: React.ReactNode;
}

const FAQS: FAQ[] = [
  {
    id: 'faq-1',
    question: 'Làm thế nào để đăng truyện mới?',
    answer: 'Bạn có thể vào mục "Studio Của Tôi" từ menu dropdown cá nhân. Tại đây, chọn "Tạo truyện mới", điền thông tin và bắt đầu viết các chương truyện. Khi sẵn sàng, hãy nhấn Xuất bản để độc giả có thể đọc tác phẩm của bạn.'
  },
  {
    id: 'faq-2',
    question: 'Tại sao bình luận của tôi bị xóa?',
    answer: 'Bình luận có thể bị xóa nếu vi phạm Tiêu chuẩn Cộng đồng của chúng tôi (chứa ngôn từ kích động, xúc phạm, spam, v.v.). Ngoài ra, tác giả của bài viết/truyện cũng có quyền quản lý và xóa bình luận trong bài viết/truyện của họ.'
  },
  {
    id: 'faq-3',
    question: 'Làm thế nào để báo cáo bài viết hoặc người dùng?',
    answer: 'Trong các bài đăng hoặc bình luận, bạn có thể nhấn vào biểu tượng 3 chấm (...) góc phải trên cùng và chọn "Báo cáo". Chúng tôi sẽ tiếp nhận và xử lý trong thời gian sớm nhất.'
  },
  {
    id: 'faq-4',
    question: 'Tôi có thể thay đổi tên đăng nhập (username) không?',
    answer: 'Có! Bạn có thể thay đổi tên hiển thị và tên đăng nhập của mình tại trang Cài đặt tài khoản. Lưu ý, tên đăng nhập (username) chỉ chứa chữ cái, số và dấu gạch dưới (_).'
  }
];

export const HelpPage: React.FC = () => {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div className="help-page fade-in">
      <div className="help-header">
        <h1 className="help-title">Trung tâm Trợ giúp</h1>
        <p className="help-subtitle">Chúng tôi có thể giúp gì cho bạn hôm nay?</p>
      </div>

      <div className="help-content">
        <div className="help-categories">
          <div className="help-category-card">
            <Book size={32} className="help-category-icon" />
            <h3>Hướng dẫn Đọc & Viết</h3>
            <p>Tìm hiểu cách sử dụng công cụ sáng tác, đăng truyện và quản lý thư viện.</p>
          </div>
          <div className="help-category-card">
            <MessageCircle size={32} className="help-category-icon" />
            <h3>Cộng đồng & Tương tác</h3>
            <p>Cách tham gia diễn đàn, bình luận và quy tắc cộng đồng.</p>
          </div>
          <div className="help-category-card">
            <FileText size={32} className="help-category-icon" />
            <h3>Chính sách & Quy định</h3>
            <p>
              Xem chi tiết <Link to="/terms" className="help-link">Điều khoản Dịch vụ</Link> và <Link to="/privacy" className="help-link">Chính sách Bảo mật</Link>.
            </p>
          </div>
        </div>

        <div className="faq-section">
          <h2 className="section-title">
            <HelpCircle size={24} />
            Câu hỏi thường gặp
          </h2>
          <div className="faq-list">
            {FAQS.map(faq => (
              <div key={faq.id} className={`faq-item ${openFaqId === faq.id ? 'open' : ''}`}>
                <button className="faq-question" onClick={() => toggleFaq(faq.id)}>
                  <span>{faq.question}</span>
                  {openFaqId === faq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-content">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="contact-section">
          <h2>Bạn vẫn cần hỗ trợ?</h2>
          <p>Nếu bạn không tìm thấy câu trả lời, đừng ngần ngại liên hệ với chúng tôi.</p>
          <a href="mailto:support@abora.vn" className="contact-btn">
            <Mail size={18} /> Gửi Email Hỗ trợ
          </a>
        </div>
      </div>
    </div>
  );
};
