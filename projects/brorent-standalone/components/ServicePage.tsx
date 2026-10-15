'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Phone, MessageCircle, CheckCircle2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { BRO_DOMAINS, BroVerseConfig } from '@/lib/domains';
import RequestModal from '@/components/RequestModal';

interface ServicePageProps {
  domainId: string;
}

const HERO_RATIO = 1094 / 360;
const SLIDER_RATIO = 626 / 417;

function HeroDisplay({ brand, domainId }: { brand: string; domainId: string }) {
  const [hero, setHero] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/images?domainId=${domainId}`)
      .then((r) => r.json())
      .then((d) => { if (d.hero) setHero(d.hero); })
      .catch(() => {});
  }, [domainId]);

  if (!hero) return null;

  return (
    <div className="relative mt-4 rounded-[40px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)]" style={{ aspectRatio: `${HERO_RATIO}` }}>
      <img src={hero} alt={brand} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>{brand}</h1>
      </div>
    </div>
  );
}

function SliderDisplay({ brand, domainId }: { brand: string; domainId: string }) {
  const [slides, setSlides] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch(`/api/images?domainId=${domainId}`)
      .then((r) => r.json())
      .then((d) => { if (d.slider?.length) setSlides(d.slider); })
      .catch(() => {});
  }, [domainId]);

  if (slides.length === 0) return null;

  return (
    <div className="mt-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3 px-1">Фотогалерея</p>
      <div className="relative rounded-[24px] overflow-hidden bg-zinc-100" style={{ aspectRatio: `${SLIDER_RATIO}` }}>
        <img src={slides[current]} alt={`${brand} ${current + 1}`} className="w-full h-full object-cover" />
        {slides.length > 1 && (
          <>
            <button type="button" onClick={() => setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-zinc-500 hover:text-zinc-900 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={() => setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-zinc-500 hover:text-zinc-900 transition-colors">
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {slides.map((_: string, i: number) => (
                <button key={i} type="button" onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${current === i ? 'w-5' : 'w-1.5'} bg-white/80`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ServicePage({ domainId }: ServicePageProps) {
  const domain = BRO_DOMAINS.find((d) => d.id === domainId)!;
  const config = BroVerseConfig[domainId];
  const Icon = domain.icon;

  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    domain.categories[0]?.name || null
  );
  const [requestService, setRequestService] = useState<string | null>(null);
  const [showRequest, setShowRequest] = useState(false);
  const [liveEdits, setLiveEdits] = useState<Record<string, { desc?: string; price?: string; time?: string; image?: string }>>({});

  useEffect(() => {
    fetch(`/api/catalog/${domainId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.services) return;
        const map: Record<string, { desc?: string; price?: string; time?: string; image?: string }> = {};
        (d.services || []).forEach((s: { name: string; desc?: string; price?: string; time?: string; image?: string }) => { map[s.name] = s; });
        setLiveEdits(map);
      })
      .catch(() => {});
  }, [domainId]);

  const bgColor = domain.bgClass.includes('#')
    ? domain.bgClass.replace('bg-[', '').replace(']', '')
    : domain.bgClass.includes('gradient')
    ? '#1a1a2e'
    : '#666';

  const toggleCategory = (name: string) => {
    setExpandedCategory(expandedCategory === name ? null : name);
  };

  return (
    <div className="min-h-[100dvh] bg-[#FFFFFF]">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex h-14 sm:h-16 max-w-lg items-center justify-between px-4 sm:px-5">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-zinc-900 hover:text-zinc-600 transition-colors">
            <ArrowLeft size={16} />
            Назад
          </Link>
          <span className="text-[10px] sm:text-xs font-bold text-zinc-500">{domain.domain}</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 sm:px-5 pb-24">
        <HeroDisplay brand={domain.brand} domainId={domainId} />
        <SliderDisplay brand={domain.brand} domainId={domainId} />

        <div className="flex items-center gap-4 pt-6 sm:pt-8 pb-6">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-[24px] shadow-xl text-white" style={{ backgroundColor: bgColor }}>
            <Icon size={32} className="sm:w-10 sm:h-10" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">{domain.brand}</h1>
            <p className="text-xs sm:text-sm font-semibold text-zinc-500 mt-0.5">{domain.tagline}</p>
          </div>
        </div>

        {config && config.priceBase > 0 && (
          <div className="mb-6 p-4 rounded-[24px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-zinc-500">Стоимость от</span>
              <span className="text-xl sm:text-2xl font-black text-zinc-900">{config.priceBase} ₽</span>
            </div>
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {domain.categories.map((category) => (
            <div key={category.name} className="rounded-[24px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
              <button type="button" onClick={() => toggleCategory(category.name)} className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: bgColor }} />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-900">{category.name}</h3>
                    <p className="text-[10px] sm:text-xs text-zinc-400">{category.items.length} услуг</p>
                  </div>
                </div>
                <ArrowRight size={16} className={`text-zinc-400 transition-transform ${expandedCategory === category.name ? 'rotate-90' : ''}`} />
              </button>

              {expandedCategory === category.name && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2.5 sm:space-y-3">
                  {category.items.map((item) => {
                    const live = liveEdits[item.name];
                    return (
                    <button key={item.name} type="button" onClick={() => setRequestService(item.name)}
                      className="w-full flex items-start gap-3 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors text-left group">
                      <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-zinc-900">{item.name}</p>
                        <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5">{live?.desc || item.description}</p>
                        {live?.price && (
                          <p className="text-[10px] sm:text-xs font-bold text-zinc-700 mt-0.5">{live.price} ₽{live.time ? ` · ${live.time}` : ''}</p>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0 mt-0.5">
                        Заказать →
                      </span>
                    </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 sm:mt-8 p-4 sm:p-5 rounded-[24px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <h3 className="text-xs sm:text-sm font-bold text-zinc-900 mb-3">Почему выбирают нас</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5"><Star size={14} className="text-yellow-500 fill-yellow-500" /><span className="text-[10px] sm:text-xs text-zinc-600">Проверенные мастера с Trust Level</span></div>
            <div className="flex items-center gap-2.5"><Star size={14} className="text-yellow-500 fill-yellow-500" /><span className="text-[10px] sm:text-xs text-zinc-600">Гарантия на все виды работ</span></div>
            <div className="flex items-center gap-2.5"><Star size={14} className="text-yellow-500 fill-yellow-500" /><span className="text-[10px] sm:text-xs text-zinc-600">Прозрачные цены без скрытых доплат</span></div>
            <div className="flex items-center gap-2.5"><Star size={14} className="text-yellow-500 fill-yellow-500" /><span className="text-[10px] sm:text-xs text-zinc-600">Выезд в день обращения</span></div>
          </div>
        </div>

        {domainId === 'wash' && (
          <div className="mt-4">
            <img src="https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784801082121-0.jpg" alt="BroWash" className="w-full rounded-[20px] object-cover" />
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-t border-white/20 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto max-w-lg flex gap-3">
          <a href="tel:+79001234567" className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-[20px] bg-zinc-900 text-white text-xs sm:text-sm font-bold hover:bg-zinc-800 transition-colors">
            <Phone size={16} />
            Позвонить
          </a>
          <button
            type="button"
            onClick={() => setShowRequest(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-[20px] text-white text-xs sm:text-sm font-bold transition-colors hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: bgColor }}
          >
            <MessageCircle size={16} />
            Оставить заявку
          </button>
        </div>
      </div>

      {(showRequest || requestService) && (
        <RequestModal
          brand={domain.brand}
          color={bgColor}
          domain={domainId}
          serviceName={requestService || domain.tagline}
          onClose={() => { setShowRequest(false); setRequestService(null); }}
        />
      )}
    </div>
  );
}
