'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Map, X, ArrowUpRight, Star, Phone, Truck, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

const MOSCOW_CENTER: [number, number] = [55.7558, 37.6173];

const PROMO_POPUPS = [
  {
    coords: [55.7644, 37.6057] as [number, number],
    title: 'Химчистка диванов',
    service: 'BroWash',
    color: '#4285F4',
    text: '5 мастеров рядом • от 1 500 ₽',
    badge: '2 мин',
    price: '1 500 ₽',
    masters: 5,
  },
  {
    coords: [55.7494, 37.5356] as [number, number],
    title: 'Переезды по Москве',
    service: 'BroMove',
    color: '#4285F4',
    text: '3 Газели на подходе • от 2 500 ₽',
    badge: '8 мин',
    price: '2 500 ₽',
    masters: 3,
  },
  {
    coords: [55.7539, 37.6208] as [number, number],
    title: 'Ремонт техники',
    service: 'BroFrame',
    color: '#FBBC05',
    text: 'iPhone, MacBook • Гарантия 1 год',
    badge: '15 мин',
    price: '1 000 ₽',
    masters: 2,
  },
  {
    coords: [55.7278, 37.5747] as [number, number],
    title: 'Сантехника и электрика',
    service: 'BroBuild',
    color: '#EA4335',
    text: 'Выезд в день обращения • от 1 200 ₽',
    badge: '10 мин',
    price: '1 200 ₽',
    masters: 4,
  },
  {
    coords: [55.7411, 37.6202] as [number, number],
    title: 'Аренда инструментов',
    service: 'BroRent',
    color: '#34A853',
    text: 'Karcher, Bosch, Makita • Доставка',
    badge: '30 мин',
    price: '800 ₽',
    masters: 1,
  },
  {
    coords: [55.7680, 37.5870] as [number, number],
    title: 'Мойка окон',
    service: 'BroWash',
    color: '#4285F4',
    text: 'Панорамные окна • Химия SafeWay',
    badge: '5 мин',
    price: '2 000 ₽',
    masters: 2,
  },
  {
    coords: [55.7350, 37.5900] as [number, number],
    title: 'Сборка мебели IKEA',
    service: 'BroMove',
    color: '#4285F4',
    text: 'Шкафы, кровати, комоды • от 1 500 ₽',
    badge: '20 мин',
    price: '1 500 ₽',
    masters: 3,
  },
  {
    coords: [55.7570, 37.6350] as [number, number],
    title: 'Ремонт роботов-пылесосов',
    service: 'BroFrame',
    color: '#FBBC05',
    text: 'Xiaomi, Roborock • Восстановление',
    badge: '25 мин',
    price: '3 000 ₽',
    masters: 1,
  },
];

function MapCardInner({ onClose }: { onClose: () => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [activePopup, setActivePopup] = useState(0);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: MOSCOW_CENTER,
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
      }).addTo(map);

      mapInstance.current = map;

      PROMO_POPUPS.forEach((popup, i) => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;" data-index="${i}">
            <div style="padding:6px 12px;border-radius:20px;background:${popup.color};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px ${popup.color}66;border:2px solid white;">
              <span style="font-size:11px;font-weight:800;color:white;white-space:nowrap;">${popup.service}</span>
            </div>
            <div style="width:2px;height:6px;background:${popup.color};opacity:0.5;"></div>
            <div style="width:6px;height:6px;border-radius:50%;background:${popup.color};opacity:0.3;"></div>
          </div>`,
          iconSize: [60, 40],
          iconAnchor: [30, 40],
        });

        const popupHtml = `<div style="font-family:-apple-system,sans-serif;min-width:220px;padding:4px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <div style="width:32px;height:32px;border-radius:10px;background:${popup.color};display:flex;align-items:center;justify-content:center;">
              <span style="font-size:9px;font-weight:800;color:white;">${popup.service.replace('Bro', '')}</span>
            </div>
            <div>
              <div style="font-size:14px;font-weight:700;color:#1C1C1E;">${popup.title}</div>
              <div style="font-size:10px;color:${popup.color};font-weight:600;">${popup.service}</div>
            </div>
          </div>
          <div style="font-size:12px;color:#8E8E93;margin-bottom:10px;">${popup.text}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid #E5E5EA;">
            <div style="display:flex;align-items:center;gap:4px;">
              <span style="font-size:10px;color:#34C759;font-weight:700;">● ${popup.masters} мастеров</span>
            </div>
            <div style="font-size:13px;font-weight:800;color:#1C1C1E;">от ${popup.price}</div>
          </div>
          <div style="margin-top:8px;padding:8px;background:#1C1C1E;border-radius:12px;text-align:center;font-size:12px;font-weight:700;color:white;cursor:pointer;">Выбрать услугу</div>
        </div>`;

        const marker = L.marker(popup.coords, { icon })
          .addTo(map)
          .bindPopup(popupHtml, { maxWidth: 280, className: 'promo-popup' });

        marker.on('click', () => {
          setActivePopup(i);
          map.flyTo(popup.coords, 15, { duration: 0.8 });
        });

        markersRef.current.push(marker);
      });

      setTimeout(() => {
        markersRef.current[0]?.openPopup();
      }, 1000);
    });

    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  const flyTo = useCallback((index: number) => {
    const popup = PROMO_POPUPS[index];
    if (!popup || !mapInstance.current) return;
    setActivePopup(index);
    mapInstance.current.flyTo(popup.coords, 15, { duration: 0.8 });
    markersRef.current[index]?.openPopup();
  }, []);

  return (
    <>
      <style>{`
        .promo-popup .leaflet-popup-content-wrapper {
          border-radius: 20px !important;
          padding: 8px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important;
        }
        .promo-popup .leaflet-popup-tip {
          background: white !important;
        }
        .promo-popup .leaflet-popup-close-button {
          display: none !important;
        }
      `}</style>
      <div className="flex h-full flex-col">
        <div ref={mapRef} className="min-h-0 flex-1" />
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 border-t border-zinc-100 bg-white/90 backdrop-blur-xl">
          {PROMO_POPUPS.map((popup, i) => (
            <button
              key={i}
              type="button"
              onClick={() => flyTo(i)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-[11px] font-bold transition-all ${
                activePopup === i
                  ? 'text-white shadow-lg'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
              style={activePopup === i ? { background: popup.color } : {}}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: popup.color }} />
              {popup.service}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default function MapCard() {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => setExpanded((v) => !v), []);

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className="group relative flex w-full flex-col overflow-hidden rounded-[40px] p-6 sm:p-8 text-left shadow-[0_15px_40px_-10px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18)] active:scale-[0.98] bg-[#F2F2F7]/70 backdrop-blur-xl border border-white/60"
      >
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 sm:-right-8 sm:-top-8 sm:h-32 sm:w-32 rounded-full bg-[#4285F4]/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-4 h-20 w-20 sm:-bottom-10 sm:-left-6 sm:h-28 sm:w-28 rounded-full bg-[#34A853]/8 blur-xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#4285F4] to-[#34A853] shadow-lg">
            <Map size={26} className="text-white" strokeWidth={2.25} />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#4285F4]/12 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#4285F4] backdrop-blur-sm">
            Live
          </span>
        </div>

        <div className="relative mt-6 flex-1">
          <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400">
            BroVerse.ru
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">Карта</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-500">
            Мастера, перевозки и сервисы рядом с вами
          </p>
        </div>

        <div className="relative mt-4 flex items-center gap-2">
          {['#4285F4', '#EA4335', '#FBBC05', '#34A853'].map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
          ))}
          <span className="ml-2 text-[11px] font-bold text-zinc-400">8 сервисов на карте</span>
        </div>

        <div className="relative mt-5 flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-[20px] bg-gradient-to-r from-[#4285F4] to-[#34A853] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#4285F4]/20">
            Открыть карту
            <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </button>

      {expanded && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={toggle}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[40px] bg-white shadow-2xl border border-zinc-100"
            style={{ animation: 'scaleIn 0.3s ease-out' }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-white/90 backdrop-blur-xl rounded-t-[40px] z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#4285F4] to-[#34A853]">
                  <Map size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Карта экосистемы</h2>
                  <p className="text-[10px] text-zinc-400">Москва • 8 сервисов рядом</p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggle}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative flex-1 min-h-0">
              <MapCardInner onClose={toggle} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
