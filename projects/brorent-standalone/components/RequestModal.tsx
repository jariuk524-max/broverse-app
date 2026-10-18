'use client';

import { useCallback, useRef, useState } from 'react';
import { CheckCircle2, X, Camera, Send, Loader2 } from 'lucide-react';
import { createServiceRequest } from '@/lib/requests';
import ConsentCheckbox from '@/components/ConsentCheckbox';
import DevStub from '@/components/DevStub';
import { DATA_COLLECTION_LOCKED } from '@/lib/site-config';

interface RequestModalProps {
  serviceName?: string;
  brand?: string;
  color?: string;
  domain?: string;
  onClose: () => void;
}

const INPUT =
  'w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-[15px] outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all';

const TAP =
  'touch-manipulation select-none';

export default function RequestModal({
  serviceName = 'Химчистка мебели',
  brand = 'BroWash',
  color = '#4285F4',
  domain = 'wash',
  onClose,
}: RequestModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [pdConsent, setPdConsent] = useState(false);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // 152-ФЗ: на время разработки вход закрыт заглушкой — данные не собираются
  if (DATA_COLLECTION_LOCKED) return <DevStub variant="card" onClose={onClose} title="Заявки временно закрыты" />;

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const canSubmit = phone.trim().length >= 6 && pdConsent && !submitting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    const res = await createServiceRequest({
      serviceName: `${brand} — ${serviceName}`,
      clientPhone: phone.trim(),
      address: address.trim(),
      photo,
      description: description.trim(),
      domain,
    });
    setSubmitting(false);
    if (res) {
      setSubmitted(true);
      fetch('/api/telegram-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: res }),
      }).catch(() => {});
    } else {
      setError('Не удалось отправить заявку. Попробуйте ещё раз.');
    }
  }, [canSubmit, brand, serviceName, domain, phone, address, photo, description]);

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center js-modal">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm anim-fade" onClick={handleClose} />
        <div className="relative w-full sm:max-w-[400px] mx-4 mb-4 sm:mb-0 bg-white rounded-[24px] p-8 text-center shadow-2xl anim-pop">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">Ваша заявка на рассмотрении</h3>
          <p className="text-sm text-zinc-500 mb-1">{serviceName}</p>
          <p className="text-xs text-zinc-400 mb-6">Мы свяжемся с вами после проверки. Обычно это занимает до 30 минут.</p>
          <button
            type="button"
            onClick={handleClose}
            className={`w-full py-3 rounded-2xl text-white text-sm font-bold transition-colors hover:opacity-90 ${TAP}`}
            style={{ background: color }}
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center js-modal">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm anim-fade" onClick={handleClose} />
      <div className="relative w-full sm:max-w-[420px] mx-4 bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col anim-sheet">

        {/* Header */}
        <div className="shrink-0 bg-white border-b border-zinc-100 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900">Оставить заявку</h3>
            <p className="text-[11px] text-zinc-400">{brand} · {serviceName}</p>
          </div>
          <button type="button" onClick={handleClose} className={`p-1.5 rounded-full hover:bg-zinc-100 transition-colors ${TAP}`}>
            <X size={18} className="text-zinc-400" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* Photo */}
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Фото</p>
            <button
              type="button"
              onClick={handlePhotoClick}
              className={`group relative w-full h-[140px] rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center gap-2 overflow-hidden hover:border-[#4285F4]/40 transition-colors ${TAP}`}
            >
              {photo ? (
                <>
                  <img src={photo} alt="Фото" className="absolute inset-0 w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/50 text-white text-[10px] font-semibold">Заменить</span>
                </>
              ) : (
                <>
                  <Camera size={28} className="text-zinc-300 group-hover:text-[#4285F4] transition-colors" />
                  <span className="text-[12px] font-semibold text-zinc-400">Сделать фото</span>
                </>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Описание</p>
            <textarea
              placeholder="Опишите задачу: что почистить, степень загрязнения, материал..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${INPUT} resize-none h-24`}
            />
          </div>

          {/* Requisites */}
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Реквизиты</p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Телефон *</label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="+7 (___) ___-__-__"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Адрес</label>
                <input
                  type="text"
                  inputMode="text"
                  placeholder="Улица, дом, корпус, кв."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={INPUT}
                />
              </div>
            </div>
          </div>

          {/* Contact note */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-[12px] font-semibold text-zinc-700 leading-relaxed">
              Наш сотрудник или мастер свяжется с вами, уточнит детали и согласует стоимость.
            </p>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 rounded-xl">
              <p className="text-[11px] text-rose-600 font-semibold text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Sticky bottom bar */}
        <div className="shrink-0 bg-white border-t border-zinc-100 p-4 sm:p-5 space-y-3">
          <ConsentCheckbox checked={pdConsent} onChange={setPdConsent} />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-3.5 rounded-2xl text-white text-sm font-bold disabled:opacity-30 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${TAP}`}
            style={{ background: color }}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Отправляем...
              </>
            ) : (
              <>
                <Send size={14} /> Отправить заявку
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
