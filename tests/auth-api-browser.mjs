import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
try {
  const page = await browser.newPage();
  const requests = [];
  let profileStatus = 200;
  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    requests.push({ path, authorization: request.headers().authorization });
    const user = { id: 1, email: 'test@example.com', nickname: '테스터' };
    let data = user;
    let status = 200;
    if (path.endsWith('/signup')) status = 201;
    if (path.endsWith('/login')) data = { accessToken: 'test-token', tokenType: 'Bearer', expiresIn: 7200 };
    if (path.endsWith('/me')) status = profileStatus;
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(status === 200 || status === 201
      ? { success: true, data }
      : { success: false, errorCode: 'UNAUTHORIZED', message: '인증이 필요합니다.' }) });
  });
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5173');
  // Exercise the real API modules through Vite and Axios, not a second implementation.
  const result = await page.evaluate(async () => {
    const { signup, login, getMe } = await import('/src/api/authApi.ts');
    const { setAccessToken } = await import('/src/api/tokenStorage.ts');
    const user = await signup({ email: 'test@example.com', password: 'password123', nickname: '테스터' });
    const token = await login({ email: 'test@example.com', password: 'password123' });
    setAccessToken(token.accessToken, false, token.expiresIn);
    const profile = await getMe();
    return { user, token, profile };
  });
  assert.equal(result.user.id, 1);
  assert.equal(result.token.accessToken, 'test-token');
  assert.equal(result.profile.nickname, '테스터');
  assert.equal(requests.find(r => r.path.endsWith('/signup')).authorization, undefined);
  assert.equal(requests.find(r => r.path.endsWith('/login')).authorization, undefined);
  assert.equal(requests.find(r => r.path.endsWith('/me')).authorization, 'Bearer test-token');
  profileStatus = 401;
  const unauthorized = await page.evaluate(async () => {
    const { getMe } = await import('/src/api/authApi.ts');
    const { getAccessToken } = await import('/src/api/tokenStorage.ts');
    let notified = false;
    window.addEventListener('auth:unauthorized', () => { notified = true; }, { once: true });
    try { await getMe(); } catch (e) { return { status: e.status, token: getAccessToken(), notified }; }
  });
  assert.deepEqual(unauthorized, { status: 401, token: null, notified: true });
  console.log('PASS: wrapped signup/login/profile, Bearer header and protected 401 session clearing');
} finally { await browser.close(); }
