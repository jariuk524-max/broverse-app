'use client';

import { useState, useCallback, useEffect } from 'react';
import { CheckCircle2, X, Phone, MessageCircle, Zap, Minus, Plus, Truck } from 'lucide-react';
import { createOrderInSupabase } from '@/lib/monolith-bridge';
import { saveOrder } from '@/components/Header';

export type OrderServiceItem = {
  name: string;
  desc: string;
  price: string;
  domain: string;
  brand: string;
  color: string;
  icon: string;
  time: string;
  image: string;
};

interface OrderModalProps {
  service: OrderServiceItem;
  onClose: () => void;
}

const DELIVERY_FEE = 700;

function calculateTotalPrice(dayPrice: number, days: number): number {
  if (days <= 0) return 0;
  if (days === 1) return dayPrice;
  if (days === 2) return dayPrice * 2 * 0.9;
  return dayPrice * days * 0.8;
}

const QUICK_DAYS = [
  { days: 1, label: '1 день' },
  { days: 2, label: '2 дня' },
  { days: 3, label: '3 дня' },
  { days: 5, label: '5 дней' },
  { days: 7, label: 'Неделя' },
];

const TIME_SLOTS = [
  { id: '09-12', label: '09:00 — 12:00', sub: 'Утро', startHour: 9 },
  { id: '12-15', label: '12:00 — 15:00', sub: 'День', startHour: 12 },
  { id: '15-18', label: '15:00 — 18:00', sub: 'Вечер', startHour: 15 },
  { id: '18-21', label: '18:00 — 21:00', sub: 'Поздно', startHour: 18 },
];

function getMoscowHour(): number {
  const now = new Date();
  const msk = new Date(now.getTime() + (3 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
  return msk.getHours();
}

function getAvailableTimeSlots(isToday: boolean): typeof TIME_SLOTS {
  if (!isToday) return TIME_SLOTS;
  const currentHour = getMoscowHour();
  return TIME_SLOTS.filter(slot => slot.startHour >= currentHour);
}

export default function OrderModal({ service, onClose }: OrderModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [dateOption, setDateOption] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [rentDays, setRentDays] = useState(1);
  const [deliveryType, setDeliveryType] = useState<'courier' | 'pickup'>('courier');
  const [returnType, setReturnType] = useState<'courier' | 'pickup'>('courier');
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const availableTimeSlots = getAvailableTimeSlots(dateOption === 'today');
  const hasAvailableSlotsToday = availableTimeSlots.length > 0;

  const dateOptions = [
    { id: 'today', label: 'Сегодня', sub: `${today.getDate()} ${today.toLocaleString('ru', { month: 'short' })}` },
    { id: 'tomorrow', label: 'Завтра', sub: `${tomorrow.getDate()} ${tomorrow.toLocaleString('ru', { month: 'short' })}` },
    { id: 'dayafter', label: dayAfter.toLocaleString('ru', { weekday: 'short' }), sub: `${dayAfter.getDate()} ${dayAfter.toLocaleString('ru', { month: 'short' })}` },
    { id: 'custom', label: 'Выбрать дату', sub: 'Календарь' },
  ];

  const dayPrice = parseInt(service.price.replace(/\s/g, ''));
  const rentalTotal = calculateTotalPrice(dayPrice, rentDays);
  const deliveryCost = deliveryType === 'courier' ? DELIVERY_FEE : 0;
  const returnCost = returnType === 'courier' ? DELIVERY_FEE : 0;
  const grandTotal = rentalTotal + deliveryCost + returnCost;

  const canProceed = dateOption && timeSlot && name && phone && (deliveryType === 'pickup' || address);

  const handleSubmit = useCallback(async () => {
    const timeLabel = TIME_SLOTS.find(t => t.id === timeSlot)?.label || timeSlot;
    const dateLabel = dateOption === 'custom' ? customDate : dateOptions.find(d => d.id === dateOption)?.label;
    await createOrderInSupabase({
      title: `${service.brand} — ${service.name}`,
      service: 'rental',
      address: address || `Москва, доставка`,
      price: grandTotal,
      client_name: name,
      client_phone: phone,
      client_comment: `Аренда ${rentDays} дн., доставка: ${dateLabel} ${timeLabel}, получение: ${deliveryType === 'courier' ? 'курьер' : 'самовывоз'}, возврат: ${returnType === 'courier' ? 'курьер' : 'самовывоз'}, адрес: ${address} — ${comment}`,
    });
    saveOrder({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      phone,
      service: service.name,
      date: dateLabel || '',
      time: timeLabel,
      delivery: deliveryType === 'courier' ? 'Курьер' : 'Самовывоз',
      returnType: returnType === 'courier' ? 'Курьер' : 'Самовывоз',
      days: rentDays,
      total: grandTotal,
      status: 'new',
      createdAt: new Date().toISOString(),
    });
    setSubmitted(true);
  }, [service.name, service.brand, address, dateOption, customDate, timeSlot, rentDays, name, phone, comment, grandTotal, deliveryType, returnType]);

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />
        <div className={`relative w-full sm:max-w-[400px] mx-4 mb-4 sm:mb-0 bg-white rounded-[24px] p-8 text-center shadow-2xl transition-all duration-300 ease-out ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}>
          <div className="mx-auto w-16 h-16 rounded-full bg-[#E0F7FA] flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle2 size={32} className="text-[#00BCD4]" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">Заявка отправлена!</h3>
          <p className="text-sm text-zinc-500 mb-2">{service.name}</p>
          <p className="text-xs text-zinc-400 mb-1">Доставка: {dateOption === 'custom' ? customDate : dateOptions.find(d => d.id === dateOption)?.label} • {TIME_SLOTS.find(t => t.id === timeSlot)?.label}</p>
          <p className="text-xs text-zinc-400 mb-2">Аренда: {rentDays} {rentDays === 1 ? 'сутки' : rentDays < 5 ? 'суток' : 'суток'}</p>
          <p className="text-sm font-bold text-[#00BCD4] mb-6">Итого: {grandTotal.toLocaleString('ru')} ₽</p>
          <button type="button" onClick={handleClose} className="w-full py-3 rounded-2xl bg-[#00BCD4] text-white text-sm font-bold hover:bg-[#0097A7] transition-colors">
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />
      <div className={`relative w-full sm:max-w-[420px] mx-4 mb-0 sm:mb-0 bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden transition-all duration-300 ease-out max-h-[90vh] overflow-y-auto ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full sm:translate-y-8 opacity-0 scale-95'}`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-zinc-100 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E0F7FA] flex items-center justify-center">
                <span className="text-xl">{service.icon}</span>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900">{service.name}</h3>
                <p className="text-[10px] sm:text-[11px] text-[#00BCD4] font-semibold">{service.brand}</p>
              </div>
            </div>
            <button type="button" onClick={handleClose} className="p-1.5 rounded-full hover:bg-zinc-100 transition-colors">
              <X size={18} className="text-zinc-400" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-zinc-900">{service.price} ₽</span>
              <span className="text-[11px] text-zinc-400">/сутки</span>
            </div>
            <div className="flex items-center gap-2">
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)} className="text-[11px] font-semibold text-[#00BCD4] hover:underline">Изменить</button>
              )}
              <div className="flex gap-1">
                {[1, 2].map((s) => (
                  <div key={s} className={`h-1 w-10 rounded-full transition-all duration-300 ${step >= s ? 'bg-[#00BCD4]' : 'bg-zinc-200'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 pb-28">
          {/* Step 1 */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">

              {/* Date */}
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Дата доставки</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {dateOptions.map((d) => (
                    <button key={d.id} type="button" onClick={() => { setDateOption(d.id); setTimeSlot(''); }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${dateOption === d.id ? 'border-[#00BCD4] bg-[#E0F7FA]/50 shadow-sm' : 'border-zinc-200 hover:border-zinc-300'}`}>
                      <p className="text-[13px] font-bold text-zinc-800">{d.label}</p>
                      <p className="text-[10px] text-zinc-400">{d.sub}</p>
                    </button>
                  ))}
                </div>
                {dateOption === 'custom' && (
                  <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)}
                    min={today.toISOString().split('T')[0]}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#00BCD4] transition-colors mt-1.5" />
                )}
              </div>

              {/* Time */}
              {dateOption && dateOption !== 'custom' && (
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Время доставки</p>
                  {dateOption === 'today' && !hasAvailableSlotsToday && (
                    <div className="p-2.5 bg-amber-50 rounded-xl text-center mb-1.5">
                      <p className="text-[11px] text-amber-600 font-semibold">Все слоты на сегодня уже прошли</p>
                      <p className="text-[10px] text-amber-400">Выберите другую дату</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1.5">
                    {TIME_SLOTS.map((t) => {
                      const isAvailable = dateOption !== 'today' || availableTimeSlots.some(s => s.id === t.id);
                      return (
                        <button key={t.id} type="button" onClick={() => { if (isAvailable) setTimeSlot(t.id); }}
                          disabled={!isAvailable}
                          className={`p-2 rounded-xl border text-left transition-all ${!isAvailable ? 'border-zinc-100 bg-zinc-50 opacity-40 cursor-not-allowed' : timeSlot === t.id ? 'border-[#00BCD4] bg-[#E0F7FA]/50 shadow-sm' : 'border-zinc-200 hover:border-zinc-300'}`}>
                          <p className="text-[12px] font-bold text-zinc-800">{t.label}</p>
                          <p className="text-[9px] text-zinc-400">{isAvailable ? t.sub : 'Прошло'}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {dateOption === 'custom' && customDate && (
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Время доставки</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TIME_SLOTS.map((t) => (
                      <button key={t.id} type="button" onClick={() => setTimeSlot(t.id)}
                        className={`p-2 rounded-xl border text-left transition-all ${timeSlot === t.id ? 'border-[#00BCD4] bg-[#E0F7FA]/50' : 'border-zinc-200 hover:border-zinc-300'}`}>
                        <p className="text-[12px] font-bold text-zinc-800">{t.label}</p>
                        <p className="text-[9px] text-zinc-400">{t.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery type */}
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Способ получения</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setDeliveryType('courier')}
                    className={`p-3 rounded-xl border text-left transition-all ${deliveryType === 'courier' ? 'border-[#00BCD4] bg-[#E0F7FA]/50' : 'border-zinc-200 hover:border-zinc-300'}`}>
                    <div className="flex items-center gap-2">
                      <Truck size={16} className={deliveryType === 'courier' ? 'text-[#00BCD4]' : 'text-zinc-400'} />
                      <div>
                        <p className="text-[12px] font-bold text-zinc-900">Курьер</p>
                        <p className="text-[10px] text-[#00BCD4] font-semibold">700 ₽</p>
                      </div>
                    </div>
                  </button>
                  <button type="button" onClick={() => setDeliveryType('pickup')}
                    className={`p-3 rounded-xl border text-left transition-all ${deliveryType === 'pickup' ? 'border-[#00BCD4] bg-[#E0F7FA]/50' : 'border-zinc-200 hover:border-zinc-300'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📍</span>
                      <div>
                        <p className="text-[12px] font-bold text-zinc-900">Самовывоз</p>
                        <p className="text-[10px] text-emerald-500 font-semibold">Бесплатно</p>
                      </div>
                    </div>
                  </button>
                </div>
                {deliveryType === 'pickup' && (
                  <div className="mt-2 bg-[#E0F7FA]/50 rounded-xl p-2.5 space-y-1">
                    <div className="flex items-center gap-2"><span className="text-sm">📍</span><p className="text-[11px] font-semibold text-zinc-800">Москва, ул. Примерная, д. 15</p></div>
                    <div className="flex items-center gap-2"><span className="text-sm">📞</span><a href="tel:+79001234567" className="text-[11px] font-semibold text-[#00BCD4]">+7 (900) 123-45-67</a></div>
                    <div className="flex items-center gap-2"><span className="text-sm">🕐</span><p className="text-[11px] text-zinc-600">Пн-Вс: 09:00 — 21:00</p></div>
                  </div>
                )}
              </div>

              {/* Return type */}
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Способ возврата</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setReturnType('courier')}
                    className={`p-3 rounded-xl border text-left transition-all ${returnType === 'courier' ? 'border-[#00BCD4] bg-[#E0F7FA]/50' : 'border-zinc-200 hover:border-zinc-300'}`}>
                    <div className="flex items-center gap-2">
                      <Truck size={16} className={returnType === 'courier' ? 'text-[#00BCD4]' : 'text-zinc-400'} />
                      <div>
                        <p className="text-[12px] font-bold text-zinc-900">Курьер</p>
                        <p className="text-[10px] text-[#00BCD4] font-semibold">700 ₽</p>
                      </div>
                    </div>
                  </button>
                  <button type="button" onClick={() => setReturnType('pickup')}
                    className={`p-3 rounded-xl border text-left transition-all ${returnType === 'pickup' ? 'border-[#00BCD4] bg-[#E0F7FA]/50' : 'border-zinc-200 hover:border-zinc-300'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📍</span>
                      <div>
                        <p className="text-[12px] font-bold text-zinc-900">Самовывоз</p>
                        <p className="text-[10px] text-emerald-500 font-semibold">Бесплатно</p>
                      </div>
                    </div>
                  </button>
                </div>
                {returnType === 'pickup' && (
                  <div className="mt-2 bg-[#E0F7FA]/50 rounded-xl p-2.5 space-y-1">
                    <div className="flex items-center gap-2"><span className="text-sm">📍</span><p className="text-[11px] font-semibold text-zinc-800">Москва, ул. Примерная, д. 15</p></div>
                    <div className="flex items-center gap-2"><span className="text-sm">📞</span><a href="tel:+79001234567" className="text-[11px] font-semibold text-[#00BCD4]">+7 (900) 123-45-67</a></div>
                    <div className="flex items-center gap-2"><span className="text-sm">🕐</span><p className="text-[11px] text-zinc-600">Пн-Вс: 09:00 — 21:00</p></div>
                  </div>
                )}
              </div>

              {/* Days */}
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">На сколько суток?</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-black text-[#00BCD4] w-12 text-center">{rentDays}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <button type="button" onClick={() => setRentDays(Math.max(1, rentDays - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center active:scale-95 transition-all">
                      <Minus size={14} className="text-zinc-600" />
                    </button>
                    <input type="range" min={1} max={10} value={rentDays} onChange={(e) => setRentDays(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-[#00BCD4]" />
                    <button type="button" onClick={() => setRentDays(Math.min(10, rentDays + 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center active:scale-95 transition-all">
                      <Plus size={14} className="text-zinc-600" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_DAYS.map((q) => (
                    <button key={q.days} type="button" onClick={() => setRentDays(q.days)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${rentDays === q.days ? 'bg-[#00BCD4] text-white shadow-md' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
                      {q.label}
                    </button>
                  ))}
                </div>
                <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden mt-2">
                  <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase bg-zinc-50">
                    <span>Период</span><span>Цена/сутки</span>
                  </div>
                  <div className="px-3 py-1.5 flex items-center justify-between border-t border-zinc-100">
                    <span className="text-[11px] text-zinc-600">1 сутки</span>
                    <span className="text-[11px] font-bold text-zinc-900">{dayPrice.toLocaleString('ru')} ₽</span>
                  </div>
                  <div className="px-3 py-1.5 flex items-center justify-between border-t border-zinc-100">
                    <span className="text-[11px] text-zinc-600">2 суток</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-bold text-[#00BCD4] bg-[#E0F7FA] px-1 py-0.5 rounded">−10%</span>
                      <span className="text-[11px] font-bold text-zinc-900">{Math.round(dayPrice * 0.9).toLocaleString('ru')} ₽</span>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 flex items-center justify-between border-t border-zinc-100">
                    <span className="text-[11px] text-zinc-600">3–10 суток</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-bold text-[#00BCD4] bg-[#E0F7FA] px-1 py-0.5 rounded">−20%</span>
                      <span className="text-[11px] font-bold text-zinc-900">{Math.round(dayPrice * 0.8).toLocaleString('ru')} ₽</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Контакты</p>
                <div className="space-y-2">
                  <input type="text" placeholder="Ваше имя" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#00BCD4] transition-colors" />
                  <input type="tel" placeholder="+7 (___) ___-__-__" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#00BCD4] transition-colors" />
                  {deliveryType === 'courier' && (
                    <input type="text" placeholder="Адрес доставки (улица, дом, кв.)" value={address} onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#00BCD4] transition-colors" />
                  )}
                  <textarea placeholder="Комментарий" value={comment} onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#00BCD4] transition-colors resize-none h-14" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#E0F7FA] flex items-center justify-center shrink-0">
                  <span className="text-xl">{service.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-zinc-900 truncate">{service.name}</p>
                  <p className="text-[11px] text-zinc-400">{service.brand}</p>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-xl p-3 space-y-1.5 mb-3">
                <div className="flex justify-between text-[12px]">
                  <span className="text-zinc-400">Дата</span>
                  <span className="font-semibold text-zinc-800">{dateOption === 'custom' ? customDate : dateOptions.find(d => d.id === dateOption)?.label}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-zinc-400">Время</span>
                  <span className="font-semibold text-zinc-800">{TIME_SLOTS.find(t => t.id === timeSlot)?.label}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-zinc-400">Получение</span>
                  <span className="font-semibold text-zinc-800">{deliveryType === 'courier' ? 'Курьер — 700 ₽' : 'Самовывоз — бесплатно'}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-zinc-400">Возврат</span>
                  <span className="font-semibold text-zinc-800">{returnType === 'courier' ? 'Курьер — 700 ₽' : 'Самовывоз — бесплатно'}</span>
                </div>
                {deliveryType === 'courier' && address && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-zinc-400">Адрес</span>
                    <span className="font-semibold text-zinc-800 text-right max-w-[180px] truncate">{address}</span>
                  </div>
                )}
                <div className="flex justify-between text-[12px]">
                  <span className="text-zinc-400">Срок</span>
                  <span className="font-semibold text-zinc-800">{rentDays} {rentDays === 1 ? 'сутки' : rentDays < 5 ? 'суток' : 'суток'}</span>
                </div>
              </div>

              <div className="bg-[#E0F7FA]/50 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-[12px]">
                  <span className="text-zinc-500">Аренда ({rentDays} × {rentDays === 1 ? dayPrice : rentDays === 2 ? Math.round(dayPrice * 0.9) : Math.round(dayPrice * 0.8)} ₽)</span>
                  <span className="font-semibold text-zinc-800">{rentalTotal.toLocaleString('ru')} ₽</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-zinc-500">Доставка</span>
                  <span className={`font-semibold ${deliveryType === 'courier' ? 'text-zinc-800' : 'text-emerald-500'}`}>
                    {deliveryType === 'courier' ? `${DELIVERY_FEE} ₽` : 'Бесплатно'}
                  </span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-zinc-500">Возврат</span>
                  <span className={`font-semibold ${returnType === 'courier' ? 'text-zinc-800' : 'text-emerald-500'}`}>
                    {returnType === 'courier' ? `${DELIVERY_FEE} ₽` : 'Бесплатно'}
                  </span>
                </div>
                <div className="border-t border-[#00BCD4]/30 pt-1.5 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-bold text-zinc-800">К оплате</span>
                    <span className="text-xl font-black text-[#00BCD4]">{grandTotal.toLocaleString('ru')} ₽</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky bottom bar */}
        <div className="sticky bottom-0 bg-white border-t border-zinc-100 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold text-zinc-500">Итого:</span>
            <span key={grandTotal} className="text-xl font-black text-[#00BCD4] animate-[pulse_0.3s_ease-in-out]">{grandTotal.toLocaleString('ru')} ₽</span>
          </div>
          {step === 1 ? (
            <button type="button" onClick={() => setStep(2)} disabled={!canProceed}
              className="w-full py-3.5 rounded-2xl bg-[#00BCD4] text-white text-sm font-bold disabled:opacity-30 hover:bg-[#0097A7] transition-all duration-200 active:scale-[0.98]">
              Проверить заказ →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit}
              className="w-full py-3.5 rounded-2xl bg-[#00BCD4] text-white text-sm font-bold hover:bg-[#0097A7] transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2">
              <Zap size={14} /> Забронировать за {grandTotal.toLocaleString('ru')} ₽
            </button>
          )}
          <div className="flex gap-2 mt-2">
            <a href="tel:+79001234567" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-100 transition-colors">
              <Phone size={11} /> Позвонить
            </a>
            <a href="https://t.me/" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-100 transition-colors">
              <MessageCircle size={11} /> Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
