import { useId, useState } from 'react';
import { isApiError } from '../../api/errors';
import { errorMessage } from './useRemote';

export function useFieldFeedback() {
  const prefix = useId();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  function reset() { setFields({}); setError(''); }
  function report(form: HTMLFormElement, errors: Record<string, string>, message = '') {
    setFields(errors);
    setError(message);
    requestAnimationFrame(() => {
      for (const element of form.elements) {
        if ((element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) && Object.hasOwn(errors, element.name)) {
          element.focus();
          break;
        }
      }
    });
  }
  function failure(form: HTMLFormElement, e: unknown) {
    if (!isApiError(e) || !e.fieldErrors.length) { setError(errorMessage(e)); return; }
    const known: Record<string, string> = Object.create(null);
    const other: string[] = [];
    for (const {field, reason} of e.fieldErrors) {
      if (form.elements.namedItem(field)) known[field] = reason;
      else other.push(reason);
    }
    report(form, known, other.join(' · '));
  }
  function attrs(name: string) {
    return {name, 'aria-invalid': !!fields[name], 'aria-describedby': fields[name] ? prefix + name : undefined};
  }
  function hint(name: string) {
    return fields[name] && <small className="p-error" role="alert" id={prefix + name}>{fields[name]}</small>;
  }
  return { error, attrs, hint, report, failure, reset, clear(name: string) {
    setFields(old => { const next = {...old}; delete next[name]; return next; });
    setError('');
  }};
}
