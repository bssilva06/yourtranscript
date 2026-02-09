import { Client } from "@upstash/qstash";

/**
 * QStash client singleton for async job dispatch.
 * Only initialized when USE_QSTASH=true (production mode).
 */
export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

/** Check if QStash async mode is enabled (off by default for dev) */
export function isQStashEnabled(): boolean {
  return process.env.USE_QSTASH === "true";
}

/** Job status TTL: 5 minutes (enough time for polling) */
export const JOB_STATUS_TTL = 60 * 5;
