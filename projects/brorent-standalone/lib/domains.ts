import type { LucideIcon } from 'lucide-react';
import { Camera, Truck, Hammer, Wrench, HeartHandshake, Users, Globe, Smartphone, Home } from 'lucide-react';

export type DomainService = 'cleaning' | 'repair' | 'electronics' | 'moving' | 'rental' | 'community' | 'education';

export type OrderSource = 'tg' | 'vk' | 'web' | 'insta';

export type ChannelDiscount = {
  tg?: number;
  vk?: number;
  web?: number;
  insta?: number;
};

export type BroDomainConfig = {
  id: string;
  title: string;
  domain: string;
  accent: string;
  color: string;
  priceBase: number;
  channels: ChannelDiscount;
  description: string;
  hero?: string;
  subHero?: string;
  images?: {
    main?: string;
    slider?: string[];
  };
};

export const BroVerseConfig: Record<string, BroDomainConfig> = {
  verse: {
    id: 'verse',
    title: 'BroVerse',
    domain: 'BroVerse.ru',
    accent: 'Сердце экосистемы',
    color: '#4285F4',
    priceBase: 0,
    channels: { tg: 1.0, web: 1.0 },
    description: 'Главная витрина для клиентов и точка входа в Дашборд для Мастеров.',
    hero: 'Братство профессионалов',
    subHero: 'Все услуги экосистемы в одном месте. Найдите мастера, который решит вашу задачу.',
  },
  care: {
    id: 'care',
    title: 'BroCare',
    domain: 'BroCare.ru',
    accent: 'Инкубатор мастеров',
    color: '#1C1C1E',
    priceBase: 0,
    channels: { tg: 1.0, web: 1.0 },
    description: 'Обучение, аттестация, Trust Level и вход в Братство.',
    hero: 'Стань профессионалом экосистемы',
    subHero: 'Обучение, аттестация и поддержка. Повышайте Trust Level и получайте привилегии.',
  },
  wash: {
    id: 'wash',
    title: 'BroWash',
    domain: 'BroWash.ru',
    accent: 'Химчистка мебели',
    color: '#4285F4',
    priceBase: 1500,
    channels: { tg: 0.9, vk: 1.0, web: 1.0, insta: 0.95 },
    description: 'Химчистка мягкой мебели и матрасов, мойка окон, чистка ковров, химчистка салонов авто, озонирование',
    hero: 'Химчистка, которая возвращает уют',
    subHero: 'Используем технологию экстракции и составы SafeWay, чтобы твой диван был чистым и безопасным для детей.',
  },
  move: {
    id: 'move',
    title: 'BroMove',
    domain: 'BroMove.ru',
    accent: 'Грузоперевозки',
    color: '#4285F4',
    priceBase: 2500,
    channels: { tg: 0.95, web: 1.0 },
    description: 'Квартирные переезды, офисные переезды, сборка мебели, грузоперевозки манипулятором',
    hero: 'Грузоперевозки со скоростью мысли',
    subHero: 'Прозрачный тариф: от 2500₽. Свои чистые Газели и грузчики, которые не задают лишних вопросов.',
  },
  frame: {
    id: 'frame',
    title: 'BroFrame',
    domain: 'BroFrame.ru',
    accent: 'Ремонт техники',
    color: '#FBBC05',
    priceBase: 1000,
    channels: { tg: 1.0, web: 1.0 },
    description: 'Ремонт смартфонов и планшетов, чистка ноутбуков, ремонт роботов-пылесосов, настройка умного дома',
    hero: 'Реанимация твоей электроники',
    subHero: 'От замены экрана на iPhone до починки компрессора холодильника. Делаем при тебе с гарантией 1 год.',
  },
  build: {
    id: 'build',
    title: 'BroBuild',
    domain: 'BroBuild.ru',
    accent: 'Инженерия и ремонт',
    color: '#EA4335',
    priceBase: 1200,
    channels: { tg: 0.9, web: 1.0 },
    description: 'Сантехника, электрика, ремонт помещений, бытовая техника',
    hero: 'Ремонт, который делают с душой',
    subHero: 'Сантехника, электрика, отделка — приедем в день обращения и сделаем так, как нужно вам.',
  },
  rent: {
    id: 'rent',
    title: 'BroRent',
    domain: 'BroRent.ru',
    accent: 'Шеринг инструментов',
    color: '#34A853',
    priceBase: 800,
    channels: { tg: 0.95, web: 1.0 },
    description: 'Аренда моющих пылесосов Puzzi, электроинструмент, садовый инвентарь',
    hero: 'Профессиональный инструмент — без покупки',
    subHero: 'Арендуйте пылесосы Karcher, перфораторы Bosch, парогенераторы — привезём на объект и заберём обратно.',
  },
};

export type ServiceItem = {
  name: string;
  description: string;
};

export type ServiceCategory = {
  name: string;
  items: ServiceItem[];
};

export type BroDomain = {
  id: string;
  domain: string;
  brand: string;
  tagline: string;
  categories: ServiceCategory[];
  /** Tailwind background utility */
  bgClass: string;
  /** Tailwind text color for card body */
  textClass: string;
  /** Action pill styling */
  actionClass: string;
  icon: LucideIcon;
  actionLabel: string;
  service: DomainService;
  leadPrice: number;
  isHub?: boolean;
};

export const BRO_DOMAINS: BroDomain[] = [
  {
    id: 'verse',
    domain: 'BroVerse.ru',
    brand: 'BroVerse',
    tagline: 'Сердце экосистемы',
    categories: [
      { name: 'Для клиентов', items: [
        { name: 'Витрина услуг', description: 'Полный каталог сервисов' },
        { name: 'AI-оценка', description: 'Оценка стоимости по фото' },
      ]},
      { name: 'Для мастеров', items: [
        { name: 'Дашборд', description: 'Управление заказами' },
        { name: 'Лента заказов', description: 'Новые заявки в реальном времени' },
      ]},
    ],
    bgClass: 'bg-gradient-to-br from-[#4285F4] to-[#34A853]',
    textClass: 'text-white',
    actionClass: 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm',
    icon: Globe,
    actionLabel: 'Войти в Дашборд',
    service: 'community',
    leadPrice: 0,
    isHub: true,
  },
  {
    id: 'wash',
    domain: 'BroWash.ru',
    brand: 'BroWash',
    tagline: 'Химчистка мебели',
    categories: [
      { name: 'Мебель', items: [
        { name: 'Химчистка диванов', description: 'Глубокая чистка с удалением пятен' },
        { name: 'Химчистка кресел', description: 'Детские, офисные, кресла-качалки' },
        { name: 'Чистка матрасов', description: 'Удаление клещей, аллергенов, запахов' },
        { name: 'Кухонные уголки', description: 'Столы, стулья, мягкие вставки' },
      ]},
      { name: 'Окна', items: [
        { name: 'Мойка окон', description: 'Стандартные и панорамные' },
        { name: 'Панорамное остекление', description: 'Балконы, лоджии, витражи' },
        { name: 'Витрины', description: 'Коммерческие помещения' },
      ]},
      { name: 'Текстиль', items: [
        { name: 'Шторы и тюль', description: 'Чистка без снятия на карнизе' },
        { name: 'Ковры и ковролин', description: 'Глубокая чистка с выведением пятен' },
      ]},
      { name: 'Авто', items: [
        { name: 'Химчистка салона', description: 'Выездная чистка в любую точку' },
        { name: 'Детские автокресла', description: 'Безопасная чистка сертифицированными средствами' },
      ]},
      { name: 'Спецзадачи', items: [
        { name: 'Озонирование', description: 'Удаление запахов: дым, животные, плесень' },
        { name: 'Сложные пятна', description: 'Вино, кровь, маркеры, кофе' },
      ]},
    ],
    bgClass: 'bg-[#4285F4]',
    textClass: 'text-white',
    actionClass: 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm',
    icon: Camera,
    actionLabel: 'Оценить по фото',
    service: 'cleaning',
    leadPrice: 1500,
  },
  {
    id: 'care',
    domain: 'BroCare.ru',
    brand: 'BroCare',
    tagline: 'Инкубатор и Блог Братства',
    categories: [
      { name: 'Обучение', items: [
        { name: 'Курсы профессий', description: 'С нуля до профи: химчистка, ремонт, логистика' },
        { name: 'Видео-база', description: 'Пошаговые инструкции и разборы кейсов' },
      ]},
      { name: 'Аттестация', items: [
        { name: 'Trust Level', description: 'Повышение рейтинга и получение статуса' },
        { name: 'Verified Master', description: 'Подтверждённый профессионал экосистемы' },
      ]},
      { name: 'Поддержка', items: [
        { name: 'База знаний', description: 'FAQ, инструкции, лучшие практики' },
        { name: 'Юридическая помощь', description: 'Консультации и защита интересов' },
        { name: 'Страхование', description: 'Страховка заказов и имущества' },
      ]},
      { name: 'Блог братства', items: [
        { name: 'Истории мастеров', description: 'Как наши братья растут и зарабатывают' },
        { name: 'До/После работ', description: 'Фото реальных проектов до и после' },
        { name: 'Советы и лайфхаки', description: 'Профессиональные секреты от бывалых' },
      ]},
      { name: 'События', items: [
        { name: 'BroBrew Fridays', description: 'Пятничные встречи в формате нетворкинга' },
        { name: 'Бранчи', description: 'Совместные завтраки и обсуждение кейсов' },
        { name: 'Выезды на природу', description: 'Командные поездки и тимбилдинг' },
      ]},
      { name: 'Привилегии', items: [
        { name: 'Скидки у партнёров', description: 'Кафе, магазины, сервисы' },
        { name: 'Приоритет в заказах', description: 'Для активных участников' },
        { name: 'Мерч братства', description: 'Фирменная одежда и аксессуары' },
      ]},
    ],
    bgClass: 'bg-[#1C1C1E]',
    textClass: 'text-white',
    actionClass: 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm',
    icon: HeartHandshake,
    actionLabel: 'Войти в сообщество',
    service: 'education',
    leadPrice: 0,
  },
  {
    id: 'build',
    domain: 'BroBuild.ru',
    brand: 'BroBuild',
    tagline: 'Инженерия и ремонт',
    categories: [
      { name: 'Сантехника', items: [
        { name: 'Замена смесителей', description: 'Ванные, кухни, туалеты' },
        { name: 'Устранение протечек', description: 'Трубы, стыки, сантехнические узлы' },
        { name: 'Установка унитазов', description: 'Подвесные, напольные, биде' },
        { name: 'Ремонт душевых', description: 'Кабины, поддоны, лейки, смесители' },
      ]},
      { name: 'Электрика', items: [
        { name: 'Замена проводки', description: 'Полная или частичная замена' },
        { name: 'Установка розеток', description: 'Силовые, обычные, USB-розетки' },
        { name: 'Сборка электрощитов', description: 'Автоматы, УЗО, дифавтоматы' },
        { name: 'Диагностика неисправностей', description: 'Поиск обрывов, коротких замыканий' },
      ]},
      { name: 'Ремонт помещений', items: [
        { name: 'Мелкий ремонт', description: 'Заделка трещин, покраска, обои' },
        { name: 'Установка дверей', description: 'Входные, межкомнатные, раздвижные' },
        { name: 'Настил пола', description: 'Ламинат, плитка, линолеум' },
        { name: 'Потолки', description: 'Натяжные, подвесные, покраска' },
      ]},
      { name: 'Бытовая техника', items: [
        { name: 'Ремонт холодильников', description: 'Заправка фреоном, замена компрессоров, No Frost' },
        { name: 'Климат-техника', description: 'Чистка, дозаправка и монтаж кондиционеров' },
        { name: 'Кофемашины', description: 'Обслуживание профессиональных и домашних' },
      ]},
    ],
    bgClass: 'bg-[#EA4335]',
    textClass: 'text-white',
    actionClass: 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm',
    icon: Hammer,
    actionLabel: 'Вызвать мастера',
    service: 'repair',
    leadPrice: 1200,
  },
  {
    id: 'frame',
    domain: 'BroFrame.ru',
    brand: 'BroFrame',
    tagline: 'Ремонт техники',
    categories: [
      { name: 'Apple / Android', items: [
        { name: 'Замена дисплеев', description: 'iPhone, iPad, Samsung, Xiaomi' },
        { name: 'Замена аккумуляторов', description: 'Оригинал и качественные аналоги' },
        { name: 'Восстановление после воды', description: 'Диагностика, чип-мойка, замена деталей' },
      ]},
      { name: 'Ноутбуки / ПК', items: [
        { name: 'Чистка от пыли', description: 'Продувка, замена термопасты' },
        { name: 'Апгрейд', description: 'SSD, ОЗУ, замена клавиатуры' },
        { name: 'Переустановка ОС', description: 'Windows, macOS, Linux' },
      ]},
      { name: 'Роботы-пылесосы', items: [
        { name: 'Ремонт моющих роботов', description: 'Включая парк BroRent' },
        { name: 'Замена аккумуляторов', description: 'Восстановление автономности' },
        { name: 'Чистка сенсоров', description: 'Лидар, камеры, датчики столкновений' },
      ]},
      { name: 'Умный дом', items: [
        { name: 'Wi-Fi мосты', description: 'Настройка Mesh-систем, роутеров' },
        { name: 'Видеонаблюдение', description: 'Камеры, recorder, удалённый доступ' },
        { name: 'Голосовые ассистенты', description: 'Яндекс, Apple Home, Google Home' },
      ]},
    ],
    bgClass: 'bg-[#FBBC05]',
    textClass: 'text-zinc-900',
    actionClass: 'bg-black/10 hover:bg-black/15 text-zinc-900 backdrop-blur-sm',
    icon: Smartphone,
    actionLabel: 'Диагностика за 5 мин',
    service: 'electronics',
    leadPrice: 1000,
  },
  {
    id: 'move',
    domain: 'BroMove.ru',
    brand: 'BroMove',
    tagline: 'Грузоперевозки',
    categories: [
      { name: 'Переезды', items: [
        { name: 'Квартирные переезды', description: 'Упаковка, погрузка, транспортировка, расстановка' },
        { name: 'Офисные переезды', description: 'Перенос мебели, техники, документов' },
        { name: 'Дачные переезды', description: 'Грузоперевозки за город' },
      ]},
      { name: 'Мебель', items: [
        { name: 'Сборка мебели', description: 'IKEA, хранение, офисные системы' },
        { name: 'Разборка мебели', description: 'Для переезда или хранения' },
        { name: 'Перетяжка мягкой мебели', description: 'Замена обивки, реставрация' },
      ]},
      { name: 'Грузоперевозки', items: [
        { name: 'Манипулятор', description: 'Крупногабаритные грузы' },
        { name: 'Квартирный таксомотор', description: 'Газель, КАМАЗ, газель-фургон' },
        { name: 'Прозрачный тариф', description: 'Фиксированная стоимость без доплат' },
      ]},
    ],
    bgClass: 'bg-[#4285F4]',
    textClass: 'text-white',
    actionClass: 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm',
    icon: Truck,
    actionLabel: 'Рассчитать перевозку',
    service: 'moving',
    leadPrice: 2500,
  },
  {
    id: 'rent',
    domain: 'BroRent.ru',
    brand: 'BroRent',
    tagline: 'Шеринг Инструментов',
    categories: [
      { name: 'Клинеринг', items: [
        { name: 'Пылесосы Karcher', description: 'Profesional для химчистки' },
        { name: 'Парогенераторы', description: 'Для детейлинга и текстиля' },
        { name: 'Аппараты для чистки', description: 'Inject-Extract системы' },
      ]},
      { name: 'Электроинструмент', items: [
        { name: 'Перфораторы', description: 'Bosch, Makita, DeWalt' },
        { name: 'Шуруповерты', description: 'Аккумуляторные и сетевые' },
        { name: 'Уровни и лазеры', description: 'Для точных замеров' },
      ]},
      { name: 'Садовый инвентарь', items: [
        { name: 'Мойки высокого давления', description: 'Karcher для фасадов и заборов' },
        { name: 'Газонокосилки', description: 'Электрические и бензиновые' },
      ]},
      { name: 'Логистика', items: [
        { name: 'Доставка на объект', description: 'Привезём и заберём обратно' },
        { name: 'Химия и тара', description: 'Предоставляются компанией' },
      ]},
    ],
    bgClass: 'bg-[#34A853]',
    textClass: 'text-white',
    actionClass: 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm',
    icon: Wrench,
    actionLabel: 'Забронировать инструмент',
    service: 'rental',
    leadPrice: 800,
  },
];

export type BroverseLeadPayload = {
  domain: string;
  brand: string;
  tagline: string;
  title: string;
  price: number;
  service: DomainService;
  address: string;
  services: string[];
};

export function domainToLead(domain: BroDomain): BroverseLeadPayload {
  const allServices = domain.categories.flatMap((cat) =>
    cat.items.map((item) => `${cat.name}: ${item.name}`)
  );

  return {
    domain: domain.domain,
    brand: domain.brand,
    tagline: domain.tagline,
    title: `${domain.domain} — ${domain.tagline}`,
    price: domain.leadPrice,
    service: domain.service,
    address: `Москва, лид с ${domain.domain}`,
    services: allServices,
  };
}
