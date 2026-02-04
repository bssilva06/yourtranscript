from fastapi import FastAPI

app = FastAPI(title="YourTranscript Worker")


@app.get("/health")
async def health():
    return {"status": "ok"}
