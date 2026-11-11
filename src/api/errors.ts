import type { ApiError } from '../types/api';

export function isApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) return false;

  return (
    'status' in error && (error.status === null || typeof error.status === 'number') &&
    'errorCode' in error && typeof error.errorCode === 'string' &&
    'message' in error && typeof error.message === 'string' &&
    'fieldErrors' in error && Array.isArray(error.fieldErrors) &&
    error.fieldErrors.every((fieldError: unknown) => (
      typeof fieldError === 'object' && fieldError !== null &&
      'field' in fieldError && typeof fieldError.field === 'string' &&
      'reason' in fieldError && typeof fieldError.reason === 'string'
    )) &&
    'timestamp' in error && (error.timestamp === null || typeof error.timestamp === 'string') &&
    'originalError' in error
  );
}
