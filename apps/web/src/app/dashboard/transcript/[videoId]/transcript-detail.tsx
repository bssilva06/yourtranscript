"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { TranscriptSegment } from "@/lib/types";

interface TranscriptDetailProps {
  videoId: string;
  segments: TranscriptSegment[];
  language: string;
  createdAt: string;
}

export function TranscriptDetail({
  videoId,
  segments,
  language,
  createdAt,
}: TranscriptDetailProps) {
  const [copied, setCopied] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const getFullText = () => segments.map((s) => s.text).join(" ");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getFullText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  };

  const totalDuration = segments.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Video info header */}
      <div className="flex items-start gap-4">
        <img
          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
          alt=""
          className="w-40 h-24 rounded-lg object-cover shrink-0 bg-muted"
        />
        <div className="space-y-1">
          <h1 className="font-display text-2xl tracking-tight">
            Video {videoId}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{language.toUpperCase()}</span>
            <span>&middot;</span>
            <span>{segments.length} segments</span>
            <span>&middot;</span>
            <span>{formatTime(totalDuration)} duration</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Extracted {new Date(createdAt).toLocaleDateString()}
          </p>
          <a
            href={`https://youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
          >
            Watch on YouTube
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Transcript header with copy button */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Transcript</h2>
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

      {/* Transcript content */}
      <div
        ref={transcriptRef}
        className="rounded-xl border-2 border-border/40 bg-card paper-texture overflow-hidden"
      >
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {segments.map((segment, index) => (
            <div
              key={index}
              className="group flex gap-4 hover:bg-accent/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors cursor-default"
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
  );
}
