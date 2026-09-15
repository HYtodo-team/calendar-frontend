import axios, { type AxiosError } from 'axios';
import { clearAccessToken, getAccessToken } from './tokenStorage';
import type { ApiError } from '../types/api';

interface ErrorResponseBody {
  errorCode?: string;
  message?: string;
  fieldErrors?: ApiError['fieldErrors'];
  timestamp?: string;
}

const API_PREFIX = '/api/v1';
const DEFAULT_API_ORIGIN = 'http://localhost:8080';

function joinUrl(origin: string, prefix: string) {
  return `${origin.replace(/\/$/, '')}${prefix}`;
}

export function normalizeApiError(error: AxiosError<ErrorResponseBody>): ApiError {
  const status = error.response?.status ?? null;
  const data = error.response?.data ?? {};

  return {
    status,
    errorCode: data.errorCode ?? 'UNKNOWN_ERROR',
    message: data.message ?? '요청 처리 중 오류가 발생했습니다.',
    fieldErrors: data.fieldErrors ?? [],
    timestamp: data.timestamp ?? null,
    originalError: error,
  };
}

const api = axios.create({
  baseURL: joinUrl(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN, API_PREFIX),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponseBody>) => {
    const apiError = normalizeApiError(error);

    if (apiError.status === 401) {
      clearAccessToken();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject(apiError);
  },
);

export default api;
