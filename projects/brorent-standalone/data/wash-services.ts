export type WashService = {
  name: string;
  desc: string;
  price: string;
  time: string;
  image: string;
  fallback: string;
};

export const WASH_SERVICES: WashService[] = [
  {
    name: 'Кресло',
    desc: 'Химчистка кресла с подлокотниками',
    price: '1000',
    time: '1 ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-1783454885323.jpg',
    fallback: '/hero/wash-Химчистка_кресла-0.jpg',
  },
  {
    name: 'Диван прямой',
    desc: 'Химчистка прямого дивана шириной с подлокотниками до 150 см',
    price: '1500',
    time: '30м до 1ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-1.jpg',
    fallback: '/hero/wash-Химчистка_дивана-0.jpg',
  },
  {
    name: 'Диван прямой 150-200',
    desc: 'Химчистка прямого дивана шириной с подлокотниками от 150 до 200 см',
    price: '2500',
    time: '1-2 ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-2.jpg',
    fallback: '/hero/wash-Химчистка_дивана-1.jpg',
  },
  {
    name: 'Диван прямой 201-260',
    desc: 'Химчистка прямого дивана шириной с подлокотниками от 201 до 260 см',
    price: '3000',
    time: '1-2 ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-3.jpg',
    fallback: '/hero/wash-Химчистка_дивана-2.jpg',
  },
  {
    name: 'Диван прямой 261-320',
    desc: 'Химчистка большого прямого дивана шириной с подлокотниками от 261 до 320 см',
    price: '3750',
    time: '1-2 ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-4.jpg',
    fallback: '/hero/wash-Химчистка_дивана-3.jpg',
  },
  {
    name: 'Диван угловой',
    desc: 'Химчистка углового дивана шириной с подлокотниками до 220 см',
    price: '3000',
    time: '2-3 ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-5.jpg',
    fallback: '/hero/wash-Химчистка_дивана-4.jpg',
  },
  {
    name: 'Диван угловой 220-280',
    desc: 'Химчистка углового дивана шириной с подлокотниками от 220 до 280 см',
    price: '3800',
    time: '3-4 ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-6.jpg',
    fallback: '/hero/wash-Химчистка_дивана-5.jpg',
  },
  {
    name: 'Диван угловой 280-340',
    desc: 'Химчистка углового дивана шириной с подлокотниками от 280 до 340 см',
    price: '4500',
    time: '1.5-2.5 ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-7.jpg',
    fallback: '/hero/wash-slider-0.jpg',
  },
  {
    name: 'Диван угловой 341-400',
    desc: 'Химчистка углового дивана с подлокотниками шириной от 341 до 400 см',
    price: '6000',
    time: '1-2.5 ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-8.jpg',
    fallback: '/hero/wash-slider-1.jpg',
  },
  {
    name: 'Двухспальный матрас',
    desc: 'Химчистка дивана с двуспальным матрасом 180 х 200 см',
    price: '2800',
    time: '1-2 ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-1783454602509.jpg',
    fallback: '/hero/wash-slider-2.jpg',
  },
  {
    name: 'Кровать с изголовьем',
    desc: 'Химчистка кровати с матрасом 180 х 90 см',
    price: '2200',
    time: '1 ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-1783454714595.jpg',
    fallback: '/hero/wash-slider-3.jpg',
  },
  {
    name: 'Кресло кровать',
    desc: 'Химчистка кресла кровати со спальным местом',
    price: '2400',
    time: '1-1.5 ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-1783454793751.jpg',
    fallback: '/hero/wash-Химчистка_кресла-1.jpg',
  },
  {
    name: 'Матрас 190х80',
    desc: 'Химчистка матраса 190см х 80см',
    price: '2000',
    time: '1 ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-1783543950056.jpg',
    fallback: '/hero/wash-slider-4.jpg',
  },
  {
    name: 'Матрас 200х160',
    desc: 'Химчистка матраса 200см х 160см',
    price: '2800',
    time: '1 ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-1783544054262.jpg',
    fallback: '/hero/wash-slider-5.jpg',
  },
  {
    name: 'Съемная подушка до 30',
    desc: 'Ширина до 30 см',
    price: '300',
    time: '15 м',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-1783455049130.jpg',
    fallback: '/hero/wash-Химчистка_кресла-2.jpg',
  },
  {
    name: 'Съемная подушка 30-70',
    desc: 'Ширина от 30 до 70 см',
    price: '500',
    time: '15-20 м',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-1783455102245.jpg',
    fallback: '/hero/wash-Test-0.jpg',
  },
  {
    name: 'Съемная подушка 70-100',
    desc: 'Ширина от 70 до 100 см',
    price: '650',
    time: '20-25 м',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-1783455132001.jpg',
    fallback: '/hero/wash-Test-1.jpg',
  },
  {
    name: 'Кухонный уголок',
    desc: 'Химчистка кухонного уголка 110 х 150 см',
    price: '2300',
    time: '1-1.5 ч',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-1783455197393.jpg',
    fallback: '/hero/wash-Химчистка_дивана-0.jpg',
  },
  {
    name: 'Стул 2 стороны',
    desc: 'Стул с мягкой спинкой (2 стороны)',
    price: '550',
    time: '10 м',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-1783455323053.jpg',
    fallback: '/hero/wash-Химчистка_кресла-0.jpg',
  },
  {
    name: 'Стул 1 сторона',
    desc: 'Химчистка стула с мягкой спинкой (1 сторона)',
    price: '450',
    time: '10 м',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-1783455439645.jpg',
    fallback: '/hero/wash-Химчистка_кресла-1.jpg',
  },
  {
    name: 'Стул сидушка',
    desc: 'Химчистка стула с мягкой сидушкой',
    price: '350',
    time: '15 м',
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/wash-1783455494056.jpg',
    fallback: '/hero/wash-Химчистка_кресла-2.jpg',
  },
];

export const WASH_HERO = {
  image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784832911022-0.jpg',
  fallback: '/hero/wash-hero.jpg',
};

export const WASH_GALLERY: { image: string; fallback: string }[] = [
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784829718033-0.jpg', fallback: '/hero/wash-slider-0.jpg' },
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784829719101-1.jpg', fallback: '/hero/wash-slider-1.jpg' },
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784829719904-2.jpg', fallback: '/hero/wash-slider-2.jpg' },
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784829721451-3.jpg', fallback: '/hero/wash-slider-3.jpg' },
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784829722641-4.jpg', fallback: '/hero/wash-slider-4.jpg' },
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784829723522-5.jpg', fallback: '/hero/wash-slider-5.jpg' },
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784829724804-6.jpg', fallback: '/hero/wash-Химчистка_дивана-1.jpg' },
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784829725709-7.jpg', fallback: '/hero/wash-Химчистка_дивана-3.jpg' },
];

export const WASH_WORKS: { image: string; fallback: string }[] = [
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784819773071-0.jpg', fallback: '/hero/wash-Химчистка_дивана-0.jpg' },
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784819776572-1.jpg', fallback: '/hero/wash-Химчистка_дивана-1.jpg' },
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784819777903-2.jpg', fallback: '/hero/wash-Химчистка_дивана-2.jpg' },
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784819779131-3.jpg', fallback: '/hero/wash-Химчистка_дивана-3.jpg' },
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784819780664-4.jpg', fallback: '/hero/wash-Химчистка_дивана-4.jpg' },
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784819782001-5.jpg', fallback: '/hero/wash-Химчистка_дивана-5.jpg' },
  { image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784819783639-6.jpg', fallback: '/hero/wash-Химчистка_кресла-0.jpg' },
];

export const WASH_BANNERS = {
  first: {
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784830753959-0.jpg',
    fallback: '/hero/wash-Химчистка_дивана-4.jpg',
  },
  second: {
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784834052028-0.jpg',
    fallback: '/hero/wash-Химчистка_дивана-5.jpg',
  },
  final: {
    image: 'https://bnopcchgcnkzcvduxwth.supabase.co/storage/v1/object/public/catalog-photos/browash-photo-1784801082121-0.jpg',
    fallback: '/hero/wash-slider-2.jpg',
  },
};
