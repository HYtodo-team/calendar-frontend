import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../../api/authApi';
import { isApiError } from '../../api/errors';
import useAuthForm from '../../auth/useAuthForm';
import { validateEmail, validateNewPassword } from '../../auth/validation';
import AuthField from '../../components/auth/AuthField';
import AuthLayout from '../../components/layout/AuthLayout';

export default function SignupPage() {
  const navigate = useNavigate();
  const form = useAuthForm({
    initialValues: { email: '', nickname: '', password: '', passwordConfirm: '' },
    validate: (values) => ({
      email: validateEmail(values.email),
      nickname: !values.nickname.trim() ? '닉네임을 입력해 주세요.'
        : values.nickname.trim().length > 50 ? '닉네임은 50자 이하로 입력해 주세요.' : undefined,
      password: validateNewPassword(values.password),
      passwordConfirm: values.passwordConfirm !== values.password || !values.passwordConfirm
        ? '비밀번호가 일치하는지 확인해 주세요.' : undefined,
    }),
    submit: async ({ email, nickname, password }) => {
      await signup({ email: email.trim(), nickname: nickname.trim(), password });
      navigate('/login', { replace: true, state: { message: '회원가입이 완료됐어요. 새 계정으로 로그인해 주세요.' } });
    },
    mapError: (error) => isApiError(error) && (error.status === 409 || error.errorCode === 'EMAIL_ALREADY_EXISTS')
      ? { message: '이미 가입된 이메일이에요. 로그인하거나 다른 이메일을 입력해 주세요.', errors: { email: '이미 사용 중인 이메일이에요.' } }
      : {},
  });

  return (
    <AuthLayout title="Planary와 함께 시작해요" description="일정과 할 일을 한 곳에서 관리해 보세요">
      <form className="auth-form" noValidate onSubmit={form.handleSubmit} aria-busy={form.isSubmitting}>
        <AuthField id="signup-email" name="email" label="이메일" type="email" autoComplete="email" required
          placeholder="you@example.com" value={form.values.email} error={form.errors.email} disabled={form.isSubmitting}
          onChange={(event) => form.setField('email', event.target.value)} />
        <AuthField id="signup-nickname" name="nickname" label="닉네임" type="text" autoComplete="nickname" required
          placeholder="사용할 이름을 입력해 주세요" value={form.values.nickname} error={form.errors.nickname} disabled={form.isSubmitting}
          onChange={(event) => form.setField('nickname', event.target.value)} />
        <AuthField id="signup-password" name="password" label="비밀번호" type="password" autoComplete="new-password" required
          placeholder="영문과 숫자를 포함한 8~72자" value={form.values.password} error={form.errors.password} disabled={form.isSubmitting}
          onChange={(event) => form.setField('password', event.target.value)} />
        <AuthField id="signup-password-confirm" name="passwordConfirm" label="비밀번호 확인" type="password" autoComplete="new-password" required
          placeholder="비밀번호를 다시 입력해 주세요" value={form.values.passwordConfirm} error={form.errors.passwordConfirm} disabled={form.isSubmitting}
          onChange={(event) => form.setField('passwordConfirm', event.target.value)} />
        {form.formError && <p className="auth-form-error" role="alert">{form.formError}</p>}
        <button className="auth-button" type="submit" disabled={form.isSubmitting}>{form.isSubmitting ? '가입 중…' : '회원가입'}</button>
      </form>
      <p className="auth-footer"><Link to="/login">로그인으로 돌아가기</Link></p>
    </AuthLayout>
  );
}
