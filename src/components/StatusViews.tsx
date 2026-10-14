import type { ReactNode } from 'react';

export function LoadingState({ label = 'Loading…', testId = 'loading' }: { label?: string; testId?: string }) {
  return (
    <div className="status-view" role="status" aria-live="polite" data-testid={testId}>
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

interface MessageProps {
  title: string;
  message?: ReactNode;
  actions?: ReactNode;
  testId: string;
  /** Render the title as the page heading (h1) — used when the state replaces a whole page. */
  asPageHeading?: boolean;
  tone?: 'empty' | 'error' | 'success';
}

export function MessageState({ title, message, actions, testId, asPageHeading, tone = 'empty' }: MessageProps) {
  const Heading = asPageHeading ? 'h1' : 'h2';
  return (
    <section className={`status-view status-view--${tone}`} data-testid={testId} role={tone === 'error' ? 'alert' : undefined}>
      <span className="status-view__icon" aria-hidden="true">
        {tone === 'error' ? '!' : tone === 'success' ? '✓' : '∅'}
      </span>
      <Heading className="status-view__title">{title}</Heading>
      {message && <div className="status-view__message">{message}</div>}
      {actions && <div className="status-view__actions">{actions}</div>}
    </section>
  );
}

export function Alert({ tone, children, testId }: { tone: 'error' | 'info' | 'success'; children: ReactNode; testId?: string }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'} data-testid={testId}>
      {children}
    </div>
  );
}
