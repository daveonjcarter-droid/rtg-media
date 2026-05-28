import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
  created_at: string;
  updated_at: string;
}

function computeIsActive(sub: SubscriptionRow | null): boolean {
  if (!sub) return false;
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
  const now = Date.now();
  if (["active", "trialing", "past_due"].includes(sub.status)) {
    return periodEnd == null || periodEnd > now;
  }
  if (sub.status === "canceled" && periodEnd && periodEnd > now) return true;
  return false;
}

export function useSubscription(userId: string | null | undefined) {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSub = useCallback(async () => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("environment", getStripeEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as SubscriptionRow | null) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSub();
  }, [fetchSub]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`subscriptions:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => { fetchSub(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchSub]);

  return {
    subscription,
    isActive: computeIsActive(subscription),
    isPlus: computeIsActive(subscription) && (subscription?.price_id === "rtg_plus_monthly" || subscription?.price_id === "rtg_plus_yearly"),
    loading,
    refetch: fetchSub,
  };
}
