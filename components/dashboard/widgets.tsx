import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StageBadge } from "@/components/prospects/badges";
import { formatDate, formatEUR, formatTime, monthLabel, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/lib/stats";
import type { Settings } from "@/types/database";

export type Kpi = { label: string; value: React.ReactNode; hint?: React.ReactNode; emphasis?: boolean };

/** Bande de KPI : un seul bloc bordé, séparateurs fins, aucune icône décorative. */
export function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {items.map((k) => (
        <div key={k.label} className="-mb-px -ml-px border-b border-l px-4 py-4">
          <p className="text-xs text-muted-foreground">{k.label}</p>
          <p className={cn("mt-1.5 text-xl font-semibold tracking-tight tabular-nums", k.emphasis && "text-primary")}>{k.value}</p>
          {k.hint && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{k.hint}</p>}
        </div>
      ))}
    </div>
  );
}

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
      {children}
      <ArrowUpRight className="size-3" />
    </Link>
  );
}

function GoalBar({ label, current, goal, format }: { label: string; current: number; goal: number; format: (n: number) => string }) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="shrink-0 text-muted-foreground">{label}</span>
        <span className="text-right whitespace-nowrap tabular-nums">
          {format(current)} <span className="text-muted-foreground">/ {format(goal)}</span>
        </span>
      </div>
      <div
        className="h-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground tabular-nums">{pct} %</p>
    </div>
  );
}

export function GoalsCard({ stats, settings }: { stats: DashboardStats; settings: Settings }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="first-letter:uppercase">Objectifs · {monthLabel(stats.today.slice(0, 7), true)}</CardTitle>
        <SectionLink href="/parametres">Modifier</SectionLink>
      </CardHeader>
      <CardContent className="space-y-5">
        <GoalBar label="Signatures" current={stats.dealsThisMonth} goal={settings.monthly_goal_deals} format={(n) => String(n)} />
        <GoalBar label="CA signé" current={stats.revenueThisMonth} goal={settings.monthly_goal_revenue} format={formatEUR} />
      </CardContent>
    </Card>
  );
}

function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 text-[13px] transition-colors hover:bg-accent"
    >
      {children}
    </Link>
  );
}

export function TodayCard({ stats }: { stats: DashboardStats }) {
  const empty = stats.followUps.length === 0 && stats.callsToday.length === 0;
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Aujourd&apos;hui</CardTitle>
        <SectionLink href="/agenda">Agenda</SectionLink>
      </CardHeader>
      <CardContent>
        {stats.callsToday.map((p) => (
          <Row key={`c-${p.id}`} href={`/prospects/${p.id}`}>
            <span className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">{formatTime(p.next_call_at!)}</span>
            <span className="min-w-0 flex-1 truncate">Call · {p.company}</span>
          </Row>
        ))}
        {stats.followUps.map((p) => {
          const late = p.next_follow_up! < stats.today;
          return (
            <Row key={`f-${p.id}`} href={`/prospects/${p.id}`}>
              <span className={cn("w-12 shrink-0 text-xs tabular-nums", late ? "text-primary" : "text-muted-foreground")}>
                {late ? formatDate(p.next_follow_up).split(" ").slice(0, 2).join(" ") : "Auj."}
              </span>
              <span className="min-w-0 flex-1 truncate" title={late ? "Relance en retard" : undefined}>
                Relancer {p.company}
              </span>
            </Row>
          );
        })}
        {empty && <p className="py-4 text-[13px] text-muted-foreground">Rien d&apos;urgent aujourd&apos;hui.</p>}
        {stats.upcoming.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <p className="mb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Cette semaine</p>
            {stats.upcoming.map((p) => (
              <Row key={`u-${p.id}`} href={`/prospects/${p.id}`}>
                <span className="w-12 shrink-0 text-xs text-muted-foreground">{relativeDay(p.next_follow_up!, stats.today)}</span>
                <span className="min-w-0 flex-1 truncate">{p.company}</span>
              </Row>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentCard({ stats, settings }: { stats: DashboardStats; settings: Settings }) {
  return (
    <Card className="gap-0 pb-2">
      <CardHeader className="flex items-center justify-between pb-3">
        <CardTitle>Derniers prospects</CardTitle>
        <SectionLink href="/prospects">Tout voir</SectionLink>
      </CardHeader>
      <div>
        {stats.recent.length === 0 && <p className="px-5 py-4 text-[13px] text-muted-foreground">Aucun prospect.</p>}
        {stats.recent.map((p) => (
          <Link
            key={p.id}
            href={`/prospects/${p.id}`}
            className="flex items-center gap-4 border-t px-5 py-2.5 text-[13px] transition-colors hover:bg-accent/60"
          >
            <span className="min-w-0 flex-1 truncate font-medium">{p.company}</span>
            <span className="hidden w-28 shrink-0 truncate text-muted-foreground sm:block">{p.city ?? "—"}</span>
            <span className="hidden w-36 shrink-0 md:block">
              <StageBadge stage={p.stage} stages={settings.stages} />
            </span>
            <span className="w-20 shrink-0 text-right tabular-nums">{formatEUR(p.estimated_amount)}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
