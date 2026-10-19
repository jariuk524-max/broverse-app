import Link from 'next/link';
import { Construction } from 'lucide-react';

export const metadata = {
  title: 'BroVerse — скоро откроемся',
  description: 'Сайт обновляется. Скоро откроемся.',
  robots: { index: false },
};

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
        <Construction size={28} className="text-zinc-400" />
      </div>
      <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Onest, -apple-system, system-ui, sans-serif' }}>
        BroVerse обновляется
      </h1>
      <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-8">
        Мы дорабатываем кабинеты и каталог. Скоро откроемся — следите за обновлениями.
      </p>
      <Link
        href="/privacy"
        className="text-xs text-zinc-600 underline underline-offset-4 hover:text-zinc-400 transition-colors"
      >
        Политика обработки персональных данных
      </Link>
    </div>
  );
}
