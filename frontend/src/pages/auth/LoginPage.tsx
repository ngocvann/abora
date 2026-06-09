import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import './Auth.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? 'YOUR_GOOGLE_CLIENT_ID';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Vui lòng nhập email hoặc username'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const buildUser = (data: any) => ({
  id: data.userId,
  email: data.email,
  username: data.username,
  displayName: data.displayName,
  avatarUrl: data.avatarUrl,
  roles: [data.role],
  hasPassword: data.hasPassword ?? true,
  oauthProvider: data.oauthProvider ?? null,
});

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMsg, setErrorMsg] = useState('');
  const [googleError, setGoogleError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  // ── Đăng nhập form thường ─────────────────────────────────────────────────
  const onSubmit = async (data: LoginFormInputs) => {
    try {
      setErrorMsg('');
      const response = await api.post('/auth/login', {
        email: data.usernameOrEmail.trim(),
        password: data.password,
      });
      setAuth(response.data.accessToken, buildUser(response.data));
      navigate('/');
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      );
    }
  };

  // ── Đăng nhập Google ──────────────────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setGoogleError('');
      const response = await api.post('/auth/oauth2/google', {
        idToken: credentialResponse.credential,
      });
      setAuth(response.data.accessToken, buildUser(response.data));
      navigate('/');
    } catch (err: any) {
      setGoogleError(
        err.response?.data?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.'
      );
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="auth-container">
        <div className="auth-card glass-panel fade-in">
          <h2 className="auth-title">Chào mừng trở lại</h2>
          <p className="auth-subtitle">Đăng nhập để tiếp tục hành trình của bạn</p>

          {/* Google Login */}
          <div className="auth-oauth-section">
            <div className="google-btn-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setGoogleError('Đăng nhập Google bị hủy hoặc thất bại.')
                }
                useOneTap={false}
                shape="pill"
                size="large"
                text="signin_with"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <span>hoặc đăng nhập bằng tài khoản</span>
          </div>

          <ConfirmModal
            isOpen={!!errorMsg || !!googleError}
            title="Thông báo"
            message={errorMsg || googleError}
            hideCancel={true}
            onConfirm={() => { setErrorMsg(''); setGoogleError(''); }}
            onCancel={() => { setErrorMsg(''); setGoogleError(''); }}
          />

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <Input
              label="Email hoặc Username"
              type="text"
              placeholder="email@example.com hoặc username"
              {...register('usernameOrEmail')}
              error={errors.usernameOrEmail?.message}
            />
            <Input
              label="Mật khẩu"
              type="password"
              placeholder="Nhập mật khẩu"
              {...register('password')}
              error={errors.password?.message}
            />

            <div className="auth-forgot">
              <Link to="/forgot-password" className="auth-forgot-link">
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full mt-2"
            >
              Đăng nhập
            </Button>
          </form>

          <div className="auth-footer">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-gradient font-bold">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};
