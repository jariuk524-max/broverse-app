# AGENTS.md — карта проекта Broverse (актуальная)

## Архитектура: 3 порта = 3 мини-апа (все задеплоены на Vercel)

```
ПОРТ 3000 — КАБИНЕТ МАСТЕРОВ
  Источник: /Applications/broverse/apps/monolith
  Деплой:   broverse-masters.vercel.app (корень, НЕ /master!)
  Mini-app: @BroVerse_Masters_Bot (menu → https://broverse-masters.vercel.app/)
  Вид: Титановый Монолит, вкладки Карта / Заказы / История / Профиль
  Также здесь webhook /api/admin-webhook для @Broverse_Admin_bot

ПОРТ 3001 — КЛИЕНТСКИЙ ХАБ (песочница)
  Источник: projects/brorent-standalone (этот репо, ~/Desktop/broverse)
  Деплой:   broverse-client.vercel.app (версия: apps/client-site → устарела,
            сейчас деплой идёт из песочницы через vercel CLI)
  Mini-app: @Broverse_ru_bot
  Содержит: главная с 6 сайтами, /services/*, /admin (PIN: NEXT_PUBLIC_ADMIN_PIN)

ПОРТ 3002 — СТАРАЯ АДМИНКА
  Источник: /Applications/broverse/apps/admin
  Деплой:   admin-psi-two-25.vercel.app/admin-mobile?secret=broverse_admin_2024
  Mini-app: @Broverse_Admin_bot (menu button — НЕ ТРОГАТЬ)
  В admin-mobile добавлен блок «🛠 Новая админка» → broverse-client.vercel.app/admin
```

Репозитории:
- `~/Desktop/broverse` (ветка main, remote: broverse-app) — песочница.
- `/Applications/broverse` (ветка main, remote: broverse-full) — монолит, admin, masters.

## Рабочая зона
- Основная работа — в `projects/brorent-standalone/`.
- `/Applications/broverse` — только по явному запросу (там admin/masters/monolith).

## 6 клиентских сайтов (каталог редактируется из /admin)
| id | Бренд | Лендинг | Источник услуг |
|----|-------|---------|----------------|
| wash | BroWash | BroWashLanding | `data/wash-services.ts` |
| build | BroBuild | BroBuildLanding | `data/build-services.ts` |
| frame | BroFrame | BroFrameLanding | `data/frame-services.ts` |
| move | BroMove | BroMoveLanding | `data/move-services.ts` (только переезды и грузоперевозки) |
| garden | BroGarden | BroGardenLanding | `data/garden-services.ts` (озеленение, стрижка газонов, уборка снега; ассеты — SVG в public/hero/garden-*.svg) |
| rent | BroRent | BroRentLanding | `components/services/rent/` |
| verse | BroVerse | ServicePage (hub) | `lib/domains.ts` (BRO_DOMAINS) |

BroCare убран из клиентского хаба: обучение мастеров живёт в кабинете мастеров
(broverse-masters → Профиль → плашка «BroCare», компонент `apps/monolith/components/BroCareAcademy.tsx`).

## Каталог: код + правки
- Оригинал — в data-модулях (см. таблицу).
- Правки админки — `data/catalog-edits.json` (per domain → per service name).
- Публичный merged: `GET /api/catalog/[domain]`.
- Админский: `GET/POST/DELETE /api/admin/catalog` (auth: `x-admin-pin`).
- Лендинги подхватывают liveEdits через `/api/catalog/{domain}`.

## Заявки и отзывы
- Все сайты → Supabase `orders`, status `'review'`, `metadata.domain`.
- Клиент: кнопка ⭐ «Отзыв» на главной → телефон → «решён/не решён» + оценка + комментарий
  → сохраняется в `metadata.feedback` → вкладка «Отзывы» в /admin.
- Модерация: `/admin` → «Заявки» / «Отзывы» / «Каталог».

## Telegram-боты (токены НЕ хранить в репо!)
- @Broverse_ru_bot — клиентский хаб.
- @Broverse_Admin_bot — admin-mobile + /admin-команда; webhook: broverse-masters /api/admin-webhook.
- @BroVerse_Masters_Bot — кабинет мастеров.

## Закрытый сайт (на время разработки)
- proxy.ts: весь публичный сайт (главная, /masters, /services/*, /chat, публичные API)
  → /coming-soon. Вход владельца: личная ссылка ?access=bv-9f4c2x7q → cookie bv_access (1 год;
  переопределение — env SITE_ACCESS_CODE). Всегда открыты: /privacy, /coming-soon, /admin, /chief,
  /api/admin/*. Перед публичным запуском — удалить proxy.ts.

## Стек
Next.js 14 App Router, React 18, TS 5.4, Tailwind 4, Supabase.

## Проверка
- `npx tsc --noEmit` — без ошибок.
- Страницы: `/`, `/admin`, `/services/{wash,build,frame,move,rent,care,verse}` → 200.
