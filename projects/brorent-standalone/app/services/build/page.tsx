import ServicePage from '@/components/ServicePage';

export const metadata = {
  title: 'BroBuild — Инженерия и ремонт',
  description: 'Сантехника, электрика, ремонт помещений, бытовая техника',
};

export default function BuildPage() {
  return <ServicePage domainId="build" />;
}
