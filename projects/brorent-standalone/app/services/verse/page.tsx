import ServicePage from '@/components/ServicePage';

export const metadata = {
  title: 'BroVerse — Сердце экосистемы',
  description: 'Главная витрина для клиентов и точка входа в Дашборд для Мастеров',
};

export default function VersePage() {
  return <ServicePage domainId="verse" />;
}
