'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, ChevronDown, ChevronUp, Phone } from 'lucide-react';
import type { BroDomain } from '@/lib/domains';

const MONOLITH_ROUTES: Record<string, string> = {
  wash: 'http://localhost:3000/wash',
  move: 'http://localhost:3000/move',
  frame: 'http://localhost:3000/frame',
  build: 'http://localhost:3000/build',
  rent: 'http://localhost:3000/rent',
};

interface DomainCardProps {
  domain: BroDomain;
  sent: boolean;
  onActivate: (domain: BroDomain) => void;
  href?: string;
}

export default function DomainCard({ domain, sent, onActivate, href }: DomainCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = domain.icon;

  const classes = `group relative flex w-full flex-col overflow-hidden rounded-[40px] p-5 sm:p-6 text-left shadow-[0_15px_40px_-10px_rgba(0,0,0,0.2)] sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] sm:hover:shadow-[0_28px_70px_-12px_rgba(0,0,0,0.35)] active:scale-[0.98] sm:p-8 ${domain.bgClass} ${domain.textClass}`;

  const totalServices = domain.categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const monolithUrl = MONOLITH_ROUTES[domain.id];

  const content = (
    <>
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 sm:-right-8 sm:-top-8 sm:h-32 sm:w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-4 h-20 w-20 sm:-bottom-10 sm:-left-6 sm:h-28 sm:w-28 rounded-full bg-black/5 blur-xl" />

      <div className="relative flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md">
          <Icon size={22} className="sm:w-7 sm:h-7" strokeWidth={2.25} />
        </div>
        {domain.isHub ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
            Хаб
          </span>
        ) : sent ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
            <CheckCircle2 size={10} className="sm:w-3 sm:h-3" />
            В Монолите
          </span>
        ) : (
          <span className="rounded-full bg-white/15 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest backdrop-blur-sm opacity-80">
            {monolithUrl ? 'Монолит' : 'Live'}
          </span>
        )}
      </div>

      <div className="relative mt-5 sm:mt-8 flex-1">
        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] opacity-80">
          {domain.domain}
        </p>
        <h2 className="mt-1 text-xl sm:text-2xl font-black tracking-tight sm:text-3xl">{domain.brand}</h2>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-semibold leading-relaxed opacity-90">
          {domain.tagline}
        </p>
      </div>

      {!domain.isHub && domain.categories.length > 0 && (
        <div className="relative mt-4 sm:mt-6">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold opacity-70 hover:opacity-100 transition-opacity"
          >
            {expanded ? 'Скрыть' : `Все услуги (${totalServices})`}
            {expanded ? <ChevronUp size={12} className="sm:w-3.5 sm:h-3.5" /> : <ChevronDown size={12} className="sm:w-3.5 sm:h-3.5" />}
          </button>

          {expanded && (
            <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
              {domain.categories.map((category) => (
                <div key={category.name}>
                  <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60 mb-1.5 sm:mb-2">
                    {category.name}
                  </h4>
                  <div className="space-y-1 sm:space-y-1.5">
                    {category.items.map((item) => (
                      <div key={item.name} className="flex items-start gap-1.5 sm:gap-2">
                        <span className="mt-1 h-0.5 sm:h-1 w-0.5 sm:w-1 rounded-full bg-current opacity-40 shrink-0" />
                        <div>
                          <span className="text-[10px] sm:text-xs font-bold">{item.name}</span>
                          <span className="text-[9px] sm:text-[10px] opacity-60 ml-1">{item.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {domain.isHub && (
        <div className="relative mt-4 sm:mt-6">
          {domain.categories.map((category) => (
            <div key={category.name} className="mb-3 sm:mb-4">
              <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60 mb-1.5 sm:mb-2">
                {category.name}
              </h4>
              <div className="space-y-1 sm:space-y-1.5">
                {category.items.map((item) => (
                  <div key={item.name} className="flex items-start gap-1.5 sm:gap-2">
                    <span className="mt-1 h-0.5 sm:h-1 w-0.5 sm:w-1 rounded-full bg-current opacity-40 shrink-0" />
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold">{item.name}</span>
                      <span className="text-[9px] sm:text-[10px] opacity-60 ml-1">{item.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="relative mt-4 sm:mt-6 flex items-center gap-2">
        <div
          className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm font-black transition-colors ${domain.actionClass}`}
        >
          {domain.actionLabel}
          <ArrowUpRight
            size={14}
            className="sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>
        {monolithUrl && (
          <div className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold opacity-60">
            <Phone size={8} />
            Монолит
          </div>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <Link href={`/services/${domain.id}`} className={classes}>
      {content}
    </Link>
  );
}
