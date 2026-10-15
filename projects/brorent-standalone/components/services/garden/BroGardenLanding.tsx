'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Phone, MessageCircle } from 'lucide-react';
import RequestModal from '@/components/RequestModal';
import ServiceDetailModal from '@/components/ServiceDetailModal';
import SmartPhoto from '@/components/SmartPhoto';
import {
  GARDEN_CATEGORIES,
  GARDEN_HERO,
  GARDEN_GALLERY,
  GARDEN_BANNERS,
  type GardenService,
  type GardenCategory,
} from '@/data/garden-services';

const BRAND = '#16A34A';

const ADVANTAGES = [
  { emoji: '🌱', title: 'Под ключ', desc: 'От подготовки участка до полива — всё делает одна бригада' },
  { emoji: '⚡', title: 'Выезд за 1 день', desc: 'Приезжаем в день обращения, работаем в сезон без выходных' },
  { emoji: '🧹', title: 'Убираем за собой', desc: 'Траву, обрезки и снег вывозим — участок чистый после работ' },
  { emoji: '📅', title: 'Сезонный уход', desc: 'Стрижка, подкормка и снег по расписанию — не надо напоминать' },
];

const STEPS = [
  { num: '01', title: 'Опишите участок', desc: 'Что делаем: газон, стрижка, снег' },
  { num: '02', title: 'Смета и дата', desc: 'Называем точную цену и приезжаем в удобный день' },
  { num: '03', title: 'Выполняем работы', desc: 'Бригада приезжает с инструментом и материалами' },
  { num: '04', title: 'Приёмка', desc: 'Осматриваете результат — оплата после приёмки' },
];

const Photo = SmartPhoto;

function Carousel({ photos, intervalMs, rounded, aspect }: {
  photos: { image: string; fallback: string }[];
  intervalMs: number;
  rounded: string;
  aspect: string;
}) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % photos.length), intervalMs);
    return () => clearInterval(t);
  }, [photos.length, intervalMs]);
  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);
  return (
    <div className={`relative overflow-hidden bg-zinc-100 ${rounded}`} style={{ aspectRatio: aspect }}>
      {photos.map((p, i) => (
        <Photo
          key={p.image}
          src={p.image}
          fallback={p.fallback}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <button type="button" onClick={prev} aria-label="Назад" className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-zinc-500 hover:text-zinc-900 transition-colors">
        <ChevronLeft size={16} />
      </button>
      <button type="button" onClick={next} aria-label="Вперёд" className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-zinc-500 hover:text-zinc-900 transition-colors">
        <ChevronRight size={16} />
      </button>
      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
        {photos.map((p, i) => (
          <button
            key={p.image}
            type="button"
            aria-label={`Фото ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-white/80' : 'w-1.5 bg-white/80'}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function BroGardenLanding() {
  const [requestService, setRequestService] = useState<string | null>(null);
  const [showRequest, setShowRequest] = useState(false);
  const [detail, setDetail] = useState<{ s: GardenService; cat: GardenCategory } | null>(null);
  const [liveEdits, setLiveEdits] = useState<Record<string, Partial<GardenService>>>({});

  useEffect(() => {
    fetch('/api/catalog/garden')
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, Partial<GardenService>> = {};
        (d.services || []).forEach((s: GardenService) => { map[s.name] = s; });
        setLiveEdits(map);
      })
      .catch(() => {});
  }, []);

  const withEdits = (s: GardenService): GardenService => ({ ...s, ...(liveEdits[s.name] || {}) });

  return (
    <div className="min-h-screen" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif', background: '#F2F2F7' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {/* Шапка */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" aria-label="Назад" className="w-10 h-10 rounded-full bg-white/75 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <ArrowLeft size={18} className="text-zinc-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-[28px] font-black" style={{ color: BRAND }}>BroGarden</h1>
            <p className="text-[13px] text-zinc-400">Озеленение, газоны и уборка снега — сезон без забот</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative mt-4 rounded-[40px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)]" style={{ aspectRatio: '3.0388888888888888' }}>
          <Photo src={GARDEN_HERO.image} fallback={GARDEN_HERO.fallback} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>BroGarden</h2>
            <p className="text-[12px] text-white/80 mt-0.5">Озеленение · Стрижка газонов · Уборка снега</p>
          </div>
        </div>

        {/* Фотогалерея */}
        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3 px-1">Фотогалерея</p>
          <Carousel photos={GARDEN_GALLERY} intervalMs={3500} rounded="rounded-[24px]" aspect="1.501199040767386" />
        </div>

        {/* Преимущества */}
        <section className="mt-8 mb-8">
          <h3 className="text-[16px] font-bold text-zinc-900 mb-4 text-center">Наши преимущества</h3>
          <div className="grid grid-cols-2 gap-3">
            {ADVANTAGES.map((a) => (
              <div key={a.title} className="bg-white rounded-[28px] border border-white/20 p-5 shadow-sm text-center">
                <span className="text-xl mb-2 block">{a.emoji}</span>
                <p className="text-[13px] font-bold text-zinc-900 mb-1">{a.title}</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Баннер 1 */}
        <section className="mb-6">
          <Photo src={GARDEN_BANNERS.first.image} fallback={GARDEN_BANNERS.first.fallback} alt="BroGarden" className="w-full rounded-[20px] object-cover shadow-sm" />
        </section>

        {/* Услуги по направлениям */}
        {GARDEN_CATEGORIES.map((cat) => (
          <section key={cat.name} className="mb-8">
            <h3 className="text-[16px] font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <span>{cat.emoji}</span> {cat.name}
            </h3>
            <p className="text-[11px] text-zinc-400 mb-3 px-0.5">{cat.services.length} услуг · от {cat.services[0]?.price} ₽</p>
            <div className="space-y-3">
              {cat.services.map((raw) => {
                const s = withEdits(raw);
                return (
                <button
                  key={raw.name}
                  type="button"
                  onClick={() => setDetail({ s, cat })}
                  className="w-full bg-white rounded-[20px] shadow-sm overflow-hidden flex text-left active:scale-[0.98] transition-transform"
                >
                  <div className="w-28 h-28 shrink-0 bg-zinc-100">
                    <Photo src={s.image} fallback={raw.image} alt={s.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div>
                      <p className="text-[13px] font-bold text-zinc-900 leading-tight">{s.name}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{s.desc}</p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-zinc-400">{s.time}</span>
                      <span className="text-[13px] font-bold text-zinc-900">{s.price} ₽</span>
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          </section>
        ))}

        {/* Баннер 2 */}
        <section className="mb-6">
          <Photo src={GARDEN_BANNERS.second.image} fallback={GARDEN_BANNERS.second.fallback} alt="BroGarden" className="w-full rounded-[20px] object-cover shadow-sm" />
        </section>

        {/* Как это работает */}
        <section className="mb-8">
          <div className="bg-white rounded-[28px] p-6 shadow-sm">
            <h3 className="text-[16px] font-bold text-zinc-900 mb-4">Как это работает</h3>
            <div className="space-y-3">
              {STEPS.map((st) => (
                <div key={st.num} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${BRAND}1A` }}>
                    <span className="text-[12px] font-bold" style={{ color: BRAND }}>{st.num}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-zinc-900">{st.title}</p>
                    <p className="text-[11px] text-zinc-400">{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Финальный баннер */}
        <section className="mb-8">
          <Photo src={GARDEN_BANNERS.final.image} fallback={GARDEN_BANNERS.final.fallback} alt="BroGarden" className="w-full rounded-[20px] object-cover" />
        </section>
      </div>

      {/* Нижняя панель */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-t border-white/20 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] p-4 z-50" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto max-w-lg flex gap-3">
          <a href="tel:+79001234567" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[20px] bg-zinc-900 text-white text-[13px] font-bold hover:bg-zinc-800 transition-colors">
            <Phone size={16} /> Позвонить
          </a>
          <button
            type="button"
            onClick={() => setShowRequest(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[20px] text-white text-[13px] font-bold transition-colors hover:opacity-90"
            style={{ background: BRAND }}
          >
            <MessageCircle size={16} /> Оставить заявку
          </button>
        </div>
      </div>

      {detail && (
        <ServiceDetailModal
          service={detail.s}
          category={{ name: detail.cat.name, emoji: detail.cat.emoji }}
          brand={BRAND}
          brandName="BroGarden"
          ctaLabel="Оставить заявку"
          onCta={() => { setRequestService(detail.s.name); setDetail(null); }}
          onClose={() => setDetail(null)}
        />
      )}

      {(showRequest || requestService) && (
        <RequestModal
          brand="BroGarden"
          color={BRAND}
          domain="garden"
          serviceName={requestService || 'Озеленение и уход'}
          onClose={() => { setShowRequest(false); setRequestService(null); }}
        />
      )}
    </div>
  );
}
