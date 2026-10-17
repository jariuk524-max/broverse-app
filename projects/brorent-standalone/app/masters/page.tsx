import Link from 'next/link';
import {
  ArrowRight, ClipboardList, UserRound, Wrench, GraduationCap,
  Star, MessageCircle, MapPin, ChevronRight, Home,
} from 'lucide-react';

export const metadata = {
  title: 'Стать мастером — заявки на вашу работу | BroVerse',
  description:
    'BroVerse — сервис заявок для мастеров: химчистка, ремонт, переезды, сад, аренда. Анкета, услуги, направления и обучение BroCare. Регистрация за 2 минуты.',
  alternates: { canonical: '/masters' },
};

const STEPS = [
  {
    num: '01',
    icon: UserRound,
    title: 'Создайте анкету',
    desc: 'Имя, город, фото и опыт — клиенты увидят, кто приедет работать.',
  },
  {
    num: '02',
    icon: Wrench,
    title: 'Включите направления',
    desc: 'Выберите, чем занимаетесь: химчистка, сантехника, ремонт, переезды и другие.',
  },
  {
    num: '03',
    icon: ClipboardList,
    title: 'Получайте заявки',
    desc: 'Заявки клиентов с 6 сайтов BroVerse приходят прямо в ваш кабинет.',
  },
  {
    num: '04',
    icon: Star,
    title: 'Работайте и растите',
    desc: 'Честные отзывы поднимают рейтинг, а рейтинг — новые заказы.',
  },
];

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Заявки рядом с вами',
    desc: 'Клиенты со всех шести сервисов BroVerse — в одной ленте, с адресом, ценой и временем.',
    color: '#4285F4',
    bg: '#EBF3FF',
  },
  {
    icon: UserRound,
    title: 'Анкета и услуги',
    desc: 'Портфолио с фото, ценами и вариантами работ. Публикуется после быстрой проверки.',
    color: '#34A853',
    bg: '#E8F5E9',
  },
  {
    icon: Wrench,
    title: 'Новые направления',
    desc: 'Не хватает навыка? Откройте направление заявкой администратору или через обучение.',
    color: '#EA4335',
    bg: '#FDECEA',
  },
  {
    icon: GraduationCap,
    title: 'Обучение BroCare',
    desc: 'Короткие курсы и тесты: пройдите — и получите сертифицированное направление.',
    color: '#FBBC05',
    bg: '#FEF7E0',
  },
  {
    icon: Star,
    title: 'Честный рейтинг',
    desc: 'Оценки пишут только реальные клиенты. Хорошая работа видна всем сразу.',
    color: '#00BCD4',
    bg: '#E0F7FA',
  },
  {
    icon: MessageCircle,
    title: 'Кабинет в Telegram',
    desc: 'Всё работает в телефоне: карта, заказы, история и профиль — без установки приложений.',
    color: '#16A34A',
    bg: '#E7F6EC',
  },
];

const BRANDS = ['BroWash', 'BroBuild', 'BroFrame', 'BroMove', 'BroRent', 'BroGarden'];

export default function MastersPage() {
  return (
    <div className="min-h-screen bg-[#F2F2F7]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif' }}>
      <header className="max-w-2xl mx-auto px-4 pt-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center">
            <Home size={16} className="text-white" />
          </span>
          <span className="text-[15px] font-black text-zinc-900">BroVerse</span>
        </Link>
        <Link
          href="/master"
          className="px-4 py-2 rounded-full bg-zinc-900 text-white text-[12px] font-bold active:scale-95 transition-transform"
        >
          Регистрация
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-16">
        {/* Hero */}
        <section className="text-center pt-10 pb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[11px] font-bold text-zinc-500 shadow-sm">
            <Wrench size={12} className="text-[#EA4335]" /> Для мастеров и специалистов
          </span>
          <h1 className="text-[30px] leading-[1.15] font-black text-zinc-900 mt-4">
            Заявки на вашу работу — <span className="text-[#EA4335]">каждый день</span>
          </h1>
          <p className="text-[14px] text-zinc-500 mt-3 leading-relaxed max-w-[320px] mx-auto">
            Подключитесь к BroVerse: клиенты с шести сервисов сами находят вас.
            Без подписок — вы берёте только те заказы, которые нужны вам.
          </p>
          <div className="flex gap-2.5 mt-6 justify-center">
            <Link
              href="/master"
              className="px-5 py-3 rounded-2xl bg-[#EA4335] text-white text-[13px] font-bold shadow-[0_6px_18px_rgba(234,67,53,0.3)] active:scale-95 transition-transform flex items-center gap-1.5"
            >
              Стать мастером <ArrowRight size={15} />
            </Link>
            <a
              href="https://broverse-masters.vercel.app/"
              className="px-5 py-3 rounded-2xl bg-white text-zinc-700 text-[13px] font-bold shadow-sm active:scale-95 transition-transform flex items-center gap-1.5"
            >
              Кабинет мастера <ChevronRight size={15} />
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 mt-5">
            {BRANDS.map((b) => (
              <span key={b} className="px-2.5 py-1 rounded-full bg-white text-[10px] font-bold text-zinc-400 shadow-sm">{b}</span>
            ))}
          </div>
        </section>

        {/* Как это работает */}
        <section>
          <h2 className="text-[18px] font-black text-zinc-900 px-1 mb-3">Как это работает</h2>
          <div className="space-y-2.5">
            {STEPS.map((s) => (
              <div key={s.num} className="flex items-center gap-3.5 bg-white rounded-[20px] p-4 shadow-sm">
                <div className="w-11 h-11 rounded-2xl bg-[#F2F2F7] flex items-center justify-center shrink-0">
                  <s.icon size={19} className="text-zinc-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-zinc-900">
                    <span className="text-zinc-300 mr-1.5">{s.num}</span>{s.title}
                  </p>
                  <p className="text-[12px] text-zinc-500 mt-0.5 leading-snug">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Возможности */}
        <section className="mt-8">
          <h2 className="text-[18px] font-black text-zinc-900 px-1 mb-3">Что внутри</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-[20px] p-4 shadow-sm">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2.5" style={{ background: f.bg }}>
                  <f.icon size={18} style={{ color: f.color }} />
                </div>
                <p className="text-[13px] font-bold text-zinc-900">{f.title}</p>
                <p className="text-[12px] text-zinc-500 mt-1 leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust */}
        <section className="mt-8 bg-white rounded-[24px] p-5 shadow-sm">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[20px] font-black text-zinc-900">6</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">сервисов<br />с заявками</p>
            </div>
            <div>
              <p className="text-[20px] font-black text-zinc-900">9</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">направлений<br />работы</p>
            </div>
            <div>
              <p className="text-[20px] font-black text-zinc-900">0 ₽</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">подписка<br />и вступление</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-8 rounded-[24px] bg-zinc-900 p-6 text-center shadow-lg">
          <MapPin size={22} className="text-[#EA4335] mx-auto mb-3" />
          <h2 className="text-[19px] font-black text-white leading-snug">
            Регистрация занимает 2 минуты
          </h2>
          <p className="text-[13px] text-zinc-400 mt-2 leading-relaxed">
            Заполните анкету — и получайте первые заявки уже сегодня.
          </p>
          <Link
            href="/master"
            className="inline-flex items-center gap-1.5 mt-5 px-6 py-3.5 rounded-2xl bg-[#EA4335] text-white text-[14px] font-bold active:scale-95 transition-transform"
          >
            Заполнить анкету <ArrowRight size={16} />
          </Link>
        </section>

        <p className="text-center mt-6">
          <Link href="/" className="text-[12px] font-semibold text-zinc-400 hover:text-zinc-600">
            ← На главную
          </Link>
        </p>
      </main>
    </div>
  );
}
