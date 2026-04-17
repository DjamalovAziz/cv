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