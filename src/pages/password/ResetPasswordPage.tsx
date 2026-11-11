import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset } from '../../api/authApi';
import { isApiError } from '../../api/errors';
import { useAuth } from '../../auth/useAuth';
import useAuthForm from '../../auth/useAuthForm';
import { validateNewPassword } from '../../auth/validation';
import AuthField from '../../components/auth/AuthField';
import AuthLayout from '../../components/layout/AuthLayout';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const form = useAuthForm({
    initialValues: { password: '', passwordConfirm: '' },
    validate: (values) => ({
      password: validateNewPassword(values.password),
      passwordConfirm: !values.passwordConfirm || values.password !== values.passwordConfirm
        ? '비밀번호가 일치하는지 확인해 주세요.' : undefined,
    }),
    submit: async ({ password }) => {
      if (!token) return;
      await confirmPasswordReset({ token, password });
      signOut();
      navigate('/login', { replace: true, state: { message: '비밀번호가 변경됐어요. 새 비밀번호로 로그인해 주세요.' } });
    },
    mapError: (error) => isApiError(error) && (error.status === 401 || error.fieldErrors.some(({ field }) => field === 'token')
      || /TOKEN.*(INVALID|EXPIRED)|(INVALID|EXPIRED).*TOKEN/.test(error.errorCode))
      ? { message: '재설정 링크가 만료되었거나 유효하지 않아요. 새 링크를 요청해 주세요.' } : {},
  });

  return (
    <AuthLayout title="새 비밀번호 설정" description="새로운 비밀번호를 입력해 주세요">
      {!token ? (
        <p className="auth-form-error" role="alert">재설정 링크가 유효하지 않아요. 이메일로 받은 링크를 열거나 새 링크를 요청해 주세요.</p>
      ) : (
        <form className="auth-form" noValidate onSubmit={form.handleSubmit} aria-busy={form.isSubmitting}>
          <AuthField id="new-password" name="password" label="새 비밀번호" type="password" autoComplete="new-password" required
            placeholder="영문과 숫자를 포함한 8~72자" value={form.values.password} error={form.errors.password} disabled={form.isSubmitting}
            onChange={(event) => form.setField('password', event.target.value)} />
          <AuthField id="new-password-confirm" name="passwordConfirm" label="새 비밀번호 확인" type="password" autoComplete="new-password" required
            placeholder="비밀번호를 다시 입력해 주세요" value={form.values.passwordConfirm} error={form.errors.passwordConfirm} disabled={form.isSubmitting}
            onChange={(event) => form.setField('passwordConfirm', event.target.value)} />
          {form.formError && <p className="auth-form-error" role="alert">{form.formError}</p>}
          <button className="auth-button" type="submit" disabled={form.isSubmitting}>{form.isSubmitting ? '변경 중…' : '비밀번호 변경'}</button>
        </form>
      )}
      <p className="auth-footer"><Link to="/forgot-password">재설정 링크 다시 받기</Link></p>
      <p className="auth-footer"><Link to="/login">로그인으로 돌아가기</Link></p>
    </AuthLayout>
  );
}
