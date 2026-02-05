import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:8000";
const FREE_TIER_DAILY_LIMIT = 5;

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
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

  // Check authentication
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

  // Check rate limit for free users
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("subscription_tier, daily_extractions_count, daily_extractions_reset_at")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_tier === "free") {
    // Check if we need to reset the daily count
    const resetAt = new Date(profile.daily_extractions_reset_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentCount = profile.daily_extractions_count;
    if (resetAt < today) {
      currentCount = 0;
    }

    if (currentCount >= FREE_TIER_DAILY_LIMIT) {
      await logRequest(supabase, user.id, video_id, "error", "rate_limit", 0, Date.now() - startTime, "Daily limit exceeded");
      return NextResponse.json(
        { error: `Daily limit of ${FREE_TIER_DAILY_LIMIT} transcripts reached. Upgrade to Pro for unlimited access.` },
        { status: 429 }
      );
    }
  }

  // Check cache first (database)
  const { data: cached } = await supabase
    .from("transcripts")
    .select("content, language")
    .eq("video_id", video_id)
    .single();

  if (cached) {
    const latency = Date.now() - startTime;
    await logRequest(supabase, user.id, video_id, "cached", "db_cache", 0, latency);
    // Increment daily count even for cached results
    await incrementDailyCount(supabase, user.id);

    return NextResponse.json({
      video_id,
      segments: cached.content,
      language: cached.language,
      cached: true,
    });
  }

  // Call the Python worker
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
      await logRequest(supabase, user.id, video_id, "error", "error", 0, latency, errorData.detail);
      return NextResponse.json(
        { error: errorData.detail || "Extraction failed" },
        { status: workerResponse.status }
      );
    }

    const data: WorkerResponse = await workerResponse.json();
    const latency = Date.now() - startTime;

    // Cache the transcript in database
    const textBlob = data.segments.map(s => s.text).join(" ");
    await supabase.from("transcripts").upsert({
      video_id: data.video_id,
      language: data.language,
      content: data.segments,
      text_blob: textBlob,
      updated_at: new Date().toISOString(),
    });

    // Log the successful request
    await logRequest(supabase, user.id, video_id, "success", "youtube_api", 0, latency);

    // Increment daily extraction count
    await incrementDailyCount(supabase, user.id);

    return NextResponse.json({
      ...data,
      cached: false,
    });
  } catch (error) {
    console.error("Worker request failed:", error);
    const latency = Date.now() - startTime;
    await logRequest(supabase, user.id, video_id, "error", "error", 0, latency, "Worker connection failed");
    return NextResponse.json(
      { error: "Failed to connect to extraction service" },
      { status: 503 }
    );
  }
}

async function logRequest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  videoId: string,
  status: string,
  provider: string,
  costUsd: number,
  latencyMs: number,
  errorMessage?: string
) {
  try {
    await supabase.from("request_logs").insert({
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
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  try {
    await supabase.rpc("increment_daily_extractions", { p_user_id: userId });
  } catch (e) {
    console.error("Failed to increment daily count:", e);
  }
}
