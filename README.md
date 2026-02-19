# This Story

5 minutes of daily reflection, powered by AI. Track your growth, discover your patterns.

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- OpenAI API key

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Add your OpenAI API key to .env
# OPENAI_API_KEY="sk-..."

# 4. Start PostgreSQL
docker compose up -d

# 5. Run database migration and seed
npx prisma migrate deploy
npx prisma db seed

# 6. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Account

After seeding, you can log in with:
- Email: `demo@thistory.app`
- Password: `demo1234`

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: NextAuth.js v5 (JWT + Credentials)
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Vercel AI SDK + OpenAI (gpt-4o-mini)
- **Push Notifications**: Web Push API + web-push
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts

## Project Structure

```
src/
  app/
    (auth)/          Login, signup pages
    (main)/          Authenticated pages (chat, dashboard, settings)
    api/             API routes (auth, chat, push, notifications, cron)
  components/
    ui/              Reusable components (Button, Input, Card, Badge, etc.)
    chat/            Chat-specific components
    dashboard/       Dashboard-specific components
    settings/        Notification settings component
  lib/
    auth.ts          NextAuth configuration
    prisma.ts        Database client
    push.ts          Server-side push notification service
    push-client.ts   Client-side push subscription management
    streak.ts        Streak calculation
    ai/              AI prompts and extraction logic
  types/             TypeScript type definitions
prisma/
  schema.prisma      Database schema
  seed.ts            Seed data
public/
  sw.js              Service worker for push notifications
```

## NPM Scripts

```bash
npm run dev                 # Start dev server
npm run build               # Production build
npm run db:up               # Start PostgreSQL
npm run db:migrate          # Run migrations
npm run db:seed             # Seed database
npm run db:studio           # Open Prisma Studio
npm run generate-vapid-keys # Generate VAPID keys for push notifications
```

## Push Notifications Setup

1. Generate VAPID keys:
   ```bash
   npm run generate-vapid-keys
   ```

2. Add the keys to your `.env`:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key"
   VAPID_PRIVATE_KEY="your-private-key"
   CRON_SECRET="your-cron-secret"
   ```

3. Enable notifications in the Settings page after logging in.

### Testing Notifications Locally

Trigger the cron endpoint manually:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/notifications
```

### Production (Vercel)

The `vercel.json` configures a cron job to run every minute (`* * * * *`).
This requires a Vercel Pro plan. For Hobby plans, change the schedule to a daily time (e.g., `0 * * * *` for hourly).

## Features (MVP)

- JWT-based authentication (signup/login)
- Streaming AI chat with guided daily reflection
- Automatic insight extraction (goals, concerns, actions, habits)
- Dashboard with streak tracking, activity chart, habit tracker
- Conversation history viewer
- **Web Push notifications** with per-user scheduling and timezone support
