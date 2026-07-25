'use client';

import { useState, useEffect, useRef } from 'react';

type Car = {
  id: number;
  color: string;
  darkColor: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  paused: boolean;
  pauseUntil: number;
  visible: boolean;
  opacity: number;
};

type Pin = {
  id: number;
  color: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
};

const PINS: Pin[] = [
  { id: 1, color: '#4285F4', label: 'Мастер чистит диван', sublabel: 'Химчистка · от 1 500₽', x: 22, y: 28 },
  { id: 2, color: '#EA4335', label: 'Ремонт розетки', sublabel: 'BroBuild · выезд 40 мин', x: 72, y: 22 },
  { id: 3, color: '#FBBC05', label: 'Замена экрана', sublabel: 'iPhone 15 Pro · 4 500₽', x: 48, y: 42 },
  { id: 4, color: '#34A853', label: 'Переезд завершён', sublabel: 'BroMove · готов к новому', x: 25, y: 58 },
  { id: 5, color: '#00BCD4', label: 'Аренда пылесоса', sublabel: 'Karcher · от 800₽/день', x: 68, y: 55 },
];

const ROAD_H = [80, 160, 260, 320];
const ROAD_V = [100, 200, 300, 400, 500, 600];

function getWaypoints(): { x: number; y: number }[][] {
  return [
    [{ x: -5, y: ROAD_H[1] }, { x: 12, y: ROAD_H[1] }, { x: 25, y: ROAD_H[1] }, { x: 25, y: ROAD_V[1] }, { x: 25, y: ROAD_V[2] }, { x: 25, y: ROAD_H[2] }, { x: 40, y: ROAD_H[2] }, { x: 55, y: ROAD_H[2] }, { x: 55, y: ROAD_V[1] }, { x: 55, y: ROAD_H[1] }, { x: 70, y: ROAD_H[1] }, { x: 85, y: ROAD_H[1] }, { x: 105, y: ROAD_H[1] }],
    [{ x: 105, y: ROAD_H[3] }, { x: 85, y: ROAD_H[3] }, { x: 70, y: ROAD_H[3] }, { x: 70, y: ROAD_V[2] }, { x: 70, y: ROAD_V[1] }, { x: 70, y: ROAD_H[1] }, { x: 55, y: ROAD_H[1] }, { x: 40, y: ROAD_H[1] }, { x: 25, y: ROAD_H[1] }, { x: -5, y: ROAD_H[1] }],
    [{ x: ROAD_V[0], y: -5 }, { x: ROAD_V[0], y: 15 }, { x: ROAD_V[0], y: 35 }, { x: ROAD_V[1], y: 35 }, { x: ROAD_V[1], y: 75 }, { x: ROAD_V[1], y: 95 }, { x: ROAD_V[2], y: 95 }, { x: ROAD_V[2], y: 55 }, { x: ROAD_V[3], y: 55 }, { x: ROAD_V[3], y: 75 }, { x: ROAD_V[3], y: 105 }],
  ];
}

function interpolate(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return a + diff * Math.min(1, Math.max(0, t));
}

const HOUR_MS = 3600000;

export default function InteractiveMap() {
  const [cars, setCars] = useState<Car[]>([]);
  const startTimeRef = useRef(Date.now());
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const waypoints = getWaypoints();
    const initialCars: Car[] = [
      { id: 0, color: '#34A853', darkColor: '#2D9249', x: -5, y: ROAD_H[1], angle: 0, speed: 0.0003, paused: false, pauseUntil: 0, visible: true, opacity: 1 },
      { id: 1, color: '#4285F4', darkColor: '#3367D6', x: 105, y: ROAD_H[3], angle: 180, speed: 0.00025, paused: false, pauseUntil: 0, visible: true, opacity: 1 },
      { id: 2, color: '#FBBC05', darkColor: '#E6A800', x: ROAD_V[0], y: -5, angle: 90, speed: 0.00035, paused: false, pauseUntil: 0, visible: true, opacity: 1 },
      { id: 3, color: '#EA4335', darkColor: '#C5221F', x: 40, y: 45, angle: 0, speed: 0, paused: true, pauseUntil: 60000, visible: true, opacity: 1 },
      { id: 4, color: '#00BCD4', darkColor: '#00838F', x: 65, y: 75, angle: 0, speed: 0, paused: true, pauseUntil: 120000, visible: true, opacity: 1 },
    ];
    setCars(initialCars);

    let wpIndex = [0, 0, 0, 0, 0];
    let pauseTimers = [0, 0, 0, 180000, 300000];
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      const time = Date.now() - startTimeRef.current;

      setCars(prev => prev.map((car, i) => {
        const wps = waypoints[i % waypoints.length];
        if (!wps) return car;
        let { x, y, angle, paused, pauseUntil } = car;
        const currentWp = wpIndex[i] || 0;
        const nextWp = currentWp + 1;

        if (nextWp >= wps.length) {
          wpIndex[i] = 0;
          const cycleMs = (600 + i * 180) * 1000;
          pauseTimers[i] = (time + cycleMs) % HOUR_MS;
          return { ...car, x: wps[0].x, y: wps[0].y, paused: true, pauseUntil: pauseTimers[i], visible: true, opacity: 1 };
        }
        if (paused) {
          if (time < pauseUntil) return car;
          wpIndex[i] = currentWp + 1;
          return { ...car, paused: false };
        }
        const target = wps[nextWp];
        const dx = target.x - x;
        const dy = target.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.5) {
          if (nextWp % 5 === 2 || nextWp === wps.length - 2) {
            return { ...car, x: target.x, y: target.y, paused: true, pauseUntil: time + (30 + Math.random() * 60) * 1000 };
          }
          wpIndex[i] = nextWp;
          return { ...car, x: target.x, y: target.y };
        }
        const moveSpeed = car.speed * dt;
        const step = Math.min(moveSpeed, dist);
        const t = step / dist;
        return { ...car, x: interpolate(x, target.x, t), y: interpolate(y, target.y, t), angle: lerpAngle(angle, Math.atan2(dy, dx) * (180 / Math.PI), Math.min(1, t * 3)) };
      }));

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <section className="mb-10">
      <div className="relative rounded-[20px] overflow-hidden h-[320px] sm:h-[380px] shadow-[0_1px_12px_rgba(0,0,0,0.06)] border border-zinc-100">

        {/* Фон — светлая карта */}
        <div className="absolute inset-0 bg-[#E8EDF2]" />

        {/* Парки */}
        <div className="absolute top-[8%] left-[4%] w-[16%] h-[22%] bg-[#C8E6C9]/40 rounded-[16px]" />
        <div className="absolute bottom-[12%] right-[6%] w-[14%] h-[20%] bg-[#C8E6C9]/30 rounded-[14px]" />
        <div className="absolute top-[50%] left-[38%] w-[8%] h-[10%] bg-[#C8E6C9]/20 rounded-full" />

        {/* Водоём */}
        <div className="absolute top-[4%] right-[12%] w-[18%] h-[13%] bg-[#BBDEFB]/35 rounded-[20px]" />

        {/* Дороги */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80 L 800 80" stroke="#F5F5F5" strokeWidth="10" />
          <path d="M0 80 L 800 80" stroke="#FFF" strokeWidth="7" />
          <path d="M0 160 L 800 160" stroke="#F5F5F5" strokeWidth="18" />
          <path d="M0 160 L 800 160" stroke="#FFF" strokeWidth="14" />
          <path d="M0 160 L 800 160" stroke="#E0E0E0" strokeWidth="0.5" strokeDasharray="10 8" />
          <path d="M0 260 L 800 260" stroke="#F5F5F5" strokeWidth="12" />
          <path d="M0 260 L 800 260" stroke="#FFF" strokeWidth="8" />
          <path d="M100 0 L 100 400" stroke="#F0F0F0" strokeWidth="5" />
          <path d="M200 0 L 200 400" stroke="#F5F5F5" strokeWidth="14" />
          <path d="M200 0 L 200 400" stroke="#FFF" strokeWidth="10" />
          <path d="M400 0 L 400 400" stroke="#F5F5F5" strokeWidth="16" />
          <path d="M400 0 L 400 400" stroke="#FFF" strokeWidth="12" />
          <path d="M400 0 L 400 400" stroke="#E0E0E0" strokeWidth="0.5" strokeDasharray="12 8" />
          <path d="M600 0 L 600 400" stroke="#F5F5F5" strokeWidth="12" />
          <path d="M600 0 L 600 400" stroke="#FFF" strokeWidth="8" />
        </svg>

        {/* Деревья — вдоль дорог */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {Array.from({ length: 10 }).map((_, i) => <circle key={`t1-${i}`} cx={30 + i * 78} cy={72} r={5} fill="#A5D6A7" opacity="0.5" />)}
          {Array.from({ length: 10 }).map((_, i) => <circle key={`t1b-${i}`} cx={30 + i * 78} cy={88} r={5} fill="#A5D6A7" opacity="0.5" />)}
          {Array.from({ length: 8 }).map((_, i) => <circle key={`t2-${i}`} cx={20 + i * 100} cy={150} r={6} fill="#81C784" opacity="0.45" />)}
          {Array.from({ length: 8 }).map((_, i) => <circle key={`t2b-${i}`} cx={20 + i * 100} cy={170} r={6} fill="#81C784" opacity="0.45" />)}
          {Array.from({ length: 8 }).map((_, i) => <circle key={`t3-${i}`} cx={15 + i * 100} cy={252} r={4} fill="#A5D6A7" opacity="0.4" />)}
          {Array.from({ length: 8 }).map((_, i) => <circle key={`t3b-${i}`} cx={15 + i * 100} cy={268} r={4} fill="#A5D6A7" opacity="0.4" />)}
          {Array.from({ length: 5 }).map((_, i) => <circle key={`tv1-${i}`} cx={94} cy={25 + i * 75} r={4} fill="#A5D6A7" opacity="0.4" />)}
          {Array.from({ length: 5 }).map((_, i) => <circle key={`tv2-${i}`} cx={106} cy={25 + i * 75} r={4} fill="#A5D6A7" opacity="0.4" />)}
          <circle cx={65} cy={48} r={8} fill="#81C784" opacity="0.35" />
          <circle cx={85} cy={52} r={6} fill="#A5D6A7" opacity="0.3" />
          <circle cx={635} cy={278} r={7} fill="#81C784" opacity="0.3" />
          <circle cx={355} cy={198} r={5} fill="#A5D6A7" opacity="0.25" />
        </svg>

        {/* Здания */}
        <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
          <rect x="115" y="90" width="65" height="50" rx="3" fill="#D5D5D5" stroke="#C0C0C0" strokeWidth="0.5" />
          <rect x="120" y="95" width="6" height="6" rx="1" fill="#BDBDBD" /><rect x="130" y="95" width="6" height="6" rx="1" fill="#BDBDBD" /><rect x="140" y="95" width="6" height="6" rx="1" fill="#BDBDBD" /><rect x="150" y="95" width="6" height="6" rx="1" fill="#BDBDBD" /><rect x="160" y="95" width="6" height="6" rx="1" fill="#BDBDBD" />
          <rect x="120" y="108" width="6" height="6" rx="1" fill="#BDBDBD" /><rect x="130" y="108" width="6" height="6" rx="1" fill="#BDBDBD" /><rect x="140" y="108" width="6" height="6" rx="1" fill="#BDBDBD" /><rect x="150" y="108" width="6" height="6" rx="1" fill="#BDBDBD" />
          <rect x="315" y="90" width="70" height="48" rx="3" fill="#D5D5D5" stroke="#C0C0C0" strokeWidth="0.5" />
          <rect x="320" y="95" width="7" height="6" rx="1" fill="#BDBDBD" /><rect x="332" y="95" width="7" height="6" rx="1" fill="#BDBDBD" /><rect x="344" y="95" width="7" height="6" rx="1" fill="#BDBDBD" /><rect x="356" y="95" width="7" height="6" rx="1" fill="#BDBDBD" />
          <rect x="415" y="170" width="75" height="65" rx="3" fill="#D5D5D5" stroke="#C0C0C0" strokeWidth="0.5" />
          <rect x="420" y="176" width="7" height="6" rx="1" fill="#BDBDBD" /><rect x="432" y="176" width="7" height="6" rx="1" fill="#BDBDBD" /><rect x="444" y="176" width="7" height="6" rx="1" fill="#BDBDBD" /><rect x="456" y="176" width="7" height="6" rx="1" fill="#BDBDBD" />
          <rect x="420" y="190" width="7" height="6" rx="1" fill="#BDBDBD" /><rect x="432" y="190" width="7" height="6" rx="1" fill="#BDBDBD" /><rect x="444" y="190" width="7" height="6" rx="1" fill="#BDBDBD" />
          <rect x="615" y="90" width="60" height="45" rx="3" fill="#D5D5D5" stroke="#C0C0C0" strokeWidth="0.5" />
          <rect x="620" y="95" width="6" height="6" rx="1" fill="#BDBDBD" /><rect x="630" y="95" width="6" height="6" rx="1" fill="#BDBDBD" /><rect x="640" y="95" width="6" height="6" rx="1" fill="#BDBDBD" />
          <rect x="115" y="270" width="70" height="40" rx="3" fill="#D5D5D5" stroke="#C0C0C0" strokeWidth="0.5" />
          <rect x="315" y="270" width="65" height="35" rx="3" fill="#D5D5D5" stroke="#C0C0C0" strokeWidth="0.5" />
          <rect x="515" y="270" width="55" height="30" rx="3" fill="#D5D5D5" stroke="#C0C0C0" strokeWidth="0.5" />
          <rect x="615" y="270" width="65" height="35" rx="3" fill="#D5D5D5" stroke="#C0C0C0" strokeWidth="0.5" />
        </svg>

        {/* Названия улиц */}
        <div className="absolute text-[7px] text-zinc-400 font-medium" style={{ top: '153px', left: '5px' }}>ул. Мира</div>
        <div className="absolute text-[7px] text-zinc-400 font-medium" style={{ top: '253px', left: '5px' }}>ул. Пушкина</div>
        <div className="absolute text-[7px] text-zinc-400 font-medium" style={{ top: '73px', left: '5px' }}>пр. Ленина</div>
        <div className="absolute text-[7px] text-zinc-400 font-medium" style={{ top: '5px', left: '194px', transform: 'rotate(90deg)', transformOrigin: 'left' }}>пер. Садовый</div>
        <div className="absolute text-[7px] text-zinc-400 font-medium" style={{ top: '5px', left: '394px', transform: 'rotate(90deg)', transformOrigin: 'left' }}>ул. Центральная</div>
        <div className="absolute text-[7px] text-zinc-400 font-medium" style={{ top: '5px', left: '594px', transform: 'rotate(90deg)', transformOrigin: 'left' }}>пер. Тихий</div>

        <style>{`
          @keyframes mapPulse { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.5); opacity: 0; } }
          @keyframes mapAppear { 0% { transform: translateY(12px) scale(0); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
          .mp { animation: mapAppear 0.3s ease-out both; }
          .mp-d1 { animation-delay: 0.1s; } .mp-d2 { animation-delay: 0.2s; } .mp-d3 { animation-delay: 0.3s; } .mp-d4 { animation-delay: 0.4s; } .mp-d5 { animation-delay: 0.5s; }
        `}</style>

        {/* Маркеры с подсказками */}
        {PINS.map((pin, i) => (
          <div key={pin.id} className={`absolute mp mp-d${i + 1} z-10 group cursor-default`}
            style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)' }}>
            <svg width="28" height="36" viewBox="0 0 28 36" fill="none" style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.15))' }}>
              <path d="M14 0 C 6.3 0 0 6.3 0 14 C 0 24.5 14 36 14 36 C 14 36 28 24.5 28 14 C 28 6.3 21.7 0 14 0z" fill={pin.color} />
              <circle cx="14" cy="14" r="7" fill="#fff" />
              <circle cx="14" cy="14" r="3" fill={pin.color} opacity="0.3" />
            </svg>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] px-3 py-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap border border-zinc-100 z-20 group-hover:translate-y-0 translate-y-1">
              <p className="text-[10px] font-bold text-zinc-900">{pin.label}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">{pin.sublabel}</p>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />
            </div>
          </div>
        ))}

        {/* Ваша точка */}
        <div className="absolute z-10" style={{ left: '50%', top: '40%', transform: 'translate(-50%, -50%)' }}>
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-[#4285F4] border-[3px] border-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]" />
            <div className="absolute inset-0 rounded-full bg-[#4285F4]/30" style={{ animation: 'mapPulse 2s ease-out infinite' }} />
          </div>
        </div>

        {/* Машины */}
        {cars.map(car => {
          if (!car.visible || car.opacity < 0.01) return null;
          return (
            <div key={car.id} className="absolute z-20 transition-none"
              style={{ left: `${car.x}%`, top: `${car.y}px`, transform: `translate(-50%, -50%) rotate(${car.angle}deg)`, opacity: car.opacity }}>
              <svg width="18" height="10" viewBox="0 0 18 10" fill="none" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))' }}>
                <rect x="1" y="2" width="9" height="5" rx="1.5" fill={car.color} stroke="#fff" strokeWidth="0.5" />
                <path d="M10 3.5h3l2.5 2v2H10V3.5z" fill={car.darkColor} stroke="#fff" strokeWidth="0.5" />
                <circle cx="3.5" cy="8.5" r="1.3" fill="#555" stroke="#fff" strokeWidth="0.3" />
                <circle cx="13.5" cy="8.5" r="1.3" fill="#555" stroke="#fff" strokeWidth="0.3" />
              </svg>
            </div>
          );
        })}

        {/* Нижняя панель */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/98 to-transparent pt-14 pb-4 px-5 z-30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-zinc-900">Рядом — 5 направлений</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Выезд мастера от 1 часа</p>
            </div>
            <button type="button" className="px-5 py-2.5 rounded-xl bg-[#4285F4] text-white text-[11px] font-bold shadow-[0_2px_8px_rgba(66,133,244,0.3)] active:scale-95 transition-transform">
              Выбрать
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
