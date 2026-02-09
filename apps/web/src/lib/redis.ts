import { Redis } from "@upstash/redis";

/**
 * Singleton Upstash Redis client.
 * Used for transcript caching (7-day TTL) ahead of the database.
 * Gracefully returns null on connection failures so the app
 * falls through to the DB cache layer instead of crashing.
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/** Cache TTL for transcripts: 7 days in seconds */
export const TRANSCRIPT_CACHE_TTL = 60 * 60 * 24 * 7; // 604800s
