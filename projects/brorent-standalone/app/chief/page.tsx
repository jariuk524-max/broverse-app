import AdminPage from '../admin/page';

export const metadata = {
  title: 'Кабинет руководителя — BroVerse',
  description: 'Создание кабинетов сотрудников, доступы к навыкам, история работы, модерация и управление проектом.',
};

export default function ChiefPage() {
  return <AdminPage chief />;
}
