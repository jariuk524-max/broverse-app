'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Phone, MessageCircle, CheckCircle2, Clock } from 'lucide-react';
import OrderModal, { type OrderServiceItem } from '@/components/OrderModal';
import SmartSearch from '@/components/SmartSearch';

const FALLBACK_SERVICES: OrderServiceItem[] = [
  { name: 'Пылесос Karcher Puzzi 8/1', desc: 'Сдам в аренду моющий пылесос Karcher Puzzi 8/1. В комплекте порция моющего средства в подарок (которого хватит почистить кухонный уголок). Дополнительные средства есть в наличии. Будем с вами на связи на протяжении всего срока аренды.', price: '1000', domain: 'rent', brand: 'BroRent', color: '#00BCD4', icon: '🧹', time: 'От 1 дня', image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784878029979-0.jpg' },
  { name: 'Перфоратор Bosch', desc: 'Мощный перфоратор для демонтажа и сверления бетона', price: '500', domain: 'rent', brand: 'BroRent', color: '#00BCD4', icon: '🔨', time: 'От 1 дня', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400' },
  { name: 'Парогенератор', desc: 'Для детейлинга мебели и текстиля', price: '600', domain: 'rent', brand: 'BroRent', color: '#00BCD4', icon: '♨️', time: 'От 1 дня', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400' },
  { name: 'Мойка высокого давления', desc: 'Karcher для фасадов, заборов, площадок', price: '700', domain: 'rent', brand: 'BroRent', color: '#00BCD4', icon: '💦', time: 'От 1 дня', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400' },
  { name: 'Шуруповерт аккумуляторный', desc: 'Для сборки мебели и ремонтных работ', price: '400', domain: 'rent', brand: 'BroRent', color: '#00BCD4', icon: '🔩', time: 'От 1 дня', image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400' },
  { name: 'Болгарка Makita', desc: 'УШМ 125мм для резки металла и камня', price: '450', domain: 'rent', brand: 'BroRent', color: '#00BCD4', icon: '⚙️', time: 'От 1 дня', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400' },
  { name: 'Лазерный уровень', desc: 'Для точной разметки при ремонте', price: '350', domain: 'rent', brand: 'BroRent', color: '#00BCD4', icon: '📐', time: 'От 1 дня', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400' },
  { name: 'Компрессор', desc: 'Для покраски и пневмоинструмента', price: '550', domain: 'rent', brand: 'BroRent', color: '#00BCD4', icon: '💨', time: 'От 1 дня', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400' },
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
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />
      <div className={`relative w-full sm:max-w-[420px] mx-4 bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden transition-all duration-300 ease-out max-h-[90vh] overflow-y-auto ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full sm:translate-y-8 opacity-0 scale-95'}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
          <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <button type="button" onClick={handleClose} className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"><span className="text-sm">✕</span></button>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-[#00BCD4] text-[10px] font-bold text-white">{service.brand}</span>
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white">{service.time}</span>
            </div>
            <h2 className="text-xl font-black text-white leading-tight mb-3" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{service.name}</h2>
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-xl px-3 py-1.5">
                <span className="text-[11px] text-zinc-400 block leading-none">Цена</span>
                <span className="text-lg font-black text-zinc-900">{service.price} ₽</span>
              </div>
              <div className="flex-1 text-right">
                <p className="text-[11px] text-white/70">в день аренды</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm text-zinc-600 leading-relaxed mb-4">{service.desc}</p>
          <div className="bg-[#E0F7FA] rounded-2xl p-4 mb-4">
            <h4 className="text-[13px] font-bold text-[#00BCD4] mb-2">Условия аренды</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-[#00BCD4] shrink-0" /><span className="text-[13px] text-zinc-700">Доставка и возврат в удобное время</span></div>
              <div className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-[#00BCD4] shrink-0" /><span className="text-[13px] text-zinc-700">Залог не требуется</span></div>
              <div className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-[#00BCD4] shrink-0" /><span className="text-[13px] text-zinc-700">Инструмент проверен и готов к работе</span></div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl">
            <span className="text-xl">📞</span>
            <div>
              <p className="text-[12px] font-bold text-zinc-900">Нужна консультация?</p>
              <p className="text-[11px] text-zinc-400">Поможем подобрать инструмент</p>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-zinc-100 p-4">
          <button type="button" onClick={() => { handleClose(); setTimeout(onOrder, 300); }} className="w-full py-3.5 rounded-2xl bg-[#00BCD4] text-white text-sm font-bold hover:bg-[#0097A7] transition-all duration-200 active:scale-[0.98]">Забронировать от {service.price} ₽/день</button>
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

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="w-10 h-10 rounded-full bg-white/75 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <ArrowLeft size={18} className="text-zinc-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-[28px] font-black text-[#00BCD4]">BroRent</h1>
            <p className="text-[13px] text-zinc-400">Аренда профессионального инструмента</p>
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
            <h3 className="text-[16px] font-bold text-zinc-900 mb-3 px-2">Наши работы</h3>
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
              { icon: '⚡', label: 'Быстрая выдача', desc: 'Инструмент готов к выдаче в течение 1 часа после заказа' },
              { icon: '🛡️', label: 'Гарантия', desc: 'Все инструменты проходят проверку перед выдачей' },
              { icon: '💰', label: 'Фикс. цена', desc: 'Стоимость фиксируется заранее, без скрытых доплат' },
              { icon: '📸', label: 'Доставка', desc: 'Доставим инструмент на объект и заберём обратно' },
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

        {/* Услуги */}
        <section className="mb-8">
          <h3 className="text-[16px] font-bold text-zinc-900 mb-4">Инструменты</h3>
          <div className="space-y-3">
            {services.map((svc) => (
              <button key={svc.name} type="button" onClick={() => setDetailService(svc)}
                className="w-full bg-white rounded-[20px] shadow-sm overflow-hidden flex text-left active:scale-[0.98] transition-transform">
                <div className="w-28 h-28 shrink-0 bg-zinc-100">
                  <img src={svc.image} alt={svc.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                  <div>
                    <p className="text-[13px] font-bold text-zinc-900 leading-tight">{svc.name}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{svc.desc}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-zinc-400">{svc.time}</span>
                    <span className="text-[13px] font-bold text-zinc-900">{svc.price} ₽/день</span>
                  </div>
                </div>
              </button>
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
                { step: '02', title: 'Забронируйте', desc: 'Укажите дату и срок аренды' },
                { step: '03', title: 'Получите', desc: 'Доставим или заберёте сами' },
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
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3 px-1">Фотогалерея</p>
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
            <h3 className="text-[16px] font-bold text-zinc-900 mb-4">За счёт чего мы получаем идеальный результат?</h3>
            <div className="space-y-3">
              {[
                { title: 'Проверка инструмента', desc: 'Каждый инструмент проходит диагностику перед выдачей' },
                { title: 'Оперативная замена', desc: 'При поломке заменим инструмент в течение часа' },
                { title: 'Чистые инструменты', desc: 'Все инструменты чистые и готовы к работе' },
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
            <MessageCircle size={16} /> Оставить заявку
          </button>
        </div>
      </div>

      {/* Service detail modal */}
      {detailService && (
        <ServiceDetailModal service={detailService} onOrder={() => setSelectedService(detailService)} onClose={() => setDetailService(null)} />
      )}

      {/* Order modal */}
      {selectedService && (
        <OrderModal service={selectedService} onClose={() => setSelectedService(null)} />
      )}

    </div>
  );
}
