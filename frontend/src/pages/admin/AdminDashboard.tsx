import React, { useEffect, useState } from 'react';
import { Users, BookOpen, AlertTriangle, MessageSquare, Send, Image } from 'lucide-react';
import api from '../../services/api';
import styles from './AdminDashboard.module.css';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface DashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalStories: number;
  newStoriesThisMonth: number;
  pendingReports: number;
  totalComments: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Notification Broadcast State
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastUrl, setBroadcastUrl] = useState('');
  const [broadcastUser, setBroadcastUser] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  // Banner Settings State
  const [bannerUrl, setBannerUrl] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  useEffect(() => {
    // Fetch banner url
    api.get('/settings/home_banner').then(res => {
      if (res.data && res.data.value) {
        setBannerUrl(res.data.value);
      }
    }).catch(console.error);

    // Replace with real API call later
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingBanner(true);
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.url) {
        setBannerUrl(res.data.url);
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload ảnh thất bại.');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleSaveBanner = async () => {
    setIsSavingBanner(true);
    try {
      await api.post('/settings/home_banner', { value: bannerUrl });
      alert('Đã lưu banner thành công!');
    } catch (err) {
      console.error('Save failed', err);
      alert('Lưu banner thất bại.');
    } finally {
      setIsSavingBanner(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div>
      <h1 className={`${styles.pageTitle} text-gradient`}>Tổng quan hệ thống</h1>
      
      <div className={styles.dashboardGrid}>
        <div className={`glass-panel ${styles.statCard} ${styles.cardUsers}`}>
          <div className={styles.statHeader}>
            <span>Người dùng</span>
            <div className={styles.statIcon}><Users size={24} /></div>
          </div>
          <div className={styles.statValue}>{stats?.totalUsers || 0}</div>
          <div className={styles.statTrend}>
            <span className={styles.trendUp}>+{stats?.newUsersThisMonth || 0}</span>
            <span className={styles.trendNeutral}>trong tháng này</span>
          </div>
        </div>

        <div className={`glass-panel ${styles.statCard} ${styles.cardStories}`}>
          <div className={styles.statHeader}>
            <span>Truyện</span>
            <div className={styles.statIcon}><BookOpen size={24} /></div>
          </div>
          <div className={styles.statValue}>{stats?.totalStories || 0}</div>
          <div className={styles.statTrend}>
            <span className={styles.trendUp}>+{stats?.newStoriesThisMonth || 0}</span>
            <span className={styles.trendNeutral}>trong tháng này</span>
          </div>
        </div>

        <div className={`glass-panel ${styles.statCard} ${styles.cardReports}`}>
          <div className={styles.statHeader}>
            <span>Báo cáo chờ xử lý</span>
            <div className={styles.statIcon}><AlertTriangle size={24} /></div>
          </div>
          <div className={styles.statValue}>{stats?.pendingReports || 0}</div>
          <div className={styles.statTrend}>
            {stats?.pendingReports && stats.pendingReports > 0 ? (
              <span className={styles.trendDown}>Cần xử lý ngay</span>
            ) : (
              <span className={styles.trendNeutral}>Không có báo cáo</span>
            )}
          </div>
        </div>

        <div className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statHeader}>
            <span>Bình luận</span>
            <div className={styles.statIcon} style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}><MessageSquare size={24} /></div>
          </div>
          <div className={styles.statValue}>{stats?.totalComments || 0}</div>
          <div className={styles.statTrend}>
            <span className={styles.trendNeutral}>Toàn hệ thống</span>
          </div>
        </div>
      </div>
      
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Send size={20} />
          Gửi thông báo hệ thống
        </h3>
        
        {sendSuccess && (
          <div style={{ padding: '0.75rem', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderRadius: '8px', marginBottom: '1rem' }}>
            {sendSuccess}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nội dung thông báo *</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Nhập nội dung thông báo..."
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Username người nhận (Tùy chọn)</label>
              <input
                className="form-input"
                type="text"
                placeholder="Để trống = Gửi cho TẤT CẢ"
                value={broadcastUser}
                onChange={(e) => setBroadcastUser(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Đường dẫn đính kèm (Tùy chọn)</label>
              <input
                className="form-input"
                type="text"
                placeholder="Ví dụ: /about"
                value={broadcastUrl}
                onChange={(e) => setBroadcastUrl(e.target.value)}
              />
            </div>
          </div>
          <button
            className="primary-btn"
            style={{ alignSelf: 'flex-start' }}
            disabled={!broadcastMsg.trim() || isSending}
            onClick={() => setShowConfirm(true)}
          >
            {isSending ? 'Đang gửi...' : 'Gửi thông báo'}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={async () => {
          setIsSending(true);
          setSendSuccess(null);
          try {
            await api.post('/admin/notifications/broadcast', {
              message: broadcastMsg,
              targetUrl: broadcastUrl,
              targetUsername: broadcastUser,
            });
            setSendSuccess('Đã gửi thông báo thành công!');
            setBroadcastMsg('');
            setBroadcastUrl('');
            setBroadcastUser('');
            setTimeout(() => setSendSuccess(null), 3000);
          } catch (err) {
            console.error('Lỗi khi gửi thông báo', err);
            alert('Có lỗi xảy ra khi gửi thông báo. Vui lòng thử lại.');
          } finally {
            setIsSending(false);
            setShowConfirm(false);
          }
        }}
        title="Xác nhận gửi thông báo"
        message={broadcastUser.trim() ? `Bạn có chắc chắn muốn gửi thông báo này tới người dùng "${broadcastUser}" không?` : `CẢNH BÁO: Bạn đang chuẩn bị gửi thông báo này tới TOÀN BỘ NGƯỜI DÙNG trên hệ thống. Bạn có chắc chắn không?`}
        confirmText="Gửi"
        cancelText="Hủy"
        isDanger={true}
      />

      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Image size={20} />
          Cài đặt giao diện (Banner)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>URL Ảnh Banner Trang chủ & Khám phá</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="form-input"
                type="text"
                placeholder="Nhập URL ảnh hoặc upload..."
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                style={{ flex: 1 }}
              />
              <button 
                className="primary-btn" 
                onClick={handleSaveBanner}
                disabled={isSavingBanner}
                style={{ whiteSpace: 'nowrap' }}
              >
                {isSavingBanner ? 'Đang lưu...' : 'Lưu Banner'}
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Hoặc Upload ảnh từ máy tính</label>
            <input 
              type="file" 
              accept="image/*"
              className="form-input"
              onChange={handleUploadBanner}
              disabled={isUploadingBanner}
            />
            {isUploadingBanner && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '10px' }}>Đang upload...</span>}
          </div>
          {bannerUrl && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Xem trước:</p>
              <img src={bannerUrl} alt="Banner Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--reader-border)' }} />
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
