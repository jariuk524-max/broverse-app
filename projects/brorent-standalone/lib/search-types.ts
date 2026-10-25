/** Общие типы живого поискового индекса (используются и на клиенте, и на сервере) */

/** Чип карусели подсказок под поиском */
export type Chip = {
  /** Подпись на чипе */
  text: string;
  /** Что подставляется в поиск и по чему ищем результаты */
  query: string;
  /** Иллюстрация чипа (URL или путь /hints/*.svg) */
  img: string;
};

/** Услуга живого каталога: код + правки из админки (все 6 сайтов) */
export type LiveService = {
  domain: string;
  category?: string;
  name: string;
  desc: string;
  price?: string;
  time?: string;
  image?: string;
  /** true — услуга добавлена из админки (new) */
  isNew?: boolean;
};

/** Ответ GET /api/search-index */
export type SearchIndex = {
  chips: Chip[];
  services: LiveService[];
};
