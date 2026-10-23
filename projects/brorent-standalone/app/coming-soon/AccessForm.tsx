'use client';

import { useEffect, useState } from 'react';

/** Вход владельца на закрытый сайт: пароль 0021 → proxy ставит cookie и открывает главную */
export default function AccessForm() {
  const [code, setCode] = useState('');
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('denied')) setErr(true);
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = code.trim();
        if (!v) return;
        window.location.href = `/?access=${encodeURIComponent(v)}`;
      }}
      style={{ fontFamily: 'Onest, -apple-system, system-ui, sans-serif' }}
      className="w-full max-w-[280px] mt-8"
    >
      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5 text-left">
        Вход для владельца
      </label>
      <div className="flex gap-2">
        <input
          type="password"
          inputMode="numeric"
          value={code}
          onChange={(e) => { setCode(e.target.value); setErr(false); }}
          placeholder="Пароль"
          className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm outline-none focus:border-zinc-600 transition-colors"
        />
        <button
          type="submit"
          disabled={!code.trim()}
          className="px-4 py-2.5 rounded-xl bg-white text-zinc-900 text-sm font-bold active:scale-95 transition-transform disabled:opacity-30"
        >
          Войти
        </button>
      </div>
      {err && <p className="text-[12px] text-red-400 mt-1.5 text-left">Неверный пароль</p>}
    </form>
  );
}
