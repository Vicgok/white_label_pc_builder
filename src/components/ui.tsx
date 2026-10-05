import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';

type ToastContextValue = { toast: (message: string) => void };
const ToastContext = createContext<ToastContextValue>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toast = useCallback((text: string) => { clearTimeout(timeout.current); setMessage(text); timeout.current = setTimeout(() => setMessage(''), 4000); }, []);
  useEffect(() => () => clearTimeout(timeout.current), []);
  return <ToastContext.Provider value={{ toast }}>{children}<div className={`toast ${message ? 'visible' : ''}`} role="status" aria-live="polite">{message && <><Check size={17} />{message}</>}</div></ToastContext.Provider>;
}
export function Dialog({ title, children, onClose, dark = false, sheet = false }: { title: string; children: ReactNode; onClose: () => void; dark?: boolean; sheet?: boolean }) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('button, input, textarea, select, a[href]')?.focus();
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea, select, a[href], [tabindex="0"]') || []).filter(el => el.getClientRects().length);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', listener);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', listener); previousFocus?.focus(); };
  }, []);
  return createPortal(<div className={`dialog-backdrop ${dark ? 'dark' : ''} ${sheet ? 'sheet' : ''}`} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} className="dialog-panel"><div className="dialog-heading"><h2 id={titleId}>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={21} /></button></div>{children}</div></div>, document.body);
}
export function EmptyState({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="empty-state"><h3>{title}</h3><p>{description}</p>{children}</div>;
}
export async function copyText(value: string) {
  if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(value); return; }
  const textarea = document.createElement('textarea');
  textarea.value = value; textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.append(textarea); textarea.select();
  const copied = document.execCommand('copy'); textarea.remove();
  if (!copied) throw new Error('Clipboard unavailable');
}
