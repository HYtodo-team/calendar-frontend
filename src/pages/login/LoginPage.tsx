import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import type { LoginRequest } from '../../types/api';
import AuthLayout from '../../components/layout/AuthLayout';
import LoginForm from './LoginForm';

export default function LoginPage() {
  const { signIn, enterGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const message = typeof location.state?.message === 'string' ? location.state.message : '';

  async function handleLogin(credentials: LoginRequest, rememberMe: boolean) {
    await signIn(credentials, rememberMe);
  }

  return (
    <AuthLayout
      title="다시 만나서 반가워요"
      description="일정과 할 일을 한 곳에서 관리해 보세요"
    >
      {message && <p className="auth-notice auth-notice-success" role="status">{message}</p>}
      <LoginForm onLogin={handleLogin} onGuest={() => { enterGuest(); navigate('/'); }} />
      <p className="auth-footer">
        <span>아직 계정이 없으신가요?</span>
        <Link to="/signup">
          회원가입
        </Link>
      </p>
    </AuthLayout>
  );
}
