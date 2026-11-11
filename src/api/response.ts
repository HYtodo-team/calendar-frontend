import type { AxiosError } from 'axios';
import type { ApiError, FieldError } from '../types/api';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// API functions receive the payload after the common success envelope is removed.
export function unwrapApiResponse(body: unknown, status: number): unknown {
  if (status === 204) return undefined;
  if (!isRecord(body) || body.success !== true || !Object.hasOwn(body, 'data')) {
    throw new Error('서버의 성공 응답 형식을 확인해 주세요.');
  }
  return body.data;
}

export function normalizeApiError(error: AxiosError<unknown>): ApiError {
  const data = isRecord(error.response?.data) ? error.response.data : {};
  const fieldErrors: FieldError[] = [];
  if (Array.isArray(data.fieldErrors)) {
    for (const item of data.fieldErrors) {
      if (isRecord(item) && typeof item.field === 'string' && typeof item.message === 'string') {
        // Existing form components use "reason" internally.
        fieldErrors.push({ field: item.field, reason: item.message });
      }
    }
  }
  return {
    status: error.response?.status ?? null,
    errorCode: typeof data.errorCode === 'string' ? data.errorCode : 'UNKNOWN_ERROR',
    message: typeof data.message === 'string' ? data.message : '요청 처리 중 오류가 발생했습니다.',
    fieldErrors,
    timestamp: typeof data.timestamp === 'string' ? data.timestamp : null,
    originalError: error,
  };
}
