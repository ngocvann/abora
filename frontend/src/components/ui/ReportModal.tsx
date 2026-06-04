import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { X } from 'lucide-react';
import './ConfirmModal.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'STORY' | 'CHAPTER' | 'COMMENT' | 'USER' | 'POST';
  targetId: number;
}

const REPORT_CATEGORIES = [
  "Nội dung phản cảm, đồi trụy",
  "Vi phạm bản quyền / Đạo nhái",
  "Spam, quảng cáo trái phép",
  "Ngôn từ kích động, thù ghét",
  "Khác"
];

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, targetType, targetId }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const reportMutation = useMutation({
    mutationFn: (reason: string) => api.post('/reports', { targetType, targetId, reason }),
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
        setSelectedCategory('');
        setDetails('');
      }, 2000);
    },
    onError: (error: any) => {
      alert("Đã có lỗi xảy ra khi gửi báo cáo: " + (error.response?.data?.message || error.message));
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      alert("Vui lòng chọn một lý do báo cáo.");
      return;
    }
    if (selectedCategory === "Khác" && !details.trim()) {
      alert("Vui lòng cung cấp thêm chi tiết cho lý do báo cáo.");
      return;
    }

    const fullReason = `[${selectedCategory}] ${details.trim()}`;
    reportMutation.mutate(fullReason);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
        {showSuccess ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <h3 style={{ color: '#10b981', fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>Gửi Báo Cáo Thành Công</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Cảm ơn bạn đã góp phần xây dựng cộng đồng. Chúng tôi sẽ xem xét báo cáo này sớm nhất có thể.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Báo Cáo Vi Phạm</h3>
              <button 
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="modal-message" style={{ marginBottom: '1.5rem' }}>
              Vui lòng chọn lý do báo cáo phù hợp để giúp quản trị viên xử lý nhanh chóng hơn.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {REPORT_CATEGORIES.map((category) => (
                  <label key={category} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="reportCategory" 
                      value={category} 
                      checked={selectedCategory === category}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={{ accentColor: 'var(--primary-color)' }}
                    />
                    <span style={{ color: selectedCategory === category ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {category}
                    </span>
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Chi tiết bổ sung (bắt buộc nếu chọn "Khác")
                </label>
                <textarea
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: 'var(--text-primary)',
                    resize: 'none',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                  rows={3}
                  placeholder="Mô tả cụ thể vấn đề..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={onClose}>
                  Hủy
                </button>
                <button type="submit" className="btn-confirm" disabled={reportMutation.isPending}>
                  {reportMutation.isPending ? 'Đang gửi...' : 'Gửi Báo Cáo'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};
