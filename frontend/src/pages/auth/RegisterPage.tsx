import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import './Auth.css';

const registerSchema = z
  .object({
    email: z.string().email('Email không hợp lệ'),
    username: z
      .string()
      .min(3, 'Username tối thiểu 3 ký tự')
      .max(50, 'Username tối đa 50 ký tự')
      .regex(/^[a-zA-Z0-9_]+$/, 'Chỉ dùng chữ cái, số và dấu gạch dưới')
      .optional()
      .or(z.literal('')),
    password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterFormInputs = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      setErrorMsg('');
      await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        username: data.username || undefined,
      });
      // Đăng ký thành công, tự động chuyển hướng tới trang nhập OTP
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.'
      );
    }
  };

  // ── Form đăng ký ──────────────────────────────────────────────────────────
  return (
    <div className="auth-container">
      <div className="auth-card glass-panel fade-in">
        <div className="auth-icon-header">
          <UserPlus size={38} className="auth-page-icon" />
        </div>
        <h2 className="auth-title">Tạo tài khoản</h2>
        <p className="auth-subtitle">Gia nhập cộng đồng Abora ngay hôm nay</p>

        <ConfirmModal
          isOpen={!!errorMsg}
          title="Thông báo"
          message={errorMsg}
          hideCancel={true}
          onConfirm={() => setErrorMsg('')}
          onCancel={() => setErrorMsg('')}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <Input
            label="Email *"
            type="email"
            placeholder="your@email.com"
            {...register('email')}
            error={errors.email?.message}
          />

          <Input
            label="Username (tuỳ chọn)"
            type="text"
            placeholder="Chỉ gồm chữ, số và _ (VD: ngocvan_123)"
            {...register('username')}
            error={errors.username?.message}
          />



          <Input
            label="Mật khẩu *"
            type="password"
            placeholder="Ít nhất 8 ký tự"
            {...register('password')}
            error={errors.password?.message}
          />

          <Input
            label="Xác nhận mật khẩu *"
            type="password"
            placeholder="Nhập lại mật khẩu"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-4"
          >
            Tạo tài khoản
          </Button>
        </form>

        <div className="auth-footer">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-gradient font-bold">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};
