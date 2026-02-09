# Infrastructure

Configuration placeholders and notes for production infrastructure.

## Services

| Service | Purpose | Status |
|---------|---------|--------|
| Vercel | Web app hosting (Next.js) | Planned |
| Supabase | Postgres database + Auth | Active (free tier) |
| Upstash Redis | Transcript caching + rate limiting | Account created, integration in progress |
| Upstash QStash | Async job queue (worker dispatch) | Planned |
| Google Cloud Run | Worker hosting (Python FastAPI) | Planned |
| Stripe | Payments ($9/mo Pro tier) | Planned (Week 9) |
| ScrapingBee | Reliable transcript extraction | Planned (Week 7) |

## Database

Schema lives in `supabase/migrations/001_initial_schema.sql`. Includes:

- `transcripts` — cached transcript data (video_id unique, JSONB content)
- `request_logs` — usage tracking (user, video, status, provider, cost, latency)
- `user_profiles` — extends auth.users with subscription tier and daily counters
- RLS policies for all tables
- Trigger to auto-create user profile on signup
- Helper functions for daily extraction counting
