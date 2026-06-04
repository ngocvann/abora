import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordType = type === 'password';
    const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="input-wrapper">
        {label && <label className="input-label">{label}</label>}
        <div className="input-container-inner">
          <input
            ref={ref}
            type={inputType}
            className={`input-field ${error ? 'input-error' : ''} ${isPasswordType ? 'input-field-password' : ''} ${className}`}
            {...props}
          />
          {isPasswordType && (
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <span className="input-error-msg">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
