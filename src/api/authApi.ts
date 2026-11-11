import api from './axios';
import { clearAccessToken } from './tokenStorage';
import type { LoginRequest, SignupRequest, TokenResponse, UserResponse, PasswordResetRequest, PasswordResetConfirmRequest } from '../types/api';

function validateUserResponse(user: UserResponse): UserResponse {
  if (typeof user?.id !== 'number' || typeof user.email !== 'string' || typeof user.nickname !== 'string') {
    throw new Error('Invalid user response');
  }
  return user;
}

export async function signup({ email, password, nickname }: SignupRequest): Promise<UserResponse> {
  const response = await api.post<UserResponse>('/auth/signup', {
    email,
    password,
    nickname,
  });

  return validateUserResponse(response.data);
}

export async function login({ email, password }: LoginRequest): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>('/auth/login', {
    email,
    password,
  });

  const { accessToken, expiresIn, tokenType } = response.data ?? {};
  if (typeof accessToken !== 'string' || !accessToken.trim() || tokenType !== 'Bearer' || !Number.isSafeInteger(expiresIn) || expiresIn <= 0) {
    throw new Error('Invalid login response');
  }
  return response.data;
}

export async function getMe(signal?: AbortSignal): Promise<UserResponse> {
  const response = await api.get<UserResponse>('/users/me', { signal });
  return validateUserResponse(response.data);
}

export function logout() {
  clearAccessToken();
}

export async function requestPasswordReset(payload: PasswordResetRequest): Promise<void> {
  await api.post('/auth/password-reset/request', payload);
}

export async function confirmPasswordReset(payload: PasswordResetConfirmRequest): Promise<void> {
  await api.post('/auth/password-reset/confirm', payload);
}
