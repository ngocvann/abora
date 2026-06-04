import React from "react";
import { createPortal } from "react-dom";
import { X, Eye, Heart, MessageCircle, TrendingUp, Users } from "lucide-react";
import type { Story } from "../../types/story";
import "./AnalyticsModal.css";

interface AnalyticsModalProps {
  story: Story;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ story, onClose }) => {
  // Mock data for charts if needed, or just display raw numbers
  const conversionRate = story.viewCount > 0 ? ((story.favoriteCount / story.viewCount) * 100).toFixed(2) : "0.00";
  const engagementRate = story.viewCount > 0 ? ((story.commentCount / story.viewCount) * 100).toFixed(2) : "0.00";

  return createPortal(
    <div className="analytics-modal-overlay" onClick={onClose}>
      <div className="analytics-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="analytics-modal-header">
          <h2>Thống kê tác phẩm</h2>
          <button className="analytics-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="analytics-modal-body">
          <div className="analytics-story-info">
            <h3>{story.title}</h3>
            <p>{story.chapterCount} Chương • Đã xuất bản: {new Date(story.createdAt).toLocaleDateString("vi-VN")}</p>
          </div>

          <div className="analytics-stats-grid">
            <div className="analytics-stat-card">
              <div className="stat-card-icon view-icon">
                <Eye size={24} />
              </div>
              <div className="stat-card-info">
                <span className="stat-card-label">Tổng lượt xem</span>
                <span className="stat-card-value">{story.viewCount}</span>
              </div>
            </div>

            <div className="analytics-stat-card">
              <div className="stat-card-icon fav-icon">
                <Heart size={24} />
              </div>
              <div className="stat-card-info">
                <span className="stat-card-label">Lượt thích</span>
                <span className="stat-card-value">{story.favoriteCount}</span>
              </div>
            </div>

            <div className="analytics-stat-card">
              <div className="stat-card-icon comment-icon">
                <MessageCircle size={24} />
              </div>
              <div className="stat-card-info">
                <span className="stat-card-label">Bình luận</span>
                <span className="stat-card-value">{story.commentCount}</span>
              </div>
            </div>

            <div className="analytics-stat-card">
              <div className="stat-card-icon follow-icon">
                <Users size={24} />
              </div>
              <div className="stat-card-info">
                <span className="stat-card-label">Người theo dõi</span>
                <span className="stat-card-value">{story.followCount}</span>
              </div>
            </div>
          </div>

          <div className="analytics-metrics-section">
            <h3>Chỉ số tương tác</h3>
            <div className="metrics-list">
              <div className="metric-item">
                <TrendingUp size={20} className="metric-icon" />
                <div className="metric-details">
                  <span className="metric-name">Tỷ lệ chuyển đổi (Thích / Xem)</span>
                  <div className="metric-bar-container">
                    <div className="metric-bar" style={{ width: `${Math.min(100, Number(conversionRate))}%` }}></div>
                  </div>
                </div>
                <span className="metric-score">{conversionRate}%</span>
              </div>
              
              <div className="metric-item">
                <TrendingUp size={20} className="metric-icon" />
                <div className="metric-details">
                  <span className="metric-name">Tỷ lệ tương tác (Bình luận / Xem)</span>
                  <div className="metric-bar-container">
                    <div className="metric-bar" style={{ width: `${Math.min(100, Number(engagementRate))}%`, backgroundColor: 'var(--primary-color)' }}></div>
                  </div>
                </div>
                <span className="metric-score">{engagementRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
