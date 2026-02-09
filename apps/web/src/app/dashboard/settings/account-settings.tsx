"use client";

import Link from "next/link";

interface AccountSettingsProps {
  email: string;
  tier: string;
  dailyUsage: number;
  dailyLimit: number | null;
}

export function AccountSettings({ email, tier, dailyUsage, dailyLimit }: AccountSettingsProps) {
  const usagePercent = dailyLimit ? Math.min((dailyUsage / dailyLimit) * 100, 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="space-y-2">
        <h2 className="font-display text-3xl tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and view your usage.
        </p>
      </div>

      {/* Profile Section */}
      <div className="rounded-xl border-2 border-border/40 bg-card p-6 space-y-5">
        <h3 className="font-display text-xl">Profile</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-body font-medium">{email}</p>
            </div>
          </div>

          <div className="border-t border-border/40" />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <div className="flex items-center gap-2">
                <p className="font-body font-medium capitalize">{tier}</p>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    tier === "pro"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tier === "pro" ? "Active" : "Free tier"}
                </span>
              </div>
            </div>
            {tier === "free" && (
              <button
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                disabled
                title="Coming soon"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Section */}
      <div className="rounded-xl border-2 border-border/40 bg-card p-6 space-y-5">
        <h3 className="font-display text-xl">Today&apos;s Usage</h3>

        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-body font-semibold tabular-nums">
                {dailyUsage}
                {dailyLimit && (
                  <span className="text-lg text-muted-foreground font-normal">
                    {" "}/ {dailyLimit}
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {dailyLimit
                  ? "transcripts extracted today"
                  : "transcripts extracted today (unlimited)"}
              </p>
            </div>
          </div>

          {dailyLimit && (
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercent >= 100
                      ? "bg-destructive"
                      : usagePercent >= 80
                        ? "bg-chart-5"
                        : "bg-primary"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {usagePercent >= 100 && (
                <p className="text-xs text-destructive">
                  Daily limit reached. Resets at midnight UTC.
                </p>
              )}
            </div>
          )}

          {tier === "free" && usagePercent < 100 && (
            <p className="text-xs text-muted-foreground">
              {dailyLimit! - dailyUsage} extraction{dailyLimit! - dailyUsage !== 1 ? "s" : ""} remaining today. Resets at midnight UTC.
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border-2 border-border/40 bg-card p-6 space-y-5">
        <h3 className="font-display text-xl">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-border/40 px-4 py-2.5 text-sm font-medium hover:bg-accent/50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Extraction
          </Link>
        </div>
      </div>
    </div>
  );
}
