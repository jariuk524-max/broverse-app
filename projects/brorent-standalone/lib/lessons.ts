// SERVER-ONLY: уроки обязательного обучения мастеров — правила и тесты по
// направлениям. Дефолты (как в кабинете мастеров) хранятся здесь, правки
// руководителя — в Storage admin/master_lessons.json (вкладка «Обучение»
// в кабинете руководителя), оттуда их подтягивает кабинет мастеров через
// GET /api/lessons.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type LessonRule = {
  id: string;
  /** Ключ иконки (clock, wallet, shield, sparkles …) — монолит маппит на Lucide */
  icon: string;
  title: string;
  desc: string;
  /** Фото урока (URL из Storage), необязательно */
  image?: string;
};

export type LessonQuestion = {
  id: string;
  q: string;
  options: string[];
  /** Индекс правильного варианта */
  correct: number;
};

export type LessonBlock = {
  rules: LessonRule[];
  quiz: LessonQuestion[];
};

export type Lessons = {
  /** 3 общих правила + 3 общих вопроса теста */
  base: LessonBlock;
  /** Уроки по направлениям мастеров (cleaning, plumbing, …) */
  directions: Record<string, LessonBlock>;
};

const BUCKET = 'catalog-photos';
const FILE = 'admin/master_lessons.json';

/* ── Дефолты: перенос содержимого lib/training.ts монолита ── */

const BASE_RULES: LessonRule[] = [
  {
    id: 'base-r1',
    icon: 'clock',
    title: 'Ответ за 15 минут',
    desc: 'На заказ нужно отреагировать в течение 15 минут — так клиенты доверяют сервису.',
  },
  {
    id: 'base-r2',
    icon: 'wallet',
    title: 'Цена — только через кабинет',
    desc: 'Объём вырос — остановитесь и согласуйте новую цену через кабинет. Никаких доплат наличными.',
  },
  {
    id: 'base-r3',
    icon: 'shield',
    title: 'Отмена — за 2 часа',
    desc: 'Если не сможете приехать, отмените заказ не позднее чем за 2 часа — клиент получит другого мастера.',
  },
];

const PROFILE_RULES: Record<string, LessonRule> = {
  cleaning: {
    id: 'cleaning-r1',
    icon: 'sparkles',
    title: 'Бережная чистка',
    desc: 'Проверяем средство на незаметном участке, снимаем кольца и украшения, мебель передвигаем вдвоём — ткань и поверхности должны остаться целыми.',
  },
  plumbing: {
    id: 'plumbing-r1',
    icon: 'droplets',
    title: 'Вода перекрыта',
    desc: 'Перед работой перекрываем подачу воды и ставим таз под стык; после сборки проверяем сухость каждого соединения, прежде чем уезжать.',
  },
  electric: {
    id: 'electric-r1',
    icon: 'zap',
    title: 'Только обесточенная линия',
    desc: 'Обязательно обесточиваем линию и проверяем индикатором; автоматы включаем только после полной сборки и осмотра.',
  },
  repair: {
    id: 'repair-r1',
    icon: 'hammer',
    title: 'Пыль под контролем',
    desc: 'Рабочее место застилаем плёнкой, пыль собираем пылесосом по ходу, после себя убираем — клиент принимает чистый объект.',
  },
  appliance: {
    id: 'appliance-r1',
    icon: 'wrench',
    title: 'Диагностика до разборки',
    desc: 'Сначала диагностика и понятная оценка стоимости клиенту, потом разборка; запчасти заказываем только после согласования.',
  },
  electronics: {
    id: 'electronics-r1',
    icon: 'smartphone',
    title: 'Данные клиента неприкосновенны',
    desc: 'Рекомендуем бэкап до работ; содержимое устройства не читаем и не передаём, результат показываем при клиенте.',
  },
  moving: {
    id: 'moving-r1',
    icon: 'package',
    title: 'Хрупкое — в помеченные короба',
    desc: 'Хрупкое оборачиваем в плёнку и маркируем, тяжёлое поднимаем с правильной техникой, мебель защищаем плёнкой — груз доезжает целым.',
  },
  rental: {
    id: 'rental-r1',
    icon: 'hardhat',
    title: 'Проверка перед выдачей',
    desc: 'Проверяем инструмент, заряд и комплект, показываем, как безопасно работать; при возврате принимаем при клиенте и сверяем комплектность.',
  },
  garden: {
    id: 'garden-r1',
    icon: 'leaf',
    title: 'Сезон и чистота участка',
    desc: 'Косим в сухую погоду и в допустимые часы, скошенное собираем и вывозим, технику используем с защитой и по инструкции.',
  },
};

const DEFAULT_RULE: LessonRule = {
  id: 'default-r1',
  icon: 'wrench',
  title: 'Диагностика и точная цена',
  desc: 'Сначала диагностика и согласование стоимости с клиентом, потом работа; всё сверх договорённости — только через кабинет.',
};

const BASE_QUIZ: LessonQuestion[] = [
  {
    id: 'base-q1',
    q: 'Сколько времени мастер отвечает на заказ?',
    options: ['1 час', '15 минут', 'Сутки', 'Ответ не обязателен'],
    correct: 1,
  },
  {
    id: 'base-q2',
    q: 'Объём работ на объекте вырос — что делает мастер?',
    options: [
      'Останавливается и согласует новую цену через кабинет',
      'Берёт доплату наличными',
      'Продолжает, а цену выставит потом',
    ],
    correct: 0,
  },
  {
    id: 'base-q3',
    q: 'Отмена заказа — не позднее чем…',
    options: ['В любой момент', 'За 30 минут до визита', 'За 2 часа до визита'],
    correct: 2,
  },
];

const PROFILE_QUIZ: Record<string, LessonQuestion[]> = {
  cleaning: [
    {
      id: 'cleaning-q1',
      q: 'Деликатная ткань, свежее пятно — с чего начинаете?',
      options: ['Тестируем средство на незаметном участке', 'Сразу льём средство на пятно', 'Трём щёткой на сухую'],
      correct: 0,
    },
    {
      id: 'cleaning-q2',
      q: 'Что говорите клиенту после экстракционной чистки?',
      options: ['Поверхность сохнет несколько часов — пользоваться пока нельзя', 'Всё готово сразу, можно садиться', 'Ничего — сам разберётся'],
      correct: 0,
    },
  ],
  plumbing: [
    {
      id: 'plumbing-q1',
      q: 'Перед заменой смесителя первым делом?',
      options: ['Перекрыть воду и сбросить давление', 'Открыть оба крана', 'Сразу раскручивать гайки'],
      correct: 0,
    },
    {
      id: 'plumbing-q2',
      q: 'Собрали стык — что делаете до отъезда?',
      options: ['Проверяем сухость стыков под давлением', 'Включаем воду и уезжаем', 'Просим клиента проверить завтра'],
      correct: 0,
    },
  ],
  electric: [
    {
      id: 'electric-q1',
      q: 'С чего начинаются работы с электрикой?',
      options: ['Обесточить линию и проверить индикатором', 'Проверить напряжение на живом проводе', 'Это не имеет значения'],
      correct: 0,
    },
    {
      id: 'electric-q2',
      q: 'Розетка греется под нагрузкой — ваше действие?',
      options: [
        'Снять розетку, проверить контакты и линию, устранить до включения мощной техники',
        'Посоветовать пользоваться аккуратнее',
        'Заменить розетку, не проверяя линию',
      ],
      correct: 0,
    },
  ],
  repair: [
    {
      id: 'repair-q1',
      q: 'Что делаете с пылью во время работ?',
      options: ['Застилаем плёнкой и собираем пыль пылесосом по ходу', 'Уберём потом, если клиент попросит', 'Пусть пылит — это нормально'],
      correct: 0,
    },
    {
      id: 'repair-q2',
      q: 'Когда убираете за собой?',
      options: ['Сразу по завершении — до приёмки работ', 'На следующий день', 'Только по отдельной договорённости и доплате'],
      correct: 0,
    },
  ],
  appliance: [
    {
      id: 'appliance-q1',
      q: 'Холодильник не морозит — что делаете первым?',
      options: ['Диагностика: компрессор, датчики, фреон — и только потом разборка', 'Сразу меняем компрессор', 'Сразу говорим «нужно заправить»'],
      correct: 0,
    },
    {
      id: 'appliance-q2',
      q: 'Ремонт по итогу невыгоден клиенту — что предлагаете?',
      options: ['Честную альтернативу: не чинить то, что по цене почти как новое', 'Всё равно чиним — раз уже приехали', 'Меняем детали без разговора'],
      correct: 0,
    },
  ],
  electronics: [
    {
      id: 'electronics-q1',
      q: 'После замены дисплея проверяете?',
      options: ['Face ID, True Tone и качество экрана при клиенте', 'Только что экран включается', 'Ничего — гарантия есть'],
      correct: 0,
    },
    {
      id: 'electronics-q2',
      q: 'Что делаете с данными устройства?',
      options: ['Не читаем и не передаём, заранее советуем бэкап', 'Просматриваем содержимое для диагностики', 'Копируем на свой носитель «на всякий случай»'],
      correct: 0,
    },
  ],
  moving: [
    {
      id: 'moving-q1',
      q: 'Как готовите хрупкое к перевозке?',
      options: ['В плёнку и короба с пометкой «Хрупкое»', 'Как есть — просто положу аккуратно', 'В верх кузова без фиксации'],
      correct: 0,
    },
    {
      id: 'moving-q2',
      q: 'Груз в кузове фиксируете?',
      options: ['Да, ремнями и упорами — ничто не ездит по дороге', 'Просто закрываем двери', 'Фиксация не нужна'],
      correct: 0,
    },
  ],
  rental: [
    {
      id: 'rental-q1',
      q: 'Что делаете при выдаче инструмента?',
      options: ['Проверяем работу, заряд и комплект, показываем, как безопасно работать', 'Отдаём коробку как есть', 'Ждём — позвонит, если что-то не так'],
      correct: 0,
    },
    {
      id: 'rental-q2',
      q: 'Клиент возвращает инструмент — приёмка?',
      options: ['Осматриваем комплект и состояние при клиенте, замечания фиксируем', 'Принимаем молча', 'Сразу выставляем счёт за любые царапины'],
      correct: 0,
    },
  ],
  garden: [
    {
      id: 'garden-q1',
      q: 'Когда косите газон?',
      options: ['В сухую погоду, в допустимые часы, в защитной экипировке', 'В любую погоду — лишь бы быстрее', 'Под дождём: трава мягче'],
      correct: 0,
    },
    {
      id: 'garden-q2',
      q: 'Куда деть скошенную траву?',
      options: ['Собираем и вывозим или компостируем по договорённости', 'Оставляем на газоне', 'Сжигаем прямо на участке'],
      correct: 0,
    },
  ],
};

const DEFAULT_PROFILE_QUIZ: LessonQuestion[] = [
  {
    id: 'default-q1',
    q: 'Не уверены в причине неисправности — что делаете?',
    options: ['Диагностируете и объявляете стоимость до начала работ', 'Начинаете разбирать и посмотрим', 'Говорите «починится, если повезёт»'],
    correct: 0,
  },
  {
    id: 'default-q2',
    q: 'Клиент недоволен результатом — ваш шаг?',
    options: ['Эскалируете в поддержку через кабинет и решаете вопрос вместе', 'Спорите и уходите', 'Просите написать жалобу прямо в чат'],
    correct: 0,
  },
];

/** Направления с уроками (ключи совпадают с профилем мастера) */
export const LESSON_DIRECTIONS = ['cleaning', 'plumbing', 'electric', 'repair', 'appliance', 'electronics', 'moving', 'rental', 'garden'];

export function defaultLessons(): Lessons {
  const directions: Record<string, LessonBlock> = {};
  for (const id of LESSON_DIRECTIONS) {
    directions[id] = {
      rules: [PROFILE_RULES[id] ?? DEFAULT_RULE],
      quiz: PROFILE_QUIZ[id] ?? DEFAULT_PROFILE_QUIZ,
    };
  }
  return { base: { rules: BASE_RULES, quiz: BASE_QUIZ }, directions };
}

function client(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Лёгкая валидация структуры уроков, присланной из кабинета */
function sanitize(raw: unknown): Lessons | null {
  const o = raw as { base?: LessonBlock; directions?: Record<string, LessonBlock> } | null;
  if (!o || typeof o !== 'object') return null;
  if (!o.base || !Array.isArray(o.base.rules) || !Array.isArray(o.base.quiz)) return null;
  if (!o.directions || typeof o.directions !== 'object') return null;

  const rule = (r: LessonRule): LessonRule => ({
    id: String(r?.id || `r_${Math.random().toString(36).slice(2, 8)}`).slice(0, 40),
    icon: String(r?.icon || 'wrench').slice(0, 30),
    title: String(r?.title || '').trim().slice(0, 120),
    desc: String(r?.desc || '').trim().slice(0, 600),
    image: r?.image ? String(r.image).slice(0, 300) : undefined,
  });
  const question = (q: LessonQuestion): LessonQuestion => {
    const options = (Array.isArray(q?.options) ? q.options : []).map((x) => String(x).trim().slice(0, 160)).slice(0, 6);
    const correct = Math.min(Math.max(Number(q?.correct) || 0, 0), Math.max(options.length - 1, 0));
    return {
      id: String(q?.id || `q_${Math.random().toString(36).slice(2, 8)}`).slice(0, 40),
      q: String(q?.q || '').trim().slice(0, 400),
      options,
      correct,
    };
  };

  const directions: Record<string, LessonBlock> = {};
  for (const [id, b] of Object.entries(o.directions)) {
    if (!Array.isArray(b?.rules) || !Array.isArray(b?.quiz)) continue;
    directions[id.slice(0, 30)] = {
      rules: b.rules.filter((r) => r?.title).map(rule).slice(0, 20),
      quiz: b.quiz.filter((q) => q?.q && Array.isArray(q.options) && q.options.length >= 2).map(question).slice(0, 30),
    };
  }

  return {
    base: {
      rules: o.base.rules.filter((r) => r?.title).map(rule).slice(0, 20),
      quiz: o.base.quiz.filter((q) => q?.q).map(question).slice(0, 30),
    },
    directions,
  };
}

/** Уроки: правки руководителя из Storage, иначе дефолты */
export async function getLessons(): Promise<Lessons> {
  const db = client();
  if (db) {
    const { data } = await db.storage.from(BUCKET).download(FILE);
    if (data) {
      try {
        const json = JSON.parse(await data.text());
        const clean = sanitize(json?.lessons);
        if (clean) return clean;
      } catch {
        /* повреждённый JSON — дефолты ниже */
      }
    }
  }
  return defaultLessons();
}

/** Сохранить отредактированные уроки */
export async function saveLessons(raw: unknown): Promise<{ ok: boolean; lessons?: Lessons; error?: string }> {
  const lessons = sanitize(raw);
  if (!lessons) return { ok: false, error: 'Некорректная структура уроков' };
  const db = client();
  if (!db) return { ok: false, error: 'Storage не настроен' };
  const body = JSON.stringify({ lessons }, null, 2);
  const { error } = await db.storage.from(BUCKET).upload(FILE, body, {
    contentType: 'application/json',
    upsert: true,
  });
  if (error) return { ok: false, error: 'Не удалось сохранить уроки' };
  return { ok: true, lessons };
}
