'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Camera, CheckCircle2, Send } from 'lucide-react';
import Link from 'next/link';

export default function MasterRegistrationForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handlePhotoClick = () => fileInputRef.current?.click();
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhoto(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
            Статус заявки можно отследить в приложении BroVerse.
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
            <p className="text-[13px] text-[#8E8E93]">BroCare.ru</p>
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

          <button
            type="submit"
            className="w-full rounded-[18px] bg-[#1C1C1E] px-6 py-4 text-[16px] font-bold text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all active:scale-[0.98] hover:bg-[#2C2C2E]"
          >
            <span className="flex items-center justify-center gap-2">
              <Send size={18} />
              Отправить заявку
            </span>
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] font-medium tracking-wide text-[#C7C7CC]">
          BroCare.ru · Экосистема профессионального братства
        </p>
      </div>
    </div>
  );
}
