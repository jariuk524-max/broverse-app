'use client';

import { useEffect, useState } from 'react';

export type PublicRegion = { id: string; name: string; enabled: boolean; lat: number; lng: number };

/** Стартовый список — зеркало lib/admin/regions.ts (фолбэк, если API недоступно) */
const FALLBACK: PublicRegion[] = [
  { id: 'moscow', name: 'Москва', enabled: true, lat: 55.7558, lng: 37.6173 },
  { id: 'moscow-oblast', name: 'Московская область', enabled: true, lat: 55.7558, lng: 37.6173 },
];

let cached: PublicRegion[] | null = null;

/** Города, где работает BroVerse (включённые регионы) — для форм заказа */
export function useRegions(): { regions: PublicRegion[]; loading: boolean } {
  const [regions, setRegions] = useState<PublicRegion[]>(() => cached ?? FALLBACK);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (cached) return;
    let alive = true;
    fetch('/api/regions')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list: PublicRegion[] = Array.isArray(d?.regions)
          ? d.regions.filter((x: PublicRegion) => x && x.enabled && x.name)
          : [];
        if (!alive) return;
        const next = list.length > 0 ? list : FALLBACK;
        cached = next;
        setRegions(next);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { regions, loading };
}
