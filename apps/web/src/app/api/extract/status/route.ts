import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redis } from "@/lib/redis";
import type { TranscriptSegment } from "@/lib/types";

interface JobStatus {
  status: "processing" | "completed" | "failed";
  video_id: string;
  segments?: TranscriptSegment[];
  language?: string;
  error?: string;
}

export async function GET(request: Request) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("job_id");

  if (!jobId) {
    return NextResponse.json({ error: "job_id is required" }, { status: 400 });
  }

  try {
    const jobData = await redis.get<JobStatus>(jobId);

    if (!jobData) {
      return NextResponse.json(
        { error: "Job not found or expired" },
        { status: 404 }
      );
    }

    // If completed, clean up the job key after returning
    if (jobData.status === "completed" || jobData.status === "failed") {
      // Delete async — don't block the response
      redis.del(jobId).catch((e) =>
        console.error("Failed to clean up job key:", e)
      );
    }

    return NextResponse.json(jobData);
  } catch (e) {
    console.error("Failed to read job status:", e);
    return NextResponse.json(
      { error: "Failed to check job status" },
      { status: 500 }
    );
  }
}
