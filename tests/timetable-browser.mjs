// Start Vite first. Set PLAYWRIGHT_MODULE to an external index.mjs file URL if needed.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
let entries = [];
let nextId = 1;
let failSave = false;
let failDelete = false;
let failRead = false;
const writes = [];
const timetable = { id: 1, title: '테스트 시간표', semester: '2026-2', isActive: true };
await page.addInitScript(() => {
  localStorage.setItem('hytodo.accessToken', 'test-token');
  localStorage.setItem('hytodo.accessTokenExpiresAt', String(Date.now() + 7200000));
});
await page.route('**/api/v1/**', async route => {
  const req = route.request();
  const path = new URL(req.url()).pathname.replace('/api/v1', '');
  const method = req.method();
  const body = req.postDataJSON();
  const send = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: status === 204 ? '' : JSON.stringify(status >= 200 && status < 300 ? { success: true, data } : { success: false, ...data }) });
  if (method !== 'GET') writes.push({ path, method, body });
  if (path === '/users/me') return send({ id: 1, email: 'test@example.com', nickname: '테스터' });
  if (path === '/dashboard/summary') return send({ todayEventCount: 0, incompleteTodoCount: 0, upcomingEvents: [] });
  if (path === '/timetables') return send([timetable]);
  if (path === '/timetables/1') return send({ ...timetable, entries });
  if (path.startsWith('/timetables/1/entries')) {
    const entryId = Number(path.split('/')[4]);
    if (method === 'POST' || method === 'PATCH') {
      if (failSave) return send({ errorCode: 'VALIDATION_ERROR', message: '입력 확인', fieldErrors: [{ field: 'title', message: '제목을 다시 확인해 주세요.' }] }, 400);
      const previous = entries.find(entry => entry.id === entryId);
      const saved = { ...body, id: method === 'POST' ? nextId++ : entryId };
      for (const field of ['memo', 'location', 'color']) {
        const value = body[field] ?? previous?.[field];
        saved[field] = value || null;
      }
      entries = method === 'POST' ? [...entries, saved] : entries.map(e => e.id === entryId ? saved : e);
      return send(saved, method === 'POST' ? 201 : 200);
    }
    if (method === 'DELETE') {
      if (failDelete) return send({ errorCode: 'INTERNAL_SERVER_ERROR', message: '삭제 실패' }, 500);
      entries = entries.filter(e => e.id !== entryId); return send(null, 204);
    }
    if (failRead) return send({ errorCode: 'INTERNAL_SERVER_ERROR', message: '상세 조회 실패' }, 500);
    const entry = entries.find(e => e.id === entryId);
    return entry ? send(entry) : send({ errorCode: 'RESOURCE_NOT_FOUND', message: '항목 없음' }, 404);
  }
  if (path.startsWith('/calendar/dates/')) return send({ date: path.split('/').at(-1), events: [], dailyNote: { content: null } });
  if (path === '/calendar-events' || path === '/todos') return send([]);
  throw new Error(`Unexpected request: ${method} ${path}`);
});
const dialog = page.getByRole('dialog');
const click = name => dialog.getByRole('button', { name, exact: true }).click();
const waitTitle = title => dialog.getByRole('heading', { name: title, exact: true }).waitFor();
try {
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5173');
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await dialog.getByRole('button', { name: /테스트 시간표/ }).click();
  await dialog.getByText('등록된 시간표 항목이 없어요.').waitFor();
  await click('＋ 항목 추가');
  await dialog.getByLabel('제목', { exact: true }).fill('주말 수업');
  await dialog.getByLabel('요일', { exact: true }).selectOption('7');
  await dialog.getByLabel('시작 시간', { exact: true }).fill('23:00:30');
  await dialog.getByLabel('종료 시간', { exact: true }).fill('23:00:30');
  await click('저장');
  await dialog.getByText('종료 시간은 시작 시간보다 늦어야 해요.').waitFor();
  assert.equal(writes.length, 0);
  await dialog.getByLabel('종료 시간', { exact: true }).fill('23:59');
  await dialog.getByLabel('색상 (선택)', { exact: true }).fill('#bad');
  await click('저장');
  await dialog.getByText('색상은 #2563EB처럼 6자리 색상 코드로 입력해 주세요.').waitFor();
  assert.equal(writes.length, 0);
  await dialog.getByLabel('색상 (선택)', { exact: true }).fill('#2563EB');
  await dialog.getByLabel('장소', { exact: true }).fill('공학관');
  await dialog.getByLabel('메모', { exact: true }).fill('교재 준비');
  failSave = true;
  await click('저장');
  await dialog.locator('#entry-title-error').waitFor();
  assert.equal(await dialog.getByLabel('제목', { exact: true }).inputValue(), '주말 수업');
  failSave = false;
  await click('저장');
  await waitTitle('시간표 항목 상세');
  await dialog.getByText('교재 준비', { exact: true }).waitFor();
  assert.equal(entries[0].startTime, '23:00:30');
  await click('시간표로 돌아가기');
  const block = dialog.getByRole('button', { name: /주말 수업 일요일.*상세 보기/ });
  await block.waitFor();
  await block.focus(); await page.keyboard.press('Enter');
  await click('항목 수정');
  assert.equal(await dialog.getByLabel('시작 시간', { exact: true }).inputValue(), '23:00:30');
  assert.equal(await dialog.getByLabel('장소', { exact: true }).getAttribute('maxlength'), '255');
  const longTitle = `주말 수업 ${'긴제목'.repeat(28)}`;
  await dialog.getByLabel('제목', { exact: true }).fill(longTitle);
  await dialog.getByLabel('요일', { exact: true }).selectOption('6');
  await dialog.getByLabel('시작 시간', { exact: true }).fill('06:00');
  await dialog.getByLabel('종료 시간', { exact: true }).fill('07:30');
  await dialog.getByLabel('메모', { exact: true }).fill('');
  await dialog.getByLabel('장소', { exact: true }).fill('');
  await dialog.getByLabel('색상 (선택)', { exact: true }).fill('');
  await click('저장');
  await dialog.getByText('토요일 · 06:00–07:30', { exact: true }).waitFor();
  for (const key of ['memo', 'location', 'color']) {
    assert.equal(writes.at(-1).body[key], '');
    assert.equal(entries[0][key], null);
  }
  await dialog.getByText('등록된 메모가 없어요.').waitFor();
  await click('시간표로 돌아가기');
  const updatedBlock = dialog.getByRole('button', { name: /주말 수업.*토요일.*상세 보기/ });
  await updatedBlock.waitFor();
  assert.equal(entries[0].title, longTitle);
  assert.equal(await updatedBlock.evaluate(el => el.style.height), '72px');
  assert.equal(await updatedBlock.evaluate(el => el.style.top), '0px');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await mkdir('node_modules/.cache/timetable-browser', { recursive: true });
  await page.screenshot({ path: 'node_modules/.cache/timetable-browser/mobile.png' });
  failRead = true;
  await updatedBlock.click();
  await dialog.getByRole('alert').waitFor();
  failRead = false; await click('다시 시도');
  await dialog.getByRole('heading', { name: longTitle, exact: true }).waitFor();
  assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth), true);
  await click('항목 삭제');
  const beforeCancel = writes.length;
  await click('취소');
  assert.equal(writes.length, beforeCancel);
  await click('항목 삭제'); failDelete = true;
  await click('삭제'); await dialog.getByText('삭제 실패', { exact: true }).waitFor();
  assert.equal(entries.length, 1);
  failDelete = false; await click('삭제');
  await dialog.getByText('등록된 시간표 항목이 없어요.').waitFor();
  assert.equal(entries.length, 0);
  // A stale grid item must offer a recovery path after a 404.
  entries = [{ id: 99, title: '삭제 예정', dayOfWeek: 1, startTime: '09:00:00', endTime: '10:00:00', location: null, memo: null, color: null }];
  await click('닫기');
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await dialog.getByRole('button', { name: /테스트 시간표/ }).click();
  const stale = dialog.getByRole('button', { name: /삭제 예정.*상세 보기/ });
  await stale.waitFor(); entries = []; await stale.click();
  await dialog.getByText('항목이 삭제되었거나 접근할 수 없어요.').waitFor();
  await click('시간표로 돌아가기');
  await dialog.getByText('등록된 시간표 항목이 없어요.').waitFor();
  assert.deepEqual(errors, []);
  assert.ok(writes.every(w => w.path.startsWith('/timetables/1/entries')));
  console.log('PASS: timetable entry create/read/update/delete, validation, keyboard, mobile, retry, 404 and cancel');
} finally { await browser.close(); }
