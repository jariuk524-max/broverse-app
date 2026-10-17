/** Открытие направления мастера после одобрения заявки в /admin */

const MONOLITH = 'https://broverse-masters.vercel.app';

/**
 * Добавляет направление в профиль мастера (directions + opened) кабинета.
 * Вызывается при одобрении заявки с metadata.unlock_direction.
 */
export async function unlockDirectionForMaster(
  masterId: string,
  direction: string,
  masterName?: string,
): Promise<boolean> {
  try {
    const res = await fetch(
      `${MONOLITH}/api/master-profile?master_id=${encodeURIComponent(masterId)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return false;
    const profile = await res.json();
    if (!profile || profile.error) return false;

    const directions: string[] = Array.isArray(profile.directions) ? profile.directions : [];
    if (directions.includes(direction)) return true;
    const opened: string[] = Array.isArray(profile.opened)
      ? profile.opened
      : directions;

    const put = await fetch(`${MONOLITH}/api/master-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...profile,
        master_id: masterId,
        master_name: masterName || profile.master_name,
        directions: [...directions, direction],
        opened: opened.includes(direction) ? opened : [...opened, direction],
      }),
    });
    return put.ok;
  } catch {
    return false;
  }
}
