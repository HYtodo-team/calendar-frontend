import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { validateEmail, validateNewPassword } from '../src/auth/validation.ts';
import { clearAccessToken, getAccessToken, getTokenExpiresAt, setAccessToken } from '../src/api/tokenStorage.ts';

function memoryStorage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key) };
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage(), configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: memoryStorage(), configurable: true });
});

test('이메일 공백은 허용하고 빈 값과 잘못된 형식은 거부한다', () => {
  assert.equal(validateEmail('  user@example.com  '), undefined);
  for (const email of ['', '   ', 'user', 'a@@example.com', 'user name@example.com']) assert.ok(validateEmail(email));
});

test('신규 비밀번호는 영문·숫자와 길이 경계를 검증하며 값을 변경하지 않는다', () => {
  assert.equal(validateNewPassword('Abcd1234'), undefined);
  assert.equal(validateNewPassword('a'.repeat(71) + '1'), undefined);
  assert.equal(validateNewPassword(' Abc1234 '), undefined);
  for (const password of ['Abc1234', 'abcdefgh', '12345678', 'a'.repeat(72) + '1']) assert.ok(validateNewPassword(password));
});

test('로그인 유지 해제는 영구 저장 토큰을 제거하고 현재 탭에만 저장한다', () => {
  setAccessToken('persistent-test-token', true, 7200);
  const before = Date.now();
  setAccessToken('session-test-token', false, 7200);
  assert.equal(localStorage.getItem('hytodo.accessToken'), null);
  assert.equal(localStorage.getItem('hytodo.accessTokenExpiresAt'), null);
  assert.equal(sessionStorage.getItem('hytodo.accessToken'), 'session-test-token');
  assert.equal(getAccessToken(), 'session-test-token');
  assert.ok(getTokenExpiresAt() >= before + 7200_000 && getTokenExpiresAt() <= Date.now() + 7200_000);
});

test('로그인 유지 선택도 서버 유효기간을 연장하지 않으며 이전 세션을 정리한다', () => {
  setAccessToken('session-test-token', false, 2);
  setAccessToken('persistent-test-token', true, 2);
  assert.equal(sessionStorage.getItem('hytodo.accessToken'), null);
  assert.equal(sessionStorage.getItem('hytodo.accessTokenExpiresAt'), null);
  assert.equal(getAccessToken(), 'persistent-test-token');
  assert.ok(getTokenExpiresAt() <= Date.now() + 2000);
});

test('로그아웃은 두 저장소의 토큰과 만료 정보를 모두 지운다', () => {
  for (const storage of [localStorage, sessionStorage]) {
    storage.setItem('hytodo.accessToken', 'test-token');
    storage.setItem('hytodo.accessTokenExpiresAt', '1');
  }
  clearAccessToken();
  assert.equal(getAccessToken(), null);
  assert.equal(getTokenExpiresAt(), null);
  assert.equal(sessionStorage.getItem('hytodo.accessTokenExpiresAt'), null);
});

test('기존 저장 데이터에 만료 정보가 없거나 깨졌다면 잘못된 숫자로 해석하지 않는다', () => {
  localStorage.setItem('hytodo.accessToken', 'legacy-test-token');
  assert.equal(getTokenExpiresAt(), null);
  localStorage.setItem('hytodo.accessTokenExpiresAt', 'invalid');
  assert.equal(getTokenExpiresAt(), null);
});
