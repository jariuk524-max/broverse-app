'use client';

import { useCallback, useState } from 'react';
import { X, Send, Loader2, CheckCircle2, Star, Search, MessageSquare } from 'lucide-react';
import { findRequestsByPhone, submitFeedback, type ServiceRequest } from '@/lib/requests';

interface FeedbackModalProps {
  onClose: () => void;
}

const INPUT =
  'w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-[15px] outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all';

const TAP = 'touch-manipulation select-none';

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [orders, setOrders] = useState<ServiceRequest[] | null>(null);
  const [searchError, setSearchError] = useState('');

  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [resolved, setResolved] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const search = useCallback(async () => {
    if (phone.replace(/\D/g, '').length < 6 || searching) return;
    setSearching(true);
    setSearchError('');
    const found = await findRequestsByPhone(phone);
    setOrders(found);
    setSearching(false);
    if (found.length === 0) setSearchError('Заявки по этому номеру не найдены.');
  }, [phone, searching]);

  const send = useCallback(async () => {
    if (!selected || resolved === null || submitting) return;
    setSubmitting(true);
    setError('');
    const ok = await submitFeedback(selected.id, {
      resolved,
      comment: comment.trim(),
      rating: rating || undefined,
    });
    setSubmitting(false);
    if (ok) setDone(true);
    else setError('Не удалось отправить отзыв. Попробуйте ещё раз.');
  }, [selected, resolved, comment, rating, submitting]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  /* ── Успех ── */
  if (done) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center js-modal">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm anim-fade" onClick={handleClose} />
        <div className="relative w-full sm:max-w-[400px] mx-4 mb-4 sm:mb-0 bg-white rounded-[24px] p-8 text-center shadow-2xl anim-pop">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">Спасибо за отзыв!</h3>
          <p className="text-sm text-zinc-500 mb-6">Мы учтём вашу оценку при работе со специалистами.</p>
          <button
            type="button"
            onClick={handleClose}
            className={`w-full py-3 rounded-2xl bg-zinc-900 text-white text-sm font-bold transition-colors hover:opacity-90 ${TAP}`}
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  /* ── Форма отзыва по конкретной заявке ── */
  if (selected) {
    const already = !!selected.metadata?.feedback;
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center js-modal">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm anim-fade" onClick={handleClose} />
        <div className="relative w-full sm:max-w-[420px] mx-4 bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col anim-sheet">
          <div className="shrink-0 bg-white border-b border-zinc-100 p-4 sm:p-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900">Отзыв о заявке</h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">{selected.service_name}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} className={`p-1.5 rounded-full hover:bg-zinc-100 transition-colors ${TAP}`}>
              <X size={18} className="text-zinc-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {already && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-[12px] font-semibold text-amber-700">
                  По этой заявке отзыв уже оставлен. Отправка обновит его.
                </p>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Был ли решён ваш вопрос?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResolved(true)}
                  className={`py-3 rounded-xl text-[13px] font-bold transition-colors ${TAP} ${resolved === true ? 'bg-emerald-500 text-white' : 'bg-zinc-50 text-zinc-600'}`}
                >
                  Да, решён
                </button>
                <button
                  type="button"
                  onClick={() => setResolved(false)}
                  className={`py-3 rounded-xl text-[13px] font-bold transition-colors ${TAP} ${resolved === false ? 'bg-rose-500 text-white' : 'bg-zinc-50 text-zinc-600'}`}
                >
                  Нет, не решён
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Оценка специалиста</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(rating === n ? 0 : n)}
                    className="p-1 active:scale-90 transition-transform"
                  >
                    <Star size={26} className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Комментарий</p>
              <textarea
                placeholder="Расскажите, как прошла работа мастера..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className={`${INPUT} resize-none`}
              />
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <p className="text-[11px] text-rose-600 font-semibold text-center">{error}</p>
              </div>
            )}
          </div>

          <div className="shrink-0 bg-white border-t border-zinc-100 p-4 sm:p-5">
            <button
              type="button"
              onClick={send}
              disabled={resolved === null || submitting}
              className={`w-full py-3.5 rounded-2xl bg-zinc-900 text-white text-sm font-bold disabled:opacity-30 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${TAP}`}
            >
              {submitting ? (
                <><Loader2 size={14} className="animate-spin" /> Отправляем...</>
              ) : (
                <><Send size={14} /> Отправить отзыв</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Поиск заявки по телефону ── */
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center js-modal">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm anim-fade" onClick={handleClose} />
      <div className="relative w-full sm:max-w-[420px] mx-4 bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col anim-sheet">
        <div className="shrink-0 bg-white border-b border-zinc-100 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900">Оставить отзыв</h3>
            <p className="text-[11px] text-zinc-400">Найдите заявку по номеру телефона</p>
          </div>
          <button type="button" onClick={handleClose} className={`p-1.5 rounded-full hover:bg-zinc-100 transition-colors ${TAP}`}>
            <X size={18} className="text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Телефон *</p>
            <input
              type="tel"
              inputMode="tel"
              placeholder="+7 (___) ___-__-__"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={INPUT}
            />
            <button
              type="button"
              onClick={search}
              disabled={phone.replace(/\D/g, '').length < 6 || searching}
              className={`w-full mt-2.5 py-3 rounded-xl bg-zinc-900 text-white text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-30 active:scale-[0.98] transition-transform ${TAP}`}
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Найти заявки
            </button>
            {searchError && <p className="text-[11px] text-rose-500 font-semibold mt-2">{searchError}</p>}
          </div>

          {orders && orders.length > 0 && (
            <div className="space-y-2">
              {orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { setSelected(o); setResolved(o.metadata?.feedback?.resolved ?? null); setComment(o.metadata?.feedback?.comment || ''); setRating(o.metadata?.feedback?.rating || 0); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
                >
                  <MessageSquare size={16} className="text-zinc-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-zinc-900 truncate">{o.service_name}</p>
                    <p className="text-[10px] text-zinc-400">
                      {new Date(o.created_at).toLocaleDateString('ru-RU')}
                      {o.metadata?.feedback ? ' · отзыв оставлен' : ''}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 shrink-0">→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
