import React from "react";
import { Link } from "react-router-dom";
import { Mail, MessageSquare, Shield, Smartphone, ExternalLink } from "lucide-react";
import "./Footer.css";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/logo.png" alt="Abora Logo" className="footer-logo-img" />
          </div>
          <p className="footer-slogan">
            Nơi những câu chuyện tuyệt vời nhất<br />được sinh ra và lan tỏa.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-col footer-col-explore">
          <h4 className="footer-col-title">Khám phá</h4>
          <nav className="footer-links">
            <Link to="/" className="footer-link">Trang chủ</Link>
            <Link to="/explore" className="footer-link">Khám phá</Link>
            <Link to="/library" className="footer-link">Thư viện</Link>
            <Link to="/studio" className="footer-link">Viết truyện</Link>
          </nav>
        </div>

        {/* Support */}
        <div className="footer-col">
          <h4 className="footer-col-title">Hỗ trợ</h4>
          <nav className="footer-links">
            <a href="mailto:ngcvan04@gmail.com" className="footer-link">
              <Mail size={14} /> ngcvan04@gmail.com
            </a>
            <a href="mailto:ngcvan04@gmail.com?subject=B%C3%A1o%20c%C3%A1o%20vi%20ph%E1%BA%A1m%20Abora" className="footer-link">
              <Shield size={14} /> Báo cáo vi phạm
            </a>
            <a href="mailto:ngcvan04@gmail.com?subject=Ph%E1%BA%A3n%20h%E1%BB%93i%20v%C3%A0%20G%C3%B3p%20%C3%BD%20Abora" className="footer-link">
              <MessageSquare size={14} /> Phản hồi & góp ý
            </a>
          </nav>
        </div>

        {/* Social */}
        <div className="footer-col">
          <h4 className="footer-col-title">Kết nối</h4>
          <nav className="footer-links">
            <a href="https://www.facebook.com/ngocvan04" target="_blank" rel="noopener noreferrer" className="footer-link">
              <ExternalLink size={14} /> Facebook
            </a>
            <a href="https://discord.com/invite/xsdgfQjtNx" target="_blank" rel="noopener noreferrer" className="footer-link">
              <ExternalLink size={14} /> Discord
            </a>
            <a href="#" className="footer-link footer-link-disabled">
              <Smartphone size={14} /> App mobile (sắp ra mắt)
            </a>
          </nav>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-info">
          <span>© {currentYear} Abora. All rights reserved.</span>
          <span className="footer-bottom-divider">|</span>
          <Link to="/terms" target="_blank" rel="noopener noreferrer" className="footer-bottom-link">
            Điều khoản sử dụng
          </Link>
          <span className="footer-bottom-divider">|</span>
          <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="footer-bottom-link">
            Chính sách bảo mật
          </Link>
        </div>
        <span className="footer-bottom-note footer-quote">You are me, I am you</span>
      </div>
    </footer>
  );
};
