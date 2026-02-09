import { createClient } from "@/lib/supabase/server";
import { AccountSettings } from "./account-settings";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("subscription_tier, daily_extractions_count, daily_extractions_reset_at")
    .eq("id", user!.id)
    .single();

  // Count today's usage
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const resetAt = profile?.daily_extractions_reset_at
    ? new Date(profile.daily_extractions_reset_at)
    : new Date(0);

  const dailyUsage = resetAt < today ? 0 : (profile?.daily_extractions_count ?? 0);

  return (
    <AccountSettings
      email={user!.email ?? ""}
      tier={profile?.subscription_tier ?? "free"}
      dailyUsage={dailyUsage}
      dailyLimit={profile?.subscription_tier === "pro" ? null : 5}
    />
  );
}
