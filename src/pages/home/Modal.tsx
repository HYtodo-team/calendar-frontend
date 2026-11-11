import { useEffect, useRef, type ReactNode } from 'react';
export default function Modal({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="planner-modal" aria-labelledby="modal-title" onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}>
    <header><h2 id="modal-title">{title}</h2><button type="button" className="p-icon" aria-label="닫기" disabled={busy} onClick={onClose}>×</button></header>
    {children}
  </dialog>;
}
