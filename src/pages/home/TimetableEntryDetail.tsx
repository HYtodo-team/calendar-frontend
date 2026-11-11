import { useRef, useState } from 'react';
import { deleteTimetableEntry, getTimetableEntry } from '../../api/timetableApi';
import { isApiError } from '../../api/errors';
import { errorMessage, useRemote } from './useRemote';
import Modal from './Modal';
import TimetableEntryForm from './TimetableEntryForm';
import { weekdayNames } from './timetable';

export default function TimetableEntryDetail({ timetableId, entryId, onClose, onChanged, onRemoved }: {
  timetableId: number; entryId: number; onClose: () => void; onChanged: () => void; onRemoved: () => void;
}) {
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);
  const [actionError, setActionError] = useState('');
  const lock = useRef(false);
  const { data, error } = useRemote(`${timetableId}:${entryId}:${version}`, async () => {
    try { return await getTimetableEntry(timetableId, entryId); }
    catch (e) { if (isApiError(e) && e.status === 404) return null; throw e; }
  });
  async function remove() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setActionError('');
    try { await deleteTimetableEntry(timetableId, entryId); onRemoved(); }
    catch (e) { setActionError(errorMessage(e)); if (isApiError(e) && e.status === 404) setMissing(true); }
    finally { lock.current = false; setBusy(false); }
  }
  if (editing && data) return <TimetableEntryForm timetableId={timetableId} entry={data} onClose={() => setEditing(false)} onMissing={onRemoved} onSaved={() => { setEditing(false); setVersion(v => v + 1); onChanged(); }} />;
  return <Modal title={deleting ? '시간표 항목을 삭제할까요?' : '시간표 항목 상세'} busy={busy} onClose={onClose}>
    {missing || data === null ? <><p role="alert">항목이 삭제되었거나 접근할 수 없어요.</p><button className="p-btn" onClick={onRemoved}>시간표로 돌아가기</button></> : error ? <p className="p-error" role="alert">{error}<button className="p-btn" onClick={() => setVersion(v => v + 1)}>다시 시도</button></p> : !data ? <p role="status">항목을 불러오는 중…</p> : deleting ? <>
      <p className="p-preserve">{data.title}</p><p className="p-muted">삭제한 항목은 되돌릴 수 없어요.</p>
      {actionError && <p className="p-error" role="alert">{actionError}</p>}
      <footer><button className="p-btn" disabled={busy} onClick={() => { setDeleting(false); setActionError(''); }}>취소</button><button className="p-btn danger" disabled={busy} onClick={() => void remove()}>{busy ? '삭제 중…' : '삭제'}</button></footer>
    </> : <section className="p-entry-detail">
      <h3>{data.title}</h3><p>{weekdayNames[data.dayOfWeek - 1]}요일 · {data.startTime.slice(0, 5)}–{data.endTime.slice(0, 5)}</p>
      <h4>장소</h4><p className="p-preserve">{data.location || '등록된 장소가 없어요.'}</p>
      <h4>메모</h4><p className="p-preserve">{data.memo || '등록된 메모가 없어요.'}</p>
      <p>색상 · {data.color || '기본 색상'}</p>
      <footer><button className="p-btn" onClick={onClose}>시간표로 돌아가기</button><button className="p-btn" onClick={() => setEditing(true)}>항목 수정</button><button className="p-btn danger" onClick={() => setDeleting(true)}>항목 삭제</button></footer>
    </section>}
  </Modal>;
}
