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


class TranscriptSegment(BaseModel):
    text: str
    start: float
    duration: float


class TranscriptResponse(BaseModel):
    video_id: str
    segments: list[TranscriptSegment]
    language: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/extract", response_model=TranscriptResponse)
async def extract_transcript(request: TranscriptRequest):
    """
    Extract transcript from a YouTube video using youtube-transcript-api.
    This is the free fallback method for development.
    """
    video_id = request.video_id.strip()

    if not video_id:
        raise HTTPException(status_code=400, detail="video_id is required")

    # Validate video_id format (11 characters, alphanumeric with - and _)
    if len(video_id) != 11:
        raise HTTPException(status_code=400, detail="Invalid video_id format")

    try:
        # Fetch transcript using the simplified fetch method
        # It automatically tries to find the best available transcript
        transcript_data = yt_api.fetch(video_id, languages=["en", "en-US", "en-GB"])

        segments = [
            TranscriptSegment(
                text=segment.text,
                start=segment.start,
                duration=segment.duration,
            )
            for segment in transcript_data
        ]

        return TranscriptResponse(
            video_id=video_id,
            segments=segments,
            language="en",
        )

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
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract transcript: {str(e)}",
        )
