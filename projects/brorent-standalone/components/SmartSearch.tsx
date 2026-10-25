'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, ArrowRight, Camera, Sparkles, Loader2, ImageIcon, User } from 'lucide-react';
import Link from 'next/link';
import { POPULAR_QUERIES } from '@/lib/popular-queries';
import { getSearchResults } from '@/lib/smart-search';
import type { Chip, LiveService, SearchIndex } from '@/lib/search-types';
import type { MasterAd } from '@/lib/master-ads';

export default function SmartSearch({ query: externalQuery, onQueryChange, onMasterAdClick }: { query?: string; onQueryChange?: (q: string) => void; onMasterAdClick?: (ad: MasterAd) => void } = {}) {
  const [internalQuery, setInternalQuery] = useState('');
  const query = externalQuery !== undefined ? externalQuery : internalQuery;
  const setQuery = onQueryChange || setInternalQuery;
  const [isOpen, setIsOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [masterAds, setMasterAds] = useState<MasterAd[]>([]);
  /** Живой индекс: услуги из правок админки/модерации + чипы из кабинета руководителя */
  const [liveServices, setLiveServices] = useState<LiveService[]>([]);
  const [chips, setChips] = useState<Chip[]>(() =>
    POPULAR_QUERIES.map((c) => ({ text: c.text, query: c.query, img: c.img }))
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/masters/ads')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMasterAds(data as MasterAd[]);
      })
      .catch(() => {});
    fetch('/api/search-index')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SearchIndex | null) => {
        if (!data) return;
        if (Array.isArray(data.services) && data.services.length > 0) setLiveServices(data.services);
        if (Array.isArray(data.chips) && data.chips.length > 0) setChips(data.chips);
      })
      .catch(() => {});
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return getSearchResults(query, liveServices);
  }, [query, liveServices]);

  const masterResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || masterAds.length === 0) return [];
    const words = q.split(/\s+/).filter((w) => w.length > 2);
    const scored = masterAds
      .map((ad) => {
        const title = (ad.title || '').toLowerCase();
        const desc = (ad.description || '').toLowerCase();
        const master = (ad.master?.name || '').toLowerCase();
        let confidence = 0;
        if (title.includes(q)) confidence = 0.95;
        else if (desc.includes(q) || master.includes(q)) confidence = 0.85;
        else if (words.some((w) => title.includes(w) || desc.includes(w) || master.includes(w))) confidence = 0.75;
        return { ad, confidence };
      })
      .filter((r) => r.confidence > 0);
    return scored.sort((a, b) => b.confidence - a.confidence).slice(0, 4);
  }, [query, masterAds]);

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
          className="flex-1 bg-transparent text-[16px] sm:text-[15px] font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none min-w-0"
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
              <p className="mt-2 text-xs text-zinc-500">
                Распознаём объект и подбираем решение
              </p>
            </div>
          ) : results.length > 0 || masterResults.length > 0 ? (
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
                {masterResults.map(({ ad, confidence }) => {
                  const inner = (
                    <>
                      <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl overflow-hidden bg-zinc-100 text-zinc-400">
                        {ad.master?.photo ? (
                          <img src={ad.master.photo} alt={ad.master.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[10px] sm:text-xs font-bold" style={{ color: ad.color }}>{ad.brand}</span>
                          <span className="text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">Мастер</span>
                          <span className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full ${getConfidenceColor(confidence)}`}>
                            {Math.round(confidence * 100)}%
                          </span>
                        </div>
                        <p
                          className="mt-0.5 text-xs sm:text-sm font-bold text-zinc-900 truncate"
                          dangerouslySetInnerHTML={{ __html: highlightMatch(ad.title || '', query) }}
                        />
                        <p className="mt-0.5 text-[10px] sm:text-xs text-zinc-500 truncate">
                          {ad.master?.name}{ad.master?.city ? ` · ${ad.master.city}` : ''} · {ad.price > 0 ? `${ad.price.toLocaleString('ru-RU')} ₽` : 'Договорная'}
                        </p>
                      </div>
                      <ArrowRight
                        size={14}
                        className="mt-2 text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-1 transition-all shrink-0"
                      />
                    </>
                  );
                  const rowClass = 'flex items-start gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-zinc-50 transition-colors group';
                  return onMasterAdClick ? (
                    <button
                      key={ad.id}
                      type="button"
                      onClick={() => { setIsOpen(false); onMasterAdClick(ad); }}
                      className={`w-full text-left ${rowClass}`}
                    >
                      {inner}
                    </button>
                  ) : (
                    <Link
                      key={ad.id}
                      href="/#catalog"
                      onClick={() => setIsOpen(false)}
                      className={rowClass}
                    >
                      {inner}
                    </Link>
                  );
                })}
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
              <p className="mt-1 text-xs text-zinc-500">Попробуйте загрузить фото или изменить запрос</p>
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
        <div className="px-4 sm:px-0 mt-3 mb-8">
          <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1" style={{ scrollbarWidth: 'none' }}>
            {chips.map((s) => (
              <button
                key={`${s.query}-${s.text}`}
                type="button"
                onClick={() => handleQuickClick(s.query)}
                aria-label={`Подсказка: ${s.text}`}
                className="group relative w-[152px] h-[104px] shrink-0 snap-start rounded-[18px] overflow-hidden shadow-sm ring-1 ring-black/5 active:scale-[0.97] transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                {s.img ? (
                  <img src={s.img} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                <p className="absolute inset-x-3 bottom-2.5 text-left text-[13px] font-bold text-white leading-tight drop-shadow-sm">{s.text}</p>
                <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={12} className="text-white" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
