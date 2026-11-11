import { useEffect, useRef, useState } from 'react';
import { deleteDailyNote, saveDailyNote } from '../../api/memoApi';
import { errorMessage } from './useRemote';

interface NoteState { draft?: string; saved?: string; status?: string; error?: string }
export function useDateNote(date: string, initial: string | undefined, onSaved: () => void) {
  const [notes, setNotes] = useState<Record<string, NoteState>>({});
  const [busy, setBusy] = useState(false);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const current = notes[date] ?? {};
  const saved = current.saved ?? initial ?? '';
  const value = current.draft ?? saved;
  const dirty = value !== saved;
  function patch(update: Partial<NoteState>) {
    setNotes(old => ({ ...old, [date]: { ...old[date], ...update } }));
  }
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, busy]);
  function save(): Promise<boolean> {
    if (inFlight.current) return inFlight.current;
    if (!dirty) return Promise.resolve(true);
    setBusy(true); patch({ error: '', status: '' });
    const request = (async () => {
      try {
        const result = value.trim() ? await saveDailyNote(date, value) : (await deleteDailyNote(date), null);
        patch({ saved: result?.content ?? '', draft: undefined, status: value.trim() ? '저장했어요' : '메모를 삭제했어요' });
        onSaved();
        return true;
      } catch (error) { patch({ error: errorMessage(error) }); return false; }
      finally { setBusy(false); inFlight.current = null; }
    })();
    inFlight.current = request;
    return request;
  }
  return {
    value, dirty, busy, error: current.error, status: current.status, save,
    change: (draft: string) => patch({ draft, error: '', status: '' }),
    discard: () => patch({ draft: undefined, error: '', status: '' }),
  };
}
export type DateNoteModel = ReturnType<typeof useDateNote>;
