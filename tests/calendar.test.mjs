import assert from 'node:assert/strict';
import { test } from 'node:test';
import { monthDays, shiftMonth, weekSegments, daysUntil } from '../src/pages/home/calendar.ts';

test('월간 그리드는 윤년과 4·5·6주를 포함하고 조회 범위를 62일 이내로 유지한다', () => {
  assert.equal(monthDays('2026-02').length, 28);
  assert.equal(monthDays('2026-07').length, 35);
  assert.equal(monthDays('2026-08').length, 42);
  assert.ok(monthDays('2028-02').includes('2028-02-29'));
  for (let y = 2020; y < 2040; y++) for (let m = 1; m <= 12; m++) {
    const days = monthDays(`${y}-${String(m).padStart(2, '0')}`);
    assert.ok([28, 35, 42].includes(days.length));
    assert.equal(daysUntil(days[0], days.at(-1)), days.length - 1);
    assert.equal(new Date(`${days[0]}T12:00:00`).getDay(), 0);
  }
});
test('월 이동은 월말과 연도 경계에서 날짜 넘침이 없다', () => {
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
});
test('기간 일정은 주 경계를 잘라 표시하고 겹치는 막대를 분리한다', () => {
  const days = monthDays('2026-07').slice(0, 7);
  const events = [{ id: 1, startDate: '2026-06-20', endDate: '2026-07-03' }, { id: 2, startDate: '2026-07-01', endDate: '2026-07-08' }, { id: 3, startDate: '2026-07-03', endDate: '2026-07-03' }];
  const segments = weekSegments(events, days);
  assert.equal(segments.length, 2);
  assert.deepEqual(segments.map(s => [s.start, s.end, s.lane]), [[0, 5, 0], [3, 6, 1]]);
});
