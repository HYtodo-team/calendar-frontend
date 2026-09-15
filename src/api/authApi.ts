import api from './axios';
import { clearAccessToken, setAccessToken } from './tokenStorage';
import type { LoginRequest, SignupRequest, TokenResponse, UserResponse } from '../types/api';

export async function signup({ email, password, nickname }: SignupRequest): Promise<UserResponse> {
  const response = await api.post<UserResponse>('/auth/signup', {
    email,
    password,
    nickname,
  });

  return response.data;
}

export async function login({ email, password }: LoginRequest): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>('/auth/login', {
    email,
    password,
  });

  setAccessToken(response.data.accessToken);

  return response.data;
}

export async function getMe(): Promise<UserResponse> {
  const response = await api.get<UserResponse>('/users/me');

  return response.data;
}

export function logout() {
  clearAccessToken();
}
