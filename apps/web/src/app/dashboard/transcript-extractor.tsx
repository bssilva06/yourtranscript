"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ExtractorState = "idle" | "loading" | "success" | "error";

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export function TranscriptExtractor() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<ExtractorState>("idle");
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const extractVideoId = (input: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(url.trim());

    if (!videoId) {
      setError("Please enter a valid YouTube URL or video ID");
      setState("error");
      return;
    }

    setState("loading");
    setError(null);
    setTranscript([]);
    setVideoTitle(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ video_id: videoId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to extract transcript");
        setState("error");
        return;
      }

      setTranscript(data.segments);
      setVideoTitle(`Video ${data.video_id}`);
      setState("success");
    } catch {
      setError("Failed to extract transcript. Please try again.");
      setState("error");
    }
  };

  const getFullText = () => transcript.map((s) => s.text).join(" ");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getFullText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="font-display text-3xl tracking-tight">
          Extract Transcript
        </h2>
        <p className="text-muted-foreground">
          Paste a YouTube URL below to extract its transcript instantly.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="https://youtube.com/watch?v=... or video ID"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (state === "error") setState("idle");
              }}
              className="h-12 pl-4 pr-4 text-base font-body bg-card border-2 border-border/60 focus-visible:border-primary/50 transition-colors"
              disabled={state === "loading"}
            />
            {/* YouTube icon indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-5 h-5 text-muted-foreground/40"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
          </div>
          <Button
            type="submit"
            disabled={state === "loading" || !url.trim()}
            className="h-12 px-6 text-base font-medium"
          >
            {state === "loading" ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Extracting...
              </span>
            ) : (
              "Extract"
            )}
          </Button>
        </div>
      </form>

      {/* Error State */}
      {state === "error" && error && (
        <div className="animate-fade-in-up rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-destructive mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-medium text-destructive">Extraction failed</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {state === "loading" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="h-6 w-48 shimmer rounded" />
            <div className="h-9 w-24 shimmer rounded" />
          </div>
          <div className="rounded-xl border-2 border-border/40 bg-card p-6 space-y-3">
            <div className="h-4 shimmer rounded w-full" />
            <div className="h-4 shimmer rounded w-11/12" />
            <div className="h-4 shimmer rounded w-4/5" />
            <div className="h-4 shimmer rounded w-full" />
            <div className="h-4 shimmer rounded w-3/4" />
          </div>
        </div>
      )}

      {/* Success State - Transcript Display */}
      {state === "success" && transcript.length > 0 && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Transcript Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {videoTitle && (
                <h3 className="font-display text-xl">{videoTitle}</h3>
              )}
              <p className="text-sm text-muted-foreground">
                {transcript.length} segments · {formatTime(transcript.reduce((acc, s) => acc + s.duration, 0))} duration
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className={`gap-2 transition-all ${copied ? "copy-success bg-primary/10 border-primary/30" : ""}`}
            >
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy all
                </>
              )}
            </Button>
          </div>

          {/* Transcript Content */}
          <div
            ref={transcriptRef}
            className="rounded-xl border-2 border-border/40 bg-card paper-texture overflow-hidden"
          >
            <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto">
              {transcript.map((segment, index) => (
                <div
                  key={index}
                  className="group flex gap-4 hover:bg-accent/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors cursor-default"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="text-xs font-mono text-muted-foreground/60 pt-0.5 w-12 shrink-0 tabular-nums">
                    {formatTime(segment.start)}
                  </span>
                  <p className="text-foreground/90 leading-relaxed font-body">
                    {segment.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Word count footer */}
          <p className="text-xs text-muted-foreground text-right">
            {getFullText().split(/\s+/).length} words
          </p>
        </div>
      )}

      {/* Empty/Idle State */}
      {state === "idle" && transcript.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-12 text-center">
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
            No transcript yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Enter a YouTube URL above to extract and view its transcript here.
          </p>
        </div>
      )}
    </div>
  );
}
