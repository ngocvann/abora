import React, { useEffect } from "react";
import "./LegalPages.css";

export const PrivacyPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-container fade-in">
      <div className="legal-card glass-panel">
        <h1 className="legal-title">Chính Sách Bảo Mật</h1>
        <p className="legal-subtitle">Cập nhật lần cuối: 31 tháng 5, 2026</p>
        
        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Thu thập Thông tin</h2>
            <p>
              Abora cam kết bảo vệ quyền riêng tư trực tuyến của bạn. Khi sử dụng nền tảng của chúng tôi, chúng tôi có thể thu thập các loại thông tin sau:
            </p>
            <ul>
              <li>
                <strong>Thông tin cá nhân do bạn cung cấp:</strong> Địa chỉ email, tên đăng nhập (username), mật khẩu mã hóa khi bạn đăng ký tài khoản.
              </li>
              <li>
                <strong>Lịch sử hoạt động và tương tác:</strong> Danh sách truyện bạn đã đọc, đánh dấu, bình luận, theo dõi, vị trí chương đọc dở và các tùy chọn cấu hình giao diện đọc truyện (cỡ chữ, màu nền).
              </li>
              <li>
                <strong>Dữ liệu kỹ thuật:</strong> Địa chỉ IP, loại trình duyệt, hệ điều hành và thời gian truy cập thông qua cookies và các công nghệ tương tự nhằm duy trì phiên đăng nhập và cải thiện hiệu năng.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>2. Mục đích Sử dụng Thông tin</h2>
            <p>
              Chúng tôi sử dụng thông tin thu thập được để:
            </p>
            <ul>
              <li>Cung cấp và duy trì các dịch vụ của Abora (như lưu lịch sử đọc dở, đồng bộ thư viện cá nhân).</li>
              <li>Cá nhân hóa trải nghiệm đọc truyện (gợi ý truyện phù hợp dựa trên thói quen đọc của bạn).</li>
              <li>Gửi các thông báo quan trọng liên quan đến tài khoản, thay đổi dịch vụ hoặc phản hồi các báo cáo vi phạm.</li>
              <li>Phân tích, đánh giá hiệu năng và cải tiến trải nghiệm giao diện người dùng.</li>
              <li>Phát hiện, ngăn chặn các hành vi gian lận, phá hoại hoặc vi phạm điều khoản sử dụng.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Bảo mật Thông tin</h2>
            <p>
              Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu cá nhân của bạn khỏi bị truy cập trái phép, thay đổi, tiết lộ hoặc hủy hoại. Mật khẩu của bạn được lưu trữ ở dạng băm (hashing) bảo mật cao ở cơ sở dữ liệu. Tuy nhiên, không có phương thức truyền tải qua Internet hoặc lưu trữ điện tử nào là an toàn 100%, do đó chúng tôi không thể cam kết bảo mật tuyệt đối.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Cookies</h2>
            <p>
              Abora sử dụng cookies để lưu trữ thông tin phiên đăng nhập của bạn (session cookies) và các tùy chọn giao diện cá nhân. Bạn có thể chọn tắt cookies trong phần cài đặt của trình duyệt, tuy nhiên điều này có thể ảnh hưởng đến khả năng đăng nhập và một số chức năng lưu trữ tự động của trang web.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Chia sẻ Thông tin với Bên thứ ba</h2>
            <p>
              Chúng tôi cam kết **không bán, trao đổi hoặc cho thuê** dữ liệu cá nhân của người dùng cho bất kỳ bên thứ ba nào vì mục đích thương mại. Chúng tôi chỉ tiết lộ thông tin của bạn trong các trường hợp:
            </p>
            <ul>
              <li>Có sự đồng ý rõ ràng từ phía bạn.</li>
              <li>Để tuân thủ các nghĩa vụ pháp lý, lệnh của tòa án hoặc yêu cầu hợp pháp từ cơ quan nhà nước có thẩm quyền.</li>
              <li>Để bảo vệ quyền lợi, tài sản hoặc sự an toàn của Abora, người dùng của chúng tôi hoặc cộng đồng.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Quyền của Người dùng</h2>
            <p>
              Bạn có toàn quyền kiểm soát dữ liệu của mình trên Abora:
            </p>
            <ul>
              <li>Bạn có thể xem, chỉnh sửa thông tin cá nhân của mình bất kỳ lúc nào thông qua trang Cài đặt tài khoản.</li>
              <li>Bạn có quyền yêu cầu xóa tài khoản và mọi dữ liệu liên quan khỏi hệ thống của chúng tôi bằng cách liên hệ trực tiếp với Ban quản trị.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Thay đổi Chính sách Bảo mật</h2>
            <p>
              Chúng tôi có thể cập nhật Chính sách Bảo mật này theo thời gian. Mọi thay đổi sẽ được công bố trên trang này kèm theo ngày cập nhật mới nhất. Chúng tôi khuyến khích bạn thường xuyên kiểm tra trang này để cập nhật các thay đổi mới nhất về cách chúng tôi bảo vệ thông tin của bạn.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Thông tin Liên hệ</h2>
            <p>
              Nếu bạn có bất kỳ câu hỏi nào về Chính sách Bảo mật này hoặc muốn yêu cầu xóa tài khoản/dữ liệu của mình, vui lòng liên hệ qua email: <a href="mailto:ngcvan04@gmail.com" className="legal-email">ngcvan04@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
