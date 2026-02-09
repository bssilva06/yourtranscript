import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TranscriptDetail } from "./transcript-detail";
import type { TranscriptSegment } from "@/lib/types";

interface PageProps {
  params: Promise<{ videoId: string }>;
}

export default async function TranscriptDetailPage({ params }: PageProps) {
  const { videoId } = await params;
  const supabase = await createClient();

  // Validate videoId format
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    notFound();
  }

  // Verify this user has accessed this video
  const { data: accessLog } = await supabase
    .from("request_logs")
    .select("video_id, created_at")
    .eq("video_id", videoId)
    .in("status", ["success", "cached"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!accessLog) {
    notFound();
  }

  // Fetch the transcript content
  const { data: transcript } = await supabase
    .from("transcripts")
    .select("video_id, content, language, created_at")
    .eq("video_id", videoId)
    .single();

  if (!transcript) {
    return (
      <>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to dashboard
        </Link>

        <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-12 text-center mt-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h3 className="font-display text-lg text-foreground/80 mb-1">
            Transcript unavailable
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            This transcript is no longer cached. Extract it again from the
            dashboard.
          </p>
        </div>
      </>
    );
  }

  const segments: TranscriptSegment[] =
    transcript.content as TranscriptSegment[];

  return (
    <>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to dashboard
      </Link>

      <TranscriptDetail
        videoId={transcript.video_id}
        segments={segments}
        language={transcript.language}
        createdAt={transcript.created_at}
      />
    </>
  );
}
