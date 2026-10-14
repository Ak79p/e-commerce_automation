import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type NoticeTone = 'success' | 'error' | 'info';

interface Notice {
  id: number;
  tone: NoticeTone;
  message: string;
}

interface NoticeContextValue {
  notify: (message: string, tone?: NoticeTone) => void;
}

const NoticeContext = createContext<NoticeContextValue | null>(null);
const AUTO_DISMISS_MS = 5000;

/** Lightweight toast notifications rendered in an aria-live region. */
export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setNotices((list) => list.filter((n) => n.id !== id)), []);

  const notify = useCallback(
    (message: string, tone: NoticeTone = 'success') => {
      const id = nextId.current++;
      setNotices((list) => [...list.slice(-2), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NoticeContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite" data-testid="toast-region">
        {notices.map((n) => (
          <div key={n.id} className={`toast toast--${n.tone}`} data-testid="toast" data-tone={n.tone}>
            <span>{n.message}</span>
            <button type="button" className="toast__close" onClick={() => dismiss(n.id)} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        ))}
      </div>
    </NoticeContext.Provider>
  );
}

export function useNotice(): NoticeContextValue {
  const ctx = useContext(NoticeContext);
  if (!ctx) throw new Error('useNotice must be used inside NoticeProvider');
  return ctx;
}
