import { Construction } from 'lucide-react';

export const metadata = {
  title: 'BroVerse — проект в разработке',
  description: 'Проект BroVerse в стадии разработки.',
  robots: { index: false },
};

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
        <Construction size={28} className="text-zinc-400" />
      </div>
      <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Onest, -apple-system, system-ui, sans-serif' }}>
        Мы в разработке
      </h1>
      <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
        Проект BroVerse сейчас в стадии разработки и пока не работает —
        запустимся, когда всё будет готово.
      </p>
    </div>
  );
}
