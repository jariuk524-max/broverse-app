'use client';

import { useCallback, useMemo, useState } from 'react';
import { X, Send, Loader2, CheckCircle2, ChevronLeft, MapPin, CalendarDays, Package, Phone } from 'lucide-react';
import { createServiceRequest } from '@/lib/requests';
import ConsentCheckbox from '@/components/ConsentCheckbox';
import DevStub from '@/components/DevStub';
import { DATA_COLLECTION_LOCKED } from '@/lib/site-config';

interface MoveRequestModalProps {
  presetService?: string | null;
  onClose: () => void;
}

const INPUT =
  'w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-[15px] outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all';

const TAP = 'touch-manipulation select-none';

const BRAND = '#4285F4';

/* ── Тарифы (ориентир крупных ТК; правятся только здесь) ── */
const SIZE_BASE: Record<string, number> = { 'Студия': 3500, '1–2 комнаты': 4500, '3–4 комнаты': 5500, '5+ комнат': 7000 };
const TYPE_ADJ: Record<string, number> = { 'Квартира': 0, 'Офис': 1000, 'Дом': 1500, 'Склад': 2500, 'Груз': -500 };
const OPTIONS = [
  { id: 'movers', label: 'Грузчики (2 чел.)', price: 1500, def: true },
  { id: 'packing', label: 'Упаковка вещей', price: 2000, def: false },
  { id: 'assembly', label: 'Разбор / сборка мебели', price: 1500, def: false },
  { id: 'nofloorlift', label: 'Подъём без лифта', price: 800, def: false },
  { id: 'outtown', label: 'За город / межгород', price: 3000, def: false },
] as const;

const SLOTS = ['Утро (9–13)', 'День (13–18)', 'Вечер (18–22)'];
const TYPES = ['Квартира', 'Офис', 'Дом', 'Склад', 'Груз'] as const;
const SIZES = ['Студия', '1–2 комнаты', '3–4 комнаты', '5+ комнат'] as const;

const STEP_TITLES = ['Маршрут', 'Когда', 'Объём', 'Опции и контакт'];
const STEP_ICONS = [MapPin, CalendarDays, Package, Phone];

function presetToForm(name: string | null | undefined): Partial<{ objType: string; size: string; outtown: boolean }> {
  switch (name) {
    case 'Квартирный переезд': return { objType: 'Квартира', size: '1–2 комнаты' };
    case 'Офисный переезд': return { objType: 'Офис', size: '3–4 комнаты' };
    case 'Дачный переезд': return { objType: 'Дом', outtown: true };
    case 'Манипулятор':
    case 'Газель-фургон':
    case 'КАМАЗ / большой фургон': return { objType: 'Груз' };
    default: return {};
  }
}

export default function MoveRequestModal({ presetService, onClose }: MoveRequestModalProps) {
  const [step, setStep] = useState(0);
  const preset = useMemo(() => presetToForm(presetService), [presetService]);

  const [fromAddr, setFromAddr] = useState('');
  const [toAddr, setToAddr] = useState('');
  const [floor, setFloor] = useState('');
  const [lift, setLift] = useState(true);

  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(SLOTS[1]);

  const [objType, setObjType] = useState(preset.objType || 'Квартира');
  const [size, setSize] = useState(preset.size || '1–2 комнаты');
  const [city, setCity] = useState<'Москва' | 'Область' | 'Межгород'>('Москва');

  const [opts, setOpts] = useState<Record<string, boolean>>(
    Object.fromEntries(OPTIONS.map((o) => [o.id, Boolean(o.def) || (o.id === 'outtown' && preset.outtown === true)]))
  );

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [pdConsent, setPdConsent] = useState(false);

  /* ── Живой расчёт ── */
  const estimate = useMemo(() => {
    let sum: number;
    if (objType === 'Груз') {
      sum = 4000;
    } else {
      sum = SIZE_BASE[size] + (TYPE_ADJ[objType] || 0);
    }
    for (const o of OPTIONS) if (opts[o.id]) sum += o.price;
    if (city === 'Межгород' && !opts.outtown) sum += 3000;
    if (city === 'Область') sum += 1000;
    sum = Math.max(sum, 2500);
    const low = Math.round(sum / 100) * 100;
    const high = Math.round((sum * 1.15) / 100) * 100;
    return { low, high };
  }, [objType, size, opts, city]);

  const stepValid = useMemo(() => {
    if (step === 0) return fromAddr.trim().length > 2 && toAddr.trim().length > 2;
    if (step === 1) return !!date;
    if (step === 2) return true;
    return phone.replace(/\D/g, '').length >= 6 && pdConsent; // 152-ФЗ: согласие обязательно
  }, [step, fromAddr, toAddr, date, phone, pdConsent]);

  const breakdown = useMemo(() => {
    const lines = [
      `Маршрут: ${fromAddr.trim()} → ${toAddr.trim()} (${city})`,
      floor ? `Этаж: ${floor}${lift ? ', лифт есть' : ', без лифта'}` : '',
      date ? `Дата: ${new Date(date).toLocaleDateString('ru-RU')}, ${slot}` : '',
      objType === 'Груз' ? 'Объект: грузоперевозка' : `Объект: ${objType}, ${size}`,
      `Опции: ${OPTIONS.filter((o) => opts[o.id]).map((o) => o.label).join(', ') || 'нет'}`,
      comment.trim() ? `Комментарий: ${comment.trim()}` : '',
      `Оценка: ${estimate.low.toLocaleString('ru')}–${estimate.high.toLocaleString('ru')} ₽`,
    ];
    return lines.filter(Boolean).join('\n');
  }, [fromAddr, toAddr, city, floor, lift, date, slot, objType, size, opts, comment, estimate]);

  const submit = useCallback(async () => {
    if (submitting || !stepValid) return;
    setSubmitting(true);
    setError('');
    const res = await createServiceRequest({
      serviceName: `BroMove — ${presetService || 'Расчёт переезда'}`,
      clientName: name.trim(),
      clientPhone: phone.trim(),
      address: `${fromAddr.trim()} → ${toAddr.trim()}`,
      description: breakdown,
      proposedPrice: `${estimate.low.toLocaleString('ru')}–${estimate.high.toLocaleString('ru')}`,
      domain: 'move',
    });
    setSubmitting(false);
    if (res) setSubmitted(true);
    else setError('Не удалось отправить заявку. Попробуйте ещё раз.');
  }, [submitting, stepValid, presetService, name, phone, fromAddr, toAddr, breakdown, estimate]);

  const next = () => { if (stepValid && step < 3) setStep(step + 1); };
  const back = () => { if (step > 0) setStep(step - 1); };

  // 152-ФЗ: на время разработки вход закрыт заглушкой — данные не собираются
  if (DATA_COLLECTION_LOCKED) return <DevStub variant="card" onClose={onClose} title="Расчёт переездов временно закрыт" />;

  /* ── Успех ── */
  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center js-modal">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm anim-fade" onClick={onClose} />
        <div className="relative w-full sm:max-w-[400px] mx-4 mb-4 sm:mb-0 bg-white rounded-[24px] p-8 text-center shadow-2xl anim-pop">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">Ваша заявка на рассмотрении</h3>
          <p className="text-sm text-zinc-500 mb-1">Расчёт переезда отправлен</p>
          <p className="text-xs text-zinc-400 mb-6">Перезвоним в течение 15 минут и зафиксируем цену после согласования заявки.</p>
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3 rounded-2xl text-white text-sm font-bold transition-colors hover:opacity-90 ${TAP}`}
            style={{ background: BRAND }}
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  const StepIcon = STEP_ICONS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center js-modal">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm anim-fade" onClick={onClose} />
      <div className="relative w-full sm:max-w-[440px] mx-4 bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col anim-sheet">

        {/* Header */}
        <div className="shrink-0 bg-white border-b border-zinc-100 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button type="button" onClick={back} className={`-ml-1.5 p-1.5 rounded-full hover:bg-zinc-100 transition-colors ${TAP}`}>
                  <ChevronLeft size={18} className="text-zinc-500" />
                </button>
              )}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900">Рассчитать переезд</h3>
                <p className="text-[11px] text-zinc-400">{presetService ? `Услуга: ${presetService}` : 'BroMove · прозрачный тариф'}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className={`p-1.5 rounded-full hover:bg-zinc-100 transition-colors ${TAP}`}>
              <X size={18} className="text-zinc-400" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1.5">
            {STEP_TITLES.map((t, i) => (
              <div key={t} className="flex-1">
                <div className="h-1.5 rounded-full transition-colors" style={{ background: i <= step ? BRAND : '#E4E4E7' }} />
                <p className={`text-[8px] mt-1 hidden sm:block font-semibold ${i === step ? 'text-zinc-800' : 'text-zinc-300'}`}>{t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* Step 0 — Маршрут */}
          {step === 0 && (
            <>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <StepIcon size={12} /> Маршрут
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Откуда *</label>
                <input value={fromAddr} onChange={(e) => setFromAddr(e.target.value)} placeholder="Улица, дом, кв." className={INPUT} />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Куда *</label>
                <input value={toAddr} onChange={(e) => setToAddr(e.target.value)} placeholder="Улица, дом, кв." className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Этаж</label>
                  <input value={floor} onChange={(e) => setFloor(e.target.value)} inputMode="numeric" placeholder="Например, 5" className={INPUT} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Лифт</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button type="button" onClick={() => setLift(true)} className={`py-3 rounded-xl text-[13px] font-bold transition-colors ${TAP} ${lift ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-500'}`}>Есть</button>
                    <button type="button" onClick={() => setLift(false)} className={`py-3 rounded-xl text-[13px] font-bold transition-colors ${TAP} ${!lift ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-500'}`}>Нет</button>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Город</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Москва', 'Область', 'Межгород'] as const).map((c) => (
                    <button key={c} type="button" onClick={() => setCity(c)}
                      className={`py-2.5 rounded-xl text-[12px] font-bold transition-colors ${TAP} ${city === c ? 'text-white' : 'bg-zinc-50 text-zinc-500'}`}
                      style={{ background: city === c ? BRAND : undefined }}>{c}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 1 — Дата */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <StepIcon size={12} /> Когда везём
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Дата переезда *</label>
                <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Время</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SLOTS.map((s) => (
                    <button key={s} type="button" onClick={() => setSlot(s)}
                      className={`py-2.5 rounded-xl text-[11px] font-bold transition-colors ${TAP} ${slot === s ? 'text-white' : 'bg-zinc-50 text-zinc-500'}`}
                      style={{ background: slot === s ? BRAND : undefined }}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-[12px] font-semibold text-zinc-700">Машина и экипаж бронируются на выбранное окно. Перезвоним в течение 15 минут.</p>
              </div>
            </>
          )}

          {/* Step 2 — Объём */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <StepIcon size={12} /> Что везём
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Объект</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => setObjType(t)}
                      className={`py-2.5 rounded-xl text-[12px] font-bold transition-colors ${TAP} ${objType === t ? 'text-white' : 'bg-zinc-50 text-zinc-500'}`}
                      style={{ background: objType === t ? BRAND : undefined }}>{t}</button>
                  ))}
                </div>
              </div>
              {objType !== 'Груз' && (
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Размер</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SIZES.map((s) => (
                      <button key={s} type="button" onClick={() => setSize(s)}
                        className={`py-2.5 rounded-xl text-[12px] font-bold transition-colors ${TAP} ${size === s ? 'text-white' : 'bg-zinc-50 text-zinc-500'}`}
                        style={{ background: size === s ? BRAND : undefined }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-[12px] font-semibold text-zinc-700">Поможем оценить объём на месте — финальная цена фиксируется после согласования заявки.</p>
              </div>
            </>
          )}

          {/* Step 3 — Опции + контакт */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <StepIcon size={12} /> Дополнительно
              </div>
              <div className="space-y-2">
                {OPTIONS.map((o) => (
                  <button key={o.id} type="button" onClick={() => setOpts((p) => ({ ...p, [o.id]: !p[o.id] }))}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-colors text-left ${TAP} ${opts[o.id] ? 'border-[#4285F4] bg-blue-50/60' : 'border-zinc-200 bg-white'}`}>
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${opts[o.id] ? 'bg-[#4285F4] border-[#4285F4]' : 'border-zinc-300'}`}>
                      {opts[o.id] && <CheckCircle2 size={13} className="text-white" />}
                    </span>
                    <span className="flex-1 text-[13px] font-semibold text-zinc-800">{o.label}</span>
                    <span className="text-[12px] font-bold text-zinc-500">+{o.price.toLocaleString('ru')} ₽</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Имя</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Как к вам обращаться" className={INPUT} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Телефон *</label>
                  <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" className={INPUT} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Комментарий</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Пианино, сейф, хрупкие вещи..." className={`${INPUT} resize-none`} />
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 rounded-xl">
                  <p className="text-[11px] text-rose-600 font-semibold text-center">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky footer: estimate + action */}
        <div className="shrink-0 bg-white border-t border-zinc-100 p-4 sm:p-5" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Ориентировочно</p>
              <p className="text-[17px] font-black text-zinc-900">
                {estimate.low.toLocaleString('ru')} – {estimate.high.toLocaleString('ru')} ₽
              </p>
            </div>
            <p className="text-[10px] text-zinc-400 text-right leading-tight max-w-[150px]">Цена фиксируется<br />после согласования · без доплат</p>
          </div>

          {step < 3 ? (
            <button type="button" onClick={next} disabled={!stepValid}
              className={`w-full py-3.5 rounded-2xl text-white text-sm font-bold disabled:opacity-30 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${TAP}`}
              style={{ background: BRAND }}>
              Далее — {STEP_TITLES[step + 1]}
            </button>
          ) : (
            <div className="space-y-3">
              <ConsentCheckbox checked={pdConsent} onChange={setPdConsent} />
              <button type="button" onClick={submit} disabled={!stepValid || submitting}
                className={`w-full py-3.5 rounded-2xl text-white text-sm font-bold disabled:opacity-30 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${TAP}`}
                style={{ background: BRAND }}>
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Отправляем...</>
                ) : (
                  <><Send size={14} /> Отправить заявку — перезвоним за 15 мин</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
