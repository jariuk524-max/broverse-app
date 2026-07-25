import ServicePage from '@/components/ServicePage';

export const metadata = {
  title: 'BroFrame — Ремонт техники',
  description: 'Ремонт смартфонов, ноутбуков, роботов-пылесосов, умный дом',
};

export default function FramePage() {
  return <ServicePage domainId="frame" />;
}
