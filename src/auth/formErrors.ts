import { isApiError } from '../api/errors';

export function getAuthErrorMessage(error: unknown, fallback = '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.') {
  if (!isApiError(error)) return fallback;
  if (error.status === null) return '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.';
  if (error.status === 404 || error.status === 405 || error.status === 501) {
    return '현재 이 기능을 이용할 수 없어요. 잠시 후 다시 시도해 주세요.';
  }
  if (error.status === 429) return '요청이 너무 많아요. 잠시 기다린 후 다시 시도해 주세요.';
  if (error.errorCode === 'VALIDATION_ERROR' || error.fieldErrors.length > 0) return '입력값을 확인해 주세요.';
  return fallback;
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error)) return {};
  return Object.fromEntries(error.fieldErrors.map(({ field, reason }) => [field, reason]));
}
