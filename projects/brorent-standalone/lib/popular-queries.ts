export type PopularQuery = {
  /** Подпись на чипе */
  text: string;
  /** Что подставляется в поиск и по чему ищем результаты */
  query: string;
  /** Иллюстрация чипа */
  img: string;
};

/**
 * Карусель популярных запросов под поиском — по одной-две темы на каждый
 * бренд экосистемы. Каждый запрос обязан находить релевантные услуги
 * (см. INTENT_MAP в SmartSearch).
 */
export const POPULAR_QUERIES: PopularQuery[] = [
  { text: 'Химчистка мебели', query: 'химчистка мебели', img: '/hints/sofa.svg' },
  { text: 'Переезды офисов', query: 'переезд офиса', img: '/hints/move.svg' },
  { text: 'Перевозка вещей', query: 'перевозка вещей', img: '/hints/truck.svg' },
  { text: 'Ремонт бытовой техники', query: 'ремонт бытовой техники', img: '/hints/repair.svg' },
  { text: 'Ремонт стиральных машин', query: 'ремонт стиральной машины', img: '/hints/washer.svg' },
  { text: 'Ремонт холодильников', query: 'ремонт холодильника', img: '/hints/fridge.svg' },
  { text: 'Сантехник на час', query: 'сантехник на час', img: '/hints/faucet.svg' },
  { text: 'Мастер на час', query: 'мастер на час', img: '/hints/toolbox.svg' },
  { text: 'Мойка окон', query: 'мойка окон', img: '/hints/window.svg' },
  { text: 'Замена экрана', query: 'замена экрана', img: '/hints/display.svg' },
  { text: 'Аренда инструмента', query: 'аренда инструмента', img: '/hints/tool.svg' },
  { text: 'Стрижка газона', query: 'стрижка газона', img: '/hints/lawn.svg' },
];
