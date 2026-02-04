# YouTube Transcript SaaS

This repository contains the initial codebase for a YouTube transcript SaaS.

## Repo Layout
- `apps/web/` — Next.js 16 (App Router) frontend + API routes
- `apps/worker/` — Python FastAPI worker for transcript extraction
- `packages/shared/` — Shared types/utilities (future)
- `infra/` — Infra notes and configuration placeholders

## Quick Start

### Web app
```bash
cd apps/web
npm install
npm run dev
```

### Worker
```bash
cd apps/worker
python -m venv venv
venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Environment
- `apps/web/.env.example` — web app environment variables
- `apps/worker/.env.example` — worker environment variables

Copy these to `.env.local` or `.env` as appropriate before running locally.
