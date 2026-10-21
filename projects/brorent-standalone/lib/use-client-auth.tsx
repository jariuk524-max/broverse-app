'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import ClientAuthSheet from '@/components/ClientAuthSheet';
import type { ClientSession } from '@/lib/client-auth';

/**
 * Гард входа клиента для форм (WB-стиль):
 *   const auth = useClientAuth();
 *   …await auth.ensure(phone) — вернёт сессию или откроет шторку входа…
 *   return <>{auth.sheet}…</>
 */
export function useClientAuth() {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [pending, setPending] = useState<{ resolve: (s: ClientSession | null) => void; prefill: string } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch('/api/client-auth', { cache: 'no-store' });
        const d = await r.json().catch(() => ({ session: null }));
        if (alive) setSession(d.session || null);
      } catch {
        /* офлайн — решим при ensure */
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  /** true = можно отправлять; null = пользователь закрыл шторку */
  const ensure = useCallback((prefillPhone = ''): Promise<ClientSession | null> => {
    if (session) return Promise.resolve(session);
    return new Promise((resolve) => setPending({ resolve, prefill: prefillPhone }));
  }, [session]);

  const done = useCallback((s: ClientSession) => {
    setSession(s);
    setPending((p) => { p?.resolve(s); return null; });
  }, []);

  const cancel = useCallback(() => {
    setPending((p) => { p?.resolve(null); return null; });
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/client-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch { /* cookie уйдёт и без ответа */ }
    setSession(null);
  }, []);

  const sheet: ReactNode = pending ? (
    <ClientAuthSheet prefillPhone={pending.prefill} onDone={done} onCancel={cancel} />
  ) : null;

  return { session, ensure, sheet, logout };
}
