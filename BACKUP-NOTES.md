# BACKUP-NOTES — снимок состояния проекта Broverse

Дата фиксации: **2026-10-08**
Точка отката: git-тег **`snapshot-2026-10-08`**, чекпоинт-коммит **`f85ab97`** (ветка `main`, ahead of origin/main).
Репозиторий: `/Users/evghenii/Desktop/broverse` — единый монорепозиторий (Next.js, Pages Router).

## Как откатиться к этому состоянию
```bash
# посмотреть состояние на момент снимка
git checkout snapshot-2026-10-08          # detached-просмотр, безопасно
# вернуться в main
git checkout main
# вернуть отдельный файл из снимка (без reset --hard)
git checkout snapshot-2026-10-08 -- путь/к/файлу
```
⚠️ `git reset --hard` запрещён правилами проекта (AGENTS.md).

## Что зафиксировано в чекпоинте (8 файлов)
- `.gitignore` (+`.aider*`, +`.mimocode/`)
- `package.json` (next ^14 → **^15.0.0**)
- `pages/index.tsx` (главная витрина, активная доработка)
- `projects/brorent-standalone/app/globals.css` (+анимации)
- `projects/brorent-standalone/components/services/rent/BroRentLanding.tsx`
- `AGENTS.md` (правила песочницы)
- `components/OrderModal.tsx`, `components/services/rent/BroRentLanding.tsx` (новые, пока ниоткуда не подключены — заготовка)

Не попадают в git (по .gitignore): `node_modules/`, `.next/`, `*.log` (dev-server.log, tunnel*.log), `ngrok_token.txt` (секрет), `.env*`, `tsconfig.tsbuildinfo`, `.mimocode/`.

═══════════════════════════════════════════
## ТРИ ПРИЛОЖЕНИЯ (в одном монорепозитории)
═══════════════════════════════════════════

### 1. broverse — клиентская витрина
| Папка / файл | Назначение | Статус |
|---|---|---|
| `pages/index.tsx` | Хаб: 6 карточек сервисов (BroWash • BroBuild • BroMove • BroRent • BroBrew • BroCare), inline-стили, iOS-палитра | в работе |
| `pages/services/[slug].tsx` | Динамические страницы сервисов (browash и др.) | готово |
| `pages/_app.tsx` | Общий layout, head, leaflet.css, globals.css | готово |
| `data/services.json` | Данные сервисов | готово |
| `pages/api/services/` | API выдачи услуг | готово |

### 2. broverse-Masters — кабинет мастера
| Папка / файл | Назначение | Статус |
|---|---|---|
| `pages/master.tsx` | Кабинет мастера (профиль, metadata, доступ по ссылке «Мастер» из хаба) | готово / точечно дорабатывается |

### 3. broverse-admin — админ-панель
| Папка / файл | Назначение | Статус |
|---|---|---|
| `pages/admin/index.tsx` | Вход/панель администратора | готово (базово) |
| `pages/admin/edit/` | Редактирование контента | готово (базово) |

### Общая инфраструктура
| Путь | Назначение | Статус |
|---|---|---|
| `server.js` | Кастомный Express-сервер + Socket.IO (`npm run dev` = `node server.js`) | готово |
| `pages/api/upload.js` | Загрузка файлов (formidable) | готово |
| `pages/api/telegram-notify.ts` | Уведомления в Telegram | готово |
| `lib/supabase.ts`, `lib/telegram.ts` | Клиенты Supabase и Telegram | готово |
| `supabase/migrations/` | Миграции БД | готово |
| `styles/globals.css` | Только `@import "tailwindcss"` (Tailwind v4) | готово |
| `projects/brorent-standalone/` | Песочница: отдельное Next.js App Router-приложение (6 сервисов: rent, build, care, frame, move, verse; компоненты DomainGrid, InteractiveMap, OrderModal, SmartSearch, WashQuiz, MasterRegistrationForm, BroRentLanding; dev на порту 3001) | в работе (основная зона доработки) |

Вне репозитория: `/Users/evghenii/Desktop/broverse-full` (не git; копии `apps/client-showcase`, `apps/client-site`, `apps/monolith`) — экспериментальные копии, в снапшот не входят.

═══════════════════════════════════════════
## ШРИФТЫ (НЕ МЕНЯТЬ)
═══════════════════════════════════════════
- Кастомных веб-шрифтов нет.
- `pages/index.tsx`: `fontFamily: "system-ui, -apple-system, sans-serif"` (inline).
- Песочница brorent-standalone: системный стек Tailwind.
- Активно используются веса 700/900, uppercase + letter-spacing для заголовков.

═══════════════════════════════════════════
## СТИЛИ / CSS-ПЕРЕМЕННЫЕ (НЕ МЕНЯТЬ, ТОЛЬКО ДОПОЛНЯТЬ)
═══════════════════════════════════════════
- Палитра (iOS-style): фон `#F2F2F7`, текст `#1c1c1e`, акцент `#007AFF`, белые карточки, скруглённые радиусы.
- Песочница `app/globals.css`: утилиты `animate-in`, `fade-in`, `slide-in-from-bottom-4`, `.glass-rent` (radius 28px, blur 18px, белые полупрозрачные границы) — стиль «стекло» для rent-лендинга.
- Tailwind: монолит — v4 (`@import "tailwindcss"`), песочница — v3.4.1 (директивы `@tailwind` + `tailwind.config.ts`).

═══════════════════════════════════════════
## ПЕРЕИСПОЛЬЗУЕМЫЕ КОМПОНЕНТЫ
═══════════════════════════════════════════
- `OrderModal.tsx` — существует в 2 местах: корневой `components/` (пока не подключён) и `projects/brorent-standalone/components/` (используется).
- `BroRentLanding.tsx` — дублируется: `components/services/rent/` (корень, заготовка) и `projects/brorent-standalone/components/services/rent/` (активный).
- При синхронизации правок между ними — держать в актуальном виде обе копии или явно договориться, какая каноническая.

═══════════════════════════════════════════
## КАК ЗАПУСТИТЬ / ПРОВЕРИТЬ
═══════════════════════════════════════════
- Монолит: `npm run dev` (порт 3000, через server.js), сборка `npm run build`.
- Песочница: `cd projects/brorent-standalone && npm run dev` (порт 3001), сборка `npm run build`.
- Для env-переменных (Supabase, Telegram) используются локальные `.env*` — в git не входят.
