'use client';

import { useEffect, useState } from 'react';

/**
 * 152-ФЗ — разблокировка заглушек DevStub для ВЛАДЕЛЬЦА.
 * proxy.ts при входе по коду (0021) ставит cookie bv_owner=1 (читаемая из JS);
 * публичные посетители её не имеют — формы остаются закрытыми.
 */

function hasOwnerCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim() === 'bv_owner=1');
}

/** Мгновенная проверка — для компонентов, которых нет в SSR-HTML
 *  (модалки заказа/отзыва/заявки открываются только после клика на клиенте). */
export function isDataUnlockedNow(): boolean {
  return hasOwnerCookie();
}

/** Флаг с подъёмом после mount — для SSR-страниц (/chat, /master):
 *  серверный рендер и первый клиентский совпадают (заглушка),
 *  затем useEffect поднимает флаг и показывает реальную форму. */
export function useDataUnlocked(): boolean {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    if (hasOwnerCookie()) setUnlocked(true);
  }, []);
  return unlocked;
}
