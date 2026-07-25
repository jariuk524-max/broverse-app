'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, ArrowRight, Camera, Sparkles, Loader2, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { BRO_DOMAINS, type BroDomain } from '@/lib/domains';

type SearchResult = {
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
  'переезд': [
    { domain: 'move', service: 'Квартирные переезды', confidence: 0.95, reason: 'Переезд — услуга BroMove' },
    { domain: 'move', service: 'Офисные переезды', confidence: 0.8, reason: 'Возможно офисный переезд' },
  ],
  'мебель': [
    { domain: 'move', service: 'Сборка мебели', confidence: 0.9, reason: 'Сборка мебели — услуга BroMove' },
    { domain: 'wash', service: 'Химчистка диванов', confidence: 0.7, reason: 'Возможно чистка мебели' },
  ],
  'iphone': [
    { domain: 'frame', service: 'Замена дисплеев', confidence: 0.95, reason: 'iPhone — электроника BroFrame' },
    { domain: 'frame', service: 'Замена аккумуляторов', confidence: 0.8, reason: 'Частая проблема iPhone' },
  ],
  'телефон': [
    { domain: 'frame', service: 'Замена дисплеев', confidence: 0.9, reason: 'Телефон — электроника' },
    { domain: 'frame', service: 'Восстановление после воды', confidence: 0.6, reason: 'Возможно залитие' },
  ],
  'ноутбук': [
    { domain: 'frame', service: 'Чистка от пыли', confidence: 0.9, reason: 'Ноутбук нуждается в чистке' },
    { domain: 'frame', service: 'Апгрейд', confidence: 0.7, reason: 'Возможно апгрейд SSD/ОЗУ' },
  ],
  'холодильник': [
    { domain: 'build', service: 'Ремонт холодильников', confidence: 0.95, reason: 'Холодильник — бытовая техника' },
  ],
  'стиральная машина': [
    { domain: 'build', service: 'Ремонт бытовой техники', confidence: 0.9, reason: 'Стиральная машина — техника' },
  ],
  'розетка': [
    { domain: 'build', service: 'Установка розеток', confidence: 0.95, reason: 'Розетка — электрика' },
  ],
  'свет': [
    { domain: 'build', service: 'Замена проводки', confidence: 0.8, reason: 'Проблемы со светом — электрика' },
  ],
  'вода': [
    { domain: 'build', service: 'Устранение протечек', confidence: 0.9, reason: 'Протечка воды — сантехника' },
    { domain: 'frame', service: 'Восстановление после воды', confidence: 0.7, reason: 'Залитая техника' },
  ],
  'пылесос': [
    { domain: 'frame', service: 'Ремонт моющих роботов', confidence: 0.9, reason: 'Пылесос — техника' },
    { domain: 'rent', service: 'Пылесосы Karcher', confidence: 0.8, reason: 'Аренда пылесоса' },
  ],
  'кондиционер': [
    { domain: 'build', service: 'Климат-техника', confidence: 0.95, reason: 'Кондиционер — климат-техника' },
  ],
  'кофе': [
    { domain: 'build', service: 'Кофемашины', confidence: 0.95, reason: 'Кофемашина — бытовая техника' },
  ],
  'ковер': [
    { domain: 'wash', service: 'Ковры и ковролин', confidence: 0.95, reason: 'Ковёр — текстиль' },
  ],
  'шторы': [
    { domain: 'wash', service: 'Шторы и тюль', confidence: 0.95, reason: 'Шторы — текстиль' },
  ],
  'авто': [
    { domain: 'wash', service: 'Химчистка салона', confidence: 0.9, reason: 'Автомобиль — чистка салона' },
  ],
  'машин': [
    { domain: 'wash', service: 'Химчистка салона', confidence: 0.85, reason: 'Автомобиль — чистка салона' },
  ],
  'дом': [
    { domain: 'frame', service: 'Wi-Fi мосты', confidence: 0.7, reason: 'Умный дом — настройка' },
    { domain: 'frame', service: 'Голосовые ассистенты', confidence: 0.6, reason: 'Яндекс/Apple Home' },
  ],
  'умный': [
    { domain: 'frame', service: 'Wi-Fi мосты', confidence: 0.9, reason: 'Умный дом — настройка' },
    { domain: 'frame', service: 'Видеонаблюдение', confidence: 0.8, reason: 'Камеры умного дома' },
  ],
  'робот': [
    { domain: 'frame', service: 'Ремонт моющих роботов', confidence: 0.95, reason: 'Робот-пылесос' },
  ],
  'груз': [
    { domain: 'move', service: 'Манипулятор', confidence: 0.9, reason: 'Грузоперевозки' },
  ],
  'газель': [
    { domain: 'move', service: 'Квартирный таксомотор', confidence: 0.95, reason: 'Газель — грузоперевозки' },
  ],
  'квартир': [
    { domain: 'move', service: 'Квартирные переезды', confidence: 0.9, reason: 'Квартирный переезд' },
  ],
  'офис': [
    { domain: 'move', service: 'Офисные переезды', confidence: 0.9, reason: 'Офисный переезд' },
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
  'смесител': [
    { domain: 'build', service: 'Замена смесителей', confidence: 0.95, reason: 'Смеситель — сантехника' },
  ],
  'унитаз': [
    { domain: 'build', service: 'Установка унитазов', confidence: 0.95, reason: 'Унитаз — сантехника' },
  ],
  'душ': [
    { domain: 'build', service: 'Ремонт душевых', confidence: 0.9, reason: 'Душ — сантехника' },
  ],
  'проводк': [
    { domain: 'build', service: 'Замена проводки', confidence: 0.95, reason: 'Проводка — электрика' },
  ],
};

const PHOTO_ANALYSIS: Record<string, { domain: string; service: string; confidence: number }[]> = {
  'murniture': [{ domain: 'wash', service: 'Химчистка диванов', confidence: 0.9 }],
  'sofa': [{ domain: 'wash', service: 'Химчистка диванов', confidence: 0.95 }],
  'couch': [{ domain: 'wash', service: 'Химчистка диванов', confidence: 0.95 }],
  'chair': [{ domain: 'wash', service: 'Химчистка кресел', confidence: 0.9 }],
  'mattress': [{ domain: 'wash', service: 'Чистка матрасов', confidence: 0.95 }],
  'window': [{ domain: 'wash', service: 'Мойка окон', confidence: 0.9 }],
  'carpet': [{ domain: 'wash', service: 'Ковры и ковролин', confidence: 0.95 }],
  'curtain': [{ domain: 'wash', service: 'Шторы и тюль', confidence: 0.9 }],
  'phone': [{ domain: 'frame', service: 'Замена дисплеев', confidence: 0.85 }],
  'laptop': [{ domain: 'frame', service: 'Чистка от пыли', confidence: 0.85 }],
  'fridge': [{ domain: 'build', service: 'Ремонт холодильников', confidence: 0.9 }],
  'washing_machine': [{ domain: 'build', service: 'Ремонт бытовой техники', confidence: 0.85 }],
  'car': [{ domain: 'wash', service: 'Химчистка салона', confidence: 0.8 }],
  'robot': [{ domain: 'frame', service: 'Ремонт моющих роботов', confidence: 0.9 }],
  'box': [{ domain: 'move', service: 'Квартирные переезды', confidence: 0.8 }],
  'truck': [{ domain: 'move', service: 'Квартирный таксомотор', confidence: 0.9 }],
};

const QUICK_SUGGESTIONS = [
  { text: 'Химчистка дивана', query: 'диван', icon: '🛋️' },
  { text: 'Замена экрана', query: 'iphone', icon: '📱' },
  { text: 'Переезд', query: 'переезд', icon: '🚚' },
  { text: 'Ремонт техники', query: 'холодильник', icon: '🔧' },
  { text: 'Мойка окон', query: 'окна', icon: '🪟' },
  { text: 'Аренда инструмента', query: 'пылесос', icon: '🧹' },
];

function analyzeIntent(query: string): AIIntent[] {
  const q = query.toLowerCase().trim();
  const results: AIIntent[] = [];

  for (const [keyword, intents] of Object.entries(INTENT_MAP)) {
    if (q.includes(keyword)) {
      results.push(...intents);
    }
  }

  if (results.length === 0) {
    const words = q.split(/\s+/);
    for (const word of words) {
      for (const [keyword, intents] of Object.entries(INTENT_MAP)) {
        if (word.includes(keyword) || keyword.includes(word)) {
          results.push(...intents);
        }
      }
    }
  }

  return results
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

function getSearchResults(query: string): SearchResult[] {
  const intents = analyzeIntent(query);
  const results: SearchResult[] = [];

  for (const intent of intents) {
    const domain = BRO_DOMAINS.find((d) => d.id === intent.domain);
    if (!domain) continue;

    const category = domain.categories.find((cat) =>
      cat.items.some((item) => item.name === intent.service)
    );
    const serviceItem = category?.items.find((item) => item.name === intent.service);

    if (serviceItem) {
      results.push({
        domain,
        category: category?.name,
        service: serviceItem.name,
        description: serviceItem.description,
        confidence: intent.confidence,
      });
    }
  }

  const q = query.toLowerCase();
  BRO_DOMAINS.forEach((domain) => {
    domain.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        if (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        ) {
          const exists = results.some(
            (r) => r.domain.id === domain.id && r.service === item.name
          );
          if (!exists) {
            results.push({
              domain,
              category: cat.name,
              service: item.name,
              description: item.description,
              confidence: 0.7,
            });
          }
        }
      });
    });
  });

  return results
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);
}

export default function SmartSearch({ query: externalQuery, onQueryChange }: { query?: string; onQueryChange?: (q: string) => void } = {}) {
  const [internalQuery, setInternalQuery] = useState('');
  const query = externalQuery !== undefined ? externalQuery : internalQuery;
  const setQuery = onQueryChange || setInternalQuery;
  const [isOpen, setIsOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return getSearchResults(query);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickClick = (text: string) => {
    setQuery(text);
    setIsOpen(true);
    setAiSuggestion(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsAnalyzing(true);
    setIsOpen(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const analyses = [
      { text: 'Диван с пятнами', suggestion: 'Химчистка диванов', domain: 'wash' },
      { text: 'Грязные окна', suggestion: 'Мойка окон', domain: 'wash' },
      { text: 'Сломанный экран', suggestion: 'Замена дисплеев', domain: 'frame' },
      { text: 'Грузовые коробки', suggestion: 'Квартирные переезды', domain: 'move' },
      { text: 'Холодильник', suggestion: 'Ремонт холодильников', domain: 'build' },
    ];

    const analysis = analyses[Math.floor(Math.random() * analyses.length)];
    setAiSuggestion(analysis.text);
    setQuery(analysis.suggestion);
    setIsAnalyzing(false);
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.7) return 'text-blue-600 bg-blue-50';
    return 'text-zinc-500 bg-zinc-50';
  };

  return (
    <>
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto mb-6 sm:mb-8 px-4 sm:px-0">
      <div
        className={`relative flex items-center gap-2 sm:gap-3 rounded-[24px] border-2 bg-white/70 backdrop-blur-xl px-3 sm:px-5 py-3 sm:py-4 shadow-lg border-white/60 transition-all ${
          isOpen ? 'border-zinc-400 shadow-xl' : 'border-zinc-200'
        }`}
      >
        <Search size={18} className="text-zinc-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setAiSuggestion(null);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Что нужно починить или почистить?"
          className="flex-1 bg-transparent text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none min-w-0"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all shrink-0 ${
            isAnalyzing
              ? 'bg-blue-100 text-blue-600'
              : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600'
          }`}
          title="Загрузить фото для AI-анализа"
        >
          {isAnalyzing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Camera size={16} />
          )}
        </button>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setPhotoPreview(null);
              setAiSuggestion(null);
              inputRef.current?.focus();
            }}
            className="p-1 rounded-full hover:bg-zinc-100 transition-colors shrink-0"
          >
            <X size={14} className="text-zinc-400" />
          </button>
        )}
      </div>

      {photoPreview && (
        <div className="mt-3 flex items-center gap-2 sm:gap-3 px-4 sm:px-0">
          <div className="relative">
            <img
              src={photoPreview}
              alt="Загруженное фото"
              className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg sm:rounded-xl object-cover border-2 border-zinc-200"
            />
            <button
              type="button"
              onClick={() => {
                setPhotoPreview(null);
                setAiSuggestion(null);
              }}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
              <Sparkles size={12} className="animate-pulse" />
              AI анализирует...
            </div>
          )}
          {aiSuggestion && !isAnalyzing && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
              <Sparkles size={12} />
              {aiSuggestion}
            </div>
          )}
        </div>
      )}

      {!query && !isOpen && !photoPreview && null}

      {isOpen && (query.trim() || isAnalyzing) && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-[24px] bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl overflow-hidden z-50 mx-0 sm:mx-0">
          {isAnalyzing ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="inline-flex items-center gap-2 sm:gap-3 text-blue-600">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs sm:text-sm font-bold">AI анализирует фото...</span>
              </div>
              <p className="mt-2 text-[10px] sm:text-xs text-zinc-400">
                Распознаём объект и подбираем решение
              </p>
            </div>
          ) : results.length > 0 ? (
            <div>
              {aiSuggestion && (
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className="text-blue-600" />
                    <span className="text-[10px] sm:text-xs font-bold text-blue-700">AI рекомендация</span>
                  </div>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-zinc-700">{aiSuggestion}</p>
                </div>
              )}
              <div className="divide-y divide-zinc-100 max-h-[50vh] overflow-y-auto">
                {results.map((result, i) => (
                  <Link
                    key={`${result.domain.id}-${result.service}-${i}`}
                    href={`/services/${result.domain.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-zinc-50 transition-colors group"
                  >
                    <div
                      className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl text-white text-xs sm:text-sm font-black"
                      style={{ backgroundColor: result.domain.bgClass.includes('#') ? result.domain.bgClass.replace('bg-[', '').replace(']', '') : '#666' }}
                    >
                      {result.domain.brand.charAt(3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-[10px] sm:text-xs font-bold text-zinc-500">{result.domain.brand}</span>
                        {result.category && (
                          <span className="text-[9px] sm:text-[10px] text-zinc-400">• {result.category}</span>
                        )}
                        <span className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full ${getConfidenceColor(result.confidence)}`}>
                          {Math.round(result.confidence * 100)}%
                        </span>
                      </div>
                      <p
                        className="mt-0.5 text-xs sm:text-sm font-bold text-zinc-900 truncate"
                        dangerouslySetInnerHTML={{ __html: highlightMatch(result.service, query) }}
                      />
                      <p
                        className="mt-0.5 text-[10px] sm:text-xs text-zinc-500 truncate"
                        dangerouslySetInnerHTML={{ __html: highlightMatch(result.description, query) }}
                      />
                    </div>
                    <ArrowRight
                      size={14}
                      className="mt-2 text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-1 transition-all shrink-0"
                    />
                  </Link>
                ))}
              </div>
            </div>
          ) : query.trim() ? (
            <div className="p-6 sm:p-8 text-center">
              <p className="text-xs sm:text-sm font-bold text-zinc-500">Ничего не найдено</p>
              <p className="mt-1 text-[10px] sm:text-xs text-zinc-400">Попробуйте загрузить фото или изменить запрос</p>
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-zinc-900 px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-white hover:bg-zinc-800 transition-colors"
                >
                  <Camera size={10} />
                  Фото
                </button>
                <Link
                  href="/services/wash"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-zinc-100 px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition-colors"
                >
                  Заявка
                  <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>

      {/* Suggestions carousel */}
      {!query && !photoPreview && (
        <div className="px-4 sm:px-0 mt-3">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1" style={{ scrollbarWidth: 'none' }}>
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s.query}
                type="button"
                onClick={() => handleQuickClick(s.query)}
                className="flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-zinc-50 border border-zinc-100 snap-start shrink-0 active:scale-95 transition-transform"
              >
                <div className="w-9 h-9 rounded-full shadow-sm bg-white flex items-center justify-center text-lg">{s.icon}</div>
                <span className="text-[13px] font-semibold text-zinc-700 whitespace-nowrap">{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
