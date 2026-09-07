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
  const [homeBannerMode, setHomeBannerMode] = useState<'default' | 'custom'>('default');
  const [homeBannerUrl, setHomeBannerUrl] = useState('');
  
  const [exploreBannerMode, setExploreBannerMode] = useState<'default' | 'custom'>('default');
  const [exploreBannerUrl, setExploreBannerUrl] = useState('');

  const [isUploadingBanner, setIsUploadingBanner] = useState<'home' | 'explore' | false>(false);
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  useEffect(() => {
    // Fetch home banner
    api.get('/settings/home_banner').then(res => {
      if (res.data && res.data.value) {
        setHomeBannerMode('custom');
        setHomeBannerUrl(res.data.value);
      } else {
        setHomeBannerMode('default');
        setHomeBannerUrl('');
      }
    }).catch(console.error);

    // Fetch explore banner
    api.get('/settings/explore_banner').then(res => {
      if (res.data && res.data.value) {
        setExploreBannerMode('custom');
        setExploreBannerUrl(res.data.value);
      } else {
        setExploreBannerMode('default');
        setExploreBannerUrl('');
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

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>, target: 'home' | 'explore') => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingBanner(target);
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.url) {
        if (target === 'home') {
          setHomeBannerUrl(res.data.url);
          setHomeBannerMode('custom');
        } else {
          setExploreBannerUrl(res.data.url);
          setExploreBannerMode('custom');
        }
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
      await Promise.all([
        api.post('/settings/home_banner', { value: homeBannerMode === 'custom' ? homeBannerUrl : '' }),
        api.post('/settings/explore_banner', { value: exploreBannerMode === 'custom' ? exploreBannerUrl : '' })
      ]);
      alert('Đã lưu cài đặt giao diện thành công!');
    } catch (err) {
      console.error('Save failed', err);
      alert('Lưu cài đặt thất bại.');
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Image size={20} />
            Cài đặt Banner Trang
          </h3>
          <button 
            className="primary-btn" 
            onClick={handleSaveBanner}
            disabled={isSavingBanner}
            style={{ padding: '0.5rem 1.5rem' }}
          >
            {isSavingBanner ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* TRANG CHỦ */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--reader-border)' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Banner Trang chủ</h4>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="homeBannerMode" 
                  checked={homeBannerMode === 'default'} 
                  onChange={() => setHomeBannerMode('default')} 
                />
                Mặc định
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="homeBannerMode" 
                  checked={homeBannerMode === 'custom'} 
                  onChange={() => setHomeBannerMode('custom')} 
                />
                Tùy chỉnh
              </label>
            </div>

            {homeBannerMode === 'custom' && (
              <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Nhập URL ảnh..."
                  value={homeBannerUrl}
                  onChange={(e) => setHomeBannerUrl(e.target.value)}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="form-input"
                    onChange={(e) => handleUploadBanner(e, 'home')}
                    disabled={isUploadingBanner === 'home'}
                    style={{ flex: 1 }}
                  />
                  {isUploadingBanner === 'home' && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Đang tải lên...</span>}
                </div>
              </div>
            )}

            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Xem trước:</p>
              <img 
                src={homeBannerMode === 'default' ? '/hero-lovers.png' : (homeBannerUrl || '/hero-lovers.png')} 
                alt="Home Banner Preview" 
                style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--reader-border)' }} 
                onError={(e) => (e.currentTarget.src = '/hero-lovers.png')}
              />
            </div>
          </div>

          {/* TRANG KHÁM PHÁ */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--reader-border)' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Banner Trang Khám phá</h4>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="exploreBannerMode" 
                  checked={exploreBannerMode === 'default'} 
                  onChange={() => setExploreBannerMode('default')} 
                />
                Mặc định
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="exploreBannerMode" 
                  checked={exploreBannerMode === 'custom'} 
                  onChange={() => setExploreBannerMode('custom')} 
                />
                Tùy chỉnh
              </label>
            </div>

            {exploreBannerMode === 'custom' && (
              <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Nhập URL ảnh..."
                  value={exploreBannerUrl}
                  onChange={(e) => setExploreBannerUrl(e.target.value)}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="form-input"
                    onChange={(e) => handleUploadBanner(e, 'explore')}
                    disabled={isUploadingBanner === 'explore'}
                    style={{ flex: 1 }}
                  />
                  {isUploadingBanner === 'explore' && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Đang tải lên...</span>}
                </div>
              </div>
            )}

            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Xem trước:</p>
              <img 
                src={exploreBannerMode === 'default' ? '/explore-banner.png' : (exploreBannerUrl || '/explore-banner.png')} 
                alt="Explore Banner Preview" 
                style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--reader-border)' }} 
                onError={(e) => (e.currentTarget.src = '/explore-banner.png')}
              />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
