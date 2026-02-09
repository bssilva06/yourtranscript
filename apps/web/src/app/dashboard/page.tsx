import { createClient } from "@/lib/supabase/server";
import { TranscriptExtractor } from "./transcript-extractor";
import { RecentTranscripts } from "./recent-transcripts";
import type { TranscriptHistoryItem } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's recent transcript history
  let recentTranscripts: TranscriptHistoryItem[] = [];

  if (user) {
    const { data: logs } = await supabase
      .from("request_logs")
      .select("video_id, created_at")
      .in("status", ["success", "cached"])
      .order("created_at", { ascending: false })
      .limit(50);

    // Deduplicate by video_id, keeping most recent
    const seen = new Set<string>();
    recentTranscripts = (logs ?? [])
      .filter((log) => {
        if (seen.has(log.video_id)) return false;
        seen.add(log.video_id);
        return true;
      })
      .slice(0, 10)
      .map(({ video_id, created_at }) => ({ video_id, created_at }));
  }

  return (
    <>
      <TranscriptExtractor />
      <RecentTranscripts items={recentTranscripts} />
    </>
  );
}
