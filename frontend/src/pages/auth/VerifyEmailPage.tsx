import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, MailCheck } from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './Auth.css';

type Status = 'idle' | 'loading' | 'success';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const navigate = useNavigate();
  
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setErrorMsg('Mã OTP phải gồm 6 chữ số');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await api.post('/auth/verify-email', { email, token: otp });
      setSuccessMsg(res.data.message || 'Xác thực email thành công!');
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.'
      );
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="auth-container">
        <div className="auth-card glass-panel fade-in">
          <div className="auth-success-state">
            <CheckCircle2 size={60} className="auth-success-icon" />
            <h2 className="auth-title">Xác thực thành công!</h2>
            <p className="auth-subtitle">{successMsg}</p>
            <p className="auth-subtitle text-sm">Đang chuyển hướng tới Đăng nhập...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel fade-in">
        <div className="auth-icon-header">
          <MailCheck size={38} className="auth-page-icon" />
        </div>
        <h2 className="auth-title">Nhập mã xác thực</h2>
        <p className="auth-subtitle">
          Chúng tôi đã gửi mã OTP 6 chữ số tới email<br/>
          <strong>{email}</strong>
        </p>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form mt-4">
          <Input
            label="Mã OTP"
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            autoFocus
            style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', textAlign: 'center' }}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={status === 'loading'}
            className="w-full mt-6"
            disabled={otp.length !== 6}
          >
            Xác nhận
          </Button>
        </form>

        <div className="auth-footer mt-6">
          <Link to="/login" className="text-gradient">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};
