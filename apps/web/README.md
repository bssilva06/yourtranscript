# Web App (Next.js)

Next.js 16 frontend and API gateway for YourTranscript. Handles the UI, authentication, rate limiting, transcript caching, and request logging.

## Pages & Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Page | Landing page with hero, signup/login links |
| `/login` | Page | Email/password login form |
| `/signup` | Page | Account registration form |
| `/dashboard` | Page | Main dashboard — transcript extractor + recent history |
| `/dashboard/settings` | Page | Account settings — profile, tier, usage bar |
| `/dashboard/transcript/[videoId]` | Page | Full transcript detail view for a specific video |
| `/api/extract` | API (POST) | Extracts transcript — checks auth, rate limit, cache, then calls worker |
| `/auth/callback` | API (GET) | Supabase auth callback for session exchange |

## Architecture

- `src/proxy.ts` — Next.js 16 edge proxy for auth redirects (protects `/dashboard/*`, redirects logged-in users away from `/login` and `/signup`)
- `src/lib/supabase/client.ts` — Browser Supabase client (anon key, cookie-based auth)
- `src/lib/supabase/server.ts` — Server Supabase client (anon key, reads cookies for auth)
- `src/lib/supabase/service.ts` — Service-role Supabase client (bypasses RLS for server-side writes)
- `src/lib/types.ts` — Shared TypeScript types (`TranscriptSegment`, `TranscriptHistoryItem`)
- `src/components/ui/` — shadcn/ui components (Button, Card, Input, Label, Textarea)

## API Route: `/api/extract`

**POST** with `{ "video_id": "dQw4w9WgXcQ" }`

Flow:
1. Verify auth (Supabase JWT via cookies)
2. Check rate limit (free tier: 5/day)
3. Check DB cache (`transcripts` table)
4. If not cached, call Python worker at `WORKER_URL/extract`
5. Cache result to DB, log request, increment daily count
6. Return transcript segments

Uses anon client for reads (respects RLS) and service-role client for writes.

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                   # http://localhost:3000
```

## Scripts

```bash
npm run dev    # start dev server
npm run build  # production build
npm run start  # start production server
npm run lint   # run ESLint
```

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` — for server-side writes (never expose to browser)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — Redis cache (in progress)
- Stripe keys — planned for Week 9

## Tech Stack

- Next.js 16.1.6 (App Router)
- React 19.2.3
- TypeScript (strict mode)
- Tailwind CSS v4 (CSS-based config via `@theme inline`)
- shadcn/ui (Button, Card, Input, Label, Textarea)
- Supabase SSR (`@supabase/ssr`)
- Custom fonts: Instrument Serif (display), DM Sans (body)
- Custom color theme: warm cream background with terracotta accent

## Dependencies

See `package.json` for the full list. Key packages:

- `next`, `react`, `react-dom` — framework
- `@supabase/ssr`, `@supabase/supabase-js` — auth and database
- `class-variance-authority`, `clsx`, `tailwind-merge` — styling utilities
- `lucide-react`, `radix-ui` — icons and primitives
