# Worker Service (Python)

FastAPI worker used for transcript extraction. This service is invoked by the web app via QStash (async jobs) and can run locally for development.

## Endpoints

- `GET /health` — basic health check

## Setup

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Environment

Copy `apps/worker/.env.example` to `apps/worker/.env` and fill in values.
If `SCRAPINGBEE_API_KEY` is blank, the worker should default to the free fallback during development.

## Dependencies

See `requirements.txt` for FastAPI, Uvicorn, and HTTP utilities.
