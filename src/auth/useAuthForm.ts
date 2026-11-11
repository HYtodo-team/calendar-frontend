import { useRef, useState, type FormEvent } from 'react';
import { getAuthErrorMessage, getFieldErrors } from './formErrors';

export type AuthFormErrors<T> = Partial<Record<keyof T, string>>;

interface Options<T> {
  initialValues: T;
  validate: (values: T) => AuthFormErrors<T>;
  submit: (values: T) => Promise<void>;
  mapError?: (error: unknown) => { message?: string; errors?: AuthFormErrors<T> };
}

export default function useAuthForm<T extends Record<string, string>>(options: Options<T>) {
  const [values, setValues] = useState(options.initialValues);
  const [errors, setErrors] = useState<AuthFormErrors<T>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);

  function setField(field: keyof T, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  }

  function focusFirstError(nextErrors: AuthFormErrors<T>) {
    const first = Object.keys(values).find((field) => nextErrors[field]);
    const input = first ? formRef.current?.elements.namedItem(first) : null;
    if (input instanceof HTMLInputElement) input.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    formRef.current = event.currentTarget;
    const nextErrors = options.validate(values);
    setErrors(nextErrors);
    setFormError('');
    if (Object.values(nextErrors).some(Boolean)) {
      focusFirstError(nextErrors);
      return;
    }
    submitting.current = true;
    setIsSubmitting(true);
    try {
      await options.submit(values);
    } catch (error: unknown) {
      const mapped = options.mapError?.(error);
      const serverErrors = getFieldErrors(error);
      const nextErrors: AuthFormErrors<T> = {};
      for (const field of Object.keys(values) as (keyof T)[]) {
        const message = mapped?.errors?.[field] ?? serverErrors[String(field)];
        if (message) nextErrors[field] = message;
      }
      setErrors(nextErrors);
      setFormError(mapped?.message ?? getAuthErrorMessage(error));
      // disabled가 해제된 다음 첫 오류 입력란으로 이동한다.
      window.requestAnimationFrame(() => focusFirstError(nextErrors));
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  return { values, errors, formError, isSubmitting, setField, handleSubmit };
}
