'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Camera, CheckCircle2, Loader2, Lock, Send } from 'lucide-react';
import Link from 'next/link';
import { createServiceRequest } from '@/lib/requests';
import ConsentCheckbox from '@/components/ConsentCheckbox';
import DevStub from '@/components/DevStub';
import { DATA_COLLECTION_LOCKED } from '@/lib/site-config';
import { useDataUnlocked } from '@/lib/data-lock';

const SPECIALIZATIONS = [
  { id: 'wash', label: 'Химчистка мебели', emoji: '🛋️' },
  { id: 'build', label: 'Ремонт и установка', emoji: '🔧' },
  { id: 'frame', label: 'Техника и электроника', emoji: '📱' },
  { id: 'move', label: 'Переезды и грузоперевозки', emoji: '📦' },
  { id: 'garden', label: 'Сад и участок', emoji: '🌿' },
  { id: 'rent', label: 'Аренда оборудования', emoji: '🧹' },
];

const EXPERIENCE = [
  { id: 'junior', label: 'Менее 1 года' },
  { id: 'middle', label: '1–3 года' },
  { id: 'senior', label: 'Более 3 лет' },
];

export default function MasterRegistrationForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('wash');
  const [experience, setExperience] = useState('middle');
  const [city, setCity] = useState('');
  const [about, setAbout] = useState('');
  const [pdConsent, setPdConsent] = useState(false);

  const handlePhotoClick = () => fileInputRef.current?.click();
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhoto(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const specLabel = SPECIALIZATIONS.find((s) => s.id === specialization)?.label || specialization;
  const expLabel = EXPERIENCE.find((e) => e.id === experience)?.label || experience;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || !pdConsent) return; // 152-ФЗ: без согласия отправка запрещена
    setSending(true);
    setError('');

    const aboutLine = about.trim() ? `О себе: ${about.trim()}` : '';
    const cityLine = city.trim() ? `Город: ${city.trim()}` : '';
    const description = [
      `Специализация: ${specLabel}`,
      `Опыт: ${expLabel}`,
      cityLine,
      aboutLine,
    ]
      .filter(Boolean)
      .join(' · ');

    const res = await createServiceRequest({
      serviceName: 'Анкета мастера',
      clientName: name.trim(),
      clientPhone: phone.trim(),
      photo,
      description,
      domain: 'master',
    });

    setSending(false);
    if (res) {
      setSubmitted(true);
    } else {
      setError('Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.');
    }
  };

  // 152-ФЗ: на время разработки вход закрыт заглушкой — данные не собираются
  const dataUnlocked = useDataUnlocked();
  if (DATA_COLLECTION_LOCKED && !dataUnlocked) return <DevStub variant="page" title="Регистрация мастеров временно закрыта" />;

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] px-5 pb-32 pt-2 font-sans">
        <div className="mx-auto max-w-lg pt-24 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#34C759]/15">
            <CheckCircle2 size={40} className="text-[#34C759]" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#1C1C1E]">
            Заявка отправлена
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#8E8E93]">
            Мы проверим данные и свяжемся с вами в течение 24 часов.
            <br />
            Статус заявки можно отследить в кабинете мастера BroVerse.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#007AFF] px-6 py-3.5 text-[15px] font-bold text-white transition-colors active:bg-[#005BBB]"
          >
            <ArrowLeft size={18} />
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-[#FFFFFF] px-5 pb-32 pt-2 font-sans">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-3 pt-14 pb-6">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 shadow-sm backdrop-blur-sm"
          >
            <ArrowLeft size={20} className="text-[#1C1C1E]" />
          </Link>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[#1C1C1E]">
              Стать мастером
            </h1>
            <p className="text-[13px] text-[#8E8E93]">BroVerse · заработок на услугах</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="overflow-hidden rounded-[40px] border border-white/60 bg-white/50 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={handlePhotoClick}
                className="group relative flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1C1C1E] to-[#3A3A3C] text-white shadow-lg active:scale-95 transition-transform"
              >
                {photo ? (
                  <img src={photo} alt="Фото" className="h-full w-full object-cover" />
                ) : (
                  <Camera size={32} className="text-zinc-400" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Имя и фамилия"
                  required
                  className="w-full rounded-[14px] border border-[#E5E5EA] bg-[#F2F2F7]/80 px-4 py-3 text-[15px] text-[#1C1C1E] outline-none placeholder:text-[#C7C7CC] focus:border-[#007AFF]/40 focus:bg-white"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  required
                  className="w-full rounded-[14px] border border-[#E5E5EA] bg-[#F2F2F7]/80 px-4 py-3 text-[15px] text-[#1C1C1E] outline-none placeholder:text-[#C7C7CC] focus:border-[#007AFF]/40 focus:bg-white"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[40px] border border-white/60 bg-white/50 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl">
            <p className="mb-3 text-[13px] font-bold text-[#1C1C1E]">Специализация</p>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALIZATIONS.map((s) => {
                const active = specialization === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSpecialization(s.id)}
                    className={`flex items-center gap-2 rounded-[16px] border px-3 py-3 text-left text-[13px] font-semibold transition-all ${
                      active
                        ? 'border-[#007AFF]/50 bg-[#007AFF]/10 text-[#007AFF]'
                        : 'border-[#E5E5EA] bg-[#F2F2F7]/80 text-[#1C1C1E]'
                    }`}
                  >
                    <span className="text-[16px]">{s.emoji}</span>
                    <span className="leading-tight">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[40px] border border-white/60 bg-white/50 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl">
            <p className="mb-3 text-[13px] font-bold text-[#1C1C1E]">Опыт работы</p>
            <div className="flex gap-2">
              {EXPERIENCE.map((e) => {
                const active = experience === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setExperience(e.id)}
                    className={`flex-1 rounded-[14px] border px-2 py-2.5 text-[13px] font-semibold transition-all ${
                      active
                        ? 'border-[#34C759]/50 bg-[#34C759]/10 text-[#248A3D]'
                        : 'border-[#E5E5EA] bg-[#F2F2F7]/80 text-[#1C1C1E]'
                    }`}
                  >
                    {e.label}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Город (необязательно)"
              className="mt-3 w-full rounded-[14px] border border-[#E5E5EA] bg-[#F2F2F7]/80 px-4 py-3 text-[15px] text-[#1C1C1E] outline-none placeholder:text-[#C7C7CC] focus:border-[#007AFF]/40 focus:bg-white"
            />
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="О себе: что умеете, на чём специализируетесь (необязательно)"
              rows={3}
              className="mt-3 w-full resize-none rounded-[14px] border border-[#E5E5EA] bg-[#F2F2F7]/80 px-4 py-3 text-[15px] leading-relaxed text-[#1C1C1E] outline-none placeholder:text-[#C7C7CC] focus:border-[#007AFF]/40 focus:bg-white"
            />
          </section>

          {error && (
            <p className="rounded-[16px] bg-[#FF3B30]/10 px-4 py-3 text-[13px] font-semibold text-[#FF3B30]">
              {error}
            </p>
          )}

          <ConsentCheckbox checked={pdConsent} onChange={setPdConsent} />

          <button
            type="submit"
            disabled={sending || !pdConsent}
            className="w-full rounded-[18px] bg-[#1C1C1E] px-6 py-4 text-[16px] font-bold text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all active:scale-[0.98] hover:bg-[#2C2C2E] disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {sending ? 'Отправляем…' : 'Отправить заявку'}
            </span>
          </button>
        </form>

        <div className="mt-6 flex items-start gap-2 rounded-[20px] bg-[#F2F2F7]/80 px-4 py-3.5">
          <Lock size={14} className="mt-0.5 shrink-0 text-[#8E8E93]" />
          <p className="text-[12px] leading-relaxed text-[#8E8E93]">
            После модерации вы получите доступ к кабинету мастера: карта заказов,
            услуги и свои цены, профиль для клиентов.
          </p>
        </div>

        <p className="mt-8 text-center text-[11px] font-medium tracking-wide text-[#C7C7CC]">
          BroVerse · Экосистема профессионального братства
        </p>
      </div>
    </div>
  );
}
