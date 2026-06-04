import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import './Auth.css';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập email.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setIsSuccess(true);
    } catch {
      setErrorMsg('Đã xảy ra lỗi. Vui lòng thử lại sau.');
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
            <h2 className="auth-title">Kiểm tra email của bạn</h2>
            <p className="auth-subtitle">
              Nếu email <strong>{email}</strong> tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu.
              Liên kết sẽ hết hạn sau <strong>1 giờ</strong>.
            </p>
            <p className="auth-subtitle" style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.7 }}>
              (Trong môi trường dev, hãy kiểm tra console log của server backend để lấy link.)
            </p>
            <Link to="/login">
              <Button variant="primary" className="mt-6 w-full">Quay lại đăng nhập</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-icon-header">
              <Mail size={40} className="auth-page-icon" />
            </div>
            <h2 className="auth-title">Quên mật khẩu?</h2>
            <p className="auth-subtitle">
              Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu cho bạn.
            </p>

            {errorMsg && <div className="auth-error">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">Địa chỉ Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full mt-4"
              >
                Gửi liên kết đặt lại mật khẩu
              </Button>
            </form>

            <div className="auth-footer">
              <Link to="/login" className="auth-back-link">
                <ArrowLeft size={16} />
                Quay lại đăng nhập
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
