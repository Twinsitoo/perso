import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid size-8 place-items-center rounded-lg bg-gradient-to-br from-red-500 to-red-700 shadow-sm shadow-red-900/40">
        <span className="text-sm font-black tracking-tighter text-white">R</span>
        <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-sidebar bg-white" />
      </div>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight">
          Rony<span className="text-red-500">IA</span>
        </span>
      )}
    </div>
  );
}
