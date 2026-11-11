import type { DateNoteModel } from './useDateNote';
export default function DateNote({ date, note, disabled }: { date: string; note: DateNoteModel; disabled: boolean }) {
  return <section className="p-card">
    <h3>날짜 메모</h3>
    <label className="p-sr" htmlFor="date-note">{date} 메모</label>
    <textarea id="date-note" className="p-note" rows={4} value={note.value} disabled={disabled || note.busy}
      onChange={e => note.change(e.target.value)} placeholder="오늘 기억하고 싶은 내용을 적어보세요." />
    <div className="p-note-footer">
      <span role="status">{note.status || (note.dirty ? '저장하지 않은 변경 사항' : '')}</span>
      <button className="p-btn" disabled={disabled || note.busy || !note.dirty} onClick={() => void note.save()}>{note.busy ? '저장 중…' : '저장'}</button>
    </div>
    {note.error && <p className="p-error" role="alert">{note.error}</p>}
    {note.dirty && <p className="p-muted">내용을 비우고 저장하면 삭제돼요.</p>}
  </section>;
}
