export type MoveCategory = {
  name: string;
  emoji: string;
  services: MoveService[];
};

export type MoveService = {
  name: string;
  desc: string;
  price: string;
  time: string;
  image: string;
};

export const MOVE_CATEGORIES: MoveCategory[] = [
  {
    name: 'Переезды',
    emoji: '📦',
    services: [
      {
        name: 'Квартирный переезд',
        desc: 'Упаковка, погрузка, транспортировка и расстановка на месте — всё включено',
        price: '4 000',
        time: '3–5 ч',
        image: '/hero/move-hero.jpg',
      },
      {
        name: 'Офисный переезд',
        desc: 'Перенос мебели, техники и документов без остановки работы',
        price: '6 000',
        time: '4–6 ч',
        image: '/hero/move-slider-0.jpg',
      },
      {
        name: 'Дачный переезд',
        desc: 'Межгород в любую погоду, фиксированная цена до выезда',
        price: '5 000',
        time: 'По запросу',
        image: '/hero/move-slider-1.jpg',
      },
    ],
  },
  {
    name: 'Грузоперевозки',
    emoji: '🚛',
    services: [
      {
        name: 'Манипулятор',
        desc: 'Крупногабаритные грузы: стройматериалы, техника, сейфы',
        price: '5 000',
        time: 'От 2 ч',
        image: '/hero/move-slider-2.jpg',
      },
      {
        name: 'Газель-фургон',
        desc: 'Малогабаритные грузы по городу. Грузчики и упаковка — по запросу',
        price: '3 000',
        time: 'От 1 ч',
        image: '/hero/move-slider-3.jpg',
      },
      {
        name: 'КАМАЗ / большой фургон',
        desc: 'Объёмные грузы и межгород. Фиксированная стоимость',
        price: '6 000',
        time: 'По запросу',
        image: '/hero/move-slider-0.jpg',
      },
    ],
  },
];

export const MOVE_HERO = {
  image: '/hero/move-hero.jpg',
  fallback: '/hero/move-hero.jpg',
};

export const MOVE_GALLERY: { image: string; fallback: string }[] = [
  { image: '/hero/move-slider-0.jpg', fallback: '/hero/move-slider-0.jpg' },
  { image: '/hero/move-slider-1.jpg', fallback: '/hero/move-slider-1.jpg' },
  { image: '/hero/move-slider-2.jpg', fallback: '/hero/move-slider-2.jpg' },
  { image: '/hero/move-slider-3.jpg', fallback: '/hero/move-slider-3.jpg' },
];

export const MOVE_BANNERS = {
  first: { image: '/hero/move-slider-2.jpg', fallback: '/hero/move-slider-2.jpg' },
  second: { image: '/hero/move-slider-3.jpg', fallback: '/hero/move-slider-3.jpg' },
  final: { image: '/hero/move-hero.jpg', fallback: '/hero/move-hero.jpg' },
};
