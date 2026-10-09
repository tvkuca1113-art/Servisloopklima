'use client';

import { CheckCircle2, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState } from 'react';

interface Toast {
  id: number;
  title: string;
  body?: string;
}

const ToastContext = createContext<(t: Omit<Toast, 'id'>) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts([{ ...t, id }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" role="status" className="no-print pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-4 lg:top-20 lg:items-end lg:pr-6">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-nav px-4 py-3 text-sm text-white shadow-[var(--shadow-pop)]">
            <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-[#75e0a7]" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t.title}</p>
              {t.body ? <p className="mt-0.5 text-nav-ink">{t.body}</p> : null}
            </div>
            <button type="button" className="-m-2 inline-flex size-10 shrink-0 items-center justify-center rounded-lg hover:bg-white/10" onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} aria-label="Zatvori obavijest">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export const DEMO_CHANGE = 'Promjena je prikazana u ovoj probnoj verziji.';
