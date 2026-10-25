'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { MASTER_DIRECTIONS } from '@/lib/master-ads';
import type { LessonBlock, LessonQuestion, LessonRule, Lessons } from '@/lib/lessons';

const ICON_KEYS = ['clock', 'wallet', 'shield', 'sparkles', 'droplets', 'zap', 'hammer', 'wrench', 'smartphone', 'package', 'hardhat', 'leaf'];
const uid = () => Math.random().toString(36).slice(2, 8);

type BlockKey = 'base' | string;

/**
 * Вкладка «Обучение» кабинета руководителя: уроки обязательного обучения
 * мастеров — 3 общих правила + тест и урок по каждому направлению.
 * Правила: заголовок, текст, иконка, фото. Тест: вопрос, варианты, ответ.
 */
export default function LessonsTab() {
  const [lessons, setLessons] = useState<Lessons | null>(null);
  const [sel, setSel] = useState<BlockKey>('base');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch('/api/lessons')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.lessons ? setLessons(d.lessons) : null))
      .catch(() => {});
  }, []);

  const block = lessons
    ? sel === 'base'
      ? lessons.base
      : lessons.directions[sel]
    : null;

  const setBlock = (b: LessonBlock) => {
    setLessons((prev) => {
      if (!prev) return prev;
      if (sel === 'base') return { ...prev, base: b };
      return { ...prev, directions: { ...prev.directions, [sel]: b } };
    });
    setDirty(true);
  };

  const patchRule = (id: string, p: Partial<LessonRule>) => {
    if (!block) return;
    setBlock({ ...block, rules: block.rules.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  };

  const addRule = () => {
    if (!block) return;
    setBlock({ ...block, rules: [...block.rules, { id: uid(), icon: 'wrench', title: 'Новое правило', desc: '' }] });
  };

  const removeRule = (id: string) => {
    if (!block) return;
    setBlock({ ...block, rules: block.rules.filter((r) => r.id !== id) });
  };

  const patchQuestion = (id: string, p: Partial<LessonQuestion>) => {
    if (!block) return;
    setBlock({ ...block, quiz: block.quiz.map((q) => (q.id === id ? { ...q, ...p } : q)) });
  };

  const addQuestion = () => {
    if (!block) return;
    setBlock({
      ...block,
      quiz: [...block.quiz, { id: uid(), q: 'Новый вопрос', options: ['Вариант 1', 'Вариант 2'], correct: 0 }],
    });
  };

  const removeQuestion = (id: string) => {
    if (!block) return;
    setBlock({ ...block, quiz: block.quiz.filter((q) => q.id !== id) });
  };

  const uploadPhoto = async (rule: LessonRule) => {
    setUploading(rule.id);
    setMsg(null);
    try {
      const input = fileRefs.current[rule.id];
      const file = input?.files?.[0];
      if (!file) return;
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lesson', name: rule.title || 'lesson', data }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.path) throw new Error(json?.error || 'Ошибка загрузки');
      patchRule(rule.id, { image: json.path });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    if (!lessons) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Не удалось сохранить');
      if (json?.lessons) setLessons(json.lessons);
      setDirty(false);
      setMsg('Уроки сохранены — мастера увидят их в кабинете');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (!lessons) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={22} className="animate-spin text-zinc-600" />
      </div>
    );
  }

  const blocks: { key: BlockKey; label: string }[] = [
    { key: 'base', label: '⭐ Общие' },
    ...Object.keys(lessons.directions).map((id) => ({
      key: id,
      label: `${MASTER_DIRECTIONS[id]?.icon || '•'} ${MASTER_DIRECTIONS[id]?.label || id}`,
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[16px] p-4 shadow-sm">
        <p className="text-[13px] font-bold text-zinc-900">Уроки обязательного обучения мастеров</p>
        <p className="text-[11px] text-zinc-500 mt-1">
          Общие правила и тест показываются каждому новичку, урок направления — выбравшему эту услугу при
          регистрации. Правила можно дополнять, редактировать и снабжать фото — мастер увидит их в кабинете.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {blocks.map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => setSel(b.key)}
            className={`shrink-0 px-3.5 py-2 rounded-full text-[12px] font-bold transition-colors ${
              sel === b.key ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 shadow-sm hover:bg-zinc-100'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {block && (
        <>
          <section>
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">Правила ({block.rules.length})</p>
              <button
                type="button"
                onClick={addRule}
                className="text-[11px] font-bold text-zinc-700 flex items-center gap-1 hover:text-zinc-900 transition-colors"
              >
                <Plus size={12} /> Правило
              </button>
            </div>
            <div className="space-y-3">
              {block.rules.map((r) => (
                <div key={r.id} className="bg-white rounded-[16px] p-3.5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => fileRefs.current[r.id]?.click()}
                        className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-colors"
                        title={r.image ? 'Заменить фото' : 'Добавить фото урока'}
                      >
                        {r.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={18} />
                        )}
                        {uploading === r.id && (
                          <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 size={16} className="animate-spin text-white" />
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => fileRefs.current[r.id]?.click()}
                        className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
                      >
                        {r.image ? 'заменить' : '+ фото'}
                      </button>
                      <input
                        ref={(el) => {
                          fileRefs.current[r.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={() => uploadPhoto(r)}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={r.title}
                          onChange={(e) => patchRule(r.id, { title: e.target.value })}
                          placeholder="Заголовок правила"
                          className="flex-1 min-w-0 rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-900 focus:outline-none focus:border-zinc-400"
                        />
                        <select
                          value={r.icon}
                          onChange={(e) => patchRule(r.id, { icon: e.target.value })}
                          className="rounded-xl bg-zinc-50 border border-zinc-200 px-2 py-2 text-[12px] text-zinc-700 focus:outline-none focus:border-zinc-400"
                          title="Иконка"
                        >
                          {ICON_KEYS.map((k) => (
                            <option key={k} value={k}>
                              {k}
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={r.desc}
                        onChange={(e) => patchRule(r.id, { desc: e.target.value })}
                        placeholder="Описание правила для мастера"
                        rows={2}
                        className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 text-[12px] text-zinc-700 focus:outline-none focus:border-zinc-400 resize-y"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeRule(r.id)}
                      className="shrink-0 w-8 h-8 rounded-xl bg-zinc-100 text-zinc-500 flex items-center justify-center active:scale-95 transition-transform hover:bg-rose-50 hover:text-rose-600"
                      title="Удалить правило"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">Тест ({block.quiz.length})</p>
              <button
                type="button"
                onClick={addQuestion}
                className="text-[11px] font-bold text-zinc-700 flex items-center gap-1 hover:text-zinc-900 transition-colors"
              >
                <Plus size={12} /> Вопрос
              </button>
            </div>
            <div className="space-y-3">
              {block.quiz.map((q, qi) => (
                <div key={q.id} className="bg-white rounded-[16px] p-3.5 shadow-sm">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-zinc-900 text-white text-[11px] font-bold flex items-center justify-center mt-1">
                      {qi + 1}
                    </span>
                    <div className="flex-1 min-w-0 space-y-2">
                      <input
                        value={q.q}
                        onChange={(e) => patchQuestion(q.id, { q: e.target.value })}
                        placeholder="Вопрос"
                        className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-900 focus:outline-none focus:border-zinc-400"
                      />
                      <div className="space-y-1.5">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => patchQuestion(q.id, { correct: oi })}
                              title="Отметить правильный ответ"
                              className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                q.correct === oi ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-300 hover:border-zinc-400'
                              }`}
                            >
                              {q.correct === oi && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </button>
                            <input
                              value={opt}
                              onChange={(e) => {
                                const options = [...q.options];
                                options[oi] = e.target.value;
                                patchQuestion(q.id, { options });
                              }}
                              className="flex-1 min-w-0 rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-1.5 text-[12px] text-zinc-700 focus:outline-none focus:border-zinc-400"
                            />
                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const options = q.options.filter((_, i) => i !== oi);
                                  const correct = q.correct > oi ? q.correct - 1 : q.correct === oi ? 0 : q.correct;
                                  patchQuestion(q.id, { options, correct: Math.min(correct, options.length - 1) });
                                }}
                                className="shrink-0 w-6 h-6 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center hover:text-rose-600 transition-colors"
                                title="Убрать вариант"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        {q.options.length < 6 && (
                          <button
                            type="button"
                            onClick={() => patchQuestion(q.id, { options: [...q.options, 'Новый вариант'] })}
                            className="text-[11px] font-bold text-zinc-500 flex items-center gap-1 hover:text-zinc-800 transition-colors"
                          >
                            <Plus size={11} /> Вариант
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="text-[11px] font-bold text-zinc-400 flex items-center gap-1 hover:text-rose-600 transition-colors ml-auto"
                        >
                          <Trash2 size={11} /> Удалить вопрос
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {msg && (
        <button type="button" onClick={() => setMsg(null)} className="text-[12px] text-center text-zinc-600 hover:text-zinc-900 transition-colors">
          {msg}
        </button>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving || !dirty}
        className="w-full py-3.5 rounded-full bg-zinc-900 text-white text-[13px] font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-black/10 active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {dirty ? 'Сохранить уроки' : 'Сохранено'}
      </button>
    </div>
  );
}
