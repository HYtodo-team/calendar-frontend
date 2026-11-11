import { useEffect, useState } from 'react';
import { isApiError } from '../../api/errors';

export function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.fieldErrors.length
    ? error.fieldErrors.map(e => `${e.field}: ${e.reason}`).join(' · ')
    : error.status === null ? '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.' : error.message;
  return '데이터를 처리하지 못했어요. 다시 시도해 주세요.';
}
// The key changes before the effect runs, so a previous selection is never rendered.
export function useRemote<T>(key: string, loader: () => Promise<T>) {
  const [result, setResult] = useState<{ key: string; data?: T; error?: string; status?: number | null }>({ key: '' });
  useEffect(() => {
    let active = true;
    setResult({ key });
    loader().then(data => { if (active) setResult({ key, data }); })
      .catch(error => { if (active) setResult({ key, error: errorMessage(error), status: isApiError(error) ? error.status : undefined }); });
    return () => { active = false; };
    // Callers encode all loader inputs in key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return result.key === key ? result : { key };
}
