import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, X } from 'lucide-react';
import './AdminDeleteReasonModal.css';

interface AdminDeleteReasonModalProps {
  isOpen: boolean;
  title?: string;
  itemType: 'POST' | 'COMMENT';
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const PRESET_REASONS = [
  'Spam / Quảng cáo không phù hợp',
  'Ngôn từ xúc phạm, thù ghét hoặc kích động',
  'Nội dung vi phạm tiêu chuẩn cộng đồng Abora',
  'Thông tin sai sự thật hoặc tranh cãi tiêu cực',
  'Lý do khác'
];

export const AdminDeleteReasonModal: React.FC<AdminDeleteReasonModalProps> = ({
  isOpen,
  title,
  itemType,
  onClose,
  onConfirm
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_REASONS[2]);
  const [customReason, setCustomReason] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedPreset === 'Lý do khác'
      ? customReason.trim() || 'Vi phạm tiêu chuẩn cộng đồng'
      : selectedPreset + (customReason.trim() ? `: ${customReason.trim()}` : '');
    onConfirm(finalReason);
  };

  return createPortal(
    <div className="admin-delete-overlay" onClick={onClose}>
      <div className="admin-delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-delete-header">
          <div className="admin-delete-title">
            <ShieldAlert size={20} className="admin-icon" />
            <span>{title || `[Admin] Xóa ${itemType === 'POST' ? 'bài viết' : 'bình luận'}`}</span>
          </div>
          <button className="admin-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-delete-body">
          <p className="admin-delete-subtitle">
            Vui lòng chọn hoặc nhập lý do xóa. Thông báo này sẽ được gửi trực tiếp đến chủ sở hữu nội dung:
          </p>

          <div className="preset-reasons-list">
            {PRESET_REASONS.map((reason) => (
              <label 
                key={reason} 
                className={`preset-reason-item ${selectedPreset === reason ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="admin-delete-reason"
                  value={reason}
                  checked={selectedPreset === reason}
                  onChange={() => setSelectedPreset(reason)}
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <div className="custom-reason-wrapper">
            <label className="custom-reason-label">Ghi chú bổ sung (không bắt buộc):</label>
            <textarea
              className="custom-reason-textarea"
              placeholder={selectedPreset === 'Lý do khác' ? 'Nhập chi tiết lý do xóa (bắt buộc)...' : 'Nhập thêm giải thích chi tiết cho người dùng...'}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="admin-delete-actions">
            <button type="button" className="btn-admin-cancel" onClick={onClose}>
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn-admin-confirm"
              disabled={selectedPreset === 'Lý do khác' && !customReason.trim()}
            >
              Xác nhận xóa
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
