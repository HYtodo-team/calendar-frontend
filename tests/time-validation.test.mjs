import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidTimeRange } from '../src/pages/home/validation.ts';

test('서버와 입력의 시간 형식이 달라도 동일 시각과 역전 구간을 거부한다', () => {
  for (const [start, end] of [['10:00', '10:00:00'], ['10:00:00', '10:00'], ['10:00', '10:00'], ['11:00', '10:00:00'], ['10:00:59', '10:00']]) {
    assert.equal(isValidTimeRange(start, end), false);
  }
  assert.equal(isValidTimeRange('09:59', '10:00:00'), true);
  assert.equal(isValidTimeRange('00:00:00', '23:59'), true);
});
test('없거나 잘못된 시간은 저장 가능한 구간이 아니다', () => {
  for (const value of [undefined, null, '', '25:00', '10:60', '9:00', '09:00:99']) assert.equal(isValidTimeRange(value, '23:59'), false);
});
