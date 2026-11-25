import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="grid size-6 place-items-center rounded-md bg-primary">
        <span className="text-[13px] leading-none font-bold text-primary-foreground">R</span>
      </div>
      {!compact && <span className="text-sm font-semibold tracking-tight">RonyIA</span>}
    </div>
  );
}
