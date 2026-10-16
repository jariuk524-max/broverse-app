# ТЗ: Система «Услуги мастеров» — поэтапная реализация

Статус: Этап 1 ✅ · Этап 2 ✅ (UI доработан) · Этап 3 ✅ · Этап 4 ✅ (код) · Этап 5 ✅ (код) · Этап 6 ⬜
Блокер E2E: сеть до *.vercel.app недоступна (код задеплоен, Ready).

## Схема данных

| Сущность | Где | Ключевые поля |
|---|---|---|
| Анкета мастера | Supabase `orders` (песочница) | `service_name='Анкета мастера'`, `metadata.domain='master'`, description = «Специализация · Опыт · Город · О себе», photo, status=review |
| Услуга мастера | **Supabase Storage** `catalog-photos/master_services.json` (service-key в монолите; SQL не требуется) | `{id, created_at, master_id, master_name, title, description, price, price_variants, work_types[], photos[], phone, status: pending\|approved\|rejected\|paused}` |
| Каталог услуг | монолит `/api/catalog-services` (Storage services.json) | 46 услуг wash/build/frame/move/rent + garden-локальный список в UI |

Адреса: песочница `https://broverse-client.vercel.app`, монолит `https://broverse-masters.vercel.app`.

---

## Этап 1 — Анкета мастера → админка ✅
**Код:** `MasterRegistrationForm` (фото, имя, телефон, специализация 6 доменов, опыт, город, о себе) → `createServiceRequest` (orders, domain=master); `/master` + кнопка на главной; чип «Анкета мастера» в /admin.
**Проверки:** tsc ✅ · /master 200 ✅ · E2E insert→select→delete (204) ✅.

## Этап 2 — «Мои услуги» + «Добавить услугу» ✅ (UI уровня топовых продуктов)
**Код:** монолит `app/page.tsx` → `MasterServicesSection`.
**Флоу добавления (2 шага, bottom-sheet):**
- Прогресс-полоса 50%→100%, подписи «Шаг 1 из 2 / Шаг 2 из 2».
- Шаг 1 «Выберите услугу»: поиск (с очисткой, по name+desc), чипы доменов (Все/Ваши/чужие с 🔒), карточки с бренд-иконкой и базовой ценой; чужие домены disabled + «По приглашению»; empty-state с «Сбросить фильтры»; футер-подсказка про приглашение.
- Шаг 2 «Ваши условия»: хедер с иконкой/названием, кнопка «‹ Каталог»; **цена** (prefill из каталога, подсказка «В каталоге от X ₽», валидация >0), **варианты цен** (текст), **описание** (prefill desc каталога, счётчик 0/500), **фото** (превью + удаление, подсказка про заказы); sticky-footer CTA «Отправить на проверку» (shadow, active-scale); **защита от дублей** («Услуга уже есть в вашем списке»); микротекст «до 24 часов».
- Escape/клик по фону закрывает, scroll-lock фона, success-тост «Услуга отправлена на проверку» (3 с).
- Список: тумблер approved⇄paused («Приостановлено»), варианты цен синим, чипы статусов, редактирование цены кликом, удаление.
**Проверки:** tsc ✅ · после деплоя: визуально проверить шаги/баланс; POST→pending; тумблер paused↔approved; дубликат блокируется.

## Этап 3 — Модерация в /admin ✅
**Код:** proxy `/api/admin/master-services` (x-admin-pin → masters API; без CORS) + вкладка «Мастеры» (фильтры На модерации/Все, карточки, Одобрить→approved / Отклонить→rejected).
**Проверки:** без PIN 401 ✅ · E2E модерации — ожидает доступности Vercel (блокер сети).

## Этап 4 — Объявления на клиентском сайте ✅ (код)
**Код:** `lib/master-ads.ts` (типы, детект домена/бренда по work_types/тексту, парсер профиля анкеты) + `GET /api/masters/ads` (server: Storage public JSON `catalog-photos/master_services.json` → фильтр `status=approved` + обогащение профилем из `orders` по `master_name` → домен/бренд/цвет/фото) + секция «Мастера» в `components/DomainGrid.tsx` (карточка: фото услуги, чип «Мастер» + цвет бренда, аватар/инициалы, имя·город, ★5.0, описание, цена, клик → `ServiceDetailModal` → `OrderModal`). Секция рендерится только при наличии approved.
**Проверки:** tsc ✅ · API на тестовых данных: 2 approved отдаёт (wash, frame) / pending не отдаёт ✅ · без данных → `[]`, секция скрыта ✅ · остались только визуальная проверка с реальными услугами.

## Этап 5 — Поиск по объявлениям ✅ (код)
**Код:** `SmartSearch` тянет `/api/masters/ads`, ищет по title/description/имени мастера (title→0.95, desc/master→0.85, слова→0.75), рендерит блок «Мастер» (бренд-цвет, чип «Мастер», confidence, имя·город·цена); клик → `onMasterAdClick` (на главной открывает `OrderModal`) или Link `/#masters`.
**Проверки:** tsc ✅ · логика детекта домена/парсинга профиля проверена на 7 сэмплах ✅ · визуально — после появления реальных approved-услуг.

## Этап 6 — Фильтр карты + апсейл-предложения ⬜
Переключатель «Все / Только мои услуги» на карте заказов; `service_offers`-матрица (wash→rent, move→garden…), баннер в кабинете, согласие → услуга pending; in-app уведомления, потом TG (@BroVerse_Masters_Bot).
**Проверки:** фильтр; предложение → услуга на модерации.

---

## Ограничения / известное
- Storage-хранилище услуг: read-modify-write (мало записей — ок для MVP); конкурентность не защищена.
- master_id='master-1' захардкожен (демо без auth) — при auth заменить на реальный id.
- master_services.json читается service-key — публичный read для хаба (этап 4) — через server-proxy песочницы или публичный bucket.
- Этап 4: bucket `catalog-photos` публичный — `GET /api/masters/ads` читает `catalog-photos/master_services.json` по public URL (без ключа). Override для локальных тестов: env `MASTER_SERVICES_JSON_URL`.
- Временный сетевой блокер: *.vercel.app таймаутят с локальной сети (Google/Supabase/vercel.com работают) — повторить E2E позже/с телефона.

