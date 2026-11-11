import { useState, type ComponentPropsWithoutRef } from 'react';
import './AuthForm.css';

interface AuthFieldProps extends ComponentPropsWithoutRef<'input'> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}

export default function AuthField({ id, label, error, hint, type, ...inputProps }: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className={isPassword ? 'auth-password' : undefined}>
        <input {...inputProps} id={id} type={isPassword && visible ? 'text' : type}
          aria-invalid={Boolean(error)} aria-describedby={describedBy} />
        {isPassword && (
          <button type="button" className="auth-password-toggle" disabled={inputProps.disabled}
            aria-label={`${label} ${visible ? '숨기기' : '표시'}`} aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {visible && <path d="m3 3 18 18" />}
            </svg>
          </button>
        )}
      </div>
      {hint && <p className="auth-field-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="auth-field-error" id={`${id}-error`}>{error}</p>}
    </div>
  );
}
