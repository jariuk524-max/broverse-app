'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import SmartSearch from '@/components/SmartSearch';
import OrderModal, { type OrderServiceItem } from '@/components/OrderModal';
import RequestModal from '@/components/RequestModal';
import { ChevronRight, Shield, Star, Clock, CheckCircle2, Wrench, Phone } from 'lucide-react';
import { masterAdFallbackImage, type MasterAd } from '@/lib/master-ads';
import { GARDEN_CATEGORIES } from '@/data/garden-services';

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
          {service.isMaster && service.masterName && (
            <div className="mb-4 rounded-[18px] bg-[#F2F2F7] p-3.5">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-full bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                  {service.masterProfile?.photo ? (
                    <img src={service.masterProfile.photo} alt={service.masterName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-black text-zinc-500">{service.masterName.charAt(0).toUpperCase()}</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[15px] font-bold text-zinc-900 truncate">{service.masterName}</p>
                    <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500 shrink-0">
                      <Star size={11} fill="currentColor" />{(service.masterProfile?.rating ?? 5).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {[service.masterProfile?.specialization, service.masterProfile?.city].filter(Boolean).join(' · ') || 'Мастер BroVerse'}
                  </p>
                </div>
                {service.masterPhone && (
                  <a href={`tel:${service.masterPhone}`} className="shrink-0 flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[12px] font-bold text-zinc-900 shadow-sm active:bg-zinc-100">
                    <Phone size={13} /> Позвонить
                  </a>
                )}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {service.directionLabel && (
                  <span className="px-2.5 py-1 rounded-full bg-white text-[11px] font-semibold text-zinc-700">📌 {service.directionLabel}</span>
                )}
                {service.masterProfile?.experience && (
                  <span className="px-2.5 py-1 rounded-full bg-white text-[11px] font-semibold text-zinc-600">Опыт: {service.masterProfile.experience}</span>
                )}
                {service.masterProfile?.city && (
                  <span className="px-2.5 py-1 rounded-full bg-white text-[11px] font-semibold text-zinc-600">{service.masterProfile.city}</span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-white text-[11px] font-semibold text-zinc-600">Проверен BroVerse</span>
              </div>
              {service.masterProfile?.about && (
                <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">{service.masterProfile.about}</p>
              )}
            </div>
          )}
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

function adToOrderItem(ad: MasterAd): OrderServiceItem {
  return {
    name: ad.title,
    desc: ad.description || `Услуга мастера ${ad.master.name}`.trim(),
    price: String(ad.price || 0),
    domain: ad.domain || 'wash',
    brand: ad.brand,
    color: ad.color,
    icon: '🛠️',
    time: 'Мастер',
    image: ad.photos?.[0] || masterAdFallbackImage(ad.domain),
    isMaster: true,
    masterId: ad.master.id,
    masterName: ad.master.name,
    masterPhone: ad.master.phone || ad.phone,
    adId: ad.id,
    directionLabel: ad.directionLabel,
    masterProfile: {
      photo: ad.master.photo,
      city: ad.master.city,
      experience: ad.master.experience,
      specialization: ad.master.specialization,
      about: ad.master.about,
      rating: ad.master.rating ?? 5,
    },
  };
}

export default function DomainGrid() {
  const [selectedService, setSelectedService] = useState<OrderServiceItem | null>(null);
  const [detailService, setDetailService] = useState<OrderServiceItem | null>(null);
  const [showRequest, setShowRequest] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [services, setServices] = useState<OrderServiceItem[]>([]);
  const [garden, setGarden] = useState<OrderServiceItem[]>([]);
  const [masters, setMasters] = useState<MasterAd[]>([]);
  const [homeOrder, setHomeOrder] = useState<string[]>([]);

  // Порядок услуг на главной (выставляется в админке → «Зеркало» → «Как видит клиент»)
  useEffect(() => {
    fetch('/api/home-order')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d?.order) && d.order.length) setHomeOrder(d.order); })
      .catch(() => {});
  }, []);

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

  useEffect(() => {
    fetch('/api/masters/ads')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMasters(data as MasterAd[]);
      })
      .catch(() => {});
  }, []);

  // Услуги сайта BroGarden (каталог бренда, merged с правками /admin)
  useEffect(() => {
    fetch('/api/catalog/garden')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = Array.isArray(data?.services) ? data.services : Array.isArray(data) ? data : [];
        if (!list.length) return;
        const emojiByName = new Map<string, string>();
        for (const cat of GARDEN_CATEGORIES) {
          for (const s of cat.services) emojiByName.set(s.name, cat.emoji);
        }
        setGarden(list.map((s: any) => ({
          name: s.name || '',
          desc: s.desc || '',
          price: String(s.price || '0'),
          domain: 'garden',
          brand: 'BroGarden',
          color: '#16A34A',
          icon: emojiByName.get(s.name) || '🌿',
          time: s.time || '1 ч',
          image: s.image || '/hero/garden-hero.svg',
        })));
      })
      .catch(() => {});
  }, []);

  const catalogServices = useMemo(() => {
    // garden — из каталога бренда; убираем дубли по имени, если уже есть в /api/services
    const seen = new Set(services.map((s) => `${s.domain}:${s.name.toLowerCase()}`));
    const list = [...services, ...garden.filter((g) => !seen.has(`garden:${g.name.toLowerCase()}`))];
    if (!homeOrder.length) return list;
    // Применяем порядок главной, выставленный в админке («Зеркало» → «Как видит клиент»)
    const pos = new Map(homeOrder.map((n, i) => [n, i]));
    return list
      .map((s, i) => ({ s, i }))
      .sort((a, b) => {
        const pa = pos.has(a.s.name) ? pos.get(a.s.name)! : homeOrder.length + a.i;
        const pb = pos.has(b.s.name) ? pos.get(b.s.name)! : homeOrder.length + b.i;
        return pa - pb;
      })
      .map((x) => x.s);
  }, [services, garden, homeOrder]);
  const masterItems = useMemo(() => masters.map(adToOrderItem), [masters]);
  const allItems = useMemo(() => [...catalogServices, ...masterItems], [catalogServices, masterItems]);

  const filteredServices = filter === 'all'
    ? allItems
    : filter === 'masters'
      ? masterItems
      : allItems.filter((s) => s.domain === filter);

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <Header />
      <SmartSearch onMasterAdClick={(ad) => setSelectedService(adToOrderItem(ad))} />

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
        <section id="catalog" className="mb-10 scroll-mt-24">
          <div className="flex items-center gap-3 mb-5">
            <BroVerseLogo className="w-10 h-10" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-zinc-900">Все услуги BroVerse</h2>
              <p className="text-xs text-zinc-400">{filteredServices.length} услуг{masterItems.length > 0 ? ` · из них ${masterItems.length} от мастеров` : ''}</p>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
            <button type="button" onClick={() => setFilter('all')} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${filter === 'all' ? 'bg-zinc-900 text-white shadow-md' : 'bg-white/80 text-zinc-500 hover:bg-white'}`}>Все ({allItems.length})</button>
            <button
              type="button"
              onClick={() => setFilter(filter === 'masters' ? 'all' : 'masters')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${filter === 'masters' ? 'bg-zinc-900 text-white shadow-md' : 'bg-white/80 text-zinc-500 hover:bg-white'}`}
            >
              <Wrench size={13} />Наши мастера ({masterItems.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = allItems.filter((s) => s.domain === cat.id && !s.isMaster).length;
              return (
                <button key={cat.id} type="button" onClick={() => setFilter(filter === cat.id ? 'all' : cat.id)} className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${filter === cat.id ? 'text-white shadow-md' : 'hover:opacity-80'}`} style={{ backgroundColor: filter === cat.id ? cat.color : cat.bg, color: filter === cat.id ? '#fff' : cat.color }}>
                  <BrandLogo brand={cat.id} size={16} />{cat.label} ({count})
                </button>
              );
            })}
            <Link
              href="/masters"
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 bg-[#EA4335] text-white shadow-md hover:opacity-90"
            >
              <Wrench size={13} /> Стать мастером
            </Link>
          </div>

          {/* Service cards grid */}
          {filteredServices.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-zinc-300 bg-white/60 p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
                <Wrench size={20} className="text-zinc-400" />
              </div>
              <p className="text-sm font-bold text-zinc-700">
                {filter === 'masters' ? 'Услуги мастеров появятся здесь после модерации' : 'В этом разделе пока нет услуг'}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {filter === 'masters' ? 'Мастеры добавляют услуги в кабинете — BroVerse проверяет и публикует' : 'Попробуйте другой раздел'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {filteredServices.map((service) => (
              <button
                key={`${service.isMaster ? 'm' : 'c'}-${service.adId || service.name}`}
                type="button"
                onClick={() => setDetailService(service)}
                className="group relative text-left rounded-[24px] border border-white/20 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white/80 backdrop-blur-md"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                  <img src={service.image} alt={service.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white">{service.brand}</span>
                  {service.isMaster ? (
                    <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-zinc-900">
                      <Wrench size={10} className="text-zinc-500" /> Мастер{service.directionLabel ? ` · ${service.directionLabel}` : ''}
                    </span>
                  ) : (
                    <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white">{service.time}</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[13px] font-semibold text-zinc-800 group-hover:text-zinc-950 transition-colors leading-tight line-clamp-1">{service.name}</p>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{service.desc}</p>
                  {service.isMaster && service.masterName && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-100 overflow-hidden flex items-center justify-center shrink-0">
                        {service.masterProfile?.photo ? (
                          <img src={service.masterProfile.photo} alt={service.masterName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-bold text-zinc-500">{service.masterName.charAt(0).toUpperCase()}</span>
                        )}
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-600 truncate">{service.masterName}</span>
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 shrink-0">
                        <Star size={10} fill="currentColor" />{(service.masterProfile?.rating ?? 5).toFixed(1)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-sm font-bold text-zinc-900">от {service.price} ₽</span>
                    <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-zinc-600 transition-colors">Заказать →</span>
                  </div>
                </div>
              </button>
            ))}
            </div>
          )}
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
              <button type="button" onClick={() => setShowRequest(true)} className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-bold px-8 py-3.5 rounded-full hover:bg-zinc-800 transition-colors shadow-xl shadow-black/20">
                Оставить заявку <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* Стать мастером */}
        <section className="mb-10">
          <Link href="/master" className="block group">
            <div className="rounded-[24px] bg-gradient-to-br from-[#18181b] to-[#2a2a2e] p-8 text-center shadow-sm transition-transform active:scale-[0.99]">
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Мастерам</p>
              <h2 className="text-xl font-bold text-white mb-2">Стать мастером BroVerse</h2>
              <p className="text-sm text-zinc-400 mb-5 max-w-md mx-auto">
                Заявка на доступ к заказам, свои услуги и цены, профиль для клиентов
              </p>
              <span className="inline-flex items-center gap-2 bg-white text-zinc-900 text-sm font-bold px-7 py-3 rounded-full group-hover:bg-zinc-100 transition-colors">
                Заполнить анкету <ChevronRight size={16} />
              </span>
            </div>
          </Link>
        </section>

      </main>

      {detailService && <ServiceDetailModal service={detailService} onOrder={() => setSelectedService(detailService)} onClose={() => setDetailService(null)} />}
      {selectedService && <OrderModal service={selectedService} onClose={() => setSelectedService(null)} />}
      {showRequest && (
        <RequestModal
          serviceName="Подбор мастера"
          brand="BroVerse"
          color="#18181b"
          domain="verse"
          onClose={() => setShowRequest(false)}
        />
      )}
    </div>
  );
}
