import ServicePage from '@/components/ServicePage';

export const metadata = {
  title: 'BroCare — Инкубатор мастеров',
  description: 'Обучение, аттестация, Trust Level и вход в Братство',
};

export default function CarePage() {
  return <ServicePage domainId="care" />;
}
