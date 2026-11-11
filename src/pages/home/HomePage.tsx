import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { getEvents, getEvent, deleteEvent } from '../../api/eventApi';
import { getTodos, updateTodoCompletion, deleteTodo } from '../../api/todoApi';
import { getCalendarDate } from '../../api/calendarApi';
import { getDashboardSummary } from '../../api/dashboardApi';
import { getTimetables } from '../../api/timetableApi';
import type { EventDetailResponse, TodoResponse } from '../../types/api';
import { dateKey, localDate, monthDays, shiftMonth, daysUntil, eventTime } from './calendar';
import { useRemote, errorMessage } from './useRemote';
import MonthCalendar from './MonthCalendar';
import { EventForm, TodoForm } from './Forms';
import DateNote from './DateNote';
import { useDateNote } from './useDateNote';
import TimetableForm from './TimetableForm';
import Modal from './Modal';
import TimetableView from './TimetableView';
import './HomePage.css';

function RemoteState({ error, loading, retry, children }: { error?: string; loading: boolean; retry: () => void; children: ReactNode }) {
  return error ? <div className="p-error" role="alert">{error}<button className="p-btn" onClick={retry}>다시 시도</button></div> : loading ? <p className="p-loading" role="status">불러오는 중…</p> : <>{children}</>;
}
type Editor = { type: 'event'; event?: EventDetailResponse } | { type: 'todo'; todo?: TodoResponse; eventId?: number } | null;
export default function HomePage() {
  const { state, signOut } = useAuth();
  const navigate = useNavigate();
  const guest = state.status !== 'authenticated';
  const [today, setToday] = useState(() => dateKey(new Date()));
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [eventId, setEventId] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  const [editor, setEditor] = useState<Editor>(null);
  const [drawer, setDrawer] = useState(false);
  const [timetable, setTimetable] = useState<number | null>(null);
  const [newTimetable, setNewTimetable] = useState(false);
  const [timetableVersion, setTimetableVersion] = useState(0);
  const refreshTimetables = () => setTimetableVersion(v => v + 1);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [confirm, setConfirm] = useState<{ type: 'event' | 'todo'; id: number; title: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const refresh = () => setVersion(v => v + 1);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(dateKey(new Date())), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const days = monthDays(month);
  const scope = `${guest}:${version}`;
  const calendar = useRemote(`${scope}:${month}`, () => guest ? Promise.resolve([]) : getEvents({ from: days[0], to: days[days.length - 1] }));
  const summary = useRemote(`${scope}:${today}`, () => guest ? Promise.resolve({ todayEventCount: 0, incompleteTodoCount: 0, upcomingEvents: [] }) : getDashboardSummary());
  const todos = useRemote(scope, () => guest ? Promise.resolve([]) : getTodos());
  const timetables = useRemote(`${guest}:${timetableVersion}`, () => guest ? Promise.resolve([]) : getTimetables());
  const daily = useRemote(`${scope}:${selected}`, () => guest ? Promise.resolve({ date: selected, events: [], dailyNote: { id: null, noteDate: selected, content: null } }) : getCalendarDate(selected));
  const detail = useRemote(`${scope}:${eventId}`, () => eventId === null || guest ? Promise.resolve(null) : getEvent(eventId));
  const note = useDateNote(selected, daily.data ? daily.data.dailyNote.content ?? '' : undefined, refresh);
  function guardNavigation(action: () => void) {
    if (note.dirty || note.busy) { setDrawer(false); setPendingNavigation(() => action); }
    else action();
  }
  const dateLabel = (d: string) => localDate(d).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
  function selectDate(date: string) {
    const move = () => { setSelected(date); setEventId(null); setActionError(''); };
    if (date === selected && eventId === null) move(); else guardNavigation(move);
  }
  function selectEvent(id: number) { guardNavigation(() => { setEventId(id); setActionError(''); setDrawer(false); }); }
  async function mutate(action: () => Promise<unknown>, after?: () => void) {
    if (busy) return;
    setBusy(true); setActionError('');
    try { await action(); after?.(); refresh(); } catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  const sidebar = <><div className="p-brand"><span>P</span><strong>Planary</strong></div><p className="p-today">{localDate(today).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
    <section className="p-side-section"><h2>오늘의 요약</h2><RemoteState error={summary.error} loading={!summary.data} retry={refresh}><div className="p-summary"><div>남은 투두<strong>{summary.data?.incompleteTodoCount}</strong></div><div>오늘 일정<strong>{summary.data?.todayEventCount}</strong></div><div>임박한 기한<strong>{summary.data?.upcomingEvents.length}</strong></div></div></RemoteState></section>
    <section className="p-side-section"><h2>기한 목록 <span>5일 이내</span></h2>{summary.data?.upcomingEvents.length === 0 && <p className="p-muted">임박한 기간 일정이 없어요.</p>}{summary.data?.upcomingEvents.map(e => <button className={`p-nav ${eventId === e.id ? 'active' : ''}`} key={e.id} onClick={() => selectEvent(e.id)}><span><b>{e.title}</b><em>{daysUntil(today, e.endDate) === 0 ? 'D-day' : `D-${daysUntil(today, e.endDate)}`}</em></span><small>{e.startDate.slice(5).replace('-', '.')}–{e.endDate.slice(5).replace('-', '.')}</small></button>)}</section>
    <section className="p-side-section"><h2>고정 시간표<button className="p-icon" aria-label="새 시간표 만들기" disabled={guest} onClick={() => { setDrawer(false); setNewTimetable(true); }}>＋</button></h2><RemoteState error={timetables.error} loading={!timetables.data} retry={refreshTimetables}>{timetables.data?.length === 0 && <p className="p-muted">등록된 시간표가 없어요.</p>}{timetables.data?.map(t => <button className="p-nav" key={t.id} onClick={() => { setDrawer(false); setTimetable(t.id); }}><span><b>{t.title}</b>{t.isActive && <em className="green">적용 중</em>}</span><small>{t.semester} · 주간 시간표</small></button>)}</RemoteState></section>
    <div className="p-account"><div className="p-avatar">{guest ? 'G' : state.user.nickname.slice(0, 1)}</div><div><strong>{guest ? '게스트' : state.user.nickname}</strong><button onClick={() => guardNavigation(() => { signOut(); navigate('/login', { replace: true }); })}>{guest ? '로그인하기' : '로그아웃'}</button></div></div></>;
  const todoList = (items: TodoResponse[]) => <>{!items.length && <p className="p-empty">아직 등록된 투두가 없어요.</p>}{items.map(t => <div className="p-todo" key={t.id}><label><input type="checkbox" checked={t.isCompleted} disabled={busy || guest} onChange={() => void mutate(() => updateTodoCompletion(t.id, !t.isCompleted))} /><span className={t.isCompleted ? 'done' : ''}>{t.content}{t.event && <small>{t.event.title}</small>}</span></label><button className="p-icon" aria-label={`${t.content} 수정`} disabled={busy || guest} onClick={() => setEditor({ type: 'todo', todo: t })}>✎</button><button className="p-icon" aria-label={`${t.content} 삭제`} disabled={busy || guest} onClick={() => { setActionError(''); setConfirm({ type: 'todo', id: t.id, title: t.content }); }}>×</button></div>)}</>;
  return <main className="planner"><aside className="p-sidebar">{sidebar}</aside><section className="p-calendar-area" aria-label="월간 캘린더"><div className="p-mobile-header"><button className="p-btn" aria-label="메뉴 열기" onClick={() => setDrawer(true)}>☰</button><strong>Planary</strong><span>{guest ? '게스트' : state.user.nickname}</span></div>
    {guest && <div className="p-guest">게스트 미리보기예요. 일정과 투두를 저장하려면 로그인해 주세요.</div>}
    <div className="p-calendar-shell"><header className="p-toolbar"><button className="p-btn" onClick={() => guardNavigation(() => { setMonth(today.slice(0, 7)); setSelected(today); setEventId(null); setActionError(''); })}>오늘</button><div className="p-month-nav"><button className="p-icon" aria-label="이전 달" onClick={() => setMonth(shiftMonth(month, -1))}>‹</button><h1>{Number(month.slice(0, 4))}년 {Number(month.slice(5))}월</h1><button className="p-icon" aria-label="다음 달" onClick={() => setMonth(shiftMonth(month, 1))}>›</button></div><button className="p-btn primary" disabled={guest} onClick={() => guardNavigation(() => setEditor({ type: 'event' }))}>＋ 일정</button></header>
    <RemoteState error={calendar.error} loading={!calendar.data} retry={refresh}><MonthCalendar days={days} month={month} today={today} selected={selected} events={calendar.data ?? []} onDate={selectDate} onEvent={selectEvent} /></RemoteState>
    <div className="p-calendar-footer"><span><i /> 오늘</span><span>★ 중요 일정</span><span>날짜를 선택해 하루를 확인하세요</span></div></div></section>
    <aside className="p-detail" aria-label="상세 패널"><div className="p-detail-heading"><span className="p-eyebrow">{eventId === null ? 'MY DAY' : 'EVENT DETAIL'}</span>{eventId !== null && <button className="p-btn" onClick={() => setEventId(null)}>날짜로 돌아가기</button>}</div>
    <h2>{eventId === null ? dateLabel(selected) : '일정 상세'}</h2>
    {actionError && !confirm && <p className="p-error" role="alert">{actionError}</p>}
    {eventId === null ? <><p className="p-muted">선택한 하루를 차근차근 준비해요.</p><div className="p-quick"><button className="p-btn" disabled={guest} onClick={() => guardNavigation(() => setEditor({ type: 'event' }))}>＋ 일정</button><button className="p-btn" disabled={guest} onClick={() => setEditor({ type: 'todo' })}>＋ 투두</button><button className="p-btn" disabled={guest || !daily.data} onClick={() => document.getElementById('date-note')?.focus()}>＋ 메모</button></div>
    <RemoteState error={daily.error} loading={!daily.data} retry={refresh}><section className="p-card"><h3>일정 <span>{daily.data?.events.length}</span></h3>{daily.data?.events.length === 0 && <div className="p-empty"><span className="p-empty-symbol">☷</span>아직 일정이 없는 날이에요.<br />새로운 일정을 추가해 보세요.</div>}{daily.data?.events.map(e => <button className="p-schedule" key={e.id} onClick={() => selectEvent(e.id)}><time>{e.isAllDay ? '종일' : e.startTime?.slice(0, 5)}</time><span><b>{e.isImportant && '★ '}{e.title}</b><small>{e.startDate < e.endDate ? `${e.startDate}–${e.endDate}` : eventTime(e)}</small></span><span>›</span></button>)}</section></RemoteState>
    <section className="p-card"><h3>전체 투두 <span>{todos.data?.length ?? '—'}</span></h3><p className="p-muted">날짜와 관계없이 모든 할 일을 모았어요.</p><RemoteState error={todos.error} loading={!todos.data} retry={refresh}>{todoList(todos.data ?? [])}</RemoteState></section>
    <DateNote date={selected} note={note} disabled={guest || !daily.data} /></> : detail.status === 404 ? <div className="p-error" role="alert">일정이 삭제되었거나 접근할 수 없어요.<button className="p-btn" onClick={() => { setEventId(null); setActionError(''); refresh(); }}>날짜 목록으로 돌아가기</button></div> : <RemoteState error={detail.error} loading={!detail.data} retry={refresh}>{detail.data && <><section className="p-card p-event-detail"><span className="p-badge">{detail.data.isImportant ? '★ 중요 일정' : detail.data.startDate < detail.data.endDate ? '기간 일정' : '일정'}</span><h3>{detail.data.title}</h3><p>{detail.data.startDate}{detail.data.endDate !== detail.data.startDate && ` – ${detail.data.endDate}`}</p><p>{eventTime(detail.data)}</p>{detail.data.location && <p>장소 · {detail.data.location}</p>}{detail.data.memo && <p className="p-preserve">{detail.data.memo}</p>}<div className="p-actions"><button className="p-btn" disabled={busy} onClick={() => setEditor({ type: 'event', event: detail.data! })}>수정</button><button className="p-btn danger" disabled={busy} onClick={() => { setActionError(''); setConfirm({ type: 'event', id: eventId, title: detail.data!.title }); }}>삭제</button></div></section><section className="p-card"><h3>연결 투두 <button className="p-icon" aria-label="연결 투두 추가" onClick={() => setEditor({ type: 'todo', eventId })}>＋</button></h3>{todoList(detail.data.todos)}</section></>}</RemoteState>}
    </aside>
    {drawer && <Modal title="메뉴" onClose={() => setDrawer(false)}><div className="p-drawer-content">{sidebar}</div></Modal>}
    {editor?.type === 'event' && <EventForm date={selected} event={editor.event} onClose={() => setEditor(null)} onSaved={id => { setEditor(null); setEventId(id); refresh(); }} />}
    {editor?.type === 'todo' && <TodoForm todo={editor.todo} eventId={editor.eventId} events={[...(calendar.data ?? []), ...(detail.data && !(calendar.data ?? []).some(e => e.id === detail.data!.id) ? [detail.data] : [])]} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); refresh(); }} />}
    {newTimetable && <TimetableForm onClose={() => setNewTimetable(false)} onSaved={id => { setNewTimetable(false); setTimetable(id); refreshTimetables(); }} />}
    {timetable !== null && <TimetableView key={timetable} id={timetable} onClose={() => setTimetable(null)} onChanged={refreshTimetables} />}
    {pendingNavigation && <Modal title="메모를 저장하고 이동할까요?" busy={note.busy} onClose={() => setPendingNavigation(null)}>
      <p className="p-muted">저장하지 않은 메모가 있어요. 저장하거나 변경 사항을 버린 뒤 이동할 수 있어요.</p>
      {note.error && <p className="p-error" role="alert">{note.error}</p>}
      <footer><button className="p-btn" disabled={note.busy} onClick={() => setPendingNavigation(null)}>계속 작성</button>
        <button className="p-btn danger" disabled={note.busy} onClick={() => { note.discard(); const move = pendingNavigation; setPendingNavigation(null); move(); }}>버리고 이동</button>
        <button className="p-btn primary" disabled={note.busy} onClick={async () => { if (await note.save()) { const move = pendingNavigation; setPendingNavigation(null); move(); } }}>{note.busy ? '저장 중…' : '저장 후 이동'}</button></footer>
    </Modal>}
    {confirm && <Modal title={confirm.type === 'event' ? '일정을 삭제할까요?' : '투두를 삭제할까요?'} busy={busy} onClose={() => setConfirm(null)}><p className="p-preserve">{confirm.title}</p><p className="p-muted">{confirm.type === 'event' ? '이 일정에 연결된 투두도 함께 삭제돼요.' : '삭제한 투두는 되돌릴 수 없어요.'}</p>{actionError && <p className="p-error" role="alert">{actionError}</p>}<footer><button className="p-btn" disabled={busy} onClick={() => setConfirm(null)}>취소</button><button className="p-btn danger" disabled={busy} onClick={() => void mutate(() => confirm.type === 'event' ? deleteEvent(confirm.id) : deleteTodo(confirm.id), () => { if (confirm.type === 'event') setEventId(null); setConfirm(null); })}>{busy ? '삭제 중…' : '삭제'}</button></footer></Modal>}
  </main>;
}
