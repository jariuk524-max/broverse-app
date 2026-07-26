'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Phone, MessageCircle, CheckCircle2, Clock, ShoppingCart, Plus, Minus, X } from 'lucide-react';
import OrderModal, { type OrderServiceItem } from '@/components/OrderModal';
import SmartSearch from '@/components/SmartSearch';

const FALLBACK_SERVICES: OrderServiceItem[] = [
  {
    name: 'Пылесос Karcher Puzzi 8/1',
    desc: 'Профессиональный экстрактор для химчистки мягкой мебели, матрасов и автомобильных салонов. Мощность всасывания 210 мбар, объём бака 8 л. В комплекте: моющее средство, насадка для мебели, шланг 2.5 м.',
    price: '1000',
    domain: 'rent',
    brand: 'BroRent',
    color: '#00BCD4',
    icon: '🧹',
    time: 'От 1 дня',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784878029979-0.jpg',
  },
  {
    name: 'Пылесос Karcher Puzzi 10/1',
    desc: 'Профессиональный экстрактор для глубокой чистки ковров и крупной мебели. Мощность 480 Вт, объём бака 10 л. Комплект: моющее средство Professional, набор насадок, шланг 3.5 м.',
    price: '1200',
    domain: 'rent',
    brand: 'BroRent',
    color: '#00BCD4',
    icon: '🧹',
    time: 'От 1 дня',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784900687479-0.jpg',
  },
  {
    name: 'Сушилка Sabrina Air Force',
    desc: 'Профессиональная воздуходувка для ускорения высыхания мебели, ковров и полов после химчистки. Мощность 2000 Вт, расход воздуха 3000 м³/ч.',
    price: '500',
    domain: 'rent',
    brand: 'BroRent',
    color: '#00BCD4',
    icon: '💨',
    time: 'От 1 дня',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784900787227-0.jpg',
  },
  {
    name: 'Пылесос Sabrina Professional',
    desc: 'Профессиональный вакуумный пылесос для сухой и влажной уборки. Мощность 1400 Вт, объём бака 20 л. Фильтр HEPA H13.',
    price: '400',
    domain: 'rent',
    brand: 'BroRent',
    color: '#00BCD4',
    icon: '🧹',
    time: 'От 1 дня',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784900790996-1.jpg',
  },
  {
    name: 'Перфоратор Makita HR2470',
    desc: 'Профессиональный перфоратор для сверления и долбления бетона. 780 Вт, сила удара 2.7 Дж, патрон SDS-plus. В комплекте: буры 6/8/10 мм, глубиномер, кейс.',
    price: '600',
    domain: 'rent',
    brand: 'BroRent',
    color: '#00BCD4',
    icon: '🔨',
    time: 'От 1 дня',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784950271132-0.jpg',
  },
  {
    name: 'Шуруповерт Makita DDF484',
    desc: 'Аккумуляторный дрель-шуруповерт для сборки мебели и ремонтных работ. 18 В, 42 Нм, 21 ступень. В комплекте: 2 аккумулятора 3.0 Ач, зарядное устройство, кейс.',
    price: '500',
    domain: 'rent',
    brand: 'BroRent',
    color: '#00BCD4',
    icon: '🔩',
    time: 'От 1 дня',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784950273421-1.webp',
  },
  {
    name: 'Погружная пила Makita DSP600',
    desc: 'Профессиональная погружная пила для точного раскроя ДСП, фанеры, ЛДСП. 1200 Вт, глубина реза 56 мм. В комплекте: диск, направляющая шина 1400 мм, кейс.',
    price: '1000',
    domain: 'rent',
    brand: 'BroRent',
    color: '#00BCD4',
    icon: '🪚',
    time: 'От 1 дня',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784950275062-2.jpg',
  },
  {
    name: 'Лобзик Makita JV0600K',
    desc: 'Профессиональный электролобзик для фигурного раскроя дерева, ДСП, металла. 650 Вт, глубина реза 65 мм. В комплекте: пилки, защитный экран, кейс.',
    price: '450',
    domain: 'rent',
    brand: 'BroRent',
    color: '#00BCD4',
    icon: '📐',
    time: 'От 1 дня',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784950277237-3.jpg',
  },
  {
    name: 'Кромочный фрезер Makita 3709',
    desc: 'Профессиональный кромочный фрезер для обработки кромок ДСП, фанеры, массива. 900 Вт, 33000 об/мин. В комплекте: набор фрез, параллельный упор, кейс.',
    price: '700',
    domain: 'rent',
    brand: 'BroRent',
    color: '#00BCD4',
    icon: '⚙️',
    time: 'От 1 дня',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784950278564-4.jpg',
  },
  {
    name: 'УШМ Makita 9565CV',
    desc: 'Угловая шлифмашина 125 мм для резки металла, камня, шлифовки. 720 Вт, регулировка 2800-10000 об/мин. В комплекте: диск, защитный кожух, ключ.',
    price: '500',
    domain: 'rent',
    brand: 'BroRent',
    color: '#00BCD4',
    icon: '⚙️',
    time: 'От 1 дня',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784950280459-5.jpg',
  },
  {
    name: 'Гайковерт Makita TW1000',
    desc: 'Профессиональный ударный гайковерт. Крутящий момент 1000 Нм, патрон 1/2". В комплекте: головки 17/19/21 мм, кейс.',
    price: '800',
    domain: 'rent',
    brand: 'BroRent',
    color: '#00BCD4',
    icon: '🔧',
    time: 'От 1 дня',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784950281808-6.jpg',
  },
];

const HERO_PHOTOS = [
  'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784891104910-0.jpg',
];

const GALLERY_IMAGES = [
  'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784892682246-1.jpg',
  'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784892683881-2.jpg',
  'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784900687479-0.jpg',
  'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784900787227-0.jpg',
  'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784900790996-1.jpg',
];

const SLIDER_PHOTOS = [
  'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784950271132-0.jpg',
  'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784950273421-1.webp',
  'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784950275062-2.jpg',
  'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784950277237-3.jpg',
  'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784950278564-4.jpg',
  'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784950280459-5.jpg',
  'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784950281808-6.jpg',
];

function ServiceDetailModal({ service, onOrder, onClose }: { service: OrderServiceItem; onOrder: () => void; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true))); }, []);
  const handleClose = useCallback(() => { setVisible(false); setTimeout(onClose, 300); }, [onClose]);
  const dayPrice = parseInt(service.price.replace(/\s/g, ''));
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />
      <div className={`relative w-full sm:max-w-[420px] mx-4 bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden transition-all duration-300 ease-out max-h-[92vh] overflow-y-auto ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full sm:translate-y-8 opacity-0 scale-95'}`}>

        {/* Large photo */}
        <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100">
          <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <button type="button" onClick={handleClose} className="absolute top-4 right-4 p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors">
            <span className="text-base font-bold">✕</span>
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <span className="inline-block px-3 py-1.5 rounded-full bg-[#00BCD4] text-[11px] font-bold text-white mb-3">{service.brand}</span>
            <h2 className="text-[22px] font-black text-white leading-tight mb-2" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>{service.name}</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-black text-white">{service.price}</span>
              <span className="text-[14px] text-white/70">₽ / сутки</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 pb-24 space-y-5">

          {/* Description */}
          <div>
            <p className="text-[15px] text-zinc-700 leading-relaxed">{service.desc}</p>
          </div>

          {/* Pricing */}
          <div className="bg-zinc-50 rounded-[20px] p-5">
            <h4 className="text-[14px] font-bold text-zinc-900 mb-4">Стоимость аренды</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                <span className="text-[14px] text-zinc-600">1 сутки</span>
                <span className="text-[15px] font-bold text-zinc-900">{dayPrice.toLocaleString('ru')} ₽</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                <span className="text-[14px] text-zinc-600">2 суток</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#00BCD4] bg-[#E0F7FA] px-2 py-0.5 rounded-full">−10%</span>
                  <span className="text-[15px] font-bold text-zinc-900">{Math.round(dayPrice * 0.9).toLocaleString('ru')} ₽</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[14px] text-zinc-600">3–10 суток</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#00BCD4] bg-[#E0F7FA] px-2 py-0.5 rounded-full">−20%</span>
                  <span className="text-[15px] font-bold text-zinc-900">{Math.round(dayPrice * 0.8).toLocaleString('ru')} ₽</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-[#E0F7FA] rounded-[20px] p-5">
            <h4 className="text-[14px] font-bold text-[#00BCD4] mb-4">Условия аренды</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#00BCD4] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
                <span className="text-[14px] text-zinc-700 leading-snug">Доставка и возврат курьером за 700 ₽ или самовывоз бесплатно</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#00BCD4] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
                <span className="text-[14px] text-zinc-700 leading-snug">Залог не требуется — оплата при получении</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#00BCD4] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
                <span className="text-[14px] text-zinc-700 leading-snug">Каждый инструмент проходит диагностику перед выдачей</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#00BCD4] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
                <span className="text-[14px] text-zinc-700 leading-snug">При поломке заменим инструмент в течение часа</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#00BCD4] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
                <span className="text-[14px] text-zinc-700 leading-snug">Доставка с 09:00 до 21:00, включая выходные</span>
              </div>
            </div>
          </div>

          {/* Consultation */}
          <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-[16px]">
            <div className="w-12 h-12 rounded-full bg-[#E0F7FA] flex items-center justify-center shrink-0">
              <span className="text-xl">📞</span>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-zinc-900">Нужна консультация?</p>
              <p className="text-[12px] text-zinc-400">Поможем подобрать инструмент под вашу задачу</p>
            </div>
            <a href="tel:+79001234567" className="px-4 py-2 rounded-xl bg-[#00BCD4] text-white text-[12px] font-bold hover:bg-[#0097A7] transition-colors">Позвонить</a>
          </div>
        </div>

        {/* Sticky button */}
        <div className="sticky bottom-0 bg-white border-t border-zinc-100 p-5">
          <button type="button" onClick={() => { handleClose(); setTimeout(onOrder, 300); }}
            className="w-full py-4 rounded-2xl bg-[#00BCD4] text-white text-[15px] font-bold hover:bg-[#0097A7] transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#00BCD4]/20">
            Забронировать от {service.price} ₽/день
          </button>
        </div>
      </div>
    </div>
  );
}

const HERO_RATIO = 1094 / 360;
const SLIDER_RATIO = 626 / 417;

export default function BroRentLanding() {
  const [services] = useState<OrderServiceItem[]>(FALLBACK_SERVICES);
  const [sliderIdx, setSliderIdx] = useState(0);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [heroIdx, setHeroIdx] = useState(0);
  const [detailService, setDetailService] = useState<OrderServiceItem | null>(null);
  const [selectedService, setSelectedService] = useState<OrderServiceItem | null>(null);
  const [cart, setCart] = useState<OrderServiceItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const addToCart = (service: OrderServiceItem) => {
    setCart(prev => {
      const exists = prev.find(s => s.name === service.name);
      if (exists) return prev.filter(s => s.name !== service.name);
      return [...prev, service];
    });
  };

  const isInCart = (name: string) => cart.some(s => s.name === name);

  const cartTotal = cart.reduce((sum, s) => sum + parseInt(s.price.replace(/\s/g, '')), 0);

  useEffect(() => {
    if (SLIDER_PHOTOS.length <= 1) return;
    const timer = setInterval(() => setSliderIdx(i => (i + 1) % SLIDER_PHOTOS.length), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (HERO_PHOTOS.length <= 1) return;
    const timer = setInterval(() => setHeroIdx(i => (i + 1) % HERO_PHOTOS.length), 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (GALLERY_IMAGES.length <= 1) return;
    const timer = setInterval(() => setGalleryIdx(i => (i + 1) % GALLERY_IMAGES.length), 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif', background: '#F2F2F7' }}>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="w-10 h-10 rounded-full bg-white/75 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <ArrowLeft size={18} className="text-zinc-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-[28px] font-black text-[#00BCD4]">BroRent</h1>
            <p className="text-[13px] text-zinc-400">Аренда инструмента и оборудования для химчистки и стройки</p>
          </div>
        </div>

        {/* Поиск */}
        <SmartSearch />

        {/* Фото из админки над преимуществами */}
        <section className="mt-4 mb-4">
          <img src="https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784902478403-0.jpg" alt="BroRent" className="w-full rounded-[20px] object-cover shadow-sm" />
        </section>

        {/* Наши работы */}
        <section className="mb-8">
          <div className="bg-white rounded-[28px] p-4 shadow-sm">
            <h3 className="text-[16px] font-bold text-zinc-900 mb-3 px-2">Наше оборудование</h3>
            <div className="relative rounded-[20px] overflow-hidden" style={{ aspectRatio: `${SLIDER_RATIO}` }}>
              {SLIDER_PHOTOS.map((url, i) => (
                <img key={url} src={url} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === sliderIdx ? 'opacity-100' : 'opacity-0'}`} />
              ))}
              {SLIDER_PHOTOS.length > 1 && (
                <>
                  <button type="button" onClick={() => setSliderIdx(c => c === 0 ? SLIDER_PHOTOS.length - 1 : c - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-zinc-500 hover:text-zinc-900 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="button" onClick={() => setSliderIdx(c => c === SLIDER_PHOTOS.length - 1 ? 0 : c + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-zinc-500 hover:text-zinc-900 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
              {SLIDER_PHOTOS.map((_, i) => (
                <button key={i} type="button" onClick={() => setSliderIdx(i)} className={`h-1.5 rounded-full transition-all ${i === sliderIdx ? 'w-5 bg-[#00BCD4]' : 'w-1.5 bg-zinc-300'}`} />
              ))}
            </div>
          </div>
        </section>

        {/* Наши преимущества */}
        <section className="mt-6 mb-8">
          <h3 className="text-[16px] font-bold text-zinc-900 mb-4 text-center">Наши преимущества</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '⚡', label: 'Быстрая выдача', desc: 'Инструмент готов к выдаче в течение 1 часа после бронирования' },
              { icon: '🛡️', label: 'Проверка', desc: 'Каждый инструмент проходит диагностику перед выдачей' },
              { icon: '💰', label: 'Фикс. цена', desc: 'Стоимость фиксируется заранее, без скрытых доплат' },
              { icon: '🚛', label: 'Доставка', desc: 'Доставим на объект и заберём обратно за 700 ₽' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-[28px] border border-white/20 p-5 shadow-sm text-center">
                <span className="text-xl mb-2 block">{item.icon}</span>
                <p className="text-[13px] font-bold text-zinc-900 mb-1">{item.label}</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Фото hero под нашими работами */}
        <section className="mb-4">
          {HERO_PHOTOS.map((url, i) => (
            <img key={url} src={url} alt="BroRent" className={`w-full rounded-[20px] object-cover shadow-sm transition-opacity duration-700 ${i === heroIdx ? 'opacity-100' : 'opacity-0'}`} />
          ))}
        </section>

        {/* Моечные пылесосы для химчистки */}
        <section className="mb-8">
          <h3 className="text-[16px] font-bold text-zinc-900 mb-3">🧹 Моющие пылесосы для химчистки</h3>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
            {services.filter(s => s.icon === '🧹' || s.icon === '💨').map((svc) => {
              const inCart = isInCart(svc.name);
              return (
                <div key={svc.name} className="snap-start shrink-0 w-[280px] bg-white rounded-[20px] shadow-sm border border-zinc-100 overflow-hidden flex flex-col">
                  <button type="button" onClick={() => setDetailService(svc)} className="relative h-[160px] bg-zinc-100 overflow-hidden">
                    <img src={svc.image} alt={svc.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute top-2.5 right-2.5 px-2 py-1 rounded-full bg-[#00BCD4] text-[10px] font-bold text-white">{svc.brand}</span>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <p className="text-[15px] font-black text-white leading-tight" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>{svc.name}</p>
                    </div>
                  </button>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <p className="text-[12px] text-zinc-700 leading-snug mb-2 line-clamp-2">{svc.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-black text-zinc-900">{svc.price} ₽<span className="text-[11px] text-zinc-500 font-normal">/день</span></span>
                      <button type="button" onClick={() => addToCart(svc)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${inCart ? 'bg-[#00BCD4] text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}>
                        {inCart ? <><CheckCircle2 size={12} /> В корзине</> : <><Plus size={12} /> В корзину</>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Инструмент для стройки */}
        <section className="mb-8">
          <h3 className="text-[16px] font-bold text-zinc-900 mb-3">🔨 Инструмент для стройки</h3>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
            {services.filter(s => s.icon !== '🧹' && s.icon !== '💨').map((svc) => {
              const inCart = isInCart(svc.name);
              return (
                <div key={svc.name} className="snap-start shrink-0 w-[280px] bg-white rounded-[20px] shadow-sm border border-zinc-100 overflow-hidden flex flex-col">
                  <button type="button" onClick={() => setDetailService(svc)} className="relative h-[160px] bg-zinc-100 overflow-hidden">
                    <img src={svc.image} alt={svc.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute top-2.5 right-2.5 px-2 py-1 rounded-full bg-[#00BCD4] text-[10px] font-bold text-white">{svc.brand}</span>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <p className="text-[15px] font-black text-white leading-tight" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>{svc.name}</p>
                    </div>
                  </button>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <p className="text-[12px] text-zinc-700 leading-snug mb-2 line-clamp-2">{svc.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-black text-zinc-900">{svc.price} ₽<span className="text-[11px] text-zinc-500 font-normal">/день</span></span>
                      <button type="button" onClick={() => addToCart(svc)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${inCart ? 'bg-[#00BCD4] text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}>
                        {inCart ? <><CheckCircle2 size={12} /> В корзине</> : <><Plus size={12} /> В корзину</>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Товары для химчистки */}
        <section className="mb-8">
          <h3 className="text-[16px] font-bold text-zinc-900 mb-3">🧹 Товары для химчистки</h3>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
            {[
              { name: 'Средство GROS', desc: 'Порция для химчистки мебели 100мл', price: '250 ₽', icon: '🧴' },
              { name: 'Кондиционер GROS', desc: 'Для ткани после химчистки 100мл', price: '200 ₽', icon: '🧴' },
              { name: 'Средство Ecolab', desc: 'Professional Carpet 5л', price: '450 ₽', icon: '🧴' },
              { name: 'Средство Kiehl', desc: 'Universal Cleaner 5л', price: '500 ₽', icon: '🧴' },
              { name: 'Кондиционер Host', desc: 'After Shampoo 1л', price: '350 ₽', icon: '🧴' },
              { name: 'Средство Dr. Schutz', desc: 'Polymer Protector 5л', price: '600 ₽', icon: '🧴' },
              { name: 'Средство от пятен', desc: 'Удаление сложных загрязнений', price: '200 ₽', icon: '✨' },
              { name: 'Антисептик', desc: 'Дезинфекция поверхностей 1л', price: '250 ₽', icon: '🛡️' },
              { name: 'Круглая щётка 100мм', desc: 'Для шуруповерта, нейлон', price: '180 ₽', icon: '🧹' },
              { name: 'Насадка-щётка 65мм', desc: 'Для дрели, жёсткая', price: '150 ₽', icon: '🧹' },
            ].map((item) => (
              <div key={item.name} className="snap-start shrink-0 w-[140px] bg-white rounded-2xl p-3 shadow-sm border border-zinc-100 relative">
                <span className="text-2xl block mb-2">{item.icon}</span>
                <p className="text-[12px] font-bold text-zinc-900 mb-0.5 line-clamp-1">{item.name}</p>
                <p className="text-[10px] text-zinc-600 mb-2 line-clamp-2">{item.desc}</p>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold text-[#00BCD4]">{item.price}</p>
                  <button type="button" className="w-7 h-7 rounded-full bg-[#00BCD4] text-white flex items-center justify-center hover:bg-[#0097A7] transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Всё для стройки */}
        <section className="mb-8">
          <h3 className="text-[16px] font-bold text-zinc-900 mb-3">🔨 Всё для стройки</h3>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
            {[
              { name: 'Биты Makita', desc: 'Набор 32 шт. CR-V', price: '250 ₽', icon: '🔩' },
              { name: 'Диски для УШМ', desc: '125мм по металлу 3шт', price: '180 ₽', icon: '⚙️' },
              { name: 'Диски отрезные', desc: 'По камню 125мм 2шт', price: '200 ₽', icon: '⚙️' },
              { name: 'Рулетка 5м', desc: 'Стекловолокно, locked', price: '100 ₽', icon: '📏' },
              { name: 'Кисти для покраски', desc: 'Набор 3 шт. (50/75/100мм)', price: '220 ₽', icon: '🖌️' },
              { name: 'Нож малярный', desc: 'С телескопической ручкой', price: '80 ₽', icon: '🔪' },
              { name: 'Скотч малярный', desc: '36мм × 50м, 2 шт.', price: '150 ₽', icon: '📦' },
              { name: 'Переноска 20м', desc: '3 розетки, IP44', price: '250 ₽', icon: '🔌' },
              { name: 'Прожектор LED', desc: '50Вт, 4000 люмен', price: '350 ₽', icon: '🔦' },
              { name: 'Перчатки х/б', desc: '5 пар, пропитка', price: '90 ₽', icon: '🧤' },
              { name: 'Респираторы', desc: 'FFP2, 5 шт.', price: '120 ₽', icon: '😷' },
              { name: 'Пленка укрывная', desc: '3×4м, 50мкм', price: '150 ₽', icon: '📦' },
            ].map((item) => (
              <div key={item.name} className="snap-start shrink-0 w-[140px] bg-white rounded-2xl p-3 shadow-sm border border-zinc-100 relative">
                <span className="text-2xl block mb-2">{item.icon}</span>
                <p className="text-[12px] font-bold text-zinc-900 mb-0.5 line-clamp-1">{item.name}</p>
                <p className="text-[10px] text-zinc-600 mb-2 line-clamp-2">{item.desc}</p>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold text-[#00BCD4]">{item.price}</p>
                  <button type="button" className="w-7 h-7 rounded-full bg-[#00BCD4] text-white flex items-center justify-center hover:bg-[#0097A7] transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Как это работает */}
        <section className="mb-8">
          <div className="bg-white rounded-[28px] p-6 shadow-sm">
            <h3 className="text-[16px] font-bold text-zinc-900 mb-4">Как это работает</h3>
            <div className="space-y-3">
              {[
                { step: '01', title: 'Выберите инструмент', desc: 'Из каталога или по телефону' },
                { step: '02', title: 'Укажите дату и срок', desc: 'Когда нужен и на сколько суток' },
                { step: '03', title: 'Получите', desc: 'Доставим курьером или заберёте сами' },
                { step: '04', title: 'Верните', desc: 'В согласованное время' },
              ].map(item => (
                <div key={item.step} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00BCD4]/10 flex items-center justify-center shrink-0">
                    <span className="text-[12px] font-bold text-[#00BCD4]">{item.step}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-zinc-900">{item.title}</p>
                    <p className="text-[11px] text-zinc-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Фотогалерея */}
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3 px-1">Наше оборудование</p>
          <div className="relative rounded-[24px] overflow-hidden bg-zinc-100" style={{ aspectRatio: `${SLIDER_RATIO}` }}>
            {GALLERY_IMAGES.map((url, i) => (
              <img key={url} src={url} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === galleryIdx ? 'opacity-100' : 'opacity-0'}`} />
            ))}
            {GALLERY_IMAGES.length > 1 && (
              <>
                <button type="button" onClick={() => setGalleryIdx(c => c === 0 ? GALLERY_IMAGES.length - 1 : c - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-zinc-500 hover:text-zinc-900 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={() => setGalleryIdx(c => c === GALLERY_IMAGES.length - 1 ? 0 : c + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-zinc-500 hover:text-zinc-900 transition-colors">
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {GALLERY_IMAGES.map((_, i) => (
                    <button key={i} type="button" onClick={() => setGalleryIdx(i)} className={`h-1.5 rounded-full transition-all ${i === galleryIdx ? 'w-5' : 'w-1.5'} bg-white/80`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* За счёт чего результат */}
        <section className="mb-8">
          <div className="bg-white rounded-[28px] p-6 shadow-sm">
            <h3 className="text-[16px] font-bold text-zinc-900 mb-4">Почему выбирают нас</h3>
            <div className="space-y-3">
              {[
                { title: 'Диагностика перед выдачей', desc: 'Каждый инструмент проверяется перед тем, как попадёт к вам' },
                { title: 'Замена за 1 час', desc: 'При поломке быстро заменим инструмент' },
                { title: 'Чистые инструменты', desc: 'Всё чистое и готово к работе' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-yellow-500 text-sm mt-0.5">⭐</span>
                  <div>
                    <p className="text-[13px] font-bold text-zinc-900">{item.title}</p>
                    <p className="text-[12px] text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-[13px] font-bold text-zinc-400 mt-4">Этого не делают 9 из 10 компаний</p>
          </div>
        </section>

        {/* Фото из админки внизу */}
        <section className="mb-4">
          <img src="https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784901101384-0.jpg" alt="BroRent" className="w-full rounded-[20px] object-cover shadow-sm" />
        </section>

      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-t border-white/20 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto max-w-lg flex gap-3">
          <a href="tel:+79001234567" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[20px] bg-zinc-900 text-white text-[13px] font-bold hover:bg-zinc-800 transition-colors">
            <Phone size={16} /> Позвонить
          </a>
          <button type="button" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[20px] bg-[#00BCD4] text-white text-[13px] font-bold hover:bg-[#0097A7] transition-colors">
            <MessageCircle size={16} /> Забронировать инструмент
          </button>
        </div>
      </div>

      {/* Floating cart button */}
      {cart.length > 0 && (
        <button type="button" onClick={() => setShowCart(true)}
          className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-5 py-3.5 rounded-full bg-[#00BCD4] text-white shadow-xl shadow-[#00BCD4]/30 hover:bg-[#0097A7] transition-all active:scale-95">
          <div className="relative">
            <ShoppingCart size={20} />
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-[#00BCD4] text-[10px] font-bold flex items-center justify-center">{cart.length}</span>
          </div>
          <span className="text-[13px] font-bold">{cartTotal.toLocaleString('ru')} ₽</span>
        </button>
      )}

      {/* Cart modal */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full sm:max-w-[420px] mx-4 bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-zinc-900">Корзина ({cart.length})</h3>
              <button type="button" onClick={() => setShowCart(false)} className="p-1.5 rounded-full hover:bg-zinc-100"><X size={18} className="text-zinc-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.name} className="flex items-center gap-3 bg-zinc-50 rounded-xl p-3">
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 shrink-0 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-zinc-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-zinc-400">{item.brand}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-bold text-zinc-900">{item.price} ₽</p>
                    <p className="text-[10px] text-zinc-400">/день</p>
                  </div>
                  <button type="button" onClick={() => addToCart(item)} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors shrink-0">
                    <Minus size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-zinc-100 bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-bold text-zinc-500">Итого:</span>
                <span className="text-xl font-black text-[#00BCD4]">{cartTotal.toLocaleString('ru')} ₽/день</span>
              </div>
              <button type="button" onClick={() => { setSelectedService(cart[0]); setShowCart(false); }}
                className="w-full py-3.5 rounded-2xl bg-[#00BCD4] text-white text-sm font-bold hover:bg-[#0097A7] transition-all active:scale-[0.98]">
                Забронировать ({cart.length} шт.)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service detail modal */}
      {detailService && (
        <ServiceDetailModal service={detailService} onOrder={() => setSelectedService(detailService)} onClose={() => setDetailService(null)} />
      )}

      {/* Order modal */}
      {selectedService && (
        <OrderModal service={selectedService} cartItems={cart} onClose={() => { setSelectedService(null); setCart([]); }} />
      )}

    </div>
  );
}
