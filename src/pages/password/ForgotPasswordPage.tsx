import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../api/authApi';
import useAuthForm from '../../auth/useAuthForm';
import { validateEmail } from '../../auth/validation';
import AuthField from '../../components/auth/AuthField';
import AuthLayout from '../../components/layout/AuthLayout';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const form = useAuthForm({
    initialValues: { email: '' },
    validate: ({ email }) => ({ email: validateEmail(email) }),
    submit: async ({ email }) => {
      await requestPasswordReset({ email: email.trim() });
      setSent(true);
    },
  });

  return (
    <AuthLayout title="비밀번호를 잊으셨나요?" description="가입한 이메일로 재설정 링크를 보내드려요">
      {sent ? (
        <div className="auth-success" role="status">
          <p>입력한 이메일로 등록된 계정이 있다면 비밀번호 재설정 링크가 발송됩니다.</p>
          <p>받은 편지함과 스팸함을 확인해 주세요.</p>
        </div>
      ) : (
        <form className="auth-form" noValidate onSubmit={form.handleSubmit} aria-busy={form.isSubmitting}>
          <AuthField id="reset-email" name="email" label="이메일" type="email" autoComplete="email" required
            placeholder="you@example.com" value={form.values.email} error={form.errors.email} disabled={form.isSubmitting}
            onChange={(event) => form.setField('email', event.target.value)} />
          {form.formError && <p className="auth-form-error" role="alert">{form.formError}</p>}
          <button className="auth-button" type="submit" disabled={form.isSubmitting}>{form.isSubmitting ? '요청 중…' : '재설정 링크 받기'}</button>
        </form>
      )}
      {sent && <button className="auth-button auth-button-secondary" type="button" onClick={() => setSent(false)}>다시 요청하기</button>}
      <p className="auth-footer"><Link to="/login">로그인으로 돌아가기</Link></p>
    </AuthLayout>
  );
}
