import { useState, type FormEvent } from 'react';
import type { EventCreateRequest, EventDetailResponse, EventSummary, TodoResponse } from '../../types/api';
import { createEvent, updateEvent } from '../../api/eventApi';
import { createTodo, updateTodo } from '../../api/todoApi';
import Modal from './Modal';
import { isValidTimeRange } from './validation';
import { useFieldFeedback } from './useFieldFeedback';

export function EventForm({ date, event, onClose, onSaved }: { date: string; event?: EventDetailResponse; onClose: () => void; onSaved: (id: number) => void }) {
  const [value, setValue] = useState<EventCreateRequest>(event ?? { title: '', startDate: date, endDate: date, isAllDay: true, isImportant: false, startTime: '09:00', endTime: '10:00', location: '', memo: '' });
  const feedback = useFieldFeedback();
  const { error } = feedback;
  const [busy, setBusy] = useState(false);
  const period = value.startDate < value.endDate;
  const set = <K extends keyof EventCreateRequest>(key: K, v: EventCreateRequest[K]) => setValue(old => ({ ...old, [key]: v }));
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (busy) return;
    if (!value.title.trim()) return feedback.report(form, { title: '제목을 입력해 주세요.' });
    if (value.endDate < value.startDate) return feedback.report(form, { endDate: '종료일은 시작일보다 빠를 수 없어요.' });
    if (!period && !value.isAllDay && !isValidTimeRange(value.startTime, value.endTime)) return feedback.report(form, { endTime: '종료 시간은 시작 시간보다 늦어야 해요.' });
    const allDay = period || value.isAllDay;
    const payload: EventCreateRequest = { title: value.title.trim(), startDate: value.startDate, endDate: value.endDate, isImportant: value.isImportant, isAllDay: allDay, startTime: allDay ? null : `${value.startTime!.slice(0, 5)}:00`, endTime: allDay ? null : `${value.endTime!.slice(0, 5)}:00`, location: value.location?.trim() || null, memo: value.memo?.trim() || null };
    setBusy(true); feedback.reset();
    try { const saved = event ? await updateEvent(event.id, payload) : await createEvent(payload); onSaved(saved.id); }
    catch (e) { feedback.failure(form, e); } finally { setBusy(false); }
  }
  return <Modal title={event ? '일정 수정' : '새 일정'} onClose={onClose} busy={busy}><form onChange={e => { const el = e.target; if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) feedback.clear(el.name); }} className="p-form" onSubmit={submit}><fieldset disabled={busy}>
    <label>제목<input {...feedback.attrs('title')} autoFocus required maxLength={100} value={value.title} onChange={e => set('title', e.target.value)} placeholder="어떤 일정이 있나요?" />{feedback.hint('title')}</label>
    <div className="p-form-row"><label>시작일<input {...feedback.attrs('startDate')} type="date" required value={value.startDate} onChange={e => set('startDate', e.target.value)} />{feedback.hint('startDate')}</label><label>종료일<input {...feedback.attrs('endDate')} type="date" required min={value.startDate} value={value.endDate} onChange={e => set('endDate', e.target.value)} />{feedback.hint('endDate')}</label></div>
    <label className="p-check"><input {...feedback.attrs('isAllDay')} type="checkbox" checked={period || value.isAllDay} disabled={period} onChange={e => set('isAllDay', e.target.checked)} />종일{period && ' · 기간 일정은 종일로 저장돼요'}{feedback.hint('isAllDay')}</label>
    {!period && !value.isAllDay && <div className="p-form-row"><label>시작 시간<input {...feedback.attrs('startTime')} required type="time" value={value.startTime?.slice(0, 5) ?? ''} onChange={e => set('startTime', e.target.value)} />{feedback.hint('startTime')}</label><label>종료 시간<input {...feedback.attrs('endTime')} required type="time" value={value.endTime?.slice(0, 5) ?? ''} onChange={e => set('endTime', e.target.value)} />{feedback.hint('endTime')}</label></div>}
    <label>장소<input {...feedback.attrs('location')} maxLength={255} value={value.location ?? ''} onChange={e => set('location', e.target.value)} placeholder="장소를 입력해 주세요" />{feedback.hint('location')}</label>
    <label>일정 메모<textarea {...feedback.attrs('memo')} rows={4} value={value.memo ?? ''} onChange={e => set('memo', e.target.value)} placeholder="이 일정에 관한 메모" />{feedback.hint('memo')}</label>
    <label className="p-check"><input {...feedback.attrs('isImportant')} type="checkbox" checked={value.isImportant} onChange={e => set('isImportant', e.target.checked)} />중요 일정{feedback.hint('isImportant')}</label>
    {error && <p className="p-error" role="alert">{error}</p>}<footer><button type="button" className="p-btn" onClick={onClose}>취소</button><button className="p-btn primary">{busy ? '저장 중…' : '저장'}</button></footer>
  </fieldset></form></Modal>;
}

export function TodoForm({ todo, eventId, events, onClose, onSaved }: { todo?: TodoResponse; eventId?: number; events: EventSummary[]; onClose: () => void; onSaved: () => void }) {
  const [content, setContent] = useState(todo?.content ?? '');
  const [link, setLink] = useState(String(todo?.event?.id ?? eventId ?? ''));
  const [busy, setBusy] = useState(false);
  const feedback = useFieldFeedback();
  const { error } = feedback;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; if (busy) return;
    if (!content.trim()) return feedback.report(form, { content: '투두 내용을 입력해 주세요.' });
    setBusy(true); feedback.reset();
    try { const payload = { content: content.trim(), eventId: link ? Number(link) : null }; if (todo) await updateTodo(todo.id, payload); else await createTodo(payload); onSaved(); }
    catch (e) { feedback.failure(form, e); } finally { setBusy(false); }
  }
  return <Modal title={todo ? '투두 수정' : '새 투두'} onClose={onClose} busy={busy}><form onChange={e => { const el = e.target; if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) feedback.clear(el.name); }} className="p-form" onSubmit={submit}><fieldset disabled={busy}>
    <label>할 일<input {...feedback.attrs('content')} autoFocus required maxLength={255} value={content} onChange={e => setContent(e.target.value)} placeholder="해야 할 일을 적어보세요" />{feedback.hint('content')}</label>
    <label>연결 일정<select {...feedback.attrs('eventId')} value={link} onChange={e => setLink(e.target.value)}><option value="">독립 투두</option>{todo?.event && !events.some(e => e.id === todo.event!.id) && <option value={todo.event.id}>{todo.event.title}</option>}{events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</select>{feedback.hint('eventId')}</label><p className="p-muted">현재 달에 조회한 일정에 연결할 수 있어요. 투두에는 별도의 날짜가 없어요.</p>
    {error && <p className="p-error" role="alert">{error}</p>}<footer><button type="button" className="p-btn" onClick={onClose}>취소</button><button className="p-btn primary">{busy ? '저장 중…' : '저장'}</button></footer>
  </fieldset></form></Modal>;
}
