import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.clock.install();
  const user = { id: 1, email: 'tester@example.com', nickname: '테스터', createdAt: '2026-11-07T10:00:00' };
  const password = 'testpass123';
  let profileStatus = 404;
  let tokenType = 'Bearer';
  let profiles = 0;
  await page.route('**/api/v1/**', async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace('/api/v1', '');
    const ok = (data, status = 200) => route.fulfill({ status, json: { success: true, data } });
    const fail = (status, errorCode) => route.fulfill({ status, json: { success: false, errorCode, message: '테스트 오류', timestamp: user.createdAt } });
    if (path === '/auth/signup' || path === '/auth/login') {
      assert.equal(req.method(), 'POST');
      assert.equal(req.headers().authorization, undefined);
      const body = req.postDataJSON();
      if (path.endsWith('signup')) {
        if (body.email === 'used@example.com') return fail(409, 'EMAIL_ALREADY_EXISTS');
        assert.deepEqual(body, { email: user.email, nickname: user.nickname, password });
        return ok(user, 201);
      }
      if (body.password !== password) return fail(401, 'INVALID_CREDENTIALS');
      assert.deepEqual(body, { email: user.email, password });
      return ok({ accessToken: 'mock-token', tokenType, expiresIn: 7200 });
    }
    assert.equal(req.headers().authorization, 'Bearer mock-token');
    if (path === '/users/me') {
      profiles++;
      return profileStatus === 200 ? ok(user) : fail(profileStatus, profileStatus === 401 ? 'UNAUTHORIZED' : 'RESOURCE_NOT_FOUND');
    }
    if (path.startsWith('/calendar/dates/')) return ok({ events: [], dailyNote: { content: null } });
    if (path === '/dashboard/summary') return ok({ todayEventCount: 0, incompleteTodoCount: 0, upcomingEvents: [] });
    if (['/todos','/timetables','/calendar-events'].includes(path)) return ok([]);
    throw new Error('Unexpected route: ' + path);
  });
  const button = name => page.getByRole('button', { name, exact: true });
  const tokenStores = () => page.evaluate(() => [sessionStorage, localStorage].map(store => store.getItem('hytodo.accessToken')));
  await page.goto(new URL('/signup', process.env.APP_URL || 'http://127.0.0.1:5173').href);
  await page.locator('#signup-email').fill('used@example.com');
  await page.locator('#signup-nickname').fill(user.nickname);
  await page.locator('#signup-password').fill(password);
  await page.locator('#signup-password-confirm').fill(password);
  await button('회원가입').click();
  await page.getByText('이미 사용 중인 이메일이에요.').waitFor();
  await page.locator('#signup-email').fill(user.email);
  await button('회원가입').click();
  await page.waitForURL('**/login');
  await page.locator('#login-email').fill(user.email);
  await page.locator('#login-password').fill('wrong');
  await button('로그인').click();
  await page.getByRole('alert').waitFor();
  assert.deepEqual(await tokenStores(), [null, null]);
  await page.locator('#login-password').fill(password);
  tokenType = 'Unexpected';
  await button('로그인').click();
  await page.getByText('로그인에 실패했어요. 잠시 후 다시 시도해 주세요.').waitFor();
  assert.deepEqual(await tokenStores(), [null, null]);
  assert.equal(profiles, 0);
  tokenType = 'Bearer';
  await button('로그인').click();
  await button('다시 시도').waitFor();
  assert.deepEqual(await tokenStores(), ['mock-token', null]);
  profileStatus = 200;
  await button('다시 시도').click();
  await button('로그아웃').waitFor();
  const beforeReload = profiles;
  await page.reload();
  await button('로그아웃').waitFor();
  assert.ok(profiles > beforeReload);
  await button('로그아웃').click();
  await page.waitForURL('**/login');
  assert.deepEqual(await tokenStores(), [null, null]);
  await page.locator('#login-email').fill(user.email);
  await page.locator('#login-password').fill(password);
  await page.getByLabel('로그인 상태 유지').check();
  await button('로그인').click();
  await button('로그아웃').waitFor();
  assert.deepEqual(await tokenStores(), [null, 'mock-token']);
  await page.reload();
  await button('로그아웃').waitFor();
  await page.clock.fastForward(7200001);
  await page.waitForURL('**/login');
  assert.deepEqual(await tokenStores(), [null, null]);
  console.log('PASS: signup, duplicate email, invalid credentials/token type, missing profile and retry, refresh in both storage modes, logout and token expiry');
} finally { await browser.close(); }
