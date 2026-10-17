import { redirect } from 'next/navigation';

/** Персональная ссылка кабинета: /admin/alina-smirnova → /admin?c=alina-smirnova */
export default function CabinetEntry({ params }: { params: { cabinet: string } }) {
  const raw = String(params.cabinet || '').toLowerCase();
  const login = /^[a-z0-9][a-z0-9-]{1,38}$/.test(raw) ? raw : '';
  redirect(login ? `/admin?c=${login}` : '/admin');
}
