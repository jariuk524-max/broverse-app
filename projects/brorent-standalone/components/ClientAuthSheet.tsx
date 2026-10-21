'use client';

import { useEffect, useState } from 'react';
import { X, Send, Loader2, KeyRound, LogIn } from 'lucide-react';
import Link from 'next/link';
import type { ClientSession } from '@/lib/client-auth';

type Step = 'phone' | 'code';

function formatPhoneInput(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (d && !d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  const p = d.slice(1);
  let out = '+7';
  if (p.length) out += ` (${p.slice(0, 3)}`;
  if (p.length >= 3) out += `) ${p.slice(3, 6)}`;
  if (p.length >= 6) out += `-${p.slice(6, 8)}`;
  if (p.length >= 8) out += `-${p.slice(8, 10)}`;
  return out;
}

function digitsOf(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Шторка входа клиента поверх любой формы: телефон → код из
 * Telegram-бота @Broverse_ru_bot → сессия (WB-стиль, без пароля).
 */
export default function ClientAuthSheet({
  prefillPhone = '',
  onDone,
  onCancel,
}: {
  prefillPhone?: string;
  onDone: (session: ClientSession) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState(prefillPhone || '+7');
  const [code, setCode] = useState('');
  const [att, setAtt] = useState('');
  const [startLink, setStartLink] = useState('');
  const [sentDirect, setSentDirect] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const resendActive = resendIn > 0;
  useEffect(() => {
    if (!resendActive) return;
    const t = setInterval(() => setResendIn((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [resendActive]);

  // Фон не скроллится, пока открыта шторка
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function requestCode() {
    setError('');
    if (digitsOf(phone).length !== 11) {
      setError('Введите номер телефона полностью');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/client-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request-code', phone: digitsOf(phone) }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error || 'Не удалось отправить код');
        return;
      }
      setAtt(d.att);
      setSentDirect(d.sent === 'direct');
      setStartLink(d.start || '');
      setCode('');
      setStep('code');
      setResendIn(60);
    } catch {
      setError('Сеть недоступна — попробуйте позже');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setError('');
    if (code.replace(/\D/g, '').length !== 6) {
      setError('Введите 6 цифр');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/client-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', att, code }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error || 'Неверный код');
        return;
      }
      onDone(d.session as ClientSession);
    } catch {
      setError('Сеть недоступна — попробуйте позже');
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    'w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-[15px] outline-none focus:border-[#00BCD4] focus:ring-2 focus:ring-[#00BCD4]/20 transition-all';

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm anim-fade" onClick={onCancel} />
      <div className="relative w-full sm:max-w-[420px] bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl anim-sheet sm:anim-pop max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 pb-2">
          <div>
            <p className="text-[15px] font-bold text-zinc-900">Вход по номеру телефона</p>
            <p className="text-[12px] text-zinc-400">Код придёт в Telegram-бот @Broverse_ru_bot</p>
          </div>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-full hover:bg-zinc-100 transition-colors" aria-label="Закрыть">
            <X size={18} className="text-zinc-400" />
          </button>
        </div>

        <div className="px-4 pb-5 pt-2 space-y-3">
          {step === 'phone' ? (
            <>
              <input
                type="tel"
                inputMode="tel"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                onKeyDown={(e) => { if (e.key === 'Enter') requestCode(); }}
                placeholder="+7 (___) ___-__-__"
                className={inputCls}
              />
              {error && <p className="text-[13px] font-medium text-red-500">{error}</p>}
              <button
                type="button"
                onClick={requestCode}
                disabled={busy}
                className="w-full py-3.5 rounded-2xl bg-[#00BCD4] text-white text-sm font-bold hover:bg-[#0097A7] transition-all disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                Получить код
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setError(''); }}
                  className="text-[12px] font-semibold text-zinc-400 hover:text-zinc-600"
                >
                  ← Изменить номер
                </button>
                <span className="text-[12px] font-semibold text-zinc-500">{phone}</span>
              </div>
              {!sentDirect && startLink && (
                <a
                  href={startLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#00BCD4]/40 bg-[#E0F7FA]/60 py-3 text-sm font-bold text-[#0097A7] hover:bg-[#E0F7FA] transition-colors"
                >
                  <Send size={15} /> Открыть бота и получить код
                </a>
              )}
              <p className="text-[12px] text-zinc-400 -mt-1">
                {sentDirect ? 'Код отправлен в чат бота' : 'Введите код из чата бота'}
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => { if (e.key === 'Enter') verifyCode(); }}
                placeholder="······"
                className={`${inputCls} text-center text-[24px] font-bold tracking-[0.45em]`}
              />
              {error && <p className="text-[13px] font-medium text-red-500">{error}</p>}
              <button
                type="button"
                onClick={verifyCode}
                disabled={busy}
                className="w-full py-3.5 rounded-2xl bg-[#00BCD4] text-white text-sm font-bold hover:bg-[#0097A7] transition-all disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                Войти и продолжить
              </button>
              <button
                type="button"
                onClick={requestCode}
                disabled={busy || resendActive}
                className="w-full text-center text-[12px] font-semibold text-zinc-400 disabled:text-zinc-300"
              >
                {resendActive ? `Отправить повторно через ${resendIn} с` : 'Отправить код повторно'}
              </button>
            </>
          )}

          <p className="text-[10px] leading-snug text-zinc-400 pt-1">
            Продолжая, вы соглашаетесь с{' '}
            <Link href="/privacy" target="_blank" className="underline text-zinc-500 hover:text-zinc-700">
              Политикой обработки персональных данных
            </Link>{' '}
            (152-ФЗ). Вход защищён одноразовым кодом — пароль не нужен.
          </p>
        </div>
      </div>
    </div>
  );
}
