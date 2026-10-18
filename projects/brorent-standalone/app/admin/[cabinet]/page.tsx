import AdminPage from '../page';

const OK = /^[a-z0-9][a-z0-9-]{1,38}$/;

/** Персональная ссылка кабинета: /admin/alina-smirnova → вход с уже подставленным логином */
export default function CabinetEntry({ params }: { params: { cabinet: string } }) {
  const raw = String(params.cabinet || '').toLowerCase();
  const login = OK.test(raw) ? raw : '';
  return <AdminPage cabinet={login || undefined} />;
}
