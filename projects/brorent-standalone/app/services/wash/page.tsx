import ServicePage from '@/components/ServicePage';

export const metadata = {
  title: 'BroWash — Химчистка мебели',
  description: 'Химчистка мягкой мебели и матрасов, мойка окон, чистка ковров, химчистка салонов авто, озонирование',
};

export default function WashPage() {
  return <ServicePage domainId="wash" />;
}
