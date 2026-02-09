import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { createServiceClient } from "@/lib/supabase/service";
import { redis, TRANSCRIPT_CACHE_TTL } from "@/lib/redis";
import { JOB_STATUS_TTL } from "@/lib/qstash";
import type { TranscriptSegment } from "@/lib/types";

interface CachedTranscript {
  segments: TranscriptSegment[];
  language: string;
}

interface CallbackPayload {
  job_id: string;
  video_id: string;
  user_id: string;
  segments: TranscriptSegment[];
  language: string;
  error?: string;
}

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(request: Request) {
  // Verify QStash signature
  const signature = request.headers.get("upstash-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const body = await request.text();

  try {
    await receiver.verify({ signature, body });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload: CallbackPayload = JSON.parse(body);
  const { job_id, video_id, user_id, segments, language, error } = payload;
  const serviceClient = createServiceClient();

  // Handle worker error
  if (error) {
    try {
      await redis.set(
        job_id,
        { status: "failed", video_id, error },
        { ex: JOB_STATUS_TTL }
      );
    } catch (e) {
      console.error("Redis job status update failed:", e);
    }

    await logRequest(serviceClient, user_id, video_id, "error", "error", 0, 0, error);
    return NextResponse.json({ status: "failed" });
  }

  // Persist transcript to database
  const textBlob = segments.map((s) => s.text).join(" ");
  await serviceClient.from("transcripts").upsert({
    video_id,
    language,
    content: segments,
    text_blob: textBlob,
    updated_at: new Date().toISOString(),
  });

  // Backfill Redis cache (7-day TTL)
  try {
    await redis.set<CachedTranscript>(
      `transcript:${video_id}`,
      { segments, language },
      { ex: TRANSCRIPT_CACHE_TTL }
    );
  } catch (e) {
    console.error("Redis cache backfill failed:", e);
  }

  // Update job status to completed (with transcript data for polling)
  try {
    await redis.set(
      job_id,
      { status: "completed", video_id, segments, language },
      { ex: JOB_STATUS_TTL }
    );
  } catch (e) {
    console.error("Redis job status update failed:", e);
  }

  // Log request and increment daily count
  await logRequest(serviceClient, user_id, video_id, "success", "youtube_api", 0, 0);
  await incrementDailyCount(serviceClient, user_id);

  return NextResponse.json({ status: "completed" });
}

async function logRequest(
  client: ReturnType<typeof createServiceClient>,
  userId: string,
  videoId: string,
  status: string,
  provider: string,
  costUsd: number,
  latencyMs: number,
  errorMessage?: string
) {
  try {
    await client.from("request_logs").insert({
      user_id: userId,
      video_id: videoId,
      status,
      provider,
      cost_usd: costUsd,
      latency_ms: latencyMs,
      error_message: errorMessage,
    });
  } catch (e) {
    console.error("Failed to log request:", e);
  }
}

async function incrementDailyCount(
  client: ReturnType<typeof createServiceClient>,
  userId: string
) {
  try {
    await client.rpc("increment_daily_extractions", { p_user_id: userId });
  } catch (e) {
    console.error("Failed to increment daily count:", e);
  }
}
