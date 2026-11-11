import { useState, type FormEvent } from 'react';
import { createTimetable, updateTimetable } from '../../api/timetableApi';
import { isApiError } from '../../api/errors';
import type { TimetableResponse } from '../../types/api';
import { errorMessage } from './useRemote';
import Modal from './Modal';

export default function TimetableForm({ timetable, onClose, onSaved }: {
  timetable?: TimetableResponse; onClose: () => void; onSaved: (id: number) => void;
}) {
  const [title, setTitle] = useState(timetable?.title ?? '');
  const [semester, setSemester] = useState(timetable?.semester ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const errors: Record<string, string> = {};
    if (!title.trim() || title.trim().length > 100) errors.title = '이름은 1~100자로 입력해 주세요.';
    if (!semester.trim() || semester.trim().length > 50) errors.semester = '학기는 1~50자로 입력해 주세요.';
    setFields(errors); setError('');
    if (Object.keys(errors).length) { form.querySelector<HTMLInputElement>(`[name="${Object.keys(errors)[0]}"]`)?.focus(); return; }
    setBusy(true);
    try {
      const values = { title: title.trim(), semester: semester.trim() };
      const result = timetable ? await updateTimetable(timetable.id, values) : await createTimetable(values);
      onSaved(result.id);
    } catch (e) {
      const fieldErrors = isApiError(e) ? Object.fromEntries(e.fieldErrors.filter(f => ['title', 'semester'].includes(f.field)).map(f => [f.field, f.reason])) : {};
      setFields(fieldErrors); setError(errorMessage(e));
      // The fieldset is re-enabled after this state update before focusing.
      requestAnimationFrame(() => form.querySelector<HTMLInputElement>(`[name="${Object.keys(fieldErrors)[0]}"]`)?.focus());
    } finally { setBusy(false); }
  }
  return <Modal title={timetable ? '시간표 정보 수정' : '새 시간표'} onClose={onClose} busy={busy}>
    <form className="p-form" onSubmit={submit}><fieldset disabled={busy}>
      <label>시간표 이름<input autoFocus name="title" required maxLength={100} value={title} onChange={e => setTitle(e.target.value)} aria-invalid={!!fields.title} aria-describedby={fields.title ? 'tt-title-error' : undefined} placeholder="예: 2학기 전공 시간표" /></label>
      {fields.title && <p id="tt-title-error" className="p-error">{fields.title}</p>}
      <label>학기<input name="semester" required maxLength={50} value={semester} onChange={e => setSemester(e.target.value)} aria-invalid={!!fields.semester} aria-describedby={fields.semester ? 'tt-semester-error' : undefined} placeholder="예: 2026년 2학기" /></label>
      {fields.semester && <p id="tt-semester-error" className="p-error">{fields.semester}</p>}
      {error && <p className="p-error" role="alert">{error}</p>}
      <footer><button type="button" className="p-btn" onClick={onClose}>취소</button><button className="p-btn primary">{busy ? '저장 중…' : '저장'}</button></footer>
    </fieldset></form>
  </Modal>;
}
