'use client';

import { useState } from 'react';
import { CheckCircle2, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';

type QuizAnswer = {
  step: number;
  optionId: string;
  label: string;
  price?: number;
  time?: string;
};

const QUIZ_STEPS = [
  {
    question: 'Какой тип мебели?',
    options: [
      { id: 'sofa-straight', label: 'Диван прямой', icon: '🛋️' },
      { id: 'sofa-corner', label: 'Диван угловой', icon: '🛋️' },
      { id: 'armchair', label: 'Кресло', icon: '💺' },
      { id: 'mattress', label: 'Матрас', icon: '🛏️' },
      { id: 'carpet', label: 'Ковёр', icon: '🧶' },
      { id: 'chair', label: 'Стул', icon: '🪑' },
      { id: 'curtains', label: 'Шторы / тюль', icon: '🪭' },
      { id: 'car', label: 'Салон авто', icon: '🚗' },
    ],
  },
  {
    question: 'Какой размер?',
    options: [
      { id: 'size-s', label: 'Малый (до 140 см)', icon: '•' },
      { id: 'size-m', label: 'Средний (141–220 см)', icon: '••' },
      { id: 'size-l', label: 'Большой (221–320 см)', icon: '•••' },
      { id: 'size-xl', label: 'Очень большой (321+ см)', icon: '••••' },
    ],
  },
  {
    question: 'Какой тип обивки?',
    options: [
      { id: 'textile', label: 'Текстиль / синтетика', icon: '🧵' },
      { id: 'leather', label: 'Кожа / экокожа', icon: '🪡' },
    ],
  },
  {
    question: 'Есть ли запахи или пятна?',
    options: [
      { id: 'smell-yes', label: 'Да, есть запахи', icon: '💨', surcharge: 500 },
      { id: 'stains-yes', label: 'Да, есть пятна', icon: '💧', surcharge: 300 },
      { id: 'both-yes', label: 'И запахи, и пятна', icon: '⚠️', surcharge: 800 },
      { id: 'no', label: 'Нет, просто чистка', icon: '✨', surcharge: 0 },
    ],
  },
];

const PRICE_TABLE: Record<string, Record<string, Record<string, { price: number; time: string }>>> = {
  'sofa-straight': {
    'size-s': { textile: { price: 1500, time: '30 мин' }, leather: { price: 2000, time: '40 мин' } },
    'size-m': { textile: { price: 2250, time: '40 мин' }, leather: { price: 3000, time: '50 мин' } },
    'size-l': { textile: { price: 3000, time: '50 мин' }, leather: { price: 4000, time: '1 ч' } },
    'size-xl': { textile: { price: 3750, time: '1 ч' }, leather: { price: 5000, time: '1 ч 10 мин' } },
  },
  'sofa-corner': {
    'size-s': { textile: { price: 3000, time: '40 мин' }, leather: { price: 4000, time: '50 мин' } },
    'size-m': { textile: { price: 3750, time: '50 мин' }, leather: { price: 5000, time: '1 ч' } },
    'size-l': { textile: { price: 4500, time: '1 ч' }, leather: { price: 6000, time: '1 ч 20 мин' } },
    'size-xl': { textile: { price: 6000, time: '1 ч 10 мин' }, leather: { price: 8000, time: '1 ч 30 мин' } },
  },
  armchair: {
    'size-s': { textile: { price: 750, time: '15 мин' }, leather: { price: 1000, time: '20 мин' } },
    'size-m': { textile: { price: 1125, time: '20 мин' }, leather: { price: 1500, time: '25 мин' } },
    'size-l': { textile: { price: 1500, time: '25 мин' }, leather: { price: 2000, time: '30 мин' } },
    'size-xl': { textile: { price: 2000, time: '30 мин' }, leather: { price: 2500, time: '35 мин' } },
  },
  mattress: {
    'size-s': { textile: { price: 2000, time: '30 мин' }, leather: { price: 2000, time: '30 мин' } },
    'size-m': { textile: { price: 2500, time: '40 мин' }, leather: { price: 2500, time: '40 мин' } },
    'size-l': { textile: { price: 3000, time: '50 мин' }, leather: { price: 3000, time: '50 мин' } },
    'size-xl': { textile: { price: 3500, time: '1 ч' }, leather: { price: 3500, time: '1 ч' } },
  },
  carpet: {
    'size-s': { textile: { price: 2000, time: '2-3 ч' }, leather: { price: 2000, time: '2-3 ч' } },
    'size-m': { textile: { price: 3000, time: '3-4 ч' }, leather: { price: 3000, time: '3-4 ч' } },
    'size-l': { textile: { price: 4000, time: '4-5 ч' }, leather: { price: 4000, time: '4-5 ч' } },
    'size-xl': { textile: { price: 5000, time: '5+ ч' }, leather: { price: 5000, time: '5+ ч' } },
  },
  chair: {
    'size-s': { textile: { price: 375, time: '10 мин' }, leather: { price: 500, time: '12 мин' } },
    'size-m': { textile: { price: 450, time: '15 мин' }, leather: { price: 600, time: '18 мин' } },
    'size-l': { textile: { price: 525, time: '20 мин' }, leather: { price: 700, time: '22 мин' } },
    'size-xl': { textile: { price: 600, time: '25 мин' }, leather: { price: 800, time: '28 мин' } },
  },
  curtains: {
    'size-s': { textile: { price: 1800, time: '1-2 ч' }, leather: { price: 1800, time: '1-2 ч' } },
    'size-m': { textile: { price: 2500, time: '2-3 ч' }, leather: { price: 2500, time: '2-3 ч' } },
    'size-l': { textile: { price: 3500, time: '3-4 ч' }, leather: { price: 3500, time: '3-4 ч' } },
    'size-xl': { textile: { price: 4500, time: '4+ ч' }, leather: { price: 4500, time: '4+ ч' } },
  },
  car: {
    'size-s': { textile: { price: 4000, time: '3-4 ч' }, leather: { price: 5000, time: '4-5 ч' } },
    'size-m': { textile: { price: 5000, time: '4-5 ч' }, leather: { price: 6500, time: '5-6 ч' } },
    'size-l': { textile: { price: 6000, time: '5-6 ч' }, leather: { price: 8000, time: '6-7 ч' } },
    'size-xl': { textile: { price: 7000, time: '6+ ч' }, leather: { price: 9000, time: '7+ ч' } },
  },
};

interface WashQuizProps {
  onOrder: (data: { name: string; price: number; time: string }) => void;
}

export default function WashQuiz({ onOrder }: WashQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [done, setDone] = useState(false);

  const currentStep = QUIZ_STEPS[step];
  const progress = ((step + 1) / QUIZ_STEPS.length) * 100;

  function handleAnswer(opt: { id: string; label: string; surcharge?: number }) {
    const newAnswers = [...answers];
    newAnswers[step] = { step, optionId: opt.id, label: opt.label, price: opt.surcharge || 0 };
    setAnswers(newAnswers);

    if (step < QUIZ_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function handleRestart() {
    setStep(0);
    setAnswers([]);
    setDone(false);
  }

  function getResult() {
    const type = answers[0]?.optionId;
    const size = answers[1]?.optionId;
    const material = answers[2]?.optionId;
    const extra = answers[3]?.price || 0;

    if (!type || !size || !material) return { price: 0, time: '' };

    const base = PRICE_TABLE[type]?.[size]?.[material];
    if (!base) return { price: 0, time: '' };

    return { price: base.price + extra, time: base.time };
  }

  const result = getResult();

  return (
    <div className="rounded-[24px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-zinc-100">
        <h3 className="text-sm sm:text-base font-bold text-zinc-900">Рассчитайте стоимость</h3>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5">Ответьте на 4 вопроса за 30 секунд</p>
        {!done && (
          <div className="mt-3 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
            <div className="h-full rounded-full bg-zinc-900 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {!done ? (
          <div key={step} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Шаг {step + 1} из {QUIZ_STEPS.length}
            </p>
            <h4 className="text-base sm:text-lg font-bold text-zinc-900 mb-4">{currentStep.question}</h4>

            <div className="space-y-2">
              {currentStep.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleAnswer(opt)}
                  className="w-full flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all duration-200 text-left group"
                >
                  <span className="text-lg sm:text-xl">{opt.icon}</span>
                  <span className="text-sm sm:text-[15px] font-semibold text-zinc-800 flex-1">{opt.label}</span>
                  <ArrowRight size={14} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                </button>
              ))}
            </div>

            {step > 0 && (
              <button type="button" onClick={handleBack}
                className="flex items-center gap-1.5 mt-3 text-[11px] sm:text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors">
                <ArrowLeft size={12} /> Назад
              </button>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2 mb-4">
              {answers.map((ans, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                  <span className="text-[11px] sm:text-xs text-zinc-400">{QUIZ_STEPS[i].question}</span>
                  <span className="text-[11px] sm:text-xs font-semibold text-zinc-800">{ans.label}</span>
                </div>
              ))}
            </div>

            {result.price > 0 && (
              <div className="rounded-2xl bg-zinc-50 p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400">Расчётная стоимость</p>
                    <p className="text-2xl sm:text-3xl font-black text-zinc-900 mt-1">{result.price.toLocaleString('ru-RU')} ₽</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] sm:text-[11px] text-zinc-400">Время работы</p>
                    <p className="text-sm sm:text-base font-bold text-zinc-700 mt-0.5">{result.time}</p>
                  </div>
                </div>
                <p className="text-[10px] sm:text-[11px] text-zinc-300 mt-2">* Точная стоимость после осмотра мастером</p>
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => onOrder({ name: 'Расчёт из квиза', price: result.price, time: result.time })}
                className="flex-1 py-3 sm:py-3.5 rounded-2xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 transition-all duration-200 active:scale-[0.98]">
                Заказать от {result.price.toLocaleString('ru-RU')} ₽
              </button>
              <button type="button" onClick={handleRestart}
                className="p-3 rounded-2xl border border-zinc-200 hover:bg-zinc-50 transition-colors">
                <RotateCcw size={16} className="text-zinc-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
