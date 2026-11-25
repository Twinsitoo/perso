"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { WithData } from "@/components/layout/app-shell";
import { RevenueChart } from "@/components/dashboard/charts";
import {
  EmptyDashboard,
  MetricCard,
  PipelineCard,
  RecentCard,
  StatsBar,
  TodayCard,
} from "@/components/dashboard/widgets";
import { formatDate, formatEUR, monthLabel } from "@/lib/format";
import { computeStats } from "@/lib/stats";

export function DashboardView() {
  return (
    <WithData>
      {({ prospects, settings }) => {
        const stats = computeStats(prospects, settings);
        const month = monthLabel(stats.today.slice(0, 7), true);
        const empty = prospects.length === 0;

        return (
          <div className="space-y-6">
            <PageHeader
              title="Dashboard"
              description={<span className="first-letter:uppercase">{formatDate(stats.today)}</span>}
              actions={
                <Link href="/prospects/nouveau" className={buttonVariants()}>
                  <Plus />
                  Nouveau prospect
                </Link>
              }
            />

            {/* Indicateurs clés du mois */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label={`CA signé · ${month}`}
                value={formatEUR(stats.revenueThisMonth)}
                accent={stats.revenueThisMonth > 0}
                goal={{ current: stats.revenueThisMonth, target: settings.monthly_goal_revenue, format: formatEUR }}
              />
              <MetricCard
                label={`Signatures · ${month}`}
                value={stats.dealsThisMonth}
                goal={{ current: stats.dealsThisMonth, target: settings.monthly_goal_deals, format: (n) => String(n) }}
              />
              <MetricCard
                label="CA potentiel"
                value={formatEUR(stats.pipelineValue)}
                sub={`${stats.active} opportunité${stats.active > 1 ? "s" : ""} en cours`}
              />
              <MetricCard
                label="Taux de conversion"
                value={stats.conversionRate === null ? "—" : `${Math.round(stats.conversionRate * 100)} %`}
                sub={
                  stats.conversionRate === null
                    ? "Calculé dès le premier deal signé ou perdu"
                    : `${stats.wonCount} signé${stats.wonCount > 1 ? "s" : ""} sur ${stats.wonCount + stats.lostCount} clos`
                }
              />
            </section>

            <StatsBar
              items={[
                { label: "Prospects", value: stats.total, href: "/prospects" },
                { label: "En cours", value: stats.active, href: "/pipeline" },
                { label: "Calls cette semaine", value: stats.callsThisWeek, href: "/agenda" },
                { label: "Relances en retard", value: stats.overdueCount, href: "/agenda", alert: true },
              ]}
            />

            {empty ? (
              <EmptyDashboard />
            ) : (
              <>
                <section className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <PipelineCard stats={stats} />
                  </div>
                  <TodayCard stats={stats} />
                </section>

                <section className="grid gap-6 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-wrap items-baseline justify-between gap-2">
                      <CardTitle>CA signé · 12 derniers mois</CardTitle>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        <span className="font-medium text-foreground">{formatEUR(stats.revenue12m)}</span> · {stats.deals12m}{" "}
                        signature{stats.deals12m > 1 ? "s" : ""}
                        {stats.avgDeal !== null && <> · panier moyen {formatEUR(stats.avgDeal)}</>}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <RevenueChart data={stats.months} />
                    </CardContent>
                  </Card>
                  <RecentCard stats={stats} />
                </section>
              </>
            )}
          </div>
        );
      }}
    </WithData>
  );
}
