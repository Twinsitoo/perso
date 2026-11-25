import { priorityMeta, stageColor } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types/database";

/** Étape : pastille de couleur discrète + libellé, sans fond coloré. */
export function StageBadge({ stage, stages, className }: { stage: string; stages: Stage[]; className?: string }) {
  const s = stages.find((x) => x.key === stage);
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-md border px-1.5 text-[11px] font-medium whitespace-nowrap text-foreground/80",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", stageColor(s?.color ?? "slate").dot)} />
      {s?.label ?? stage}
    </span>
  );
}

/** Priorité : seule la priorité haute est mise en avant (accent rouge). */
export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const p = priorityMeta(priority);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] whitespace-nowrap",
        p.value === "haute" ? "font-medium text-primary" : "text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          p.value === "haute" ? "bg-primary" : p.value === "moyenne" ? "bg-muted-foreground/60" : "bg-muted-foreground/25",
        )}
      />
      {p.label}
    </span>
  );
}
