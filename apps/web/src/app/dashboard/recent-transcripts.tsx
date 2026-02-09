"use client";

import { useState } from "react";
import Link from "next/link";
import type { TranscriptHistoryItem } from "@/lib/types";

interface RecentTranscriptsProps {
  items: TranscriptHistoryItem[];
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

export function RecentTranscripts({ items }: RecentTranscriptsProps) {
  const [search, setSearch] = useState("");

  if (items.length === 0) return null;

  const filtered = search.trim()
    ? items.filter((item) =>
        item.video_id.toLowerCase().includes(search.trim().toLowerCase())
      )
    : items;

  return (
    <div className="mt-12 space-y-4 animate-fade-in-up">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-2xl tracking-tight">
            Recent Transcripts
          </h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {items.length} transcript{items.length !== 1 ? "s" : ""}
          </p>
        </div>

        {items.length > 3 && (
          <div className="relative w-56">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by video ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border-2 border-border/40 bg-card pl-9 pr-3 text-sm font-body placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No transcripts match &ldquo;{search}&rdquo;
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <Link
              key={item.video_id}
              href={`/dashboard/transcript/${item.video_id}`}
              className="group flex items-center gap-4 rounded-xl border-2 border-border/40 bg-card p-4 hover:bg-accent/50 transition-colors"
            >
              {/* YouTube thumbnail */}
              <img
                src={`https://img.youtube.com/vi/${item.video_id}/default.jpg`}
                alt=""
                className="w-20 h-14 rounded-lg object-cover shrink-0 bg-muted"
              />

              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-foreground/90 truncate">
                  {item.video_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {timeAgo(item.created_at)}
                </p>
              </div>

              {/* Chevron right */}
              <svg
                className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
