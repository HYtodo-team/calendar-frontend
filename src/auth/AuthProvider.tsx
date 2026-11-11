import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { getMe, login, logout } from '../api/authApi';
import { isApiError } from '../api/errors';
import { ACCESS_TOKEN_KEY, getAccessToken, getTokenExpiresAt, setAccessToken } from '../api/tokenStorage';
import type { LoginRequest } from '../types/api';
import { AuthContext, type AuthState } from './AuthContext';
import { getAuthErrorMessage } from './formErrors';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    status: getAccessToken() ? 'checking' : 'anonymous', user: null,
  }));
  const operation = useRef(0);

  const signOut = useCallback(() => {
    operation.current += 1;
    logout();
    setState({ status: 'anonymous', user: null });
  }, []);

  const restoreSession = useCallback(async (signal?: AbortSignal) => {
    const attempt = ++operation.current;
    const expiresAt = getTokenExpiresAt();
    if (!getAccessToken() || (expiresAt !== null && expiresAt <= Date.now())) {
      signOut();
      return;
    }
    setState({ status: 'checking', user: null });
    try {
      const user = await getMe(signal);
      if (!signal?.aborted && attempt === operation.current) setState({ status: 'authenticated', user });
    } catch (error: unknown) {
      if (signal?.aborted || attempt !== operation.current) return;
      if (isApiError(error) && error.status === 401) signOut();
      else setState({ status: 'error', user: null, message: getAuthErrorMessage(error, '로그인 상태를 확인하지 못했어요. 다시 시도해 주세요.') });
    }
  }, [signOut]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) void restoreSession(controller.signal);
    });
    return () => { controller.abort(); operation.current += 1; };
  }, [restoreSession]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.storageArea !== localStorage || (event.key !== ACCESS_TOKEN_KEY && event.key !== null)) return;
      void restoreSession();
    }
    window.addEventListener('auth:unauthorized', signOut);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('auth:unauthorized', signOut);
      window.removeEventListener('storage', onStorage);
    };
  }, [signOut, restoreSession]);

  useEffect(() => {
    if (state.status !== 'authenticated' && state.status !== 'error') return;
    const expiresAt = getTokenExpiresAt();
    if (expiresAt === null) return;
    function checkExpiry() {
      if (expiresAt !== null && Date.now() >= expiresAt) signOut();
    }
    const timer = window.setTimeout(checkExpiry, Math.max(0, expiresAt - Date.now()));
    document.addEventListener('visibilitychange', checkExpiry);
    window.addEventListener('focus', checkExpiry);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', checkExpiry);
      window.removeEventListener('focus', checkExpiry);
    };
  }, [state.status, signOut]);

  async function signIn(credentials: LoginRequest, rememberMe: boolean) {
    const attempt = ++operation.current;
    const token = await login(credentials);
    if (attempt !== operation.current) return;
    setAccessToken(token.accessToken, rememberMe, token.expiresIn);
    try {
      const user = await getMe();
      if (attempt === operation.current) setState({ status: 'authenticated', user });
    } catch (error: unknown) {
      if (attempt === operation.current) {
        if (isApiError(error) && error.status === 401) signOut();
        else setState({ status: 'error', user: null, message: getAuthErrorMessage(error, '로그인 상태를 확인하지 못했어요. 다시 시도해 주세요.') });
      }
      throw error;
    }
  }

  function enterGuest() {
    operation.current += 1;
    logout();
    setState({ status: 'guest', user: null });
  }

  return (
    <AuthContext.Provider value={{ state, signIn, signOut, retrySession: restoreSession, enterGuest }}>
      {children}
    </AuthContext.Provider>
  );
}
