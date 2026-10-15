'use client';

import { X, CheckCircle2, Clock, Tag } from 'lucide-react';
import SmartPhoto from '@/components/SmartPhoto';

export interface DetailableService {
  name: string;
  desc: string;
  price: string;
  time: string;
  image: string;
  details?: string;
  includes?: string[];
}

interface ServiceDetailModalProps {
  service: DetailableService;
  category?: { name: string; emoji?: string };
  brand: string;
  brandName: string;
  ctaLabel: string;
  onCta: () => void;
  onClose: () => void;
}

const TAP = 'touch-manipulation select-none';

export default function ServiceDetailModal({
  service,
  category,
  brand,
  brandName,
  ctaLabel,
  onCta,
  onClose,
}: ServiceDetailModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center js-modal">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm anim-fade" onClick={onClose} />
      <div className="relative w-full sm:max-w-[440px] mx-4 bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col anim-sheet">

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Фото + закрыть */}
          <div className="relative">
            <div className="h-44 sm:h-52 bg-zinc-100">
              <SmartPhoto src={service.image} fallback={service.image} alt={service.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25" />
            <button
              type="button"
              onClick={onClose}
              className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors ${TAP}`}
            >
              <X size={16} className="text-zinc-600" />
            </button>
            {category && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-bold text-zinc-700 shadow-sm">
                {category.emoji} {category.name}
              </span>
            )}
          </div>

          {/* Заголовок + чипы */}
          <div className="p-4 sm:p-5 -mt-6 relative">
            <div className="bg-white rounded-[20px] shadow-sm border border-zinc-100 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: brand }}>{brandName}</p>
              <h3 className="text-[18px] font-black text-zinc-900 leading-tight mb-1.5">{service.name}</h3>
              <p className="text-[13px] text-zinc-500 leading-relaxed">{service.desc}</p>

              <div className="flex gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold text-zinc-900 bg-zinc-50 border border-zinc-100">
                  <Tag size={12} style={{ color: brand }} /> от {service.price} ₽
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold text-zinc-900 bg-zinc-50 border border-zinc-100">
                  <Clock size={12} style={{ color: brand }} /> {service.time}
                </span>
              </div>
            </div>

            {/* Подробное описание */}
            {service.details && (
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Подробнее</p>
                <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-line">{service.details}</p>
              </div>
            )}

            {/* Что входит */}
            {service.includes && service.includes.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Что входит</p>
                <ul className="space-y-2">
                  {service.includes.map((i) => (
                    <li key={i} className="flex items-start gap-2.5 bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2.5">
                      <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color: brand }} />
                      <span className="text-[12.5px] text-zinc-700 leading-snug">{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="shrink-0 bg-white border-t border-zinc-100 p-4 sm:p-5" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`w-16 shrink-0 py-3.5 rounded-2xl bg-zinc-50 text-zinc-500 text-sm font-bold border border-zinc-200 active:scale-[0.98] transition-transform ${TAP}`}
            >
              Назад
            </button>
            <button
              type="button"
              onClick={onCta}
              className={`flex-1 py-3.5 rounded-2xl text-white text-sm font-bold active:scale-[0.98] transition-all duration-200 hover:opacity-90 ${TAP}`}
              style={{ background: brand }}
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
