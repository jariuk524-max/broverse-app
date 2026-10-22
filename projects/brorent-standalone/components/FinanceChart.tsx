'use client';

import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

export type DailyPoint = { ts: number; value: number };

const H = 176;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

const fmt = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₽`;

/** Дневная выручка в виде биржевой кривой: период, дельта, ховер-тултип */
export default function FinanceChart({ daily }: { daily: DailyPoint[] }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [period, setPeriod] = useState<7 | 30 | 0>(30);
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const set = () => setWidth(el.clientWidth);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    if (!period) return daily;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (period - 1));
    return daily.filter((p) => p.ts >= cutoff.getTime());
  }, [daily, period]);

  const n = data.length;
  if (n === 0) return null;

  const total = data.reduce((s, p) => s + p.value, 0);
  const last = data[n - 1].value;
  const delta = n > 1 ? last - data[n - 2].value : 0;
  const max = Math.max(...data.map((p) => p.value), 1);

  const x = (i: number) => (n <= 1 ? width / 2 : (i / (n - 1)) * (width - 12) + 6);
  const y = (v: number) => PAD_TOP + (1 - v / max) * (H - PAD_TOP - PAD_BOTTOM);

  const line = data.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = n > 1 ? `${line} L${x(n - 1).toFixed(1)},${H - PAD_BOTTOM} L${x(0).toFixed(1)},${H - PAD_BOTTOM} Z` : '';

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (n < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left - 6) / Math.max(rect.width - 12, 1)) * (n - 1));
    setHover(Math.min(Math.max(i, 0), n - 1));
  };

  const dateLabel = (ts: number) => new Date(ts).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  const ticks = [...new Set([0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1])];

  return (
    <div className="bg-zinc-950 rounded-[24px] p-4 border border-zinc-900">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Дневная выручка</p>
        <div className="flex gap-1">
          {([7, 30, 0] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setPeriod(p); setHover(null); }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold active:scale-95 transition-transform ${
                period === p ? 'bg-white text-zinc-900' : 'bg-white/10 text-zinc-400'
              }`}
            >
              {p === 0 ? 'Всё' : `${p} дн.`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 mt-2">
        <div>
          <p className="text-[24px] font-black text-white leading-none">{fmt(total)}</p>
          <p className="text-[10px] text-zinc-500 mt-1">за {period === 0 ? 'всё время' : `${period} дней`}</p>
        </div>
        {n > 1 && (
          <p className={`text-[12px] font-bold ${delta > 0 ? 'text-[#34A853]' : delta < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
            {delta > 0 ? '▲' : delta < 0 ? '▼' : '='} {fmt(Math.abs(delta))} сегодня
          </p>
        )}
      </div>

      <div ref={wrapRef} className="relative mt-2" style={{ height: H }}>
        {width > 0 && (
          <svg width={width} height={H} onMouseMove={onMove} onMouseLeave={() => setHover(null)} className="block">
            <defs>
              <linearGradient id={`fcg${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34A853" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#34A853" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => {
              const yy = PAD_TOP + f * (H - PAD_TOP - PAD_BOTTOM);
              return <line key={f} x1={0} x2={width} y1={yy} y2={yy} stroke="#27272A" strokeWidth={1} />;
            })}
            {n > 1 && <path d={area} fill={`url(#fcg${uid})`} />}
            {n > 1 && <path d={line} fill="none" stroke="#34A853" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
            <circle cx={x(n - 1)} cy={y(last)} r={7} fill="#34A853" opacity={0.25} className="animate-pulse" />
            <circle cx={x(n - 1)} cy={y(last)} r={3.5} fill="#34A853" stroke="#09090B" strokeWidth={1.5} />
            {hover !== null && n > 1 && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={PAD_TOP} y2={H - PAD_BOTTOM} stroke="#52525B" strokeDasharray="3 3" />
                <circle cx={x(hover)} cy={y(data[hover].value)} r={4} fill="#fff" />
              </g>
            )}
            {ticks.map((i) => (
              <text
                key={i}
                x={Math.min(Math.max(x(i), 0), Math.max(width - 1, 0))}
                y={H - 6}
                fontSize={9}
                fill="#71717A"
                textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              >
                {dateLabel(data[i].ts)}
              </text>
            ))}
          </svg>
        )}
        {hover !== null && n > 1 && (
          <div
            className="absolute top-0 px-2 py-1 rounded-lg bg-white text-zinc-900 text-[10px] font-bold shadow-lg pointer-events-none whitespace-nowrap"
            style={{ left: Math.min(Math.max(x(hover) - 55, 0), Math.max(width - 130, 0)) }}
          >
            {dateLabel(data[hover].ts)} · {fmt(data[hover].value)}
          </div>
        )}
      </div>
    </div>
  );
}
