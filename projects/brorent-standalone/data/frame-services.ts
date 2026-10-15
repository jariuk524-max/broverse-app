export type FrameCategory = {
  name: string;
  emoji: string;
  services: FrameService[];
};

export type FrameService = {
  name: string;
  desc: string;
  price: string;
  time: string;
  image: string;
};

export const FRAME_CATEGORIES: FrameCategory[] = [
  {
    name: 'Apple / Android',
    emoji: '📱',
    services: [
      {
        name: 'Замена дисплеев',
        desc: 'iPhone, iPad, Samsung, Xiaomi. Оригинал и качественные аналоги',
        price: '4 500',
        time: '30–60 мин',
        image: '/hero/frame-hero.jpg',
      },
      {
        name: 'Замена аккумуляторов',
        desc: 'Оригинал и качественные аналоги. Восстановление автономности',
        price: '2 000',
        time: '30 мин',
        image: '/hero/frame-slider-0.jpg',
      },
      {
        name: 'Восстановление после воды',
        desc: 'Диагностика, чип-мойка, замена повреждённых деталей',
        price: '5 000',
        time: '2–3 ч',
        image: '/hero/frame-slider-5.jpg',
      },
    ],
  },
  {
    name: 'Ноутбуки / ПК',
    emoji: '💻',
    services: [
      {
        name: 'Чистка от пыли',
        desc: 'Продувка, замена термопасты, профилактика перегрева',
        price: '1 500',
        time: '1 ч',
        image: '/hero/frame-slider-1.jpg',
      },
      {
        name: 'Апгрейд',
        desc: 'SSD, ОЗУ, замена клавиатуры и экранов',
        price: '2 000',
        time: '30–60 мин',
        image: '/hero/frame-Чистка_ноутбука-0.jpg',
      },
      {
        name: 'Переустановка ОС',
        desc: 'Windows, macOS, Linux. Перенос данных включён',
        price: '1 200',
        time: '1–2 ч',
        image: '/hero/frame-slider-3.jpg',
      },
    ],
  },
  {
    name: 'Роботы-пылесосы',
    emoji: '🤖',
    services: [
      {
        name: 'Ремонт моющих роботов',
        desc: 'Включая парк BroRent. Диагностика и замена узлов',
        price: '3 000',
        time: '1–2 ч',
        image: '/hero/frame-slider-2.jpg',
      },
      {
        name: 'Замена аккумуляторов',
        desc: 'Восстановление автономности любых роботов',
        price: '2 500',
        time: '40–60 мин',
        image: '/hero/frame-slider-4.jpg',
      },
      {
        name: 'Чистка сенсоров',
        desc: 'Лидар, камеры, датчики столкновений — точность как новая',
        price: '1 500',
        time: '40 мин',
        image: '/hero/frame-slider-6.jpg',
      },
    ],
  },
  {
    name: 'Умный дом',
    emoji: '📶',
    services: [
      {
        name: 'Wi-Fi мосты',
        desc: 'Настройка Mesh-систем, роутеров, бесшовный вайфай',
        price: '1 500',
        time: '1 ч',
        image: '/hero/frame-slider-3.jpg',
      },
      {
        name: 'Видеонаблюдение',
        desc: 'Камеры, регистраторы, удалённый доступ с телефона',
        price: '2 500',
        time: '1–2 ч',
        image: '/hero/frame-slider-5.jpg',
      },
      {
        name: 'Голосовые ассистенты',
        desc: 'Яндекс, Apple Home, Google Home — подключение и сценарии',
        price: '1 200',
        time: '40 мин',
        image: '/hero/frame-slider-1.jpg',
      },
    ],
  },
  {
    name: 'Бытовая техника',
    emoji: '🧊',
    services: [
      {
        name: 'Ремонт холодильников',
        desc: 'Заправка фреоном, замена компрессоров, No Frost',
        price: '3 500',
        time: '1–2 ч',
        image: '/hero/frame-slider-4.jpg',
      },
      {
        name: 'Климат-техника',
        desc: 'Чистка, дозаправка и монтаж кондиционеров',
        price: '5 000',
        time: '2–3 ч',
        image: '/hero/frame-hero.jpg',
      },
      {
        name: 'Кофемашины',
        desc: 'Обслуживание профессиональных и домашних кофемашин',
        price: '2 500',
        time: '1–2 ч',
        image: '/hero/frame-slider-2.jpg',
      },
    ],
  },
];

export const FRAME_HERO = {
  image: '/hero/frame-hero.jpg',
  fallback: '/hero/frame-hero.jpg',
};

export const FRAME_GALLERY: { image: string; fallback: string }[] = [
  { image: '/hero/frame-slider-0.jpg', fallback: '/hero/frame-slider-0.jpg' },
  { image: '/hero/frame-slider-1.jpg', fallback: '/hero/frame-slider-1.jpg' },
  { image: '/hero/frame-slider-2.jpg', fallback: '/hero/frame-slider-2.jpg' },
  { image: '/hero/frame-slider-3.jpg', fallback: '/hero/frame-slider-3.jpg' },
  { image: '/hero/frame-slider-4.jpg', fallback: '/hero/frame-slider-4.jpg' },
  { image: '/hero/frame-slider-5.jpg', fallback: '/hero/frame-slider-5.jpg' },
  { image: '/hero/frame-slider-6.jpg', fallback: '/hero/frame-slider-6.jpg' },
];

export const FRAME_BANNERS = {
  first: { image: '/hero/frame-slider-2.jpg', fallback: '/hero/frame-slider-2.jpg' },
  second: { image: '/hero/frame-slider-4.jpg', fallback: '/hero/frame-slider-4.jpg' },
  final: { image: '/hero/frame-hero.jpg', fallback: '/hero/frame-hero.jpg' },
};
