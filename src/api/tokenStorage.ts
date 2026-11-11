const ACCESS_TOKEN_KEY = 'hytodo.accessToken';
const EXPIRES_AT_KEY = 'hytodo.accessTokenExpiresAt';

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getTokenExpiresAt(): number | null {
  const storage = sessionStorage.getItem(ACCESS_TOKEN_KEY) ? sessionStorage : localStorage;
  const value = storage.getItem(EXPIRES_AT_KEY);
  if (value === null) return null;
  const expiresAt = Number(value);
  return Number.isFinite(expiresAt) ? expiresAt : null;
}

export function setAccessToken(accessToken: string, rememberMe = true, expiresIn?: number) {
  clearAccessToken();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (expiresIn !== undefined) storage.setItem(EXPIRES_AT_KEY, String(Date.now() + expiresIn * 1000));
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(EXPIRES_AT_KEY);
}

export { ACCESS_TOKEN_KEY };
