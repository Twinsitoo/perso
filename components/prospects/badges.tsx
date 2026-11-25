import { priorityMeta, stageColor } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types/database";

export function StageBadge({ stage, stages, className }: { stage: string; stages: Stage[]; className?: string }) {
  const s = stages.find((x) => x.key === stage);
  const c = stageColor(s?.color ?? "slate");
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-xs font-medium whitespace-nowrap",
        c.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", c.dot)} />
      {s?.label ?? stage}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const p = priorityMeta(priority);
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium whitespace-nowrap",
        p.badge,
        className,
      )}
    >
      {p.label}
    </span>
  );
}
