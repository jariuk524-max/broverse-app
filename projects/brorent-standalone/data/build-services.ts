export type BuildCategory = {
  name: string;
  emoji: string;
  services: BuildService[];
};

export type BuildService = {
  name: string;
  desc: string;
  price: string;
  time: string;
  image: string;
};

export const BUILD_CATEGORIES: BuildCategory[] = [
  {
    name: 'Сантехника',
    emoji: '🔧',
    services: [
      {
        name: 'Замена смесителей',
        desc: 'Ванные, кухни, туалеты. Монтаж и подключение нового смесителя',
        price: '1 500',
        time: '40–60 мин',
        image: '/hero/build-plumbing-1.jpg',
      },
      {
        name: 'Устранение протечек',
        desc: 'Трубы, стыки, сантехнические узлы. Найдём и утечку, и устраним',
        price: '1 200',
        time: '30–60 мин',
        image: '/hero/build-plumbing-0.jpg',
      },
      {
        name: 'Установка унитазов',
        desc: 'Подвесные, напольные, биде. Полный цикл монтажа',
        price: '2 000',
        time: '1–1.5 ч',
        image: '/hero/build-plumbing-2.jpg',
      },
      {
        name: 'Ремонт душевых',
        desc: 'Кабины, поддоны, лейки, смесители, герметизация',
        price: '2 500',
        time: '2–3 ч',
        image: '/hero/build-plumbing-3.jpg',
      },
    ],
  },
  {
    name: 'Электрика',
    emoji: '⚡',
    services: [
      {
        name: 'Замена проводки',
        desc: 'Полная или частичная замена. Скрытая и открытая проводка',
        price: '5 000',
        time: '3–5 ч',
        image: '/hero/build-slider-0.jpg',
      },
      {
        name: 'Установка розеток',
        desc: 'Силовые, обычные, USB-розетки. Подрозетники и замена старых',
        price: '800',
        time: '20–40 мин',
        image: '/hero/build-slider-6.jpg',
      },
      {
        name: 'Сборка электрощитов',
        desc: 'Автоматы, УЗО, дифавтоматы. Сборка и подключение щита',
        price: '4 500',
        time: '2–4 ч',
        image: '/hero/build-slider-5.jpg',
      },
      {
        name: 'Диагностика неисправностей',
        desc: 'Поиск обрывов и коротких замыканий, проверка линий',
        price: '1 000',
        time: '1 ч',
        image: '/hero/build-slider-4.jpg',
      },
    ],
  },
  {
    name: 'Ремонт помещений',
    emoji: '🛠️',
    services: [
      {
        name: 'Мелкий ремонт',
        desc: 'Заделка трещин, покраска, обои, мелкие работы по дому',
        price: '2 000',
        time: 'от 2 ч',
        image: '/hero/build-slider-3.jpg',
      },
      {
        name: 'Установка дверей',
        desc: 'Входные, межкомнатные, раздвижные. С коробкой и фурнитурой',
        price: '3 000',
        time: '1–2 ч',
        image: '/hero/build-renovation-1.jpg',
      },
      {
        name: 'Настил пола',
        desc: 'Ламинат, плитка, линолеум. Подготовка основания включена',
        price: '3 500',
        time: '3–5 ч',
        image: '/hero/build-renovation-2.jpg',
      },
      {
        name: 'Потолки',
        desc: 'Натяжные, подвесные, покраска. Замер и монтаж под ключ',
        price: '4 000',
        time: '1–2 дня',
        image: '/hero/build-renovation-0.jpg',
      },
    ],
  },
];

export const BUILD_HERO = {
  image: '/hero/build-hero.jpg',
  fallback: '/hero/build-hero.jpg',
};

export const BUILD_GALLERY: { image: string; fallback: string }[] = [
  { image: '/hero/build-slider-0.jpg', fallback: '/hero/build-slider-0.jpg' },
  { image: '/hero/build-slider-2.jpg', fallback: '/hero/build-slider-2.jpg' },
  { image: '/hero/build-plumbing-0.jpg', fallback: '/hero/build-plumbing-0.jpg' },
  { image: '/hero/build-slider-6.jpg', fallback: '/hero/build-slider-6.jpg' },
  { image: '/hero/build-renovation-2.jpg', fallback: '/hero/build-renovation-2.jpg' },
  { image: '/hero/build-slider-5.jpg', fallback: '/hero/build-slider-5.jpg' },
  { image: '/hero/build-plumbing-3.jpg', fallback: '/hero/build-plumbing-3.jpg' },
  { image: '/hero/build-renovation-1.jpg', fallback: '/hero/build-renovation-1.jpg' },
];

export const BUILD_BANNERS = {
  first: {
    image: '/hero/build-slider-3.jpg',
    fallback: '/hero/build-slider-3.jpg',
  },
  second: {
    image: '/hero/build-slider-4.jpg',
    fallback: '/hero/build-slider-4.jpg',
  },
  final: {
    image: '/hero/build-hero.jpg',
    fallback: '/hero/build-hero.jpg',
  },
};
