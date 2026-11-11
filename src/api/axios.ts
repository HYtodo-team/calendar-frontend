import axios, { type AxiosError } from 'axios';
import { clearAccessToken, getAccessToken } from './tokenStorage';
import { normalizeApiError, unwrapApiResponse } from './response';

const API_PREFIX = '/api/v1';
const DEFAULT_API_ORIGIN = 'http://localhost:8080';

function joinUrl(origin: string, prefix: string) {
  return `${origin.replace(/\/$/, '')}${prefix}`;
}

function isPublicAuthRequest(url?: string) {
  const path = url?.split('?')[0].replace(/\/$/, '');
  return ['/auth/login', '/auth/signup', '/auth/password-reset/request', '/auth/password-reset/confirm']
    .some((endpoint) => path?.endsWith(endpoint));
}

const api = axios.create({
  timeout: 15000,
  baseURL: joinUrl(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN, API_PREFIX),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken && !isPublicAuthRequest(config.url)) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    response.data = unwrapApiResponse(response.data, response.status);
    return response;
  },
  (error: AxiosError<unknown>) => {
    const apiError = normalizeApiError(error);

    const requestToken = error.config?.headers?.Authorization;
    const currentToken = getAccessToken();
    if (apiError.status === 401 && !isPublicAuthRequest(error.config?.url)
      && (!currentToken || requestToken === `Bearer ${currentToken}`)) {
      clearAccessToken();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject(apiError);
  },
);

export default api;
