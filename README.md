# CV-Monolith

T3 Stack Portfolio with Telegram 2FA authentication.

## Quick Start

```bash
npm install
cp .env.example .env
# Configure .env with your credentials

# Database
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# Development
npm run dev
```

## Setup

### 1. Telegram Bot

1. Create bot via @BotFather on Telegram
2. Copy bot token to `.env` as `BOT_TOKEN`
3. Set webhook: `https://your-domain.com/api/bot`

### 2. Database

Use PostgreSQL. Configure `DATABASE_URL` in `.env`.

### 3. Admin Access

Add your Telegram ID to `TELEGRAM_ADMIN_IDS` in `.env`.

## Features

- Public portfolio with projects, experience, skills
- Admin dashboard (`/admin`)
- Telegram 2FA login flow
- SEO ready (sitemap, robots.txt)

## Tech Stack

- Next.js 15
- tRPC
- Prisma
- NextAuth
- Tailwind CSS
- Grammy (Telegram Bot)

TODO Переделать проект:
    1. Архитектура и База Данных (Prisma)
    Спроектировать гибкую схему:

    Создать модель User с полями для Telegram ID и статуса верификации.

    Создать модель Portfolio (связь 1:1 или 1:N с пользователем).

    Создать модель Section (динамические разделы: заголовок, порядок).

    Создать модель Field (типы: TEXT, IMAGE, URL).

    Миграция: Выполнить npx prisma db push для обновления структуры в Supabase.

    2. Умная Авторизация (NextAuth + Telegram)
    Настроить сессии: Установить maxAge: 30d в конфиге NextAuth, чтобы исключить постоянные логины.

    Telegram Bot Logic: * Добавить обработчик команды /start с параметром (токен верификации).

    Реализовать кнопку request_contact для получения номера телефона.

    API Route: Создать эндпоинт /api/auth/verify, который принимает данные от бота и обновляет isVerified в базе.

    3. Конструктор Контента (Dynamic UI)
    Универсальный редактор: Создать форму, где пользователь может нажать «Добавить поле» и выбрать его тип.

    Загрузка медиа: Интегрировать Supabase Storage для хранения изображений. Реализовать превью перед загрузкой.

    Drag-and-Drop: Внедрить dnd-kit или react-beautiful-dnd, чтобы менять блоки местами без перезагрузки.

    4. Публичная часть и SEO
    Динамические роуты: Настроить пути вида /[username] для просмотра готовых CV.

    Middleware: Защитить пути /dashboard/*, чтобы редактировать профиль мог только владелец сессии.

    Metadata API: Генерировать динамические заголовки и превью (OG-images) для каждой страницы пользователя.

    5. Личный кабинет (Dashboard)
    Просмотр чужих CV: Создать ленту или поиск по всем публичным портфолио.

    Статистика: (Опционально) Добавить счетчик просмотров для каждого CV.

Universal Auth Monolith: Production Grade (Enhanced v2)

Контекст: Построй отказоустойчивую систему аутентификации (Signup / Signin / Recovery) с двухфакторной верификацией через Email и Telegram.
Стек: Next.js 14 (App Router), Prisma, Redis (Upstash или ioredis), NextAuth.js v4, Telegram Bot API (grammy или telegraf), Nodemailer, bcrypt.

1. БЕЗОПАСНОСТЬ И КЭШ (Redis)

1.1 Rate Limiting (Строгий)
- Логика: 1 запрос на отправку кода в 60 секунд с одного IP ИЛИ одного Username/Email.
- Реализация: Использовать @upstash/ratelimit + @upstash/redis. Ключи: rate:ip:{ip} и rate:target:{username}.

1.2 Управление состоянием в Redis
- Ключи:
  - pending_reg:{uuid} -> Содержит: { username, passwordHash, email?, telegramId?, method }. TTL: 15 минут.
  - code:{userId} -> Содержит: XXXX. TTL: 5 минут.
  - reset_token:{userId} -> Маркер активной сессии сброса. TTL: 10 минут.
- Cleanup (Важно): При генерации нового кода строго удалять старый ключ code:{userId} перед записью нового. Это предотвращает атаки с перебором нескольких кодов одновременно.

1.3 Обработка паролей
- Критично: Пароль хешируется через bcrypt с солью 10 на бэкенде перед сохранением в Redis (в pending_reg). Запрещено хранить сырой пароль даже во временном кэше.

2. РЕГИСТРАЦИЯ (Signup Flow)

2.1 Поля формы
- Username (уникальный), Password, Confirm Password.
- Радио-кнопка выбора канала: Email ИЛИ Telegram.
- Поле для ввода Email или Username Telegram (без '@').

2.2 Бэкенд логика (/api/auth/signup/init)
1. Валидация сложности пароля (мин. 8 символов, буквы+цифры).
2. Генерация userId = uuidv4().
3. Хеширование пароля -> passwordHash.
4. Асинхронная отправка кода (Fire-and-Forget):
   - API возвращает { pendingId: userId, status: 'pending', expiresIn: 900 } немедленно (без ожидания SMTP/TG).
   - Отправка письма/сообщения ботом выполняется в Promise.catch с логгированием ошибок.

2.3 Канал Email
- Генерация 4 цифр (1000-9999).
- Отправка через Nodemailer с красивым HTML-шаблоном.

2.4 Канал Telegram (Deep Linking)
- Ссылка на сайте: t.me/cv_azizbot?start=reg_{userId}
- Логика бота:
  - Получает /start reg_{userId}.
  - Ищет в Redis ключ pending_reg:{userId}.
  - Если найден — генерирует код, сохраняет в Redis и отправляет сообщение: «Ваш код для регистрации: 4829».
  - Если не найден — сообщает: «Сессия регистрации истекла, начните заново на сайте».
- Связка с юзером: Бот сохраняет telegramChatId в объект pending_reg:{userId} для будущей верификации.

2.5 Верификация кода (/api/auth/signup/verify)
1. Принимает pendingId и code.
2. Проверяет code:{pendingId} в Redis.
3. При успехе:
   - Достает данные из pending_reg:{pendingId}.
   - Prisma Transaction:
     user = await prisma.user.create({
       data: {
         username: data.username,
         passwordHash: data.passwordHash,
         email: data.email,
         telegramId: data.telegramChatId,
         isVerified: true,
         authMethod: data.method
       }
     })
   - Удаляет ВСЕ ключи Redis, связанные с pendingId.
   - Автоматически выполняет вход (вызывает signIn из NextAuth) без повторного ввода пароля.

3. ВХОД И СЕССИИ (Signin с NextAuth)

3.1 NextAuth Credentials Provider
- Кастомный authorize:
  1. Ищет пользователя по username.
  2. Сравнивает bcrypt.compare(credentials.password, user.passwordHash).
  3. Критическая проверка: Если user.isVerified === false -> выбрасывать ошибку VERIFICATION_REQUIRED (не пускать).
- Конфиг сессии:
  - strategy: "jwt"
  - maxAge: 30 * 24 * 60 * 60 (30 дней).

3.2 Обработка ошибки VERIFICATION_REQUIRED
- Frontend: Если API NextAuth возвращает эту ошибку, редирект на /auth/verify?pending={username}.
- Бэкенд на /auth/verify: Позволяет повторно отправить код на основной контакт пользователя (Email/TG) без повторной регистрации.

4. ВОССТАНОВЛЕНИЕ (Forgot Password) — Защита от User Enumeration

4.1 Step 1: Запрос на сброс
- Фронт: Поле "Username или Email".
- Бэкенд (КРИТИЧНО):
  - Всегда отвечать HTTP 200 OK с текстом: "Если указанный аккаунт существует и имеет активный контакт, инструкции направлены."
  - Тайминг ответа: Искусственно замедлять ответ до ~1.5 секунд (через setTimeout), чтобы злоумышленник не мог определить наличие юзера по скорости ответа сервера.
  - Поиск в БД только после задержки.

4.2 Step 2: Выбор канала доставки
- Система проверяет приоритет:
  1. Если в БД заполнен email -> отправляем туда.
  2. Если email = null, но заполнен telegramId -> бот отправляет код в ЛС Telegram.
  3. Если нет ни того, ни другого -> ничего не отправляем, но логгируем попытку сброса без контакта для админа.

4.3 Step 3: Сброс пароля
- Код проверяется по ключу reset_code:{userId} (TTL 5 мин).
- При вводе нового пароля:
  - bcrypt.hash -> обновление user.passwordHash.
  - Инвалидация сессий: Обновление поля user.updatedAt.
  - В NextAuth callback jwt должна быть проверка: если token.iat (время выдачи токена) меньше user.updatedAt -> return null (разлогин на всех устройствах).

5. ТЕЛЕГРАМ БОТ (Обработчик команд)

5.1 Команда /start
- Регулярное выражение для парсинга: \/start (reg|reset)_([a-f0-9-]+)
- Логика для reg_{id}:
  - const data = await redis.get(`pending_reg:${id}`)
  - Если data:
    - Генерируем код.
    - redis.setex(`code:${id}`, 300, code)
    - data.telegramChatId = ctx.chat.id (сохраняем ID чата обратно в Redis).
    - Ответ: «Код для регистрации: XXXX».
  - Если !data: «Регистрация не найдена. Пройдите форму на сайте заново».

5.2 Логика для reset_{id}
- Аналогично, но проверяется ключ reset_pending:{id} (создается на время сброса пароля).
- Ответ: «Код для сброса пароля: XXXX».

6. ДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ ДЛЯ PRODUCTION GRADE

6.1 Логирование и мониторинг
- Все ошибки отправки (Nodemailer SMTP fail, Telegram API fail) писать в console.error + сохранять в отдельную таблицу БД SystemLog.
- Rate Limit хиты писать в лог с пометкой [SECURITY].

6.2 Безопасность заголовков
- Strict-Transport-Security: max-age=31536000
- X-Content-Type-Options: nosniff
- Отключение X-Powered-By: Next.js в next.config.js.

6.3 Graceful Degradation
- Если Redis упал — API регистрации должен вернуть 503 Service Unavailable с понятным текстом, но НЕ КРАШИТЬ весь Next.js.