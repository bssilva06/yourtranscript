import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redis, TRANSCRIPT_CACHE_TTL } from "@/lib/redis";
import { qstash, isQStashEnabled, JOB_STATUS_TTL } from "@/lib/qstash";
import type { TranscriptSegment } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:8000";
const QSTASH_CALLBACK_URL = process.env.QSTASH_CALLBACK_URL || "";
const FREE_TIER_DAILY_LIMIT = 5;

/** Shape of the cached transcript data in Redis */
interface CachedTranscript {
  segments: TranscriptSegment[];
  language: string;
}

interface WorkerResponse {
  video_id: string;
  segments: TranscriptSegment[];
  language: string;
}

interface WorkerError {
  detail: string;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // Check authentication (uses anon client with user's cookie)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Parse request body
  let body: { video_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { video_id } = body;

  if (!video_id || typeof video_id !== "string") {
    return NextResponse.json(
      { error: "video_id is required" },
      { status: 400 }
    );
  }

  // Check rate limit for free users (read via anon client — RLS allows SELECT on own profile)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("subscription_tier, daily_extractions_count, daily_extractions_reset_at")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_tier === "free") {
    const resetAt = new Date(profile.daily_extractions_reset_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentCount = profile.daily_extractions_count;
    if (resetAt < today) {
      currentCount = 0;
    }

    if (currentCount >= FREE_TIER_DAILY_LIMIT) {
      await logRequest(serviceClient, user.id, video_id, "error", "rate_limit", 0, Date.now() - startTime, "Daily limit exceeded");
      return NextResponse.json(
        { error: `Daily limit of ${FREE_TIER_DAILY_LIMIT} transcripts reached. Upgrade to Pro for unlimited access.` },
        { status: 429 }
      );
    }
  }

  // ── Tier 0: Check Redis cache (fastest) ──
  try {
    const redisCached = await redis.get<CachedTranscript>(`transcript:${video_id}`);
    if (redisCached) {
      const latency = Date.now() - startTime;
      await logRequest(serviceClient, user.id, video_id, "cached", "cache", 0, latency);
      await incrementDailyCount(serviceClient, user.id);

      return NextResponse.json({
        video_id,
        segments: redisCached.segments,
        language: redisCached.language,
        cached: true,
      });
    }
  } catch (e) {
    // Redis failure is non-fatal — fall through to DB cache
    console.error("Redis cache read failed:", e);
  }

  // ── Tier 1: Check database cache ──
  const { data: dbCached } = await supabase
    .from("transcripts")
    .select("content, language")
    .eq("video_id", video_id)
    .single();

  if (dbCached) {
    const latency = Date.now() - startTime;
    await logRequest(serviceClient, user.id, video_id, "cached", "db_cache", 0, latency);
    await incrementDailyCount(serviceClient, user.id);

    // Backfill Redis so next request is faster
    try {
      await redis.set<CachedTranscript>(
        `transcript:${video_id}`,
        { segments: dbCached.content as TranscriptSegment[], language: dbCached.language },
        { ex: TRANSCRIPT_CACHE_TTL }
      );
    } catch (e) {
      console.error("Redis backfill failed:", e);
    }

    return NextResponse.json({
      video_id,
      segments: dbCached.content,
      language: dbCached.language,
      cached: true,
    });
  }

  // ── Tier 2: Fresh extraction (sync in dev, async via QStash in prod) ──

  if (isQStashEnabled()) {
    // ── Async mode (production): enqueue via QStash ──
    const jobId = `job:${video_id}:${Date.now()}`;

    try {
      // Store initial job status in Redis
      await redis.set(
        jobId,
        { status: "processing", video_id, user_id: user.id },
        { ex: JOB_STATUS_TTL }
      );

      // Publish to QStash — it will POST to the worker's /extract-async endpoint
      await qstash.publishJSON({
        url: `${WORKER_URL}/extract-async`,
        body: {
          video_id,
          job_id: jobId,
          callback_url: `${QSTASH_CALLBACK_URL}/api/extract/callback`,
          user_id: user.id,
        },
        retries: 2,
      });

      return NextResponse.json({
        status: "processing",
        job_id: jobId,
        video_id,
      });
    } catch (error) {
      console.error("QStash publish failed:", error);
      const latency = Date.now() - startTime;
      await logRequest(serviceClient, user.id, video_id, "error", "error", 0, latency, "QStash publish failed");
      return NextResponse.json(
        { error: "Failed to enqueue extraction job" },
        { status: 503 }
      );
    }
  }

  // ── Sync mode (dev): call worker directly ──
  try {
    const workerResponse = await fetch(`${WORKER_URL}/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ video_id }),
    });

    if (!workerResponse.ok) {
      const errorData: WorkerError = await workerResponse.json();
      const latency = Date.now() - startTime;
      await logRequest(serviceClient, user.id, video_id, "error", "error", 0, latency, errorData.detail);
      return NextResponse.json(
        { error: errorData.detail || "Extraction failed" },
        { status: workerResponse.status }
      );
    }

    const data: WorkerResponse = await workerResponse.json();
    const latency = Date.now() - startTime;

    // Cache to database (write via service client — RLS requires service_role)
    const textBlob = data.segments.map(s => s.text).join(" ");
    await serviceClient.from("transcripts").upsert({
      video_id: data.video_id,
      language: data.language,
      content: data.segments,
      text_blob: textBlob,
      updated_at: new Date().toISOString(),
    });

    // Cache to Redis (7-day TTL)
    try {
      await redis.set<CachedTranscript>(
        `transcript:${video_id}`,
        { segments: data.segments, language: data.language },
        { ex: TRANSCRIPT_CACHE_TTL }
      );
    } catch (e) {
      console.error("Redis cache write failed:", e);
    }

    // Log the successful request (write via service client)
    await logRequest(serviceClient, user.id, video_id, "success", "youtube_api", 0, latency);

    // Increment daily extraction count (write via service client)
    await incrementDailyCount(serviceClient, user.id);

    return NextResponse.json({
      ...data,
      cached: false,
    });
  } catch (error) {
    console.error("Worker request failed:", error);
    const latency = Date.now() - startTime;
    await logRequest(serviceClient, user.id, video_id, "error", "error", 0, latency, "Worker connection failed");
    return NextResponse.json(
      { error: "Failed to connect to extraction service" },
      { status: 503 }
    );
  }
}

async function logRequest(
  client: SupabaseClient,
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
  client: SupabaseClient,
  userId: string
) {
  try {
    await client.rpc("increment_daily_extractions", { p_user_id: userId });
  } catch (e) {
    console.error("Failed to increment daily count:", e);
  }
}
