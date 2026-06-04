import React from 'react';
import { Palette, CheckCircle2, Sparkles } from 'lucide-react';
import './ThemePage.css';

export const ThemePage: React.FC = () => {
  return (
    <div className="theme-page">
      <div className="theme-container">
        <h1 className="theme-page-title">
          <Palette className="mr-2 inline text-primary" size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Giao diện & Chủ đề
        </h1>
        <p className="theme-page-subtitle">Tùy chỉnh không gian đọc và tương tác của bạn trên Abora</p>

        <div className="theme-grid">
          {/* Default Theme Card */}
          <div className="theme-card active">
            <div className="theme-card-preview default-preview">
              <div className="preview-stars"></div>
              <div className="preview-glow"></div>
              <div className="preview-elements">
                <span className="preview-title">Abora Galaxy</span>
                <div className="preview-line"></div>
                <div className="preview-line short"></div>
              </div>
            </div>
            <div className="theme-card-info">
              <div className="theme-card-header">
                <h3 className="theme-title">Galaxy (Mặc định)</h3>
                <span className="theme-active-badge">
                  <CheckCircle2 size={14} /> Đang chọn
                </span>
              </div>
              <p className="theme-desc">Không gian vũ trụ sâu thẳm kết hợp tinh vân tím hồng huyền ảo.</p>
            </div>
          </div>

          {/* Coming Soon Theme Card 1 */}
          <div className="theme-card locked">
            <div className="theme-card-preview light-preview">
              <div className="preview-elements">
                <span className="preview-title dark-text">Abora Light</span>
                <div className="preview-line dark-bg"></div>
                <div className="preview-line short dark-bg"></div>
              </div>
            </div>
            <div className="theme-card-info">
              <div className="theme-card-header">
                <h3 className="theme-title">Giao diện Sáng</h3>
                <span className="theme-locked-badge">Sắp ra mắt</span>
              </div>
              <p className="theme-desc">Trang nhã, rõ ràng với độ tương phản tối ưu cho đọc sách ban ngày.</p>
            </div>
          </div>

          {/* Coming Soon Theme Card 2 */}
          <div className="theme-card locked">
            <div className="theme-card-preview cyberpunk-preview">
              <div className="preview-glow-cyber"></div>
              <div className="preview-elements">
                <span className="preview-title cyber-text">Cyberpunk Neon</span>
                <div className="preview-line cyber-bg"></div>
                <div className="preview-line short cyber-bg"></div>
              </div>
            </div>
            <div className="theme-card-info">
              <div className="theme-card-header">
                <h3 className="theme-title">Cyberpunk Neon</h3>
                <span className="theme-locked-badge">Sắp ra mắt</span>
              </div>
              <p className="theme-desc">Sự nổi loạn của sắc vàng neon và hồng dạ quang đậm chất viễn tưởng.</p>
            </div>
          </div>

          {/* Coming Soon Theme Card 3 */}
          <div className="theme-card locked">
            <div className="theme-card-preview emerald-preview">
              <div className="preview-glow-emerald"></div>
              <div className="preview-elements">
                <span className="preview-title emerald-text">Forest Emerald</span>
                <div className="preview-line emerald-bg"></div>
                <div className="preview-line short emerald-bg"></div>
              </div>
            </div>
            <div className="theme-card-info">
              <div className="theme-card-header">
                <h3 className="theme-title">Lục Bảo</h3>
                <span className="theme-locked-badge">Sắp ra mắt</span>
              </div>
              <p className="theme-desc">Tông màu xanh lá cây mát dịu, thư giãn cho đôi mắt khi đọc lâu.</p>
            </div>
          </div>
        </div>

        <div className="theme-footer-notice">
          <Sparkles size={16} style={{ color: '#eab308', marginRight: '0.5rem' }} />
          <span>Chúng tôi đang thiết kế thêm nhiều chủ đề tuyệt vời khác. Hãy đón chờ nhé!</span>
        </div>
      </div>
    </div>
  );
};
