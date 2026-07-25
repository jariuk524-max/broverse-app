import ServicePage from '@/components/ServicePage';

export const metadata = {
  title: 'BroMove — Грузоперевозки',
  description: 'Грузоперевозки, квартирные и офисные переезды, сборка мебели',
};

export default function MovePage() {
  return <ServicePage domainId="move" />;
}
