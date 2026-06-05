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
  const queryEmail = searchParams.get('email') ?? '';
  const queryToken = searchParams.get('token') ?? '';

  const [email, setEmail] = useState(queryEmail);
  const [token, setToken] = useState(queryToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập email.');
      return;
    }
    if (!token.trim()) {
      setErrorMsg('Vui lòng nhập mã xác thực OTP.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        token: token.trim(),
        newPassword
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Mã OTP không hợp lệ, đã hết hạn hoặc sai email. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <p className="auth-subtitle">Nhập mã OTP và mật khẩu mới của bạn bên dưới.</p>

            {errorMsg && <div className="auth-error">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <Input
                label="Địa chỉ Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={!!queryEmail}
              />

              <Input
                label="Mã xác thực OTP"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Nhập mã 6 chữ số"
                required
                maxLength={6}
                autoFocus={!token}
              />

              <Input
                label="Mật khẩu mới"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 8 ký tự"
                required
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

            <div className="auth-footer mt-4">
              <Link to="/forgot-password" className="text-gradient font-bold">
                Yêu cầu gửi lại mã OTP mới
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
