import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AxiosError } from 'axios';
import { normalizeApiError, unwrapApiResponse } from '../src/api/response.ts';

test('객체·배열·빈 배열·null 성공 payload를 한 번만 꺼낸다', () => {
  for (const payload of [{ accessToken: 'token', expiresIn: 7200 }, [{ id: 1 }], [], null, { data: 'nested domain value' }]) {
    assert.equal(unwrapApiResponse({ success: true, data: payload }, 200), payload);
  }
  assert.deepEqual(unwrapApiResponse({ success: true, data: { id: 1 } }, 201), { id: 1 });
});

test('204 삭제 성공은 빈 본문을 허용하고 잘못된 성공 본문은 거절한다', () => {
  assert.equal(unwrapApiResponse('', 204), undefined);
  for (const body of [null, '', [], { id: 1 }, { success: true }, { success: false, data: null }]) {
    assert.throws(() => unwrapApiResponse(body, 200));
  }
});

function serverError(status, data) {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status, statusText: 'Error', headers: {}, config: {}, data,
  });
}

test('서버 fieldErrors.message를 화면 내부 reason으로 연결한다', () => {
  const error = normalizeApiError(serverError(400, {
    success: false, errorCode: 'VALIDATION_ERROR', message: '입력값을 확인해 주세요.', timestamp: '2026-11-07T12:00:00',
    fieldErrors: [{ field: 'title', message: '제목 확인' }, { field: 'serverOnly', message: '일반 안내' }, null, {}, { field: 'title', message: 1 }],
  }));
  assert.deepEqual(error.fieldErrors, [{ field: 'title', reason: '제목 확인' }, { field: 'serverOnly', reason: '일반 안내' }]);
  assert.equal(error.status, 400);
  assert.equal(error.errorCode, 'VALIDATION_ERROR');
  assert.equal(error.message, '입력값을 확인해 주세요.');
  assert.equal(error.timestamp, '2026-11-07T12:00:00');
});

test('인증·404·서버 오류 상태와 메시지를 보존하고 선택 필드가 없어도 처리한다', () => {
  for (const status of [401, 404, 500]) {
    const error = normalizeApiError(serverError(status, { errorCode: 'SERVER_CODE', message: '서버 안내' }));
    assert.equal(error.status, status);
    assert.equal(error.message, '서버 안내');
    assert.deepEqual(error.fieldErrors, []);
  }
  for (const body of [null, '', '<html>Bad gateway</html>', { fieldErrors: 'invalid' }]) {
    assert.deepEqual(normalizeApiError(serverError(502, body)).fieldErrors, []);
  }
});

test('네트워크 실패는 서버 상태 없음으로 유지한다', () => {
  const original = new AxiosError('Network Error', 'ERR_NETWORK');
  const error = normalizeApiError(original);
  assert.equal(error.status, null);
  assert.equal(error.originalError, original);
  assert.deepEqual(error.fieldErrors, []);
});
