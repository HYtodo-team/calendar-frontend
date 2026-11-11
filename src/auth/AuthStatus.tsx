import AuthLayout from '../components/layout/AuthLayout';
import { useAuth } from './useAuth';
import '../components/auth/AuthForm.css';

export default function AuthStatus() {
  const { state, retrySession, signOut } = useAuth();
  return (
    <AuthLayout title="로그인 상태 확인" description={state.status === 'error' ? '연결 상태를 확인하고 다시 시도해 주세요' : '잠시만 기다려 주세요'}>
      {state.status === 'error' ? (
        <>
          <p className="auth-form-error" role="alert">{state.message}</p>
          <button className="auth-button" onClick={() => void retrySession()}>다시 시도</button>
          <button className="auth-button auth-button-secondary" onClick={signOut}>로그인으로 돌아가기</button>
        </>
      ) : <p className="auth-placeholder" role="status">로그인 정보를 확인하고 있어요…</p>}
    </AuthLayout>
  );
}
