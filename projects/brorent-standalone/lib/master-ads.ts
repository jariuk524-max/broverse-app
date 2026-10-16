export type MasterAd = {
  id: string;
  created_at?: string;
  title: string;
  description?: string;
  price: number;
  price_variants?: string;
  photos?: string[];
  phone?: string;
  status?: string;
  master: {
    id: string;
    name: string;
    phone?: string;
    photo?: string;
    specialization?: string;
    experience?: string;
    city?: string;
    about?: string;
    rating?: number;
  };
  domain: string;
  brand: string;
  color: string;
  /** Направление мастера (химчистка, электрика…) — из кабинета */
  direction?: string;
  directionLabel?: string;
};

/** Понятные направления из кабинета мастеров (lib/directions.ts монолита) */
export const MASTER_DIRECTIONS: Record<string, { label: string; icon: string }> = {
  cleaning: { label: 'Химчистка', icon: '🛋️' },
  plumbing: { label: 'Сантехника', icon: '🚿' },
  electric: { label: 'Электрика', icon: '⚡' },
  repair: { label: 'Стройка и ремонт', icon: '🔨' },
  appliance: { label: 'Ремонт техники', icon: '🔧' },
  electronics: { label: 'Гаджеты', icon: '📱' },
  moving: { label: 'Переезды', icon: '📦' },
  rental: { label: 'Аренда оборудования', icon: '🧰' },
  garden: { label: 'Сад и участок', icon: '🌿' },
};

export const MASTER_BRAND: Record<string, { brand: string; color: string; label: string }> = {
  wash: { brand: 'BroWash', color: '#4285F4', label: 'Химчистка мебели' },
  build: { brand: 'BroBuild', color: '#EA4335', label: 'Ремонт и установка' },
  frame: { brand: 'BroFrame', color: '#FBBC05', label: 'Техника и электроника' },
  move: { brand: 'BroMove', color: '#34A853', label: 'Переезды и грузоперевозки' },
  rent: { brand: 'BroRent', color: '#00BCD4', label: 'Аренда оборудования' },
  garden: { brand: 'BroGarden', color: '#16A34A', label: 'Сад и участок' },
};

const DOMAIN_IDS = Object.keys(MASTER_BRAND);

const DOMAIN_RULES: { domain: string; re: RegExp }[] = [
  { domain: 'wash', re: /(химчист|диван|кресло|матрас|ков[её]р|штор|тюль|мойк[аи]? ?окон|салон[а]? авто|чистк[аи]? ?мебел)/i },
  { domain: 'frame', re: /(экран|дисплей|iphone|телефон|смартфон|ноутбук|батаре|аккумулят|робот|wi-?fi|камер[ыа]?|планшет|консол)/i },
  { domain: 'move', re: /(переезд|грузоперев|таксомотор|манипулятор|сборк[аи]? ?мебел|груз)/i },
  { domain: 'garden', re: /(газон|озелен|снег|стрижк|участок|садов|дерев|кустарник)/i },
  { domain: 'rent', re: /(аренд|инструмент|оборудован|пылесос)/i },
  { domain: 'build', re: /(ремонт|установ|сантехник|электр|техник|стиральн|холодиль|микроволн|розетк|смесител|унитаз|двер|потолк|проводк|кондиционер|кофемаш)/i },
];

/** Определяет домен/бренд объявления: work_types → keywords названия/описания */
export function detectMasterAdDomain(ad: {
  title?: string;
  description?: string;
  work_types?: string[];
}): string {
  for (const raw of ad.work_types || []) {
    const w = String(raw).toLowerCase().trim();
    if (!w) continue;
    const byId = DOMAIN_IDS.find((id) => w === id || w.includes(id));
    if (byId) return byId;
    const byLabel = DOMAIN_IDS.find((id) => w.includes(MASTER_BRAND[id].label.toLowerCase()) || w.includes(MASTER_BRAND[id].brand.toLowerCase()));
    if (byLabel) return byLabel;
  }
  const text = `${ad.title || ''} ${ad.description || ''}`;
  const rule = DOMAIN_RULES.find((r) => r.re.test(text));
  return rule ? rule.domain : '';
}

export function masterBrandFor(domain: string): { brand: string; color: string } {
  const hit = MASTER_BRAND[domain];
  return hit ? { brand: hit.brand, color: hit.color } : { brand: 'BroVerse', color: '#18181b' };
}

export function masterAdFallbackImage(domain: string): string {
  return `/hero/${DOMAIN_IDS.includes(domain) ? domain : 'wash'}-hero.jpg`;
}

/** Разбирает description анкеты: «Специализация: … · Опыт: … · Город: … · О себе: …» */
export function parseMasterProfileDescription(description?: string | null): {
  specialization?: string;
  experience?: string;
  city?: string;
  about?: string;
} {
  const out: Record<string, string> = {};
  for (const chunk of String(description || '').split(' · ')) {
    const idx = chunk.indexOf(':');
    if (idx === -1) continue;
    const key = chunk.slice(0, idx).trim();
    const value = chunk.slice(idx + 1).trim();
    if (key && value) out[key] = value;
  }
  return {
    specialization: out['Специализация'],
    experience: out['Опыт'],
    city: out['Город'],
    about: out['О себе'],
  };
}
