import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ReportActionModal.module.css';
import api from '../../services/api';

import toast from 'react-hot-toast';

interface Report {
  id: number;
  reporterId: number;
  reporterUsername: string;
  targetType: 'STORY' | 'COMMENT' | 'USER';
  targetId: number;
  reason: string;
  status: string;
}

interface ReportActionModalProps {
  report: Report;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportActionModal: React.FC<ReportActionModalProps> = ({ report, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [banDays, setBanDays] = useState('3'); // Default 3 days

  const handleAction = async (actionFn: () => Promise<void>) => {
    setLoading(true);
    try {
      await actionFn();
      // Sau khi xử lý xong, đổi trạng thái Báo cáo thành RESOLVED
      await api.put(`/admin/reports/${report.id}/status`, null, {
        params: { status: 'RESOLVED', moderatorNote: note }
      });
      toast.success('Xử lý báo cáo thành công!');
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi xử lý.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await api.put(`/admin/reports/${report.id}/status`, null, {
        params: { status: 'REJECTED', moderatorNote: note || 'Bỏ qua báo cáo' }
      });
      toast.success('Đã bỏ qua báo cáo.');
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  const renderActions = () => {
    if (report.targetType === 'STORY') {
      return (
        <div className={styles.actionGroup}>
          <button 
            className={styles.btnSecondary} 
            onClick={() => handleAction(() => api.put(`/admin/stories/${report.targetId}/status?status=HIDDEN`))}
            disabled={loading}
          >
            Ẩn Truyện
          </button>
          <button 
            className={styles.btnDanger} 
            onClick={() => handleAction(() => api.delete(`/admin/stories/${report.targetId}`))}
            disabled={loading}
          >
            Xóa Truyện
          </button>
        </div>
      );
    }
    if (report.targetType === 'COMMENT') {
      return (
        <div className={styles.actionGroup}>
          <button 
            className={styles.btnSecondary} 
            onClick={() => handleAction(() => api.put(`/admin/comments/${report.targetId}/status?status=HIDDEN`))}
            disabled={loading}
          >
            Ẩn Bình luận
          </button>
          <button 
            className={styles.btnDanger} 
            onClick={() => handleAction(() => api.delete(`/admin/comments/${report.targetId}`))}
            disabled={loading}
          >
            Xóa Bình luận
          </button>
        </div>
      );
    }
    if (report.targetType === 'USER') {
      return (
        <div className={styles.actionGroup}>
          <button 
            className={styles.btnDanger} 
            onClick={() => handleAction(() => api.put(`/admin/users/${report.targetId}/status?status=BANNED`))}
            disabled={loading}
          >
            Khóa Vĩnh Viễn
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', flex: 2 }}>
            <input 
              type="number" 
              min="1" 
              value={banDays} 
              onChange={(e) => setBanDays(e.target.value)} 
              className={styles.daysInput} 
              placeholder="Số ngày..." 
              disabled={loading}
            />
            <button 
              className={styles.btnSecondary} 
              onClick={() => handleAction(() => api.put(`/admin/users/${report.targetId}/status?status=BANNED&bannedDays=${banDays}`))}
              disabled={loading || !banDays}
              style={{ flex: 2 }}
            >
              Khóa Tạm Thời
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Xử lý Báo cáo #{report.id}</h3>
        <div className={styles.info}>
          <p><strong>Loại:</strong> {report.targetType}</p>
          <p><strong>Lý do:</strong> {report.reason}</p>
        </div>
        
        <div className={styles.formGroup}>
          <label>Ghi chú của Quản trị viên</label>
          <textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Lý do xử lý..."
            rows={3}
          />
        </div>

        <div className={styles.actions}>
          {renderActions()}
          <button 
            className={styles.btnSecondary} 
            onClick={handleReject}
            disabled={loading}
            style={{ marginTop: '0.5rem' }}
          >
            Bỏ qua (Từ chối)
          </button>
          <button 
            className={styles.btnSecondary} 
            onClick={onClose}
            disabled={loading}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
