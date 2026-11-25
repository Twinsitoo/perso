import Link from "next/link";
import { CalendarClock, Euro, Handshake, Percent, Plus, TrendingUp, UserCheck, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { MonthlyCharts, StageChart } from "@/components/dashboard/charts";
import { GoalsCard, KpiCard, RecentCard, TodayCard } from "@/components/dashboard/widgets";
import { formatDate, formatEUR } from "@/lib/format";
import { loadWorkspace } from "@/lib/queries";
import { computeStats } from "@/lib/stats";

export default async function DashboardPage() {
  const { settings, prospects, user } = await loadWorkspace();
  const stats = computeStats(prospects, settings);
  const firstName = (user.email ?? "").split("@")[0].split(/[._-]/)[0];
  const hello = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bonjour${hello ? ` ${hello}` : ""} 👋`}
        description={`Voici l'état de ta prospection au ${formatDate(stats.today)}.`}
        actions={
          <Link href="/prospects/nouveau" className={buttonVariants()}>
            <Plus />
            Nouveau prospect
          </Link>
        }
      />

      {prospects.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Ton pipeline est vide. Ajoute ton premier prospect ou charge les données de démo pour voir le dashboard en action.
            </p>
            <Link href="/parametres#demo" className={buttonVariants({ variant: "outline" })}>
              Charger la démo
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Prospects" value={stats.total} hint="au total" icon={Users} />
        <KpiCard label="Actifs" value={stats.active} hint="en cours de pipeline" icon={UserCheck} />
        <KpiCard label="Calls cette semaine" value={stats.callsThisWeek} hint="calls / démos prévus" icon={CalendarClock} />
        <KpiCard label="Signés ce mois" value={stats.dealsThisMonth} hint={`${stats.wonCount} au total`} icon={Handshake} />
        <KpiCard
          label="CA signé"
          value={formatEUR(stats.revenueThisMonth)}
          hint={`ce mois · ${formatEUR(stats.revenueTotal)} au total`}
          icon={Euro}
          accent
        />
        <KpiCard label="CA potentiel" value={formatEUR(stats.pipelineValue)} hint="pipeline ouvert" icon={TrendingUp} />
        <KpiCard
          label="Conversion"
          value={stats.conversionRate === null ? "—" : `${Math.round(stats.conversionRate * 100)} %`}
          hint={`${stats.wonCount} signés / ${stats.wonCount + stats.lostCount} clos`}
          icon={Percent}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Prospects par étape</CardTitle>
                <CardDescription>Répartition actuelle du pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <StageChart data={stats.byStage} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Signatures &amp; CA par mois</CardTitle>
                <CardDescription>12 derniers mois</CardDescription>
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
}
