import React, { useEffect } from "react";
import "./LegalPages.css";

export const TermsPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-container fade-in">
      <div className="legal-card glass-panel">
        <h1 className="legal-title">Điều Khoản Sử Dụng</h1>
        <p className="legal-subtitle">Cập nhật lần cuối: 31 tháng 5, 2026</p>
        
        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Chấp thuận Điều khoản</h2>
            <p>
              Chào mừng bạn đến với <strong>Abora</strong>. Bằng việc truy cập, đăng ký tài khoản hoặc sử dụng bất kỳ tính năng nào của trang web này, bạn đồng ý tuân thủ và chịu sự ràng buộc bởi các Điều khoản Sử dụng này cùng với Chính sách Bảo mật của chúng tôi. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng ngừng sử dụng dịch vụ của chúng tôi ngay lập tức.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Tài khoản Người dùng</h2>
            <p>
              Để sử dụng một số tính năng như viết truyện, bình luận, và theo dõi thư viện, bạn phải đăng ký một tài khoản. Bạn có trách nhiệm bảo mật mật khẩu tài khoản của mình và chịu mọi trách nhiệm cho bất kỳ hoạt động nào diễn ra dưới tên tài khoản đó. Bạn đồng ý thông báo ngay cho chúng tôi nếu phát hiện bất kỳ hành vi sử dụng trái phép nào đối với tài khoản của mình.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Quyền Sở hữu Trí tuệ & Nội dung</h2>
            <ul>
              <li>
                <strong>Nội dung của Tác giả:</strong> Các tác giả đăng tải truyện trên Abora giữ toàn bộ quyền sở hữu trí tuệ đối với các tác phẩm của mình. Bằng việc đăng truyện trên Abora, bạn cấp cho chúng tôi một giấy phép không độc quyền, miễn phí bản quyền để lưu trữ, hiển thị, định dạng và phân phối tác phẩm đó trên nền tảng của Abora.
              </li>
              <li>
                <strong>Nội dung của Nền tảng:</strong> Giao diện, thiết kế, logo, mã nguồn, đồ họa và các tài nguyên kỹ thuật khác của Abora là tài sản độc quyền của Abora và được bảo hộ bởi pháp luật sở hữu trí tuệ. Bạn không được sao chép, trích xuất dữ liệu hoặc tái sử dụng bất kỳ phần nào của nền tảng khi không có sự đồng ý bằng văn bản của chúng tôi.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Tiêu chuẩn Cộng đồng & Quy định Hành vi</h2>
            <p>
              Bạn cam kết không đăng tải, truyền tải hoặc chia sẻ bất kỳ nội dung nào:
            </p>
            <ul>
              <li>Vi phạm pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam hoặc các quy định quốc tế.</li>
              <li>Có nội dung kích động thù hận, bạo lực, phân biệt chủng tộc, tôn giáo hoặc giới tính.</li>
              <li>Xâm phạm quyền riêng tư, danh dự hoặc quyền sở hữu trí tuệ của người khác.</li>
              <li>Nội dung đồi trụy, khiêu dâm không được gắn mác phù hợp hoặc vượt quá tiêu chuẩn cộng đồng.</li>
              <li>Spam, quảng cáo trái phép hoặc phát tán phần mềm độc hại.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Quyền hạn của Ban quản trị</h2>
            <p>
              Ban quản trị Abora có toàn quyền trong việc kiểm duyệt nội dung. Chúng tôi có quyền:
            </p>
            <ul>
              <li>Gỡ bỏ, tạm ẩn hoặc chỉnh sửa bất kỳ truyện, chương truyện, bình luận hoặc bài viết nào vi phạm điều khoản sử dụng hoặc tiêu chuẩn cộng đồng mà không cần báo trước.</li>
              <li>Tạm khóa hoặc khóa vĩnh viễn tài khoản của người dùng có hành vi vi phạm nhiều lần hoặc vi phạm nghiêm trọng.</li>
              <li>Hợp tác với các cơ quan chức năng có thẩm quyền trong việc xử lý các vi phạm pháp luật.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Giới hạn Trách nhiệm</h2>
            <p>
              Abora hoạt động như một nền tảng chia sẻ và lưu trữ nội dung do người dùng tạo ra. Chúng tôi không đảm bảo tính chính xác, đầy đủ hoặc chất lượng của bất kỳ nội dung nào do người dùng đăng tải. Bạn tự chịu rủi ro khi tiếp cận với các nội dung trên trang web. Abora sẽ không chịu trách nhiệm cho bất kỳ thiệt hại trực tiếp hoặc gián tiếp nào phát sinh từ việc sử dụng hoặc không thể sử dụng nền tảng của chúng tôi.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Thay đổi Điều khoản</h2>
            <p>
              Chúng tôi có quyền sửa đổi hoặc thay đổi các Điều khoản Sử dụng này vào bất kỳ lúc nào. Mọi thay đổi sẽ có hiệu lực ngay khi được đăng tải trên trang web này. Việc bạn tiếp tục sử dụng Abora sau khi các thay đổi được đăng tải đồng nghĩa với việc bạn chấp thuận các điều khoản mới đó.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Thông tin Liên hệ</h2>
            <p>
              Nếu bạn có bất kỳ câu hỏi hoặc thắc mắc nào liên quan đến Điều khoản Sử dụng này, vui lòng liên hệ với chúng tôi qua email: <a href="mailto:ngcvan04@gmail.com" className="legal-email">ngcvan04@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
