# AGENTS.md — контекст проекта Broverse

## Рабочая зона (РАБОТАЙ ТОЛЬКО ЗДЕСЬ)
Путь: /Users/evgenii/Desktop/broverse/projects/brorent-standalone
Все пути указывай относительно этой директории.
Не выходи за её пределы.

## Основной проект (ЗАПРЕЩЕНО ИЗМЕНЯТЬ)
Путь: /Users/evgenii/Desktop/broverse
СТРОГО ЗАПРЕЩЕНО: изменять, удалять, перезаписывать любые файлы
в этой папке и её подпапках (кроме projects/brorent-standalone).
Только чтение — для справки.

## Структура песочницы
- app/       — страницы и роутинг Next.js
- components/ — React-компоненты
- lib/       — вспомогательные функции
- data/      — данные и моки
- public/    — статические файлы

## Правила работы
- Работай ТОЛЬКО с файлами внутри песочницы.
- Если путь к файлу неизвестен — найди его через search_files
  внутри песочницы. НЕ спрашивай путь у пользователя.
- Игнорируй папку node_modules/ полностью.
- Не используй find или grep по всему проекту.
- Перед правкой файла — прочитай его через read_file.
- Перед изменением функции — найди её использования через search_files.
- Перед правкой покажи diff и жди подтверждения.
- Все ответы давай на русском языке.

## Запрещённые команды
НИКОГДА не выполняй:
- rm -rf (любые варианты)
- git push --force
- git reset --hard
- sudo (любые команды)
- изменения файлов вне песочницы

## package.json
- Не менять существующие зависимости без разрешения.
- Не удалять скрипты из "scripts".
- Добавлять новые зависимости только после подтверждения.

## Стек
- Next.js 16.2.4 (App Router)
- React 19.2.4 + TypeScript 5.4
- TailwindCSS 4
- Supabase (backend)
- Socket.io (realtime)

## 152-ФЗ — персональные данные (ОБЯЗАТЕЛЬНО)
Проект обязан соответствовать 152-ФЗ (персональные данные, cookie):
- ФЛАГ ЗАГЛУШКИ: `DATA_COLLECTION_LOCKED = true` в `lib/site-config.ts` — на время разработки
  все публичные формы сбора ПДн закрыты заглушками `components/DevStub.tsx`
  (заявка OrderModal / RequestModal / MoveRequestModal, отзыв FeedbackModal,
  регистрация мастера /master, чат /chat). Данные НЕ собираются до запуска.
  Перед публичным запуском выставить false — формы откроются с обязательным чекбоксом.
- Чекбокс согласия: `components/ConsentCheckbox.tsx` — обязателен в каждой форме, собирающей
  ПДн (имя, телефон, адрес, сообщения, cookie); без галочки кнопка отправки заблокирована;
  факт согласия пишется в metadata заявки (`consent: { personal_data, cookies, at }`).
- Политика обработки ПДн: страница `/privacy` (app/privacy/page.tsx) — 152-ФЗ, cookie,
  цели, сроки, права субъекта, контакты.
- Внутренние кабинеты (/admin, /chief, /leader) — не публичный сбор ПДн, флаг на них не действует.

## Новая админка (ОСНОВНАЯ — дорабатываем)
Код: projects/brorent-standalone/app/chief/page.tsx + app/admin/page.tsx (~3800 строк) + app/api/admin/*
- https://broverse-client.vercel.app/chief — Кабинет руководителя (хаб): кабинеты администраторам,
  должности/навыки, статистика сотрудников, заявки на доступ, роли (CHIEF_ONLY: team/audit)
- https://broverse-client.vercel.app/admin — личный кабинет администратора (вход по паролю)
- https://broverse-client.vercel.app/admin/<login> — персональная ссылка сотрудника
- Временный открытый вход: OPEN_CHIEF_LOGIN=true в app/api/admin/session/route.ts (вернуть false после настройки)
- Данные: Supabase (users/requests/audit/...) + Storage JSON (admin/*.json: chats, layout, avatars, profiles)
- Деплой: npx -y vercel --prod --yes ИЗ папки проекта; git-коммиты из корня репо с путями projects/brorent-standalone/...

## Закрытый публичный сайт (на время разработки)
- proxy.ts (Next 16, замена middleware): весь публичный сайт (главная, /masters, /services/*,
  /chat, публичные API) → редирект на /coming-soon. Вход владельца: личная ссылка
  ?access=bv-9f4c2x7q → cookie bv_access (httpOnly, 1 год; переопределение — env SITE_ACCESS_CODE).
- Всегда открыты: /privacy (152-ФЗ), /coming-soon, /admin и /chief (свои аутентификации), /api/admin/*.
- Перед публичным запуском: удалить/нейтрализовать proxy.ts (вернуть доступ).

## Старая админка (источник функционала — ТОЛЬКО ЧТЕНИЕ)
Путь: /Applications/broverse/apps/admin · Домен: admin-psi-two-25.vercel.app · Вход: ?secret=broverse_admin_2024
Бот: Broverse_Admin_bot (webhook: /Applications/broverse/apps/monolith/app/api/admin-webhook/route.ts):
/start, /pending, inline-кнопки approve/reject анкет, уведомления мастеру.
Страницы: /admin-mobile — CRUD каталога услуг (6 брендов, фото, порядок drag/↑↓),
/admin-browash — галерея «Мои фото» песочницы (до 10, Supabase),
/admin-moderation — анкеты мастеров + чаты поддержки + услуги мастеров.
Данные: catalog/master-profiles/master-services/support-chats → https://broverse-masters.vercel.app;
services/images/text → локальные JSON; browash → Supabase.

### Статус переноса в новую админку
- [x] Модерация анкет мастеров (вкладка «Мастера»)
- [x] Модерация услуг мастеров (api/admin/master-services + вкладка «Мастера»)
- [x] Редактирование услуг каталога с фото (вкладка «Каталог»)
- [x] Заявки/отзывы всех 6 сайтов (вкладки «Заявки», «Отзывы»)
- [x] Своя система чатов (единые треды: сотрудник/клиент/мастер/поддержка) — треды именованные
      (по имени кабинета), история хранится даже после удаления кабинета (пометка «кабинет удалён»),
      вход клиента/мастера по телефону (/chat + api/chat), вкладка «Чат» в /chief с фильтрами
      все/сотрудники/клиенты/мастера; хранилище Storage admin/admin_chats.json
- [x] Чаты поддержки: импорт старой истории support_chats в новые треды (`support:<old id>`)
      — `app/api/admin/chat/import/route.ts` (GET-статус / POST-перенос, только team, без дублей,
      статус записи в поле `legacy_status` треда), фильтр «Поддержка» и кнопка импорта в «Чат»
      у руководителя; старая таблица НЕ изменялась (открытые в ней треды — не закрывались)
- [ ] Порядок услуг в каталоге (drag/↑↓, orderedIds)
- [ ] Добавление/удаление услуг в каталоге (полный CRUD)
- [ ] BroWash галерея (до 10 фото песочницы, Supabase)
- [x] Мультимодальное фото услуги (карусель/до-после, photos[]) — «Зеркало» → «Как видит клиент» →
      клик по карточке: просмотр + галерея (камера/файл, порядок ◀▶), хранение data/images.json (POST /api/images)

