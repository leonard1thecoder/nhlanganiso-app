import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/format';

/** Label + control + hint/error wrapper. Keeps forms consistent and accessible. */
export function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn('field', error && 'field--error')}>
      <label htmlFor={id} className="field__label">
        {label}
        {required ? <span aria-hidden="true" className="field__req"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <p id={`${id}-hint`} className="field__hint">{hint}</p> : null}
      {error ? <p id={`${id}-error`} className="field__error">{error}</p> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement> & { id: string }) {
  return <input className="input" {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string }) {
  return <textarea className="input textarea" rows={4} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement> & { id: string }) {
  return <select className="input" {...props} />;
}
