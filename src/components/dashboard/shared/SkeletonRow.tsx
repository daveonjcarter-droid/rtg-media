// Skeleton primitives for the dashboard. Shared shimmer styling.
import { cn } from "@/lib/utils";

export const SkeletonBlock = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-surface/60 rounded-sm", className)} />
);

export const SkeletonRow = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0">
        <SkeletonBlock className="h-7 w-7 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <SkeletonBlock className="h-2.5 w-1/3" />
          <SkeletonBlock className="h-3 w-2/3" />
        </div>
        <SkeletonBlock className="h-2.5 w-12" />
      </div>
    ))}
  </div>
);

export const SkeletonTile = () => (
  <div className="border border-border/60 bg-[#080808] p-3 rounded-sm space-y-2">
    <SkeletonBlock className="h-3.5 w-3.5" />
    <SkeletonBlock className="h-7 w-16" />
    <SkeletonBlock className="h-2 w-20" />
  </div>
);

export const SkeletonChart = ({ className }: { className?: string }) => (
  <div className={cn("relative overflow-hidden", className)}>
    <SkeletonBlock className="absolute inset-0" />
    <div className="absolute inset-0 flex items-end gap-2 px-4 pb-4 opacity-30">
      {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
        <div key={i} className="flex-1 bg-cream/20 rounded-t-sm" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

export default SkeletonRow;
