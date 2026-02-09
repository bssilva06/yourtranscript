/** A single segment from a YouTube transcript */
export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

/** A history item representing a user's past transcript extraction */
export interface TranscriptHistoryItem {
  video_id: string;
  created_at: string;
}
