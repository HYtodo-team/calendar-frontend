import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('node_modules/.cache/home-browser', { recursive: true });
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.clock.install({ time: new Date('2026-07-24T12:00:00+09:00') });
await page.addInitScript(() => {
  localStorage.setItem('hytodo.accessToken', 'test-token');
  localStorage.setItem('hytodo.accessTokenExpiresAt', String(Date.now() + 7200000));
});
let events = [
  { id: 1, title: '기말 프로젝트', startDate: '2026-07-22', endDate: '2026-07-25', isAllDay: true, startTime: null, endTime: null, isImportant: true, location: '스터디룸', memo: '발표 자료 최종 점검' },
  { id: 2, title: '데일리 스크럼 회의', startDate: '2026-07-24', endDate: '2026-07-24', isAllDay: false, startTime: '10:00:00', endTime: '11:00:00', isImportant: false, location: '온라인', memo: null },
  { id: 3, title: 'UX 포트폴리오 정리', startDate: '2026-07-27', endDate: '2026-08-03', isAllDay: true, startTime: null, endTime: null, isImportant: false },
];
let todos = [{ id: 1, content: '발표 자료 최종 수정', isCompleted: false, event: { id: 1, title: '기말 프로젝트' } }];
let notes = { '2026-07-24': '시연 흐름 점검하기' };
const writes = [];
const monthlyReads = [];
let failCalendar = false;
let incompleteDay = true;
let failNote = false;
let noteGate = null;
let failActivation = false;
let failTimetableSave = false;
let failTimetableDelete = false;
let timetables = [{ id: 1, title: '2학기 전공 시간표', semester: '2026년 2학기', isActive: true }];
await page.route('**/api/v1/**', async route => {
  const req = route.request();
  const url = new URL(req.url());
  const path = url.pathname.replace('/api/v1', '');
  const method = req.method();
  const body = req.postDataJSON();
  if (method !== 'GET') writes.push({ path, method, body });
  const send = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: status === 204 ? '' : JSON.stringify(status >= 200 && status < 300 ? { success: true, data } : { success: false, ...data }) });
  if (path === '/users/me') return send({ id: 1, email: 'test@example.com', nickname: '지원' });
  if (path === '/dashboard/summary') return send({ todayEventCount: 2, incompleteTodoCount: todos.filter(t => !t.isCompleted).length, upcomingEvents: events.filter(e => e.id === 1) });
  if (path === '/timetables' && method === 'GET') return send(timetables);
  if (path === '/timetables' && method === 'POST') {
    if (failTimetableSave) return send({ errorCode: 'VALIDATION_ERROR', message: '입력값 확인', fieldErrors: [{ field: 'title', message: '다른 이름을 입력해 주세요.' }] }, 400);
    const t = { id: 2, ...body, isActive: !timetables.some(item => item.isActive) }; timetables.push(t); return send(t, 201);
  }
  if (/^\/timetables\/\d+/.test(path)) {
    const id = Number(path.split('/')[2]);
    if (path.endsWith('/activation')) {
      if (failActivation) return send({ errorCode: 'INTERNAL_SERVER_ERROR', message: '적용 실패' }, 500);
      timetables = timetables.map(t => ({ ...t, isActive: t.id === id }));
    } else if (method === 'PATCH') timetables = timetables.map(t => t.id === id ? { ...t, ...body } : t);
    if (method === 'DELETE') {
      if (failTimetableDelete) return send({ errorCode: 'INTERNAL_SERVER_ERROR', message: '시간표 삭제 실패' }, 500);
      timetables = timetables.filter(t => t.id !== id); return send(null, 204);
    }
    return send({ ...timetables.find(t => t.id === id), entries: id === 1 ? [{ id: 1, dayOfWeek: 1, startTime: '08:30:00', endTime: '14:00:00', title: '근로', location: '도서관', color: '#f49a8f' }] : [] });
  }
  if (path === '/calendar-events' && method === 'GET') {
    const from = url.searchParams.get('from'), to = url.searchParams.get('to');
    monthlyReads.push([from, to, req.headers().authorization]);
    if (failCalendar) return send({ message: '조회 실패', errorCode: 'INTERNAL_SERVER_ERROR' }, 500);
    return send(events.filter(e => e.startDate <= to && e.endDate >= from).map(
      ({ id, title, startDate, endDate, startTime, endTime, isAllDay, isImportant, location }) =>
        ({ id, title, startDate, endDate, startTime, endTime, isAllDay, isImportant, location: location ?? null })
    ));
  }
  if (path === '/calendar-events' && method === 'POST') { const e = { ...body, id: 10 }; events.push(e); return send({ ...e, todos: [] }, 201); }
  if (/^\/calendar-events\/\d+$/.test(path)) {
    const id = Number(path.split('/').at(-1));
    if (method === 'DELETE') { events = events.filter(e => e.id !== id); todos = todos.filter(t => t.event?.id !== id); return send(null, 204); }
    if (method === 'PATCH') events = events.map(e => e.id === id ? { ...e, ...body } : e);
    return send({ ...events.find(e => e.id === id), todos: todos.filter(t => t.event?.id === id) });
  }
  if (path.startsWith('/calendar/dates/')) { const date = path.split('/').at(-1); if (incompleteDay) return send({ date }); if (date.endsWith('-23')) await new Promise(r => setTimeout(r, 250)); return send({ date, events: events.filter(e => e.startDate <= date && e.endDate >= date), dailyNote: { noteDate: date, content: notes[date] ?? null } }); }
  if (path.startsWith('/daily-notes/')) { if (noteGate) await noteGate; if (failNote) return send({ errorCode: 'INTERNAL_SERVER_ERROR', message: '메모 저장 실패' }, 500); const date = path.split('/').at(-1); if (method === 'DELETE') { delete notes[date]; return send(null, 204); } notes[date] = body.content; return send({ noteDate: date, content: body.content }); }
  if (path === '/todos' && method === 'GET') return send(todos);
  if (path === '/todos' && method === 'POST') { const t = { id: 10, content: body.content, event: body.eventId ? { id: body.eventId, title: events.find(e => e.id === body.eventId).title } : null, isCompleted: false }; todos.push(t); return send(t, 201); }
  if (/^\/todos\/\d+/.test(path)) { const id = Number(path.split('/')[2]); if (method === 'DELETE') { todos = todos.filter(t => t.id !== id); return send(null, 204); } todos = todos.map(t => t.id === id ? { ...t, ...body } : t); return send(todos.find(t => t.id === id)); }
  return send({ message: 'Unknown mock endpoint' }, 404);
});
try {
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5173');
  await page.getByRole('heading', { name: '2026년 7월' }).waitFor();
  const dayError = page.locator('.p-detail').getByRole('alert');
  await dayError.waitFor();
  await page.locator('.p-month .p-event').first().waitFor();
  await page.locator('.p-detail .p-todo input').first().waitFor();
  assert.equal(await page.locator('#date-note').isDisabled(), true);
  incompleteDay = false;
  await dayError.getByRole('button').click();
  await page.getByText('시연 흐름 점검하기', { exact: true }).waitFor();
  const periodBars = page.locator('.p-bar').filter({ hasText: 'UX 포트폴리오 정리' });
  await periodBars.first().waitFor();
  assert.equal(await periodBars.count(), 1);
  assert.deepEqual(monthlyReads.at(-1), ['2026-06-28', '2026-08-01', 'Bearer test-token']);
  await page.getByRole('button', { name: '다음 달' }).click();
  await periodBars.nth(1).waitFor();
  assert.deepEqual(monthlyReads.at(-1), ['2026-07-26', '2026-09-05', 'Bearer test-token']);
  assert.equal(await page.locator('.p-month').getByText(/데일리 스크럼 회의/).count(), 0);
  await page.getByRole('button', { name: '이전 달' }).click();
  await page.locator('.p-month').getByText(/데일리 스크럼 회의/).waitFor();
  assert.deepEqual(monthlyReads.at(-1), ['2026-06-28', '2026-08-01', 'Bearer test-token']);
  await page.screenshot({ path: 'node_modules/.cache/home-browser/desktop.png', fullPage: true });
  await page.getByRole('button', { name: '2026-07-23', exact: true }).click();
  await page.getByRole('button', { name: '2026-07-25', exact: true }).click();
  await page.waitForTimeout(400);
  assert.equal(await page.locator('#date-note').inputValue(), '');
  await page.getByRole('button', { name: '오늘', exact: true }).click();
  await page.locator('#date-note').fill('수정한 메모');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.getByText('저장했어요', { exact: true }).waitFor();
  await page.locator('#date-note').fill('   ');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.getByText('메모를 삭제했어요').waitFor();
  assert.ok(writes.some(w => w.method === 'DELETE' && w.path === '/daily-notes/2026-07-24'));
  await page.locator('#date-note').fill('저장 전 초안');
  await page.getByRole('checkbox', { name: /발표 자료 최종 수정/ }).click();
  await page.waitForFunction(() => document.querySelector('.p-todo .done'));
  assert.equal(await page.locator('#date-note').inputValue(), '저장 전 초안');
  // Leaving a dirty note offers cancel, discard and save; failed saves keep the draft.
  await page.getByRole('button', { name: '2026-07-25', exact: true }).click();
  await page.getByRole('button', { name: '계속 작성' }).click();
  assert.equal(await page.locator('#date-note').inputValue(), '저장 전 초안');
  await page.getByRole('button', { name: '2026-07-25', exact: true }).click();
  failNote = true;
  await page.getByRole('button', { name: '저장 후 이동' }).click();
  await page.getByRole('dialog').getByText('메모 저장 실패', { exact: true }).waitFor();
  assert.equal(await page.locator('#date-note').inputValue(), '저장 전 초안');
  failNote = false;
  await page.getByRole('button', { name: '저장 후 이동' }).click();
  await page.getByRole('heading', { name: '7월 25일 토요일' }).waitFor();
  assert.equal(notes['2026-07-24'], '저장 전 초안');
  await page.getByRole('button', { name: '오늘', exact: true }).click();
  await page.locator('#date-note').fill('저장 중 이동 검증');
  assert.equal(await page.evaluate(() => { const e = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; }), true);
  let releaseNote;
  noteGate = new Promise(resolve => { releaseNote = resolve; });
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.getByRole('button', { name: '2026-07-25', exact: true }).click();
  assert.equal(await page.getByRole('dialog').getByRole('button', { name: '버리고 이동' }).isDisabled(), true);
  releaseNote(); noteGate = null;
  await page.getByRole('dialog').getByRole('button', { name: '저장 후 이동' }).waitFor();
  const noteWrites = writes.filter(w => w.path.startsWith('/daily-notes/')).length;
  await page.getByRole('button', { name: '저장 후 이동' }).click();
  await page.getByRole('heading', { name: '7월 25일 토요일' }).waitFor();
  assert.equal(writes.filter(w => w.path.startsWith('/daily-notes/')).length, noteWrites);
  await page.getByRole('button', { name: '오늘', exact: true }).click();
  await page.locator('#date-note').fill('버릴 초안');
  await page.locator('.p-schedule').filter({ hasText: '데일리 스크럼 회의' }).click();
  await page.getByRole('button', { name: '버리고 이동' }).click();
  await page.getByRole('heading', { name: '데일리 스크럼 회의', exact: true }).waitFor();
  await page.getByRole('button', { name: '수정', exact: true }).click();
  await page.getByLabel('시작 시간', { exact: true }).fill('11:00');
  const previousWrites = writes.length;
  await page.getByRole('dialog').getByRole('button', { name: '저장', exact: true }).click();
  await page.getByText('종료 시간은 시작 시간보다 늦어야 해요.').waitFor();
  assert.equal(writes.length, previousWrites);
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await page.getByRole('button', { name: '날짜로 돌아가기' }).click();
  assert.equal(await page.locator('#date-note').inputValue(), '저장 중 이동 검증');
  await page.getByRole('button', { name: '＋ 일정', exact: true }).first().click();
  await page.getByLabel('제목', { exact: true }).fill('새 기간 일정');
  await page.getByLabel('종료일', { exact: true }).fill('2026-07-28');
  await page.getByRole('button', { name: '저장', exact: true }).last().click();
  await page.getByRole('heading', { name: '새 기간 일정', exact: true }).waitFor();
  const eventWrite = writes.find(w => w.method === 'POST' && w.path === '/calendar-events');
  assert.equal(eventWrite.body.isAllDay, true); assert.equal(eventWrite.body.startTime, null); assert.equal(eventWrite.body.endTime, null);
  await page.getByRole('button', { name: '연결 투두 추가' }).click();
  await page.getByLabel('할 일', { exact: true }).fill('연결할 작업');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.getByRole('checkbox', { name: /연결할 작업/ }).waitFor();
  assert.equal(writes.find(w => w.method === 'POST' && w.path === '/todos').body.eventId, 10);
  await page.getByRole('button', { name: '삭제', exact: true }).click();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  assert.ok(!writes.some(w => w.method === 'DELETE' && w.path === '/calendar-events/10'));
  await page.getByRole('button', { name: '삭제', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '삭제', exact: true }).click();
  await page.getByRole('heading', { name: '7월 24일 금요일' }).waitFor();
  assert.ok(!todos.some(t => t.id === 10));
  await page.getByRole('button', { name: /2학기 전공 시간표/ }).click();
  await page.getByRole('dialog').getByText('근로', { exact: true }).waitFor();
  await page.keyboard.press('Escape');
  // Create, edit, activate and delete a timetable without a separate deactivation call.
  await page.getByRole('button', { name: '새 시간표 만들기' }).click();
  await page.getByLabel('시간표 이름', { exact: true }).fill('새 학기');
  await page.getByLabel('학기', { exact: true }).fill('2027-1');
  failTimetableSave = true;
  await page.getByRole('dialog').getByRole('button', { name: '저장', exact: true }).click();
  await page.locator('#tt-title-error').waitFor();
  assert.equal(await page.getByLabel('시간표 이름', { exact: true }).inputValue(), '새 학기');
  failTimetableSave = false;
  await page.getByRole('dialog').getByRole('button', { name: '저장', exact: true }).click();
  await page.getByRole('heading', { name: '새 학기', exact: true }).waitFor();
  assert.equal(timetables.find(t => t.id === 2).isActive, false);
  await page.getByRole('button', { name: '정보 수정' }).click();
  await page.getByLabel('시간표 이름', { exact: true }).fill('새 학기 수정');
  await page.getByRole('dialog').getByRole('button', { name: '저장', exact: true }).click();
  await page.getByRole('heading', { name: '새 학기 수정', exact: true }).waitFor();
  failActivation = true;
  await page.getByRole('button', { name: '이 시간표 적용' }).click();
  await page.getByText('적용 실패', { exact: true }).waitFor();
  assert.equal(timetables.find(t => t.id === 1).isActive, true);
  failActivation = false;
  await page.getByRole('button', { name: '이 시간표 적용' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '적용 중', exact: true }).waitFor();
  assert.equal(timetables.find(t => t.id === 1).isActive, false);
  assert.ok(!writes.some(w => w.path === '/timetables/1/activation'));
  assert.deepEqual(writes.find(w => w.path === '/timetables/2/activation').body, { isActive: true });
  await page.screenshot({ path: 'node_modules/.cache/home-browser/timetable.png' });
  await page.getByRole('button', { name: '시간표 삭제', exact: true }).click();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  assert.ok(!writes.some(w => w.method === 'DELETE' && w.path === '/timetables/2'));
  await page.getByRole('button', { name: '시간표 삭제', exact: true }).click();
  failTimetableDelete = true;
  await page.getByRole('dialog').getByRole('button', { name: '삭제', exact: true }).click();
  await page.getByText('시간표 삭제 실패', { exact: true }).waitFor();
  assert.equal(timetables.length, 2);
  failTimetableDelete = false;
  await page.getByRole('dialog').getByRole('button', { name: '삭제', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal(timetables.length, 1);
  assert.equal(timetables[0].isActive, false);
  failCalendar = true;
  await page.getByRole('button', { name: '다음 달' }).click();
  await page.getByText('조회 실패', { exact: false }).waitFor();
  failCalendar = false;
  await page.getByRole('button', { name: '다시 시도', exact: true }).click();
  await page.locator('.p-month').waitFor();
  await page.getByRole('button', { name: '오늘', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'node_modules/.cache/home-browser/mobile.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  // At mobile width, remove the last timetable and create from the empty list.
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /2학기 전공 시간표/ }).click();
  await page.getByRole('button', { name: '시간표 삭제', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '삭제', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await page.getByRole('dialog').getByText('등록된 시간표가 없어요.', { exact: true }).waitFor();
  await page.getByRole('dialog').getByRole('button', { name: '새 시간표 만들기' }).click();
  await page.getByLabel('시간표 이름', { exact: true }).fill('모바일 시간표');
  await page.getByLabel('학기', { exact: true }).fill('2027-2');
  await page.getByRole('dialog').getByRole('button', { name: '저장', exact: true }).click();
  await page.getByRole('heading', { name: '모바일 시간표', exact: true }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole('dialog').getByRole('button', { name: '적용 중', exact: true }).waitFor();
  await page.screenshot({ path: 'node_modules/.cache/home-browser/timetable-mobile.png' });
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  console.log('PASS: desktop/mobile, date race, note PUT/DELETE and leave guard, mixed time validation, todo completion/link, event CRUD, timetable create/edit/activation/delete and failures, error retry');
} finally { await browser.close(); }
