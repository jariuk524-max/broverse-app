'use client';

import Link from 'next/link';
import { ShieldAlert, Home, X } from 'lucide-react';

/**
 * Заглушка на время разработки (152-ФЗ): входы, собирающие персональные
 * данные, закрыты — данные не отправляются и не хранятся до запуска.
 * variant: 'page' — полноэкранная (страницы /chat, /master),
 *          'card' — внутри модалки (заявка, отзыв).
 */
export default function DevStub({
  variant = 'page',
  title = 'Мы в разработке',
  onClose,
}: {
  variant?: 'page' | 'card';
  title?: string;
  onClose?: () => void;
}) {
  const icon = <ShieldAlert size={variant === 'page' ? 34 : 26} className="text-zinc-400" />;
  const body = (
    <>
      <p className="text-[15px] sm:text-[17px] font-black text-zinc-900 leading-tight">{title}</p>
      <p className="text-[13px] text-zinc-500 leading-relaxed mt-2">
        Приём заявок, отзывов и чат временно отключены: до официального запуска сервиса
        мы не собираем и не храним персональные данные посетителей.
      </p>
      <p className="text-[13px] text-zinc-500 leading-relaxed mt-2">
        Скоро откроемся — спасибо за терпение.
      </p>
      <p className="text-[11px] text-zinc-400 leading-relaxed mt-3">
        Обработка персональных данных ведётся по{' '}
        <Link href="/privacy" className="underline text-zinc-500 hover:text-zinc-700">
          Политике обработки персональных данных
        </Link>{' '}
        (152-ФЗ).
      </p>
    </>
  );

  if (variant === 'card') {
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center js-modal">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm anim-fade" onClick={onClose} />
        <div className="relative w-full sm:max-w-[400px] mx-4 mb-4 sm:mb-0 bg-white rounded-[24px] p-6 shadow-2xl anim-pop">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0">
              {icon}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 active:scale-95 transition-transform"
              >
                <X size={15} />
              </button>
            )}
          </div>
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center px-5 text-center">
      <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-5">
        {icon}
      </div>
      <div className="max-w-md">{body}</div>
      <Link
        href="/"
        className="mt-7 inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-zinc-900 text-white text-[13px] font-bold active:scale-95 transition-transform"
      >
        <Home size={15} /> На главную
      </Link>
    </div>
  );
}
