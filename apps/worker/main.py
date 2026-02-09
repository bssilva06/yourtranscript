import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)

app = FastAPI(title="YourTranscript Worker")

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the API client
yt_api = YouTubeTranscriptApi()


class TranscriptRequest(BaseModel):
    video_id: str


class AsyncTranscriptRequest(BaseModel):
    video_id: str
    job_id: str
    callback_url: str
    user_id: str


class TranscriptSegment(BaseModel):
    text: str
    start: float
    duration: float


class TranscriptResponse(BaseModel):
    video_id: str
    segments: list[TranscriptSegment]
    language: str


def _extract(video_id: str) -> tuple[list[TranscriptSegment], str]:
    """Shared extraction logic used by both sync and async endpoints."""
    video_id = video_id.strip()

    if not video_id:
        raise HTTPException(status_code=400, detail="video_id is required")

    if len(video_id) != 11:
        raise HTTPException(status_code=400, detail="Invalid video_id format")

    try:
        transcript_data = yt_api.fetch(video_id, languages=["en", "en-US", "en-GB"])

        segments = [
            TranscriptSegment(
                text=segment.text,
                start=segment.start,
                duration=segment.duration,
            )
            for segment in transcript_data
        ]

        return segments, "en"

    except TranscriptsDisabled:
        raise HTTPException(
            status_code=404,
            detail="Transcripts are disabled for this video",
        )
    except NoTranscriptFound:
        raise HTTPException(
            status_code=404,
            detail="No transcript found for this video",
        )
    except VideoUnavailable:
        raise HTTPException(
            status_code=404,
            detail="Video is unavailable or does not exist",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract transcript: {str(e)}",
        )


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/extract", response_model=TranscriptResponse)
async def extract_transcript(request: TranscriptRequest):
    """
    Synchronous transcript extraction (used in dev mode).
    """
    segments, language = _extract(request.video_id)
    return TranscriptResponse(
        video_id=request.video_id.strip(),
        segments=segments,
        language=language,
    )


@app.post("/extract-async")
async def extract_transcript_async(request: AsyncTranscriptRequest):
    """
    Async transcript extraction triggered by QStash.
    Extracts the transcript and POSTs the result to the callback URL.
    """
    video_id = request.video_id.strip()

    try:
        segments, language = _extract(video_id)

        callback_payload = {
            "job_id": request.job_id,
            "video_id": video_id,
            "user_id": request.user_id,
            "segments": [s.model_dump() for s in segments],
            "language": language,
        }
    except HTTPException as e:
        callback_payload = {
            "job_id": request.job_id,
            "video_id": video_id,
            "user_id": request.user_id,
            "error": e.detail,
        }

    # POST result back to the Next.js callback endpoint
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            await client.post(request.callback_url, json=callback_payload)
        except Exception as e:
            print(f"Callback POST failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to deliver result to callback: {str(e)}",
            )

    return {"status": "delivered"}
