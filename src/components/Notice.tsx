import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

type Tone = 'info' | 'success' | 'error' | 'warning';

/** Inline status / error banner. Errors use role="alert" so screen readers announce them. */
export function Notice({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('notice', `notice--${tone}`, className)}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {title ? <strong className="notice__title">{title}</strong> : null}
      {children ? <div className="notice__body">{children}</div> : null}
    </div>
  );
}
