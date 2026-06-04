import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User as UserIcon, Lock, KeyRound, CheckCircle2,
  Loader2, AlertCircle, Edit3
} from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './SettingsPage.css';

// ─── API helpers ─────────────────────────────────────────────────────────────
const fetchProfile = async () => {
  const { data } = await api.get('/users/profile');
  return data;
};

// ─── Sub-components ──────────────────────────────────────────────────────────
const SectionCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  icon, title, children,
}) => (
  <div className="settings-card">
    <div className="settings-card-header">
      {icon}
      <h3 className="settings-card-title">{title}</h3>
    </div>
    {children}
  </div>
);

const FeedbackMsg: React.FC<{ type: 'success' | 'error'; message: string }> = ({ type, message }) =>
  message ? (
    <div className={`settings-feedback ${type}`}>
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  ) : null;

// ─── Main Component ──────────────────────────────────────────────────────────
export const SettingsPage: React.FC = () => {
  const { user: authUser, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: fetchProfile,
  });

  // ── Edit Profile State ────────────────────────────────────────────────────
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  React.useEffect(() => {
    if (profile) {
      setEditDisplayName(profile.displayName || '');
      setEditBio(profile.bio || '');
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: { displayName: string; bio: string }) =>
      api.put('/users/profile', data),
    onSuccess: () => {
      setProfileFeedback({ type: 'success', msg: 'Thông tin hồ sơ đã được cập nhật!' });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
    onError: (err: any) => {
      setProfileFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Không thể cập nhật thông tin hồ sơ.',
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);
    if (!editDisplayName.trim()) {
      setProfileFeedback({ type: 'error', msg: 'Tên hiển thị không được để trống.' });
      return;
    }
    updateProfileMutation.mutate({ displayName: editDisplayName.trim(), bio: editBio.trim() });
  };

  // ── Đổi username state ────────────────────────────────────────────────────
  const [newUsername, setNewUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameFeedback, setUsernameFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const usernameMutation = useMutation({
    mutationFn: (username: string) =>
      api.put('/users/settings/username', { newUsername: username }),
    onSuccess: (res) => {
      setUsernameFeedback({ type: 'success', msg: 'Username đã được cập nhật!' });
      updateUser({ username: res.data.username });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setNewUsername('');
      setIsEditingUsername(false);
    },
    onError: (err: any) => {
      setUsernameFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Không thể cập nhật username.',
      });
    },
  });

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameFeedback(null);
    if (!newUsername.trim()) return;
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(newUsername.trim())) {
      setUsernameFeedback({
        type: 'error',
        msg: 'Username chỉ chứa chữ cái, số và _, từ 3-50 ký tự.',
      });
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Đổi Username',
      message: 'Bạn có chắc chắn muốn đổi Username mới không?',
      onConfirm: () => usernameMutation.mutate(newUsername.trim())
    });
  };

  // ── Đổi / Set mật khẩu state ─────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwFeedback, setPwFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const passwordMutation = useMutation({
    mutationFn: (payload: { currentPassword?: string; newPassword: string; confirmPassword: string }) =>
      api.put('/users/settings/password', payload),
    onSuccess: (res) => {
      setPwFeedback({ type: 'success', msg: res.data.message || 'Mật khẩu đã được cập nhật!' });
      updateUser({ hasPassword: true });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    },
    onError: (err: any) => {
      setPwFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Không thể cập nhật mật khẩu.',
      });
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwFeedback(null);
    if (newPw.length < 8) {
      setPwFeedback({ type: 'error', msg: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwFeedback({ type: 'error', msg: 'Mật khẩu xác nhận không khớp.' });
      return;
    }
    const hasPassword = profile?.hasPassword ?? authUser?.hasPassword ?? true;
    if (hasPassword && !currentPw) {
      setPwFeedback({ type: 'error', msg: 'Vui lòng nhập mật khẩu hiện tại.' });
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: hasPassword ? 'Đổi mật khẩu' : 'Thiết lập mật khẩu',
      message: 'Bạn có chắc chắn muốn cập nhật mật khẩu không?',
      onConfirm: () => {
        passwordMutation.mutate({
          currentPassword: hasPassword ? currentPw : undefined,
          newPassword: newPw,
          confirmPassword: confirmPw,
        });
      }
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="settings-loading">
        <Loader2 className="animate-spin" size={36} />
      </div>
    );
  }

  const hasPassword = profile?.hasPassword ?? authUser?.hasPassword ?? true;
  const oauthProvider = profile?.oauthProvider ?? authUser?.oauthProvider ?? null;

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-page-title">Cài đặt tài khoản</h1>

        {/* ── Section: Thông tin tài khoản ─────────────────────────────── */}
        <SectionCard
          icon={<UserIcon size={20} className="settings-card-icon" />}
          title="Thông tin đăng nhập"
        >
          <div className="settings-info-grid">
            <div className="settings-info-item">
              <span className="settings-info-label">Email</span>
              <span className="settings-info-value">{profile?.email}</span>
              {profile?.emailVerified && (
                <span className="settings-verified-badge">
                  <CheckCircle2 size={13} /> Đã xác thực
                </span>
              )}
            </div>
            <div className="settings-info-item" style={{ alignItems: 'center', gap: '0.75rem' }}>
              <span className="settings-info-label">Username hiện tại</span>
              
              {!isEditingUsername ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="settings-info-value">@{profile?.username}</span>
                  <button 
                    type="button" 
                    onClick={() => { setIsEditingUsername(true); setNewUsername(profile?.username || ''); setUsernameFeedback(null); }}
                    style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    title="Chỉnh sửa Username"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, width: '100%' }}>
                  <form onSubmit={handleUsernameSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => { setNewUsername(e.target.value); setUsernameFeedback(null); }}
                      className="form-input"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.4rem 0.8rem', color: 'white', flex: 1 }}
                      pattern="^[a-zA-Z0-9_]{3,50}$"
                      title="3-50 ký tự, chỉ gồm chữ cái, số và _"
                      autoFocus
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={usernameMutation.isPending}
                      disabled={!newUsername.trim() || newUsername === profile?.username}
                    >
                      Lưu
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => { setIsEditingUsername(false); setUsernameFeedback(null); }}
                    >
                      Hủy
                    </Button>
                  </form>
                </div>
              )}
              {usernameFeedback && (
                <div style={{ width: '100%', marginTop: '0.25rem' }}>
                  <FeedbackMsg type={usernameFeedback.type} message={usernameFeedback.msg} />
                </div>
              )}
            </div>
            {oauthProvider && (
              <div className="settings-info-item">
                <span className="settings-info-label">Liên kết mạng xã hội</span>
                <span className="settings-oauth-badge">
                  {oauthProvider === 'GOOGLE' && '🔵'} {oauthProvider}
                </span>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── Section: Thông tin hồ sơ ──────────────────────────────────────── */}
        <SectionCard
          icon={<UserIcon size={20} className="settings-card-icon" />}
          title="Thông tin hồ sơ"
        >
          <form onSubmit={handleProfileSubmit} className="settings-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Tên hiển thị"
              type="text"
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              placeholder="Tên hiển thị của bạn..."
              required
            />
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)' }}>Giới thiệu bản thân</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Viết vài câu tự giới thiệu..."
                rows={4}
                style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontFamily: 'inherit', fontSize: '0.95rem' }}
              />
            </div>
            
            {profileFeedback && (
              <FeedbackMsg type={profileFeedback.type} message={profileFeedback.msg} />
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={updateProfileMutation.isPending}
              className="mt-2"
              style={{ alignSelf: 'flex-start' }}
            >
              Lưu thay đổi hồ sơ
            </Button>
          </form>
        </SectionCard>



        {/* ── Section: Mật khẩu ────────────────────────────────────────── */}
        <SectionCard
          icon={hasPassword ? <Lock size={20} className="settings-card-icon" /> : <KeyRound size={20} className="settings-card-icon warning" />}
          title={hasPassword ? 'Đổi mật khẩu' : 'Thiết lập mật khẩu'}
        >
          {!hasPassword && (
            <div className="settings-oauth-notice">
              <AlertCircle size={16} />
              <span>
                Tài khoản của bạn đang đăng nhập qua{' '}
                <strong>{oauthProvider || 'mạng xã hội'}</strong> và chưa có mật khẩu.
                Thiết lập mật khẩu để có thể đăng nhập bằng Email/Username.
              </span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="settings-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {hasPassword && (
              <Input
                label="Mật khẩu hiện tại"
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                required
              />
            )}

            <Input
              label={hasPassword ? 'Mật khẩu mới' : 'Mật khẩu'}
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Ít nhất 8 ký tự"
              required
            />

            <Input
              label="Xác nhận mật khẩu"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
            />

            {pwFeedback && (
              <FeedbackMsg type={pwFeedback.type} message={pwFeedback.msg} />
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={passwordMutation.isPending}
              className="mt-2"
            >
              {hasPassword ? 'Cập nhật mật khẩu' : 'Thiết lập mật khẩu'}
            </Button>
          </form>
        </SectionCard>
      </div>
      
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal(null);
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};
