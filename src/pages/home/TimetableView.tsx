import { activateTimetable, deleteTimetable, getTimetable } from '../../api/timetableApi';
import { errorMessage, useRemote } from './useRemote';
import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import TimetableForm from './TimetableForm';
import TimetableEntryForm from './TimetableEntryForm';
import TimetableEntryDetail from './TimetableEntryDetail';
import { isApiError } from '../../api/errors';
import { weekdayNames } from './timetable';

export default function TimetableView({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [entryId, setEntryId] = useState<number | null>(null);
  const [addingEntry, setAddingEntry] = useState(false);
  const entryTrigger = useRef<number | null>(null);
  const restoreFocus = useRef(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const lock = useRef(false);
  const [actionError, setActionError] = useState('');
  const { data, error } = useRemote(`${id}:${version}`, async () => {
    try { return await getTimetable(id); }
    catch (e) { if (isApiError(e) && e.status === 404) return null; throw e; }
  });
  const refresh = () => { setVersion(v => v + 1); onChanged(); };
  useEffect(() => {
    if (!restoreFocus.current || !data || entryId !== null || addingEntry) return;
    const trigger = document.getElementById(`tt-entry-${id}-${entryTrigger.current}`);
    (trigger ?? addButton.current)?.focus();
    restoreFocus.current = false;
  }, [data, id, entryId, addingEntry]);
  function closeEntry() { restoreFocus.current = true; setEntryId(null); setAddingEntry(false); }
  function removedEntry() { closeEntry(); refresh(); }
  async function mutate(remove: boolean) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setActionError('');
    try {
      if (remove) { await deleteTimetable(id); onChanged(); onClose(); }
      else { await activateTimetable(id); refresh(); }
    } catch (e) { setActionError(errorMessage(e)); }
    finally { lock.current = false; setBusy(false); }
  }
  if (addingEntry) return <TimetableEntryForm timetableId={id} onClose={closeEntry} onMissing={removedEntry} onSaved={savedId => { setAddingEntry(false); setEntryId(savedId); entryTrigger.current = savedId; refresh(); }} />;
  if (entryId !== null) return <TimetableEntryDetail key={entryId} timetableId={id} entryId={entryId} onClose={closeEntry} onChanged={refresh} onRemoved={removedEntry} />;
  if (editing && data) return <TimetableForm timetable={data} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); refresh(); }} />;
  if (deleting) return <Modal title="시간표를 삭제할까요?" busy={busy} onClose={() => { setDeleting(false); setActionError(''); }}>
    <p className="p-preserve">{data?.title}</p><p className="p-muted">이 시간표의 모든 항목도 함께 삭제돼요. 적용 중인 시간표를 삭제하면 적용 중인 시간표가 없는 상태가 돼요.</p>
    {actionError && <p className="p-error" role="alert">{actionError}</p>}
    <footer><button className="p-btn" disabled={busy} onClick={() => { setDeleting(false); setActionError(''); }}>취소</button><button className="p-btn danger" disabled={busy} onClick={() => void mutate(true)}>{busy ? '삭제 중…' : '삭제'}</button></footer>
  </Modal>;
  const entries = data?.entries ?? [];
  const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const first = Math.min(8, ...entries.map(e => Math.floor(minutes(e.startTime) / 60)));
  const last = Math.max(18, ...entries.map(e => Math.ceil(minutes(e.endTime) / 60)));
  const days = entries.some(e => e.dayOfWeek > 5) ? 7 : 5;
  return <Modal title={data?.title ?? '고정 시간표'} onClose={onClose} busy={busy}>
    {data === null ? <><p role="alert">시간표가 삭제되었거나 접근할 수 없어요.</p><button className="p-btn" onClick={() => { onChanged(); onClose(); }}>목록으로 돌아가기</button></> : error ? <p className="p-error" role="alert">{error} <button className="p-btn" onClick={() => setVersion(v => v + 1)}>재시도</button></p> : !data ? <p role="status">시간표를 불러오는 중…</p> : <>
      <div className="p-tt-controls"><p className="p-muted">{data.semester} · {data.isActive ? '적용 중' : '보관 중'}</p>
        <div className="p-actions"><button className="p-btn primary" disabled={busy || data.isActive} onClick={() => void mutate(false)}>{data.isActive ? '적용 중' : busy ? '적용 중…' : '이 시간표 적용'}</button>
          <button ref={addButton} className="p-btn primary" disabled={busy} onClick={() => { entryTrigger.current = null; setAddingEntry(true); }}>＋ 항목 추가</button>
          <button className="p-btn" disabled={busy} onClick={() => { setActionError(''); setEditing(true); }}>정보 수정</button>
          <button className="p-btn danger" disabled={busy} onClick={() => { setActionError(''); setDeleting(true); }}>시간표 삭제</button></div>
      </div>
      {actionError && <p className="p-error" role="alert">{actionError}</p>}
      <div className="p-timetable-scroll"><div className="p-timetable" style={{ gridTemplateColumns: `36px repeat(${days}, minmax(68px, 1fr))` }}>
        <span />{weekdayNames.slice(0, days).map(d => <strong key={d}>{d}</strong>)}
        <div>{Array.from({ length: last - first }, (_, i) => <div className="p-hour" key={i}>{first + i}</div>)}</div>
        {Array.from({ length: days }, (_, i) => <div className="p-tt-day" key={i} style={{ height: (last - first) * 48 }}>
          {entries.filter(e => e.dayOfWeek === i + 1).map(e => <button type="button" id={`tt-entry-${id}-${e.id}`} disabled={busy} onClick={() => { entryTrigger.current = e.id; setEntryId(e.id); }} className="p-tt-entry" key={e.id} style={{ top: (minutes(e.startTime) / 60 - first) * 48, height: (minutes(e.endTime) - minutes(e.startTime)) / 60 * 48, background: /^#[0-9a-f]{6}$/i.test(e.color ?? '') ? `${e.color}40` : '#dbeafe' }} aria-label={`${e.title} ${['월', '화', '수', '목', '금', '토', '일'][i]}요일 ${e.startTime.slice(0, 5)}–${e.endTime.slice(0, 5)} 상세 보기`} title={`${e.title} ${e.startTime}–${e.endTime} ${e.location ?? ''} ${e.memo ?? ''}`}>
            <b>{e.title}</b><span>{e.startTime.slice(0, 5)}–{e.endTime.slice(0, 5)}</span><span>{e.location}</span>
          </button>)}
        </div>)}
      </div></div>
      {!entries.length && <p className="p-empty">등록된 시간표 항목이 없어요.</p>}
      <p className="p-muted">고정 시간표는 캘린더 일정과 별도로 표시돼요.</p>
    </>}
  </Modal>;
}
