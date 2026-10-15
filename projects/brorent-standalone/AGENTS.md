# AGENTS.md — карта проекта Broverse (актуальная)

## Архитектура: 3 туннеля = 3 мини-апа

```
┌─ ТУННЕЛЬ 1 — КЛИЕНТСКИЙ ХАБ ─────────────────────────────┐
│ Песочница (localhost:3001 → broverse-client.vercel.app)  │
│ Главная с 6 сайтами + страницы сервисов                  │
│ Mini-app: @Broverse_ru_bot (menu → broverse-client)      │
│ Заявки → Supabase orders (status 'review')               │
└──────────────────────────────────────────────────────────┘
┌─ ТУННЕЛЬ 2 — КАБИНЕТ МАСТЕРОВ ───────────────────────────┐
│ broverse-masters.vercel.app                              │
│ /master — кабинет мастера; webhook /api/admin-webhook    │
│ обслуживает сообщения @Broverse_Admin_bot                │
│ (код НЕ в песочнице — не трогать)                        │
└──────────────────────────────────────────────────────────┘
┌─ ТУННЕЛЬ 3 — АДМИНКА ────────────────────────────────────┐
│ /admin в песочнице (PIN: NEXT_PUBLIC_ADMIN_PIN)          │
│ @Broverse_Admin_bot:                                      │
│  · menu button СУЩЕСТВУЮЩИЙ → admin-psi-two-25.vercel.app│
│    /admin-mobile — НЕ ТРОГАТЬ (исторический материал)     │
│  · команды /start, /admin добавлены                       │
│  · кнопка-щит 🛡 в хабе → /admin                          │
│ Назначение: модерация заявок всех сайтов, редактирование  │
│ каталога всех 6 сайтов, в будущем — поддержка клиентов    │
│ и мастеров                                                │
└──────────────────────────────────────────────────────────┘
```

## Рабочая зона
- Работать ТОЛЬКО в `projects/brorent-standalone/`.
- Монолит и другие репо — только чтение.

## 6 клиентских сайтов (каталог редактируется из /admin)
| id | Бренд | Источник услуг в коде |
|----|-------|----------------------|
| wash | BroWash | `data/wash-services.ts` (WASH_SERVICES) |
| build | BroBuild | `data/build-services.ts` (BUILD_CATEGORIES) |
| frame | BroFrame | `lib/domains.ts` (BRO_DOMAINS) |
| move | BroMove | `lib/domains.ts` (BRO_DOMAINS) |
| rent | BroRent | `lib/domains.ts` + `components/services/rent/` |
| care | BroCare | `lib/domains.ts` (BRO_DOMAINS) |
| verse | BroVerse | hub, `lib/domains.ts` (BRO_DOMAINS) |

## Каталог: код + правки
- Оригинал услуг — в коде (см. таблицу).
- Правки админки — `data/catalog-edits.json` (per domain → per service name).
- Публичный merged: `GET /api/catalog/[domain]` — любой домен.
- Админский: `GET/POST/DELETE /api/admin/catalog` (auth: заголовок `x-admin-pin`).
- Страницы подхватывают правки:
  - `components/services/build/BroBuildLanding.tsx`
  - `components/services/wash/BroWashLanding.tsx`
  - `components/ServicePage.tsx` (frame/move/care/verse/rent)

## Заявки
- Везде (включая RequestModal из всех сайтов) → Supabase `orders`, status `'review'`, `metadata.domain` = id сайта.
- Типы/статусы: `lib/requests.ts` ('new'|'review'|'approved'|'rejected').
- Модерация: `/admin` → вкладка «Заявки».

## Telegram-боты (токены НЕ хранить в репо!)
- @Broverse_ru_bot — клиентский хаб.
- @Broverse_Admin_bot — админка; webhook: broverse-masters.vercel.app/api/admin-webhook.
- Мастер-бот — кабинет мастеров.

## Стек
Next.js 14 App Router, React 18, TS 5.4, Tailwind 4, Supabase.

## Проверка
- `npx tsc --noEmit` — без ошибок.
- Страницы: `/`, `/admin`, `/services/{wash,build,frame,move,rent,care,verse}` → 200.
