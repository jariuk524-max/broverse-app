'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import SmartSearch from '@/components/SmartSearch';
import OrderModal, { type OrderServiceItem } from '@/components/OrderModal';
import { ChevronRight, Shield, Star, Clock, CheckCircle2 } from 'lucide-react';

function BrandLogo({ brand, size = 24 }: { brand: string; size?: number }) {
  const s = size;
  switch (brand) {
    case 'wash': return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#4285F4" /><path d="M7 16c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /><circle cx="9" cy="10" r="1.2" fill="#fff" /><circle cx="12" cy="8.5" r="1.2" fill="#fff" /><circle cx="15" cy="10" r="1.2" fill="#fff" /><path d="M8 17.5h8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>);
    case 'build': return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#EA4335" /><path d="M8 16V8l4-3 4 3v8" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" /><rect x="10" y="12" width="4" height="4" rx="0.5" stroke="#fff" strokeWidth="1.5" /><circle cx="12" cy="9" r="1" fill="#fff" /></svg>);
    case 'frame': return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#FBBC05" /><rect x="7" y="5" width="10" height="14" rx="2" stroke="#fff" strokeWidth="1.8" /><line x1="7" y1="8" x2="17" y2="8" stroke="#fff" strokeWidth="1" /><line x1="7" y1="16" x2="17" y2="16" stroke="#fff" strokeWidth="1" /><circle cx="12" cy="17.5" r="0.8" fill="#fff" /></svg>);
    case 'move': return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#34A853" /><rect x="4" y="9" width="10" height="7" rx="1" stroke="#fff" strokeWidth="1.8" /><path d="M14 11l4-2v7l-4-2" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="8" cy="17" r="1.5" stroke="#fff" strokeWidth="1.2" /><circle cx="16" cy="17" r="1.5" stroke="#fff" strokeWidth="1.2" /></svg>);
    case 'rent': return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#00BCD4" /><path d="M9 7v5l3 3 3-3V7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="15" x2="12" y2="18" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /><line x1="9" y1="18" x2="15" y2="18" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>);
    case 'garden': return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#16A34A" /><path d="M12 17c0-4 2.5-7 6-8 0 4-2.5 7-6 8z" fill="#fff" /><path d="M12 17c0-4-2.5-7-6-8 0 4 2.5 7 6 8z" fill="#DFF5E4" /><path d="M12 17v3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>);
    default: return null;
  }
}

function BroVerseLogo({ className = '' }: { className?: string }) {
  return (<svg viewBox="0 0 40 40" fill="none" className={className}><rect width="40" height="40" rx="12" fill="#18181b" /><path d="M10 12h4l4 8 4-8h4v16h-3.5v-10l-4.5 8-4.5-8v10H10V12z" fill="#fff" /><circle cx="32" cy="14" r="3" fill="#34A853" /><circle cx="32" cy="14" r="1.5" fill="#fff" /></svg>);
}

const CATEGORIES = [
  { id: 'wash', label: 'BroWash', desc: 'Химчистка мебели, матрасов, ковров и салонов автомобилей', color: '#4285F4', bg: '#EBF3FF' },
  { id: 'build', label: 'BroBuild', desc: 'Ремонт квартир, сантехники, электрики и бытовой техники', color: '#EA4335', bg: '#FDECEA' },
  { id: 'frame', label: 'BroFrame', desc: 'Ремонт смартфонов, ноутбуков, роботов и сетевого оборудования', color: '#FBBC05', bg: '#FEF7E0' },
  { id: 'move', label: 'BroMove', desc: 'Квартирные и офисные переезды, сборка мебели, грузоперевозки', color: '#34A853', bg: '#E8F5E9' },
  { id: 'rent', label: 'BroRent', desc: 'Аренда профессионального инструмента и техники', color: '#00BCD4', bg: '#E0F7FA' },
  { id: 'garden', label: 'BroGarden', desc: 'Озеленение, стрижка газонов и уборка снега', color: '#16A34A', bg: '#E7F6EC' },
];

const TRUST_ITEMS = [
  { icon: Shield, label: 'Trust Score 100', desc: 'Каждый мастер проходит строгую проверку и верификацию', color: '#34A853' },
  { icon: Star, label: 'Рейтинг 5.0', desc: 'Средний балл по отзывам клиентов', color: '#FBBC05' },
  { icon: Clock, label: 'Выезд от 1 часа', desc: 'Быстрый отклик и выезд мастера в удобное время', color: '#4285F4' },
  { icon: CheckCircle2, label: 'Гарантия 12 мес', desc: 'Официальная гарантия на все виды выполненных работ', color: '#EA4335' },
];



const HOW_IT_WORKS = [
  { num: '01', emoji: '📝', title: 'Опишите задачу', desc: 'Выберите услугу из каталога', chips: ['Фото помогает мастеру', 'AI-оценка стоимости'] },
  { num: '02', emoji: '📞', title: 'Мастер свяжется', desc: 'В течение 5 минут', chips: ['Бесплатный выезд', 'Фиксированная стоимость'] },
  { num: '03', emoji: '🔧', title: 'Работа выполняется', desc: 'Мастер приедет в удобное время', chips: ['Фотоотчёт', 'Соблюдение сроков'] },
  { num: '04', emoji: '✅', title: 'Принимайте', desc: 'Проверьте результат', chips: ['Оплата после', 'Гарантия 12 мес'] },
];

function ServiceDetailModal({ service, onOrder, onClose }: { service: OrderServiceItem; onOrder: () => void; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true))); }, []);
  const handleClose = useCallback(() => { setVisible(false); setTimeout(onClose, 300); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />
      <div className={`relative w-full sm:max-w-[420px] mx-4 bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden transition-all duration-300 ease-out max-h-[90vh] overflow-y-auto ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full sm:translate-y-8 opacity-0 scale-95'}`}>
        <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
          <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <button type="button" onClick={handleClose} className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"><span className="text-sm">✕</span></button>
          <div className="absolute bottom-3 left-3 right-3">
            <span className="inline-block px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-[10px] font-bold text-white mb-2">{service.brand} • {service.time}</span>
            <h2 className="text-lg font-black text-white leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{service.name}</h2>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-black text-zinc-900">от {service.price} ₽</span>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400"><Clock size={12} />{service.time}</div>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed mb-5">{service.desc}. Выезд мастера в удобное время, фиксированная стоимость без скрытых доплат. Гарантия на все виды работ.</p>
          <div className="space-y-2.5 mb-6">
            <div className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /><span className="text-[13px] text-zinc-600">Бесплатный выезд для осмотра</span></div>
            <div className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /><span className="text-[13px] text-zinc-600">Фиксированная стоимость</span></div>
            <div className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /><span className="text-[13px] text-zinc-600">Гарантия до 12 месяцев</span></div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-zinc-100 p-4">
          <button type="button" onClick={() => { handleClose(); setTimeout(onOrder, 300); }} className="w-full py-3.5 rounded-2xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 transition-all duration-200 active:scale-[0.98]">Заказать от {service.price} ₽</button>
        </div>
      </div>
    </div>
  );
}

export default function DomainGrid() {
  const [selectedService, setSelectedService] = useState<OrderServiceItem | null>(null);
  const [detailService, setDetailService] = useState<OrderServiceItem | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [services, setServices] = useState<OrderServiceItem[]>([]);

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: OrderServiceItem[] = data.map((s: any) => ({
            name: s.name || s.label || '',
            desc: s.desc || s.description || '',
            price: String(s.price || '0'),
            domain: s.domain || 'wash',
            brand: s.brand || '',
            color: s.color || CATEGORIES.find(c => c.id === (s.domain || 'wash'))?.color || '#4285F4',
            icon: s.icon || '📋',
            time: s.time || '1 ч',
            image: s.image || `/hero/${s.domain || 'wash'}-hero.jpg`,
          }));
          setServices(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const filteredServices = filter === 'all' ? services : services.filter((s) => s.domain === filter);

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <Header />
      <SmartSearch />

      <main className="max-w-7xl mx-auto px-4 md:px-6">

        {/* Category Grid — 3x2 */}
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {CATEGORIES.map((card) => (
              <Link key={card.id} href={`/services/${card.id}`} className="group flex flex-col items-center text-center p-6 bg-white/80 backdrop-blur-md rounded-[24px] shadow-sm border border-white/20 transition-all duration-300 hover:shadow-lg hover:scale-[1.03] active:scale-[0.97] cursor-pointer">
                <div className="mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <BrandLogo brand={card.id} size={48} />
                </div>
                <span className="text-sm font-bold" style={{ color: card.color }}>{card.label}</span>
                <span className="text-xs text-zinc-400 mt-1">{card.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Trust Info Cards */}
        <section className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-md rounded-[24px] shadow-sm border border-white/20">
                  <div className="w-11 h-11 rounded-2xl bg-[#F2F2F7] flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-zinc-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-800">{item.label}</p>
                    <p className="text-[10px] text-zinc-400">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* All Services */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <BroVerseLogo className="w-10 h-10" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-zinc-900">Все услуги BroVerse</h2>
              <p className="text-xs text-zinc-400">{filteredServices.length} услуг</p>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
            <button type="button" onClick={() => setFilter('all')} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${filter === 'all' ? 'bg-zinc-900 text-white shadow-md' : 'bg-white/80 text-zinc-500 hover:bg-white'}`}>Все ({services.length})</button>
            {CATEGORIES.map((cat) => {
              const count = services.filter((s) => s.domain === cat.id).length;
              return (
                <button key={cat.id} type="button" onClick={() => setFilter(filter === cat.id ? 'all' : cat.id)} className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${filter === cat.id ? 'text-white shadow-md' : 'hover:opacity-80'}`} style={{ backgroundColor: filter === cat.id ? cat.color : cat.bg, color: filter === cat.id ? '#fff' : cat.color }}>
                  <BrandLogo brand={cat.id} size={16} />{cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Service cards grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {filteredServices.map((service) => (
              <button key={service.name} type="button" onClick={() => setDetailService(service)} className="group relative text-left rounded-[24px] border border-white/20 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white/80 backdrop-blur-md">
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                  <img src={service.image} alt={service.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white">{service.brand}</span>
                  <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white">{service.time}</span>
                </div>
                <div className="p-4">
                  <p className="text-[13px] font-semibold text-zinc-800 group-hover:text-zinc-950 transition-colors leading-tight line-clamp-1">{service.name}</p>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{service.desc}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-sm font-bold text-zinc-900">от {service.price} ₽</span>
                    <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-zinc-600 transition-colors">Заказать →</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-zinc-900 mb-8 text-center">Как это работает</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.num} className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{step.emoji}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Шаг {step.num}</span>
                </div>
                <h3 className="text-[15px] font-bold text-zinc-800 mb-2">{step.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed mb-3">{step.desc}</p>
                <ul className="space-y-1.5">
                  {step.chips.map((chip) => (
                    <li key={chip} className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-zinc-400">{chip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-10">
          <div className="relative overflow-hidden rounded-[24px] bg-white/80 backdrop-blur-md border border-white/20 shadow-sm p-10 text-center">
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#4285F4]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[#34A853]/20 blur-3xl" />
            <div className="relative">
              <BroVerseLogo className="w-14 h-14 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-zinc-900 mb-2">Нужна помощь с выбором?</h2>
              <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">Опишите задачу — подберём мастера</p>
              <button type="button" className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-bold px-8 py-3.5 rounded-full hover:bg-zinc-800 transition-colors shadow-xl shadow-black/20">
                Оставить заявку <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

      </main>

      {detailService && <ServiceDetailModal service={detailService} onOrder={() => setSelectedService(detailService)} onClose={() => setDetailService(null)} />}
      {selectedService && <OrderModal service={selectedService} onClose={() => setSelectedService(null)} />}
    </div>
  );
}
