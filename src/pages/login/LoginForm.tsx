import { useRef, useState, type FormEvent } from 'react';
import { isApiError } from '../../api/errors';
import type { LoginRequest } from '../../types/api';
import { Link } from 'react-router-dom';
import { validateEmail } from '../../auth/validation';
import { getAuthErrorMessage } from '../../auth/formErrors';
import './LoginForm.css';

interface LoginFormProps {
  onLogin: (credentials: LoginRequest, rememberMe: boolean) => Promise<void>;
  onGuest: () => void;
}

type FieldErrors = Partial<Record<keyof LoginRequest, string>>;

export default function LoginForm({ onLogin, onGuest }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const emailInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);

  function clearFieldError(field: keyof LoginRequest) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const normalizedEmail = email.trim();
    const errors: FieldErrors = {};
    errors.email = validateEmail(normalizedEmail);
    if (!password) errors.password = '비밀번호를 입력해 주세요.';

    setFieldErrors(errors);
    setFormError('');
    if (errors.email || errors.password) {
      (errors.email ? emailInput : passwordInput).current?.focus();
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);
    try {
      await onLogin({ email: normalizedEmail, password }, rememberMe);
    } catch (error: unknown) {
      if (isApiError(error)) {
        if (error.errorCode === 'UNAUTHORIZED') {
          setFormError('로그인 정보를 확인할 수 없어요. 다시 로그인해 주세요.');
        } else if (error.errorCode === 'INVALID_CREDENTIALS' || error.status === 401) {
          setFormError('이메일 또는 비밀번호를 확인해 주세요.');
        } else if (error.errorCode === 'VALIDATION_ERROR') {
          const serverErrors: FieldErrors = {};
          for (const { field, reason } of error.fieldErrors) {
            if (field === 'email' || field === 'password') serverErrors[field] = reason;
          }
          setFieldErrors(serverErrors);
          setFormError('입력값을 확인해 주세요.');
          if (serverErrors.email || serverErrors.password) {
            window.requestAnimationFrame(() => (serverErrors.email ? emailInput : passwordInput).current?.focus());
          }
        } else {
          setFormError(getAuthErrorMessage(error));
        }
      } else {
        setFormError('로그인에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form className="login-form" noValidate onSubmit={handleSubmit} aria-busy={isSubmitting}>
      {/*이메일*/}
      <div className="login-field">
        <label htmlFor="login-email">이메일</label>
        <input id="login-email" name="email" type="email" autoComplete="username" required
          ref={emailInput} value={email} placeholder="you@example.com" disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
          onChange={(event) => { setEmail(event.target.value); clearFieldError('email'); }} />
        {fieldErrors.email && <p className="login-field-error" id="login-email-error">{fieldErrors.email}</p>}
      </div>

      {/*비밀번호*/}
      <div className="login-field">
        <label htmlFor="login-password">비밀번호</label>
        <div className="login-password">
          <input id="login-password" name="password" type={showPassword ? 'text' : 'password'}
            autoComplete="current-password" required ref={passwordInput} value={password}
            placeholder="비밀번호를 입력해 주세요" disabled={isSubmitting}
            aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
            onChange={(event) => { setPassword(event.target.value); clearFieldError('password'); }} />
          <button className="login-password-toggle" type="button" disabled={isSubmitting}
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'} aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword && <path d="m3 3 18 18" />}
            </svg>
          </button>
        </div>
        {fieldErrors.password && <p className="login-field-error" id="login-password-error">{fieldErrors.password}</p>}
      </div>

      {/* 로그인 옵션 */}
      <div className="login-options">
        <label className="login-remember">
          <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} disabled={isSubmitting}/>
          <span>로그인 상태 유지</span>
        </label>

        <Link className="login-forgot" to="/forgot-password">
          비밀번호 찾기
        </Link>
      </div>


      {formError && <p className="login-form-error" role="alert">{formError}</p>}

      <button className="login-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? '로그인 중…' : '로그인'}
      </button>

      {/* 구분선 */}
      <div className="login-divider">
        <span>또는</span>
      </div>

      {/* 게스트 */}
      <button className="login-guest" type="button" disabled={isSubmitting} onClick={onGuest}>
        게스트로 시작하기
      </button>
    </form>
  );
}
