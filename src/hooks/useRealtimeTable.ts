// useRealtimeTable — subscribe to Postgres changes on a table and run a callback
// whenever a row is inserted/updated/deleted. Used by the Command Center and
// notifications bell so the dashboard updates without a refresh.
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type Event = "INSERT" | "UPDATE" | "DELETE" | "*";

export const useRealtimeTable = (
  table: string,
  onChange: () => void,
  opts: { event?: Event; debounceMs?: number; enabled?: boolean } = {},
) => {
  const { event = "*", debounceMs = 350, enabled = true } = opts;
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => cbRef.current(), debounceMs);
    };
    const channel = supabase.channel(
      `rt-${table}-${event}-${Math.random().toString(36).slice(2, 10)}`,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (channel as any).on("postgres_changes", { event, schema: "public", table }, trigger);
    channel.subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [table, event, debounceMs, enabled]);
};

export default useRealtimeTable;
