"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { WithData } from "@/components/layout/app-shell";
import { MonthlyCharts, StageChart } from "@/components/dashboard/charts";
import { GoalsCard, KpiStrip, RecentCard, TodayCard } from "@/components/dashboard/widgets";
import { formatDate, formatEUR } from "@/lib/format";
import { computeStats } from "@/lib/stats";

export function DashboardView() {
  return (
    <WithData>
      {({ prospects, settings }) => {
        const stats = computeStats(prospects, settings);
        return (
          <div className="space-y-8">
            <PageHeader
              title="Dashboard"
              description={formatDate(stats.today)}
              actions={
                <Link href="/prospects/nouveau" className={buttonVariants()}>
                  <Plus />
                  Nouveau prospect
                </Link>
              }
            />

            {prospects.length === 0 && (
              <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-muted-foreground">Ton pipeline est vide.</p>
                <Link href="/parametres#demo" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Charger la démo
                </Link>
              </div>
            )}

            <KpiStrip
              items={[
                { label: "Prospects", value: stats.total },
                { label: "Actifs", value: stats.active },
                { label: "Calls cette semaine", value: stats.callsThisWeek },
                { label: "Signés ce mois", value: stats.dealsThisMonth, hint: `${stats.wonCount} au total` },
                {
                  label: "CA signé ce mois",
                  value: formatEUR(stats.revenueThisMonth),
                  hint: `${formatEUR(stats.revenueTotal)} au total`,
                  emphasis: true,
                },
                { label: "CA potentiel", value: formatEUR(stats.pipelineValue), hint: "pipeline ouvert" },
                {
                  label: "Conversion",
                  value: stats.conversionRate === null ? "—" : `${Math.round(stats.conversionRate * 100)} %`,
                  hint: `${stats.wonCount} / ${stats.wonCount + stats.lostCount} clos`,
                },
              ]}
            />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="grid gap-6 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prospects par étape</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StageChart data={stats.byStage} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Signatures et CA · 12 mois</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MonthlyCharts data={stats.months} />
                    </CardContent>
                  </Card>
                </div>
                <RecentCard stats={stats} settings={settings} />
              </div>
              <div className="space-y-6">
                <GoalsCard stats={stats} settings={settings} />
                <TodayCard stats={stats} />
              </div>
            </div>
          </div>
        );
      }}
    </WithData>
  );
}
