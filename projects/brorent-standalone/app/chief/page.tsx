import { currentAdmin } from '@/lib/admin/guard';
import AdminPage from '../admin/page';

export const metadata = {
  title: 'Кабинет руководителя — BroVerse',
  description: 'Создание кабинетов сотрудников, доступы к навыкам, история работы, модерация и управление проектом.',
};

/**
 * Кабинет руководителя: вход только руководителю (login admin)
 * и сотрудникам, с которыми руководитель поделился (роль chief).
 * Здесь — серверная проверка; полная (в т.ч. после входа) — в AdminPage.
 */
export default async function ChiefPage() {
  const admin = await currentAdmin();
  const allowed = !admin || admin.login === 'admin' || admin.roles.includes('chief');

  if (!allowed) {
    return (
      <div className="min-h-[100dvh] chief-dark bg-[#0A0A0B] flex items-center justify-center px-4">
        <div className="w-full max-w-[360px] bg-[#141417] rounded-[24px] p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1E1E22] flex items-center justify-center mx-auto mb-4">
            <span className="text-zinc-300 text-xl font-black">B</span>
          </div>
          <h1 className="text-lg font-bold text-white mb-1">Доступ ограничен</h1>
          <p className="text-[12px] text-zinc-400 mb-1">
            Кабинет руководителя проекта — только для руководителя.
          </p>
          <p className="text-[12px] text-zinc-500 mb-5">
            Вы вошли как {admin.display_name || admin.login}. Если нужно поделиться кабинетом —
            руководитель включает доступ в разделе «Команда».
          </p>
          <a
            href="/admin"
            className="block w-full py-3 rounded-2xl bg-white text-zinc-900 text-sm font-bold active:scale-[0.98] transition-transform"
          >
            Перейти в мой кабинет
          </a>
        </div>
      </div>
    );
  }

  return <AdminPage chief />;
}
