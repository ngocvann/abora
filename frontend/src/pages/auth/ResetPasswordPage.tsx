import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './Auth.css';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!token) {
      setErrorMsg('Token không hợp lệ. Vui lòng kiểm tra lại đường dẫn.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/auth/reset-password', { token, newPassword });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card glass-panel fade-in">
          <div className="auth-error" style={{ marginBottom: 0 }}>
            Đường dẫn không hợp lệ. Vui lòng sử dụng liên kết được gửi qua email.
          </div>
          <div className="auth-footer mt-4">
            <Link to="/forgot-password" className="text-gradient font-bold">Yêu cầu đặt lại mật khẩu</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel fade-in">
        {isSuccess ? (
          <div className="auth-success-state">
            <CheckCircle2 size={56} className="auth-success-icon" />
            <h2 className="auth-title">Mật khẩu đã được đặt lại!</h2>
            <p className="auth-subtitle">
              Mật khẩu của bạn đã được thay đổi thành công.
            </p>
            <Button
              variant="primary"
              className="mt-6 w-full"
              onClick={() => navigate('/login')}
            >
              Đăng nhập ngay
            </Button>
          </div>
        ) : (
          <>
            <div className="auth-icon-header">
              <KeyRound size={40} className="auth-page-icon" />
            </div>
            <h2 className="auth-title">Đặt lại mật khẩu</h2>
            <p className="auth-subtitle">Nhập mật khẩu mới của bạn bên dưới.</p>

            {errorMsg && <div className="auth-error">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <Input
                label="Mật khẩu mới"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 8 ký tự"
                required
                autoFocus
              />

              <Input
                label="Xác nhận mật khẩu"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full mt-4"
              >
                Xác nhận đặt lại mật khẩu
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
