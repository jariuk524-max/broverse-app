import Link from 'next/link';
import {
  Users, ShieldCheck, Image as ImageIcon, ClipboardList, Eye,
  Lock, Home, MessageSquare, Wallet, History, ArrowRight,
} from 'lucide-react';

export const metadata = {
  title: 'Возможности руководителя — BroVerse',
  description: 'Штаб руководителя BroVerse: кабинеты сотрудников, модерация, контент сайтов, задачи, финансы и аудит.',
};

const SECTIONS = [
  {
    icon: Users,
    title: 'Штаб — управление людьми',
    sub: 'вкладка «Команда»',
    items: [
      'Создавать неограниченно кабинетов: логин, имя, шаблон должности (Администратор / Бухгалтер / Дизайнер / Менеджер мастеров / Модератор / Наблюдатель / Руководитель)',
      'Выдавать и снимать навыки по одному клику — сотрудник видит только открытые разделы',
      '«Отправить доступ» — копируется готовое сообщение (ссылка + логин + разделы) → в Telegram сотруднику',
      '«Удалить кабинет» — доступ пропадает мгновенно',
      'Видеть, как работают: вошёл ли, пароль задан, последние 3 действия каждого',
      'Чат 1-на-1 с каждым сотрудником',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Модерация',
    sub: 'через сотрудников или сам',
    items: [
      'Заявки клиентов: фильтры по статусу/сайту/периоду, поиск по телефону, массовое «Одобрить/Отклонить» с причиной',
      'Мастера: анкеты и услуги — одобрить/отклонить, рейтинги',
      'Отзывы клиентов: закрывать «решён / не решён»',
      'Разблокировки навыков мастеров: заявки «Открытие направления» и «BroCare-сертификация» → одобрено — навык открывается в кабинете мастера',
    ],
  },
  {
    icon: ImageIcon,
    title: 'Контент 6 сайтов',
    sub: 'только руководитель, без сотрудников',
    items: [
      'Каталог: описания, цены, время, загрузка фото (по твоему паролю)',
      'Зеркало главной: порядок услуг ↑↓ меняется на всех страницах сайта, превью «как видит клиент», сброс',
    ],
  },
  {
    icon: ClipboardList,
    title: 'Рабочие инструменты',
    items: [
      'Задачи мастерам: поставить → мастер видит в кабинете → отмечает «выполнено»',
      'Финансы (шаблон «Бухгалтер»): суммы по заявкам, средний чек, разбивка по сайтам, выгрузка CSV',
    ],
  },
  {
    icon: Eye,
    title: 'Наблюдение',
    items: [
      'Обзор: воронка заявок, мастера и услуги, отзывы и рейтинг, команда за 7 дней',
      'Аудит: неудалимый журнал — кто, что и когда сделал (входы, статусы, правки, чаты, удаления)',
    ],
  },
];

const NOT_YET = [
  'Пушей в Telegram о новых сообщениях в чате — нужно открывать кабинет',
  '2FA на вход',
  'Фактическая выручка по сделкам («Финансы» считают суммы заявок клиентов)',
];

export default function LeaderPage() {
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
          href="/chief"
          className="px-4 py-2 rounded-full bg-zinc-900 text-white text-[12px] font-bold active:scale-95 transition-transform"
        >
          Открыть админку
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-16">
        <section className="pt-9 pb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[11px] font-bold text-zinc-500 shadow-sm">
            <Eye size={12} className="text-zinc-900" /> Для руководителя
          </span>
          <h1 className="text-[27px] leading-[1.15] font-black text-zinc-900 mt-4">
            Возможности руководства проектом
          </h1>
          <p className="text-[13px] text-zinc-500 mt-3 leading-relaxed">
            Один вход (логин <b className="text-zinc-700">admin</b>) — и весь штаб: кабинеты сотрудников,
            модерация, контент сайтов, задачи, финансы и аудит.
          </p>
          <Link
            href="/chief"
            className="inline-flex items-center gap-1.5 mt-5 px-5 py-3 rounded-2xl bg-zinc-900 text-white text-[13px] font-bold active:scale-95 transition-transform"
          >
            Перейти в штаб <ArrowRight size={15} />
          </Link>
        </section>

        <div className="space-y-3">
          {SECTIONS.map((s) => (
            <section key={s.title} className="bg-white rounded-[24px] p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0">
                  <s.icon size={17} className="text-white" />
                </span>
                <div>
                  <p className="text-[15px] font-bold text-zinc-900 leading-tight">{s.title}</p>
                  {s.sub && <p className="text-[11px] text-zinc-400">{s.sub}</p>}
                </div>
              </div>
              <ul className="space-y-2">
                {s.items.map((it) => (
                  <li key={it} className="flex gap-2 text-[12.5px] text-zinc-600 leading-snug">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="bg-white rounded-[24px] p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0">
                <Lock size={17} className="text-zinc-500" />
              </span>
              <p className="text-[15px] font-bold text-zinc-900">Пока нет</p>
            </div>
            <ul className="space-y-2">
              {NOT_YET.map((it) => (
                <li key={it} className="flex gap-2 text-[12.5px] text-zinc-400 leading-snug">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-200 shrink-0" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[24px] bg-zinc-900 p-5 text-center shadow-lg">
            <MessageSquare size={20} className="text-white mx-auto mb-2" />
            <p className="text-[14px] font-bold text-white">Сотрудникам — свой кабинет по ссылке</p>
            <p className="text-[12px] text-zinc-400 mt-1.5 leading-relaxed">
              «Команда» → «Отправить доступ»: ссылка + логин,
              <br />пароль сотрудник задаёт сам при первом входе.
            </p>
          </section>
        </div>

        <div className="flex justify-center gap-4 mt-6 text-[11px] text-zinc-400">
          <Link href="/" className="hover:text-zinc-600 flex items-center gap-1"><Home size={12} /> Главная</Link>
          <Link href="/chief" className="hover:text-zinc-600 flex items-center gap-1"><ShieldCheck size={12} /> Админка</Link>
          <span className="flex items-center gap-1"><History size={12} /> Аудит всех действий</span>
          <span className="flex items-center gap-1"><Wallet size={12} /> Финансы</span>
        </div>
      </main>
    </div>
  );
}
