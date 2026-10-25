import { BRO_DOMAINS, type BroDomain } from '@/lib/domains';
import type { LiveService } from '@/lib/search-types';

export type SearchResult = {
  domain: BroDomain;
  category?: string;
  service: string;
  description: string;
  confidence: number;
};

type AIIntent = {
  domain: string;
  service: string;
  confidence: number;
  reason: string;
};

const INTENT_MAP: Record<string, AIIntent[]> = {
  // — BroWash: чистка мебели, окон, текстиля
  'химчистка мебели': [
    { domain: 'wash', service: 'Химчистка диванов', confidence: 0.97, reason: 'Химчистка мягкой мебели' },
    { domain: 'wash', service: 'Химчистка кресел', confidence: 0.94, reason: 'Чистка кресел' },
    { domain: 'wash', service: 'Чистка матрасов', confidence: 0.9, reason: 'Чистка матрасов' },
    { domain: 'wash', service: 'Кухонные уголки', confidence: 0.86, reason: 'Чистка мягких вставок мебели' },
  ],
  'химчистк': [
    { domain: 'wash', service: 'Химчистка диванов', confidence: 0.9, reason: 'Химчистка мягкой мебели' },
    { domain: 'wash', service: 'Химчистка кресел', confidence: 0.88, reason: 'Химчистка кресел' },
    { domain: 'wash', service: 'Химчистка салона', confidence: 0.85, reason: 'Химчистка салона авто' },
    { domain: 'wash', service: 'Чистка матрасов', confidence: 0.84, reason: 'Чистка матрасов' },
  ],
  'диван': [
    { domain: 'wash', service: 'Химчистка диванов', confidence: 0.98, reason: 'Диван — это мягкая мебель' },
    { domain: 'rent', service: 'Пылесосы Karcher', confidence: 0.3, reason: 'Можно арендовать пылесос для чистки' },
  ],
  'кресло': [
    { domain: 'wash', service: 'Химчистка кресел', confidence: 0.98, reason: 'Кресло — это мягкая мебель' },
  ],
  'матрас': [
    { domain: 'wash', service: 'Чистка матрасов', confidence: 0.98, reason: 'Матрас нуждается в глубокой чистке' },
  ],
  'окна': [
    { domain: 'wash', service: 'Мойка окон', confidence: 0.95, reason: 'Мойка окон — услуга BroWash' },
    { domain: 'wash', service: 'Панорамное остекление', confidence: 0.7, reason: 'Возможно панорамные окна' },
  ],
  'окон': [
    { domain: 'wash', service: 'Мойка окон', confidence: 0.96, reason: 'Мойка окон — услуга BroWash' },
    { domain: 'wash', service: 'Панорамное остекление', confidence: 0.8, reason: 'Возможно панорамные окна' },
  ],
  'ковер': [
    { domain: 'wash', service: 'Ковры и ковролин', confidence: 0.95, reason: 'Ковёр — текстиль' },
  ],
  'штор': [
    { domain: 'wash', service: 'Шторы и тюль', confidence: 0.95, reason: 'Шторы — текстиль' },
  ],
  'авто': [
    { domain: 'wash', service: 'Химчистка салона', confidence: 0.9, reason: 'Автомобиль — чистка салона' },
  ],
  'салон': [
    { domain: 'wash', service: 'Химчистка салона', confidence: 0.92, reason: 'Чистка салона авто' },
  ],
  // — BroMove: переезды и перевозки
  'переезд': [
    { domain: 'move', service: 'Квартирные переезды', confidence: 0.9, reason: 'Переезд — услуга BroMove' },
    { domain: 'move', service: 'Офисные переезды', confidence: 0.8, reason: 'Возможно офисный переезд' },
    { domain: 'move', service: 'Дачные переезды', confidence: 0.75, reason: 'Возможно дачный переезд' },
  ],
  'офис': [
    { domain: 'move', service: 'Офисные переезды', confidence: 0.96, reason: 'Офисный переезд' },
  ],
  'перевозк': [
    { domain: 'move', service: 'Газель-фургон', confidence: 0.93, reason: 'Перевозка вещей и грузов по городу' },
    { domain: 'move', service: 'Манипулятор', confidence: 0.88, reason: 'Перевозка крупных грузов' },
    { domain: 'move', service: 'КАМАЗ / большой фургон', confidence: 0.83, reason: 'Объёмные перевозки' },
  ],
  'квартир': [
    { domain: 'move', service: 'Квартирные переезды', confidence: 0.9, reason: 'Квартирный переезд' },
  ],
  'дачн': [
    { domain: 'move', service: 'Дачные переезды', confidence: 0.9, reason: 'Дачный переезд' },
  ],
  'груз': [
    { domain: 'move', service: 'Манипулятор', confidence: 0.9, reason: 'Грузоперевозки' },
  ],
  'газель': [
    { domain: 'move', service: 'Газель-фургон', confidence: 0.95, reason: 'Газель — грузоперевозки' },
  ],
  // — BroFrame: техника и электроника
  'iphone': [
    { domain: 'frame', service: 'Замена дисплеев', confidence: 0.95, reason: 'iPhone — электроника BroFrame' },
    { domain: 'frame', service: 'Замена аккумуляторов', confidence: 0.8, reason: 'Частая проблема iPhone' },
  ],
  'экран': [
    { domain: 'frame', service: 'Замена дисплеев', confidence: 0.95, reason: 'Экран — это дисплей телефона' },
    { domain: 'frame', service: 'Замена аккумуляторов', confidence: 0.7, reason: 'Часто меняют вместе с экраном' },
  ],
  'телефон': [
    { domain: 'frame', service: 'Замена дисплеев', confidence: 0.9, reason: 'Телефон — электроника' },
    { domain: 'frame', service: 'Восстановление после воды', confidence: 0.6, reason: 'Возможно залитие' },
  ],
  'ноутбук': [
    { domain: 'frame', service: 'Чистка от пыли', confidence: 0.9, reason: 'Ноутбук нуждается в чистке' },
    { domain: 'frame', service: 'Апгрейд', confidence: 0.7, reason: 'Возможно апгрейд SSD/ОЗУ' },
  ],
  'бытов': [
    { domain: 'frame', service: 'Ремонт холодильников', confidence: 0.93, reason: 'Бытовая техника — холодильники' },
    { domain: 'frame', service: 'Ремонт стиральных машин', confidence: 0.91, reason: 'Бытовая техника — стиральные машины' },
    { domain: 'frame', service: 'Климат-техника', confidence: 0.87, reason: 'Бытовая техника — кондиционеры' },
    { domain: 'frame', service: 'Кофемашины', confidence: 0.85, reason: 'Бытовая техника — кофемашины' },
  ],
  'стиральн': [
    { domain: 'frame', service: 'Ремонт стиральных машин', confidence: 0.96, reason: 'Стиральная машина — бытовая техника' },
  ],
  'холодильник': [
    { domain: 'frame', service: 'Ремонт холодильников', confidence: 0.95, reason: 'Холодильник — бытовая техника' },
  ],
  'кондиционер': [
    { domain: 'frame', service: 'Климат-техника', confidence: 0.95, reason: 'Кондиционер — климат-техника' },
  ],
  'кофе': [
    { domain: 'frame', service: 'Кофемашины', confidence: 0.95, reason: 'Кофемашина — бытовая техника' },
  ],
  'пылесос': [
    { domain: 'frame', service: 'Ремонт моющих роботов', confidence: 0.9, reason: 'Пылесос — техника' },
    { domain: 'rent', service: 'Пылесосы Karcher', confidence: 0.8, reason: 'Аренда пылесоса' },
  ],
  'робот': [
    { domain: 'frame', service: 'Ремонт моющих роботов', confidence: 0.95, reason: 'Робот-пылесос' },
  ],
  'дом': [
    { domain: 'frame', service: 'Wi-Fi мосты', confidence: 0.7, reason: 'Умный дом — настройка' },
    { domain: 'frame', service: 'Голосовые ассистенты', confidence: 0.6, reason: 'Яндекс/Apple Home' },
  ],
  'умный': [
    { domain: 'frame', service: 'Wi-Fi мосты', confidence: 0.9, reason: 'Умный дом — настройка' },
    { domain: 'frame', service: 'Видеонаблюдение', confidence: 0.8, reason: 'Камеры умного дома' },
  ],
  'вода': [
    { domain: 'build', service: 'Устранение протечек', confidence: 0.9, reason: 'Протечка воды — сантехника' },
    { domain: 'frame', service: 'Восстановление после воды', confidence: 0.7, reason: 'Залитая техника' },
  ],
  // — BroBuild: сантехника, электрика, ремонт
  'сантехник': [
    { domain: 'build', service: 'Замена смесителей', confidence: 0.92, reason: 'Сантехника — замена смесителей' },
    { domain: 'build', service: 'Устранение протечек', confidence: 0.9, reason: 'Сантехник устраняет протечки' },
    { domain: 'build', service: 'Установка унитазов', confidence: 0.87, reason: 'Установка сантехники' },
    { domain: 'build', service: 'Ремонт душевых', confidence: 0.85, reason: 'Ремонт душевой' },
  ],
  'мастер на час': [
    { domain: 'build', service: 'Мелкий ремонт', confidence: 0.92, reason: 'Мастер на час — мелкий ремонт' },
    { domain: 'build', service: 'Диагностика неисправностей', confidence: 0.87, reason: 'Диагностика при визите мастера' },
    { domain: 'build', service: 'Установка розеток', confidence: 0.82, reason: 'Мелкие электромонтажные работы' },
    { domain: 'build', service: 'Замена смесителей', confidence: 0.78, reason: 'Мелкие сантехнические работы' },
  ],
  'розетка': [
    { domain: 'build', service: 'Установка розеток', confidence: 0.95, reason: 'Розетка — электрика' },
  ],
  'свет': [
    { domain: 'build', service: 'Замена проводки', confidence: 0.8, reason: 'Проблемы со светом — электрика' },
  ],
  'проводк': [
    { domain: 'build', service: 'Замена проводки', confidence: 0.95, reason: 'Проводка — электрика' },
  ],
  'смесител': [
    { domain: 'build', service: 'Замена смесителей', confidence: 0.95, reason: 'Смеситель — сантехника' },
  ],
  'унитаз': [
    { domain: 'build', service: 'Установка унитазов', confidence: 0.95, reason: 'Унитаз — сантехника' },
  ],
  'душ': [
    { domain: 'build', service: 'Ремонт душевых', confidence: 0.9, reason: 'Душ — сантехника' },
  ],
  'двер': [
    { domain: 'build', service: 'Установка дверей', confidence: 0.9, reason: 'Двери — ремонт помещений' },
  ],
  'пол': [
    { domain: 'build', service: 'Настил пола', confidence: 0.85, reason: 'Пол — ремонт помещений' },
  ],
  'потолок': [
    { domain: 'build', service: 'Потолки', confidence: 0.9, reason: 'Потолки — ремонт' },
  ],
  'обои': [
    { domain: 'build', service: 'Мелкий ремонт', confidence: 0.85, reason: 'Обои — ремонт' },
  ],
  // — BroGarden: сад и участок
  'стрижк': [
    { domain: 'garden', service: 'Стрижка газона', confidence: 0.95, reason: 'Стрижка газона — BroGarden' },
    { domain: 'garden', service: 'Стрижка живых изгородей', confidence: 0.88, reason: 'Стрижка изгородей' },
  ],
  'газон': [
    { domain: 'garden', service: 'Стрижка газона', confidence: 0.92, reason: 'Уход за газоном' },
    { domain: 'garden', service: 'Посадка газона', confidence: 0.78, reason: 'Посадка газона' },
    { domain: 'garden', service: 'Укладка рулонного газона', confidence: 0.75, reason: 'Рулонный газон' },
    { domain: 'rent', service: 'Газонокосилки', confidence: 0.7, reason: 'Аренда газонокосилки' },
  ],
  'снег': [
    { domain: 'garden', service: 'Уборка снега с участка', confidence: 0.9, reason: 'Уборка снега' },
    { domain: 'garden', service: 'Уборка снега с газона', confidence: 0.85, reason: 'Снег убирают с газона' },
    { domain: 'garden', service: 'Вывоз снега', confidence: 0.8, reason: 'Вывоз снега с участка' },
  ],
  // — BroRent: аренда
  'аренд': [
    { domain: 'rent', service: 'Пылесосы Karcher', confidence: 0.9, reason: 'Аренда моющего пылесоса' },
    { domain: 'rent', service: 'Парогенераторы', confidence: 0.86, reason: 'Аренда парогенератора' },
    { domain: 'rent', service: 'Перфораторы', confidence: 0.86, reason: 'Аренда электроинструмента' },
    { domain: 'rent', service: 'Шуруповерты', confidence: 0.82, reason: 'Аренда шуруповёрта' },
    { domain: 'rent', service: 'Мойки высокого давления', confidence: 0.8, reason: 'Аренда мойки высокого давления' },
  ],
};

export const normalize = (text: string) => text.toLowerCase().replace(/ё/g, 'е');

function analyzeIntent(query: string): AIIntent[] {
  const q = normalize(query).trim();
  const results: AIIntent[] = [];

  for (const [keyword, intents] of Object.entries(INTENT_MAP)) {
    if (q.includes(keyword)) {
      results.push(...intents);
    }
  }

  if (results.length === 0) {
    const words = q.split(/\s+/).filter((word) => word.length >= 4);
    for (const word of words) {
      for (const [keyword, intents] of Object.entries(INTENT_MAP)) {
        if (word.includes(keyword) || keyword.includes(word)) {
          results.push(...intents);
        }
      }
    }
  }

  const best = new Map<string, AIIntent>();
  for (const intent of results) {
    const key = `${intent.domain}|${intent.service}`;
    const prev = best.get(key);
    if (!prev || intent.confidence > prev.confidence) best.set(key, intent);
  }

  return [...best.values()]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6);
}

const RU_ENDINGS = [
  'иями', 'ями', 'ами', 'ов', 'ев', 'ей', 'ам', 'ям', 'ах', 'ях', 'ых', 'их',
  'ую', 'ые', 'ый', 'ий', 'ая', 'ое', 'ой', 'ом', 'ем', 'ать', 'ять', 'ить',
  'еть', 'ы', 'и', 'а', 'я', 'о', 'е', 'у', 'ю', 'ь',
];

function stemWord(word: string): string {
  let s = word;
  for (let i = 0; i < 3 && s.length > 4; i++) {
    const ending = RU_ENDINGS.find((e) => s.length > e.length + 3 && s.endsWith(e));
    if (!ending) break;
    s = s.slice(0, -ending.length);
  }
  return s;
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-zа-я0-9]+/)
    .filter(Boolean);
}

function stemMatch(queryStem: string, textStem: string): boolean {
  if (queryStem.length < 4 || textStem.length < 4) return false;
  return (
    queryStem === textStem ||
    queryStem.startsWith(textStem) ||
    textStem.startsWith(queryStem)
  );
}

export function getSearchResults(query: string, live?: LiveService[]): SearchResult[] {
  const best = new Map<string, SearchResult>();

  const put = (r: SearchResult) => {
    const key = `${r.domain.id}|${r.service}`;
    const prev = best.get(key);
    if (!prev || r.confidence > prev.confidence) best.set(key, r);
  };

  const intents = analyzeIntent(query);
  for (const intent of intents) {
    const domain = BRO_DOMAINS.find((d) => d.id === intent.domain);
    if (!domain) continue;

    const category = domain.categories.find((cat) =>
      cat.items.some((item) => item.name === intent.service)
    );
    const serviceItem = category?.items.find((item) => item.name === intent.service);

    if (serviceItem) {
      put({
        domain,
        category: category?.name,
        service: serviceItem.name,
        description: serviceItem.description,
        confidence: intent.confidence,
      });
    }
  }

  const q = normalize(query).trim();
  BRO_DOMAINS.forEach((domain) => {
    domain.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        if (normalize(item.name).includes(q) || normalize(item.description).includes(q)) {
          put({
            domain,
            category: cat.name,
            service: item.name,
            description: item.description,
            confidence: 0.7,
          });
        }
      });
    });
  });

  const qStems = tokenize(query)
    .filter((t) => t.length >= 4)
    .map(stemWord);
  if (qStems.length > 0) {
    const required = Math.min(2, qStems.length);

    BRO_DOMAINS.forEach((domain) => {
      domain.categories.forEach((cat) => {
        cat.items.forEach((item) => {
          const nameStems = tokenize(item.name).map(stemWord);
          const textStems = new Set(
            [...nameStems, ...tokenize(cat.name).map(stemWord), ...tokenize(item.description).map(stemWord)]
          );

          let matched = 0;
          let matchedInName = false;
          for (const qs of qStems) {
            const inName = nameStems.some((ts) => stemMatch(qs, ts));
            const inText = inName || [...textStems].some((ts) => stemMatch(qs, ts));
            if (inText) {
              matched += 1;
              if (inName) matchedInName = true;
            }
          }

          if (matched >= required) {
            put({
              domain,
              category: cat.name,
              service: item.name,
              description: item.description,
              confidence: Math.min(0.66, 0.42 + 0.08 * matched + (matchedInName ? 0.06 : 0)),
            });
          }
        });
      });
    });
  }

  // Живой каталог: услуги из правок админки и прошедшие модерацию услуги мастеров
  if (live && live.length > 0) {
    const liveItems = live.filter((s) => BRO_DOMAINS.some((d) => d.id === s.domain));
    const qLive = normalize(query).trim();

    if (qLive) {
      for (const s of liveItems) {
        if (normalize(s.name).includes(qLive) || normalize(s.desc || '').includes(qLive)) {
          const domain = BRO_DOMAINS.find((d) => d.id === s.domain)!;
          put({ domain, category: s.category, service: s.name, description: s.desc || '', confidence: 0.72 });
        }
      }
    }

    const qStemsLive = tokenize(query).filter((t) => t.length >= 4).map(stemWord);
    if (qStemsLive.length > 0) {
      const requiredLive = Math.min(2, qStemsLive.length);
      for (const s of liveItems) {
        const nameStems = tokenize(s.name).map(stemWord);
        const textStems = new Set([
          ...nameStems,
          ...tokenize(s.category || '').map(stemWord),
          ...tokenize(s.desc || '').map(stemWord),
        ]);
        let matched = 0;
        let matchedInName = false;
        for (const qs of qStemsLive) {
          const inName = nameStems.some((ts) => stemMatch(qs, ts));
          const inText = inName || [...textStems].some((ts) => stemMatch(qs, ts));
          if (inText) {
            matched += 1;
            if (inName) matchedInName = true;
          }
        }
        if (matched >= requiredLive) {
          const domain = BRO_DOMAINS.find((d) => d.id === s.domain)!;
          put({
            domain,
            category: s.category,
            service: s.name,
            description: s.desc || '',
            confidence: Math.min(0.66, 0.42 + 0.08 * matched + (matchedInName ? 0.06 : 0)),
          });
        }
      }
    }
  }

  return [...best.values()]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);
}
