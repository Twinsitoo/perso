import Link from "next/link";
import { BellRing, CalendarClock, CheckCircle2, ChevronRight, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge, StageBadge } from "@/components/prospects/badges";
import { formatDate, formatEUR, formatTime, monthLabel, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/lib/stats";
import type { Settings } from "@/types/database";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        "relative gap-0 overflow-hidden py-4",
        accent && "bg-sidebar text-sidebar-foreground ring-sidebar dark:ring-white/10",
      )}
    >
      {accent && <div className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-red-600/30 blur-2xl" />}
      <CardContent className="relative space-y-2 px-4">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-xs font-medium text-muted-foreground", accent && "text-sidebar-foreground/60")}>{label}</p>
          <Icon className={cn("size-4 text-muted-foreground", accent && "text-red-500")} />
        </div>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {hint && <p className={cn("text-xs text-muted-foreground", accent && "text-sidebar-foreground/55")}>{hint}</p>}
      </CardContent>
    </Card>
  );
}

function GoalBar({ label, current, goal, format }: { label: string; current: number; goal: number; format: (n: number) => string }) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  const done = goal > 0 && current >= goal;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          <span className="font-semibold text-foreground">{format(current)}</span> / {format(goal)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div
          className={cn("h-full rounded-full transition-all", done ? "bg-emerald-500" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {done ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" /> Objectif atteint
          </span>
        ) : (
          `${pct} % de l'objectif`
        )}
      </p>
    </div>
  );
}

export function GoalsCard({ stats, settings }: { stats: DashboardStats; settings: Settings }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-4 text-primary" />
          Objectifs de {monthLabel(stats.today.slice(0, 7), true)}
        </CardTitle>
        <CardDescription>
          <Link href="/parametres" className="hover:text-foreground hover:underline">
            Modifier les objectifs
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <GoalBar
          label="Signatures"
          current={stats.dealsThisMonth}
          goal={settings.monthly_goal_deals}
          format={(n) => String(n)}
        />
        <GoalBar label="CA signé" current={stats.revenueThisMonth} goal={settings.monthly_goal_revenue} format={formatEUR} />
      </CardContent>
    </Card>
  );
}

function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60">
      {children}
      <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground" />
    </Link>
  );
}

export function TodayCard({ stats }: { stats: DashboardStats }) {
  const empty = stats.followUps.length === 0 && stats.callsToday.length === 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>À faire aujourd&apos;hui</CardTitle>
        <CardDescription>
          {stats.followUps.length} relance{stats.followUps.length > 1 ? "s" : ""} · {stats.callsToday.length} call
          {stats.callsToday.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {stats.callsToday.map((p) => (
          <Row key={`c-${p.id}`} href={`/prospects/${p.id}`}>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500/12 text-amber-600 dark:text-amber-400">
              <CalendarClock className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                Call à {formatTime(p.next_call_at!)} · {p.company}
              </p>
              <p className="truncate text-xs text-muted-foreground">{p.contact_name ?? "—"}</p>
            </div>
          </Row>
        ))}
        {stats.followUps.map((p) => {
          const late = p.next_follow_up! < stats.today;
          return (
            <Row key={`f-${p.id}`} href={`/prospects/${p.id}`}>
              <div
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg",
                  late ? "bg-destructive/12 text-destructive" : "bg-primary/10 text-primary",
                )}
              >
                <BellRing className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Relancer {p.company}</p>
                <p className={cn("truncate text-xs", late ? "font-medium text-destructive" : "text-muted-foreground")}>
                  {late ? `En retard · prévu le ${formatDate(p.next_follow_up)}` : "Aujourd'hui"}
                  {p.contact_name ? ` · ${p.contact_name}` : ""}
                </p>
              </div>
            </Row>
          );
        })}
        {empty && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="mx-auto mb-2 size-6 text-emerald-500" />
            Rien d&apos;urgent : tout est à jour.
          </div>
        )}
        {stats.upcoming.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">Cette semaine</p>
            {stats.upcoming.map((p) => (
              <Row key={`u-${p.id}`} href={`/prospects/${p.id}`}>
                <span className="w-20 shrink-0 text-xs text-muted-foreground">{relativeDay(p.next_follow_up!, stats.today)}</span>
                <span className="truncate text-sm">{p.company}</span>
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
    <Card>
      <CardHeader>
        <CardTitle>Derniers prospects ajoutés</CardTitle>
        <CardDescription>
          <Link href="/prospects" className="hover:text-foreground hover:underline">
            Voir tous les prospects
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {stats.recent.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Aucun prospect.</p>}
        {stats.recent.map((p) => (
          <Row key={p.id} href={`/prospects/${p.id}`}>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold">
              {p.company.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.company}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[p.city, formatEUR(p.estimated_amount)].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
              <StageBadge stage={p.stage} stages={settings.stages} />
              <PriorityBadge priority={p.priority} />
            </div>
          </Row>
        ))}
      </CardContent>
    </Card>
  );
}
