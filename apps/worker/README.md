# Worker Service (Python)

FastAPI worker for YouTube transcript extraction. Called by the Next.js API route to extract transcripts using `youtube-transcript-api`. In production, this will run on Google Cloud Run and be invoked via Upstash QStash.

Currently uses `youtube-transcript-api` (free, open-source) as the extraction method. ScrapingBee integration is planned for Week 7 as a higher-reliability fallback.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check — returns `{ "status": "ok" }` |
| POST | `/extract` | Extract transcript — accepts `{ "video_id": "..." }`, returns segments |

### POST `/extract`

**Request:**
```json
{ "video_id": "dQw4w9WgXcQ" }
```

**Response:**
```json
{
  "video_id": "dQw4w9WgXcQ",
  "segments": [
    { "text": "We're no strangers to love", "start": 18.0, "duration": 3.5 }
  ],
  "language": "en"
}
```

**Error cases:**
- `400` — missing or invalid video_id
- `404` — transcripts disabled, no transcript found, or video unavailable
- `500` — unexpected extraction failure

## Setup

```bash
cd apps/worker
python -m venv venv
venv\Scripts\activate         # Windows
# source venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload     # http://localhost:8000
```

## Environment

Copy `.env.example` to `.env` and fill in values:

- `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` — for writing results directly to DB (planned)
- `SCRAPINGBEE_API_KEY` — leave blank in dev to use `youtube-transcript-api` fallback

## Dependencies

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `youtube-transcript-api` | Transcript extraction (free fallback) |
| `python-dotenv` | Environment variable loading |
| `httpx` | HTTP client (for future ScrapingBee integration) |

## Current Limitations

- Only extracts English transcripts (`en`, `en-US`, `en-GB`)
- No ScrapingBee integration yet (planned Week 7)
- Called synchronously by the API route (QStash async dispatch planned)
- CORS configured for `localhost:3000` only
