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