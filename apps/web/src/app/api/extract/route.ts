import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:8000";

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
  // Check authentication
  const supabase = await createClient();
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
      return NextResponse.json(
        { error: errorData.detail || "Extraction failed" },
        { status: workerResponse.status }
      );
    }

    const data: WorkerResponse = await workerResponse.json();

    // TODO: In the future, persist to database and log the request
    // await supabase.from('transcripts').upsert({ ... });
    // await supabase.from('request_logs').insert({ ... });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Worker request failed:", error);
    return NextResponse.json(
      { error: "Failed to connect to extraction service" },
      { status: 503 }
    );
  }
}
