import { useRef, useState, type FormEvent } from 'react';
import { createTimetableEntry, updateTimetableEntry } from '../../api/timetableApi';
import { isApiError } from '../../api/errors';
import type { TimetableEntryRequest, TimetableEntryResponse } from '../../types/api';
import Modal from './Modal';
import { errorMessage } from './useRemote';

import { weekdayNames } from './timetable';
const labels = { title: '제목', dayOfWeek: '요일', startTime: '시작 시간', endTime: '종료 시간', location: '장소', memo: '메모', color: '색상 (선택)' };
type Field = keyof typeof labels;

export default function TimetableEntryForm({ timetableId, entry, onClose, onSaved, onMissing }: {
  timetableId: number; entry?: TimetableEntryResponse; onClose: () => void;
  onSaved: (id: number) => void; onMissing: () => void;
}) {
  const [value, setValue] = useState<TimetableEntryRequest>(() => ({
    title: entry?.title ?? '', dayOfWeek: entry?.dayOfWeek ?? 1,
    startTime: entry?.startTime ?? '09:00', endTime: entry?.endTime ?? '10:00',
    location: entry?.location ?? '', memo: entry?.memo ?? '', color: entry?.color ?? '',
  }));
  const [fields, setFields] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState('');
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  function set<K extends Field>(key: K, next: TimetableEntryRequest[K]) {
    setValue(old => ({ ...old, [key]: next }));
    setFields(old => ({ ...old, [key]: undefined })); setError('');
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || missing) return;
    const form = event.currentTarget;
    const errors: Partial<Record<Field, string>> = {};
    if (!value.title.trim() || value.title.trim().length > 100) errors.title = '제목은 1~100자로 입력해 주세요.';
    if (!Number.isInteger(value.dayOfWeek) || value.dayOfWeek < 1 || value.dayOfWeek > 7) errors.dayOfWeek = '요일을 선택해 주세요.';
    const startTime = value.startTime.length === 5 ? value.startTime + ':00' : value.startTime;
    const endTime = value.endTime.length === 5 ? value.endTime + ':00' : value.endTime;
    const timeFormat = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
    if ((value.location?.trim().length ?? 0) > 255) errors.location = '장소는 255자 이하로 입력해 주세요.';
    if (!timeFormat.test(startTime) || !timeFormat.test(endTime) || startTime >= endTime) errors.endTime = '종료 시간은 시작 시간보다 늦어야 해요.';
    if (value.color?.trim() && !/^#[0-9a-f]{6}$/i.test(value.color.trim())) errors.color = '색상은 #2563EB처럼 6자리 색상 코드로 입력해 주세요.';
    function focusError(next: Partial<Record<Field, string>>) {
      const first = Object.keys(next)[0];
      if (first) requestAnimationFrame(() => form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
    }
    setFields(errors); setError('');
    if (Object.keys(errors).length) { focusError(errors); return; }
    lock.current = true; setBusy(true);
    // PATCH uses an empty string to clear an optional field; null keeps its old value.
    const emptyValue = entry ? '' : null;
    const payload: TimetableEntryRequest = {
      ...value, title: value.title.trim(), startTime, endTime,
      location: value.location?.trim() || emptyValue,
      memo: value.memo?.trim() || emptyValue,
      color: value.color?.trim() || emptyValue,
    };
    try {
      const saved = entry ? await updateTimetableEntry(timetableId, entry.id, payload) : await createTimetableEntry(timetableId, payload);
      onSaved(saved.id);
    } catch (e) {
      const next: Partial<Record<Field, string>> = {};
      if (isApiError(e)) {
        for (const field of e.fieldErrors) if (Object.hasOwn(labels, field.field)) next[field.field as Field] = field.reason;
        setMissing(e.status === 404);
      }
      setFields(next); setError(errorMessage(e)); focusError(next);
    } finally { lock.current = false; setBusy(false); }
  }
  return <Modal title={entry ? '시간표 항목 수정' : '시간표 항목 추가'} busy={busy} onClose={onClose}>
    <form className="p-form" noValidate onSubmit={submit}><fieldset disabled={busy || missing}>
      {(Object.keys(labels) as Field[]).map(name => {
        const attrs = { id: `entry-${name}`, name, 'aria-invalid': !!fields[name], 'aria-describedby': fields[name] ? `entry-${name}-error` : undefined };
        return <div key={name}><label htmlFor={`entry-${name}`}>{labels[name]}</label>
          {name === 'dayOfWeek' ? <select {...attrs} value={value.dayOfWeek} onChange={e => set(name, Number(e.target.value))}>{weekdayNames.map((day, i) => <option key={day} value={i + 1}>{day}요일</option>)}</select>
            : name === 'memo' ? <textarea {...attrs} rows={4} value={value.memo ?? ''} onChange={e => set(name, e.target.value)} />
              : <input {...attrs} autoFocus={name === 'title'} required={['title', 'startTime', 'endTime'].includes(name)} maxLength={name === 'title' ? 100 : name === 'location' ? 255 : undefined} step={name.endsWith('Time') ? 1 : undefined} type={name.endsWith('Time') ? 'time' : 'text'} placeholder={name === 'color' ? '#2563EB · 비워두면 기본 색상' : undefined} value={value[name] ?? ''} onChange={e => set(name, e.target.value)} />}
        {fields[name] && <p className="p-error" id={`entry-${name}-error`}>{fields[name]}</p>}</div>;
      })}
      {error && <p className="p-error" role="alert">{error}</p>}
      <footer><button type="button" className="p-btn" onClick={onClose}>취소</button><button className="p-btn primary">{busy ? '저장 중…' : '저장'}</button></footer>
    </fieldset></form>
    {missing && <div role="alert"><p>항목이나 시간표가 삭제되었거나 접근할 수 없어요. 입력 내용은 위에서 확인할 수 있어요.</p><button className="p-btn" onClick={onMissing}>시간표로 돌아가기</button></div>}
  </Modal>;
}
