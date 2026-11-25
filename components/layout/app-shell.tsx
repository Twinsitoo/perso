"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { todayYMD } from "@/lib/format";
import { useAppData, type AppData } from "@/lib/store";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const data = useAppData();
  let overdue = 0;
  if (data) {
    const today = todayYMD();
    const open = new Set(data.settings.stages.filter((s) => s.type === "open").map((s) => s.key));
    overdue = data.prospects.filter((p) => open.has(p.stage) && p.next_follow_up && p.next_follow_up < today).length;
  }
  return (
    <div className="flex min-h-screen">
      <Sidebar overdueCount={overdue} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav overdueCount={overdue} />
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

/** Rend `children(data)` une fois les données chargées depuis le navigateur. */
export function WithData({ children }: { children: (data: AppData) => React.ReactNode }) {
  const data = useAppData();
  if (!data) return <PageSkeleton />;
  return <>{children(data)}</>;
}
