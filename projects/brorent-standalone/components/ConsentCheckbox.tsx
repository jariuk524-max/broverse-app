'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { PD_CONSENT_KEY } from '@/lib/site-config';

/**
 * Чекбокс согласия на обработку персональных данных и cookie (152-ФЗ).
 * Обязателен до отправки любой формы, собирающей ПДн.
 * Уже given-согласие (localStorage) предустанавливается в true.
 */
export default function ConsentCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  useEffect(() => {
    try {
      if (!checked && localStorage.getItem(PD_CONSENT_KEY) === '1') onChange(true);
    } catch { /* приватный режим */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <label className="flex items-start gap-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          onChange(e.target.checked);
          try {
            if (e.target.checked) localStorage.setItem(PD_CONSENT_KEY, '1');
          } catch { /* приватный режим */ }
        }}
        className="mt-0.5 w-4 h-4 shrink-0 accent-zinc-900"
      />
      <span className="text-[11px] leading-snug text-zinc-500">
        Я совершеннолетний и даю{' '}
        <b className="text-zinc-700">согласие на обработку персональных данных</b> (имя, телефон,
        адрес, сообщения) и на использование файлов <b className="text-zinc-700">cookie</b>{' '}
        в соответствии с{' '}
        <Link href="/privacy" className="underline text-zinc-700 hover:text-zinc-900">
          Политикой обработки персональных данных
        </Link>{' '}
        (152-ФЗ)
      </span>
    </label>
  );
}
