# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Keep this file up to date.** When you implement a feature, fix a bug, add a new service integration, or change the architecture, update the relevant sections of this file (especially "Current Implementation Status" and "Database Schema"). This file should always reflect the actual state of the codebase.

## Project Overview

YouTube Transcript SaaS — a freemium ($9/mo Pro tier) web app for extracting YouTube transcripts, with planned AI summaries. MVP target: 12 weeks, $143 budget. See `youtube-saas-quick-start-guide.md` for the full roadmap and budget breakdown.

## Repository Structure

```
apps/web/        — Next.js 16 (App Router) frontend + API routes (TypeScript, Tailwind, shadcn/ui)
apps/worker/     — Python 3.11 FastAPI worker for transcript extraction
packages/shared/ — Shared types/utilities (future)
infra/           — Infrastructure configuration placeholders
supabase/        — Database migrations (schema, RLS policies, functions)
```

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand — deployed on Vercel
- **API Gateway:** Next.js API routes (Node.js 20+) — auth checks, rate limiting, billing webhooks, queue dispatch
- **Worker:** Python 3.11 + FastAPI on Google Cloud Run — transcript extraction
- **Database:** Supabase Postgres + Supabase Auth
- **Cache/Rate Limiting:** Upstash Redis
- **Job Queue:** Upstash QStash (HTTP-based, scale-to-zero)
- **Payments:** Stripe ($9/mo Pro plan)
- **Scraping:** ScrapingBee (primary), `youtube-transcript-api` (fallback/dev)

## Architecture

```
User → Next.js (Vercel)
         ├→ Supabase Auth (JWT)
         ├→ API Routes
         │    ├→ Upstash Redis (cache + rate limits)
         │    ├→ Upstash QStash (enqueue extraction jobs)
         │    └→ Supabase Postgres (read/write)
         └→ Frontend (Vercel Edge)

QStash → Python Worker (Cloud Run)
           ├→ ScrapingBee API (primary)
           ├→ youtube-transcript-api (fallback)
           └→ Supabase Postgres (persist results)
```

Key flow: user submits a YouTube URL → API route checks cache/rate limits → if not cached, enqueues job via QStash → Python worker extracts transcript using waterfall strategy (cache → ScrapingBee → youtube-transcript-api) → persists to Supabase → user polls/receives result.

## Development Phases

**CURRENT PHASE: MVP (Weeks 1-12)**
Focus: Basic transcription only, no AI features yet.

**Phase 1 (NOW):** Auth, dashboard, basic scraping
**Phase 2 (Month 4-6):** AI summaries (Gemini 3 Flash), multi-language
**Phase 3 (Month 7-12):** API access, advanced features

When implementing features, check `youtube-saas-quick-start-guide.md` for current phase priorities.

## Current Implementation Status

**What's built and working (Weeks 1-5):**
- Landing page, login, signup (Supabase Auth email/password)
- Dashboard with transcript extractor (paste URL → get text)
- Transcript detail pages (`/dashboard/transcript/[videoId]`)
- Recent transcript history with search/filter
- Account settings page (profile, tier badge, daily usage bar)
- Python FastAPI worker with `/extract` endpoint (youtube-transcript-api)
- API route `/api/extract` — auth, rate limiting, DB caching, request logging
- Service-role Supabase client for server-side writes (`src/lib/supabase/service.ts`)
- Upstash Redis caching layer (`src/lib/redis.ts`) — waterfall: Redis → DB → Worker, 7-day TTL, non-fatal failures
- Database schema with RLS policies, auto-profile trigger, daily counter functions
- Edge proxy (`src/proxy.ts`) for auth redirects on protected routes

**What's NOT wired up yet (planned):**
- ScrapingBee integration (planned Week 7 — using youtube-transcript-api for now)
- Stripe payments (planned Week 9)
- Zustand state management (listed in stack but not needed yet)

**Async extraction (QStash):** The `/api/extract` route supports hybrid sync/async mode controlled by `USE_QSTASH` env var. In dev (`USE_QSTASH=false`, default), the worker is called synchronously. In production (`USE_QSTASH=true`), jobs are enqueued via QStash → worker's `/extract-async` endpoint → callback to `/api/extract/callback` → client polls `/api/extract/status`. Job status is tracked in Redis with 5-min TTL.

## How To Work In This Repo (Rules)

- Use `apps/web` (Next.js API routes) for auth, rate limiting, billing webhooks, and job dispatch.
- Use `apps/worker` (FastAPI) only for transcript extraction logic.
- Default dev workflow must avoid paid services; prefer `youtube-transcript-api` unless explicitly asked.
- Target flow (once QStash is wired up): cache check → queue job → worker → DB update → client polls.
- Use the **anon/cookie client** (`createClient` from `server.ts`) for auth checks and RLS-respecting reads.
- Use the **service-role client** (`createServiceClient` from `service.ts`) for all server-side writes (request_logs, transcript upserts, daily count increments). Never expose this client to the browser.

**Additional rules:**
- Always create `.env.example` files (never commit actual `.env`)
- Use TypeScript strict mode in frontend
- Add JSDoc comments for complex functions
- Write tests for critical paths (auth, billing, extraction)
- Log errors to console in dev, to Sentry in prod (Phase 2)

## Schema Rules

- `transcripts.video_id` must be unique.
- `request_logs` must be written for all requests (success/error).

## Rate Limits

- Free tier: 5 transcripts/day
- Pro tier: unlimited
- Enforced in API gateway (not client-side)

## Async Job Conventions

- API route enqueues QStash job; worker processes and persists results.
- Client should poll status or read from DB; no long-running API requests.

## Cost Guardrails (Budget Sensitive)

- Do not trigger ScrapingBee in dev/test by default.
- Log `provider` and `cost_usd` to `request_logs` for every request.
- Prefer cached responses; avoid reprocessing the same `video_id`.

## Common Pitfalls (Don't Do This)

- ❌ Don't scrape from main server IP (always use ScrapingBee or proxies)
- ❌ Don't use synchronous request handling in production (queue jobs via QStash — currently synchronous in dev, must change before Vercel deploy)
- ❌ Don't store API keys in code (use env vars + Secret Manager)
- ❌ Don't skip caching layer (wastes money on duplicate scrapes)
- ❌ Don't create long-running API routes (Vercel has 10s timeout on Hobby tier)

## Database Schema (Supabase)

Schema lives in `supabase/migrations/001_initial_schema.sql`.

- `user_profiles` — extends `auth.users` with `subscription_tier` (free/pro), `stripe_customer_id`, `daily_extractions_count`, `daily_extractions_reset_at`. Auto-created on signup via trigger.
- `transcripts` — `video_id` (unique), `language`, `content` (JSONB), `text_blob`, `created_at`, `updated_at`
- `request_logs` — usage tracking: `user_id`, `video_id`, `status`, `provider`, `cost_usd`, `latency_ms`, `error_message`
- `ai_summaries` — Phase 2 (deferred)

**RLS policies:** Transcripts readable by all authenticated users. Request logs readable only by owning user. User profiles readable/updatable only by owning user. All writes require service_role.

**Helper functions:** `increment_daily_extractions(p_user_id)`, `get_daily_extractions(p_user_id)` — handle daily counter with auto-reset.

## Environment & Secrets

- `apps/web/.env.local`: Supabase, Upstash, QStash, Stripe keys.
- `apps/worker/.env`: ScrapingBee, Supabase service key (if needed).
- Never commit secrets; use example env files instead.

**Required for MVP:**

`apps/web/.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Server-side only

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXX...

# Upstash QStash
QSTASH_URL=https://qstash.upstash.io/v2/publish
QSTASH_TOKEN=eyJhbGc...
QSTASH_CURRENT_SIGNING_KEY=sig_...
QSTASH_NEXT_SIGNING_KEY=sig_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...  # Use test key in dev
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

`apps/worker/.env`:
```bash
# Supabase (for writing results)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...

# ScrapingBee (optional in dev)
SCRAPINGBEE_API_KEY=XXX...
```

**Getting these keys:**
- Supabase: Dashboard → Settings → API
- Upstash Redis: Create database → REST API tab
- Upstash QStash: Create QStash → Settings
- Stripe: Dashboard → Developers → API keys
- ScrapingBee: scrapingbee.com/account (skip in dev)

**Never commit:** Create `.env.example` with placeholder values instead.

## Build & Run Commands

### Frontend (`apps/web/`)
```bash
npm install              # install dependencies
npm run dev              # local dev server (http://localhost:3000)
npm run build            # production build
npm run lint             # lint
```

### Worker (`apps/worker/`)
```bash
python -m venv venv
venv\Scripts\activate                              # Windows
# source venv/bin/activate                         # macOS/Linux
pip install -r requirements.txt                    # install dependencies
uvicorn main:app --reload                          # local dev server (http://localhost:8000)
pytest                                             # run tests
```

## Quick Reference Commands

**Local Development:**
```bash
# Start everything locally
cd apps/web && npm run dev          # http://localhost:3000
cd apps/worker && uvicorn main:app --reload  # http://localhost:8000
docker run -d -p 6379:6379 redis:7  # local Redis for testing
```

**Database:**
```bash
npx supabase start          # Start local Supabase
npx supabase db reset       # Reset schema
npx supabase db diff        # Show schema changes
npx supabase db push        # Push changes to remote
```

**Testing:**
```bash
cd apps/web && npm test                    # Frontend tests
cd apps/worker && pytest                   # Worker tests
curl http://localhost:3000/api/health      # Check API
```

**Deployment:**
```bash
git push origin main           # Auto-deploys to Vercel (frontend)
# Worker: manual deploy to Cloud Run (see deployment docs)
```

## Security Checklist

Before any deployment:
- [ ] All API keys in environment variables (not code)
- [ ] Supabase RLS (Row Level Security) policies enabled
- [ ] Rate limiting enforced server-side (not client)
- [ ] Stripe webhooks use webhook signing secret verification
- [ ] CORS configured (restrict to app domain only)
- [ ] Input validation on all API routes (Zod schemas)
- [ ] SQL injection prevented (Supabase parameterized queries)

## Cost Tracking (Budget Sensitive)

**Every request must log costs (use service-role client for writes):**
```typescript
// In API route after extraction — use serviceClient, not the anon client
await serviceClient.from('request_logs').insert({
  user_id,
  video_id,
  status: 'success',
  provider: 'youtube_api', // or 'cache', 'db_cache', 'scrapingbee', 'error'
  cost_usd: 0,             // youtube-transcript-api is free; ScrapingBee = $0.003
  latency_ms: 1240,
  error_message: undefined, // only for errors
});
```

**Monthly cost query:**
```sql
-- Total costs this month
SELECT 
  provider,
  COUNT(*) as requests,
  SUM(cost_usd) as total_cost
FROM request_logs
WHERE created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY provider;
```

**Alert thresholds:**
- ScrapingBee > $50/day → investigate
- Error rate > 5% → check logs
- Same video_id requested >100 times → potential abuse

## Waterfall Scraping Strategy (Critical)

**Order of operations for every transcript request:**
```python
# In apps/worker/main.py

async def get_transcript(video_id: str, user_id: str):
    # Tier 0: Check cache (Redis)
    cached = await redis.get(f"transcript:{video_id}")
    if cached:
        log_request(user_id, video_id, "cache", cost=0)
        return cached
    
    # Tier 1: Check database (already scraped before)
    db_result = await supabase.from('transcripts').select('*').eq('video_id', video_id).single()
    if db_result.data and is_fresh(db_result.data.created_at, days=7):
        await redis.setex(f"transcript:{video_id}", 604800, db_result.data.content)
        log_request(user_id, video_id, "db_cache", cost=0)
        return db_result.data.content
    
    # Tier 2: ScrapingBee (99.98% success rate)
    if SCRAPINGBEE_API_KEY:
        try:
            transcript = await scrapingbee.get_transcript(video_id)
            await save_and_cache(video_id, transcript)
            log_request(user_id, video_id, "scrapingbee", cost=0.003)
            return transcript
        except Exception as e:
            logger.warning(f"ScrapingBee failed: {e}")
    
    # Tier 3: Fallback to youtube-transcript-api (free but less reliable)
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        await save_and_cache(video_id, transcript)
        log_request(user_id, video_id, "youtube_api", cost=0)
        return transcript
    except Exception as e:
        log_request(user_id, video_id, "error", cost=0, error=str(e))
        raise Exception(f"All extraction methods failed: {e}")
```

**Cost optimization:**
- 80% cache hit rate → $0 cost
- 15% new requests → ScrapingBee ($0.003 each)
- 5% fallback → youtube-transcript-api ($0)

## Debugging Common Issues

**Transcript extraction fails:**
1. Check if video has captions (not all videos do)
2. Verify ScrapingBee API key is set
3. Check `request_logs` table for error details
4. Test with youtube-transcript-api locally first

**Cache not working:**
1. Verify Redis connection (Upstash URL in env)
2. Check TTL is set (7 days for transcripts)
3. Look for `video_id` typos (must be exact match)

**Rate limit not enforced:**
1. Verify Redis INCR operation is atomic
2. Check user_id is properly extracted from JWT
3. Test with multiple accounts

**Vercel timeout:**
1. Job should be enqueued in <1s, not processed synchronously
2. Check QStash integration is working
3. Client should poll for results, not wait

## Key Design Decisions

- **QStash over BullMQ** — scale-to-zero, no idle costs
- **ScrapingBee over DIY proxies** — 99.98% reliability, saves maintenance time
- **Waterfall scraping strategy** — check cache first, then ScrapingBee, then youtube-transcript-api fallback
- **Gemini 3 Flash for AI summaries** (Phase 2) — 86% cheaper than Claude for bulk summarization
- **Serverless-first** — all services scale to zero when idle

## Testing Strategy

- Unit tests for extraction helpers and rate-limiting logic
- Integration tests for API → worker → DB flow
- Webhook tests for Stripe events
