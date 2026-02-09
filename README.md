# YourTranscript

A freemium SaaS for extracting YouTube transcripts. Paste a YouTube URL, get the full transcript instantly. Free tier includes 5 extractions/day; Pro tier ($9/mo) offers unlimited access.

**Status:** MVP in progress (Phase 1 — auth, dashboard, and basic extraction working)

## Repo Layout

```
apps/web/        — Next.js 16 (App Router) frontend + API routes
apps/worker/     — Python 3.11 FastAPI worker for transcript extraction
packages/shared/ — Shared types/utilities (planned)
infra/           — Infrastructure notes and configuration placeholders
supabase/        — Database migrations (Postgres schema, RLS policies)
```

## What's Working

- Landing page with signup/login
- Supabase Auth (email/password) with session handling
- Dashboard with transcript extraction (paste URL, get text)
- Copy-to-clipboard for full transcript text
- Timestamped segment display
- Transcript detail pages (`/dashboard/transcript/[videoId]`)
- Recent transcript history with search/filter
- Account settings page (profile, tier, daily usage bar)
- Database caching (same video isn't re-extracted)
- Rate limiting for free tier (5/day) via daily counter
- Request logging (provider, cost, latency) to `request_logs`
- Service-role Supabase client for server-side writes (bypasses RLS)

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Supabase account (free tier)
- Upstash account (free tier) — for Redis caching (in progress)

### 1. Web app

```bash
cd apps/web
cp .env.example .env.local   # fill in your Supabase keys
npm install
npm run dev                   # http://localhost:3000
```

### 2. Worker

```bash
cd apps/worker
python -m venv venv
venv\Scripts\activate         # Windows
# source venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload     # http://localhost:8000
```

### 3. Database

Run `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor to create the `transcripts`, `request_logs`, and `user_profiles` tables with RLS policies.

## Environment Variables

- `apps/web/.env.example` — Supabase, Upstash, Stripe keys
- `apps/worker/.env.example` — Supabase service key, ScrapingBee (optional)

Copy to `.env.local` / `.env` and fill in values before running locally. Never commit actual secrets.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| API Gateway | Next.js API routes (auth, rate limiting, caching, job dispatch) |
| Worker | Python 3.11, FastAPI, youtube-transcript-api |
| Database | Supabase Postgres with RLS |
| Auth | Supabase Auth (email/password) |
| Cache | Upstash Redis (in progress) |
| Payments | Stripe (planned — Week 9) |

## Roadmap

See `youtube-saas-quick-start-guide.md` for the full 12-week roadmap and budget breakdown.
