import { createContext } from 'react';
import type { LoginRequest, UserResponse } from '../types/api';

export type AuthState =
  | { status: 'checking' | 'anonymous' | 'guest'; user: null }
  | { status: 'authenticated'; user: UserResponse }
  | { status: 'error'; user: null; message: string };

interface AuthContextValue {
  state: AuthState;
  signIn: (credentials: LoginRequest, rememberMe: boolean) => Promise<void>;
  signOut: () => void;
  retrySession: () => Promise<void>;
  enterGuest: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
