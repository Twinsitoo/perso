import Link from "next/link";
import { ArrowUpRight, Plus, Target, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stageColor } from "@/lib/constants";
import { formatDate, formatEUR, formatTime, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/lib/stats";

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
      {children}
      <ArrowUpRight className="size-3" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Indicateurs clés
// ---------------------------------------------------------------------------

export function MetricCard({
  label,
  value,
  sub,
  goal,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  goal?: { current: number; target: number; format: (n: number) => string };
  accent?: boolean;
}) {
  const pct = goal && goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : null;
  return (
    <div className="flex flex-col rounded-lg border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-[28px] leading-none font-semibold tracking-tight tabular-nums", accent && "text-primary")}>
        {value}
      </p>
      <div className="mt-auto pt-4">
        {goal && pct !== null ? (
          <div className="space-y-1.5">
            <div className="h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Objectif ${label}`}>
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {pct} % de l&apos;objectif · {goal.format(goal.target)}
            </p>
          </div>
        ) : (
          sub && <p className="text-[11px] text-muted-foreground">{sub}</p>
        )}
      </div>
    </div>
  );
}

/** Ligne de compteurs secondaires. */
export function StatsBar({ items }: { items: { label: string; value: number; href: string; alert?: boolean }[] }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card sm:grid-cols-4">
      {items.map((s) => (
        <Link
          key={s.label}
          href={s.href}
          className="-mb-px -ml-px flex items-baseline justify-between gap-3 border-b border-l px-5 py-3 transition-colors hover:bg-accent/60"
        >
          <span className="text-xs text-muted-foreground">{s.label}</span>
          <span className={cn("text-base font-semibold tabular-nums", s.alert && s.value > 0 && "text-primary")}>{s.value}</span>
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline par étape
// ---------------------------------------------------------------------------

export function PipelineCard({ stats }: { stats: DashboardStats }) {
  const open = stats.byStage.filter((s) => s.type === "open");
  const closed = stats.byStage.filter((s) => s.type !== "open");
  const max = Math.max(1, ...open.map((s) => s.amount));

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="flex items-center justify-between pb-4">
        <CardTitle>Pipeline</CardTitle>
        <SectionLink href="/pipeline">Kanban</SectionLink>
      </CardHeader>
      <div className="px-5">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b pb-2 text-[11px] text-muted-foreground">
          <span>Étape</span>
          <span className="w-8 text-right">Nb</span>
          <span className="w-24 text-right">Montant</span>
        </div>
        {open.map((s) => (
          <div key={s.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b py-2.5 text-[13px]">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("size-1.5 shrink-0 rounded-full", stageColor(s.color).dot)} />
                <span className="truncate">{s.label}</span>
              </div>
              <div className="mt-1.5 ml-3.5 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground/25" style={{ width: `${(s.amount / max) * 100}%` }} />
              </div>
            </div>
            <span className="w-8 text-right text-muted-foreground tabular-nums">{s.count}</span>
            <span className="w-24 text-right tabular-nums">{formatEUR(s.amount)}</span>
          </div>
        ))}
        {closed.map((s) => (
          <div key={s.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b py-2.5 text-[13px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className={cn("size-1.5 shrink-0 rounded-full", s.type === "won" ? "bg-primary" : "bg-muted-foreground/40")} />
              <span className="truncate">{s.label}</span>
            </div>
            <span className="w-8 text-right tabular-nums">{s.count}</span>
            <span className={cn("w-24 text-right tabular-nums", s.type === "won" && "text-foreground")}>{formatEUR(s.amount)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-5 py-3 text-[13px]">
        <span className="text-muted-foreground">Total en cours</span>
        <span className="font-semibold tabular-nums">{formatEUR(stats.pipelineValue)}</span>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Aujourd'hui
// ---------------------------------------------------------------------------

function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 text-[13px] transition-colors hover:bg-accent">
      {children}
    </Link>
  );
}

export function TodayCard({ stats }: { stats: DashboardStats }) {
  const empty = stats.followUps.length === 0 && stats.callsToday.length === 0;
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>À faire aujourd&apos;hui</CardTitle>
        <SectionLink href="/agenda">Agenda</SectionLink>
      </CardHeader>
      <CardContent>
        {stats.callsToday.map((p) => (
          <Row key={`c-${p.id}`} href={`/prospects/${p.id}`}>
            <span className="w-14 shrink-0 text-xs text-muted-foreground tabular-nums">{formatTime(p.next_call_at!)}</span>
            <span className="min-w-0 flex-1 truncate">Call · {p.company}</span>
          </Row>
        ))}
        {stats.followUps.map((p) => {
          const late = p.next_follow_up! < stats.today;
          return (
            <Row key={`f-${p.id}`} href={`/prospects/${p.id}`}>
              <span className={cn("w-14 shrink-0 text-xs tabular-nums", late ? "text-primary" : "text-muted-foreground")}>
                {late ? formatDate(p.next_follow_up).split(" ").slice(0, 2).join(" ") : "Auj."}
              </span>
              <span className="min-w-0 flex-1 truncate" title={late ? "Relance en retard" : undefined}>
                Relancer {p.company}
              </span>
            </Row>
          );
        })}
        {empty && <p className="py-2 text-[13px] text-muted-foreground">Aucune relance ni call prévu aujourd&apos;hui.</p>}
        {stats.upcoming.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <p className="mb-1 text-[11px] text-muted-foreground">Cette semaine</p>
            {stats.upcoming.map((p) => (
              <Row key={`u-${p.id}`} href={`/prospects/${p.id}`}>
                <span className="w-14 shrink-0 text-xs text-muted-foreground">{relativeDay(p.next_follow_up!, stats.today)}</span>
                <span className="min-w-0 flex-1 truncate">{p.company}</span>
              </Row>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Derniers prospects
// ---------------------------------------------------------------------------

export function RecentCard({ stats }: { stats: DashboardStats }) {
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="flex items-center justify-between pb-3">
        <CardTitle>Derniers ajouts</CardTitle>
        <SectionLink href="/prospects">Tout voir</SectionLink>
      </CardHeader>
      <div>
        {stats.recent.map((p) => (
          <Link
            key={p.id}
            href={`/prospects/${p.id}`}
            className="flex items-center gap-3 border-t px-5 py-2.5 text-[13px] transition-colors hover:bg-accent/60"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.company}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {[p.city, `ajouté le ${formatDate(p.created_at)}`].filter(Boolean).join(" · ")}
              </p>
            </div>
            <span className="shrink-0 tabular-nums">{formatEUR(p.estimated_amount)}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Écran d'accueil (aucun prospect)
// ---------------------------------------------------------------------------

export function EmptyDashboard() {
  const steps = [
    {
      icon: Plus,
      title: "Ajoute ton premier prospect",
      text: "Entreprise, contact, montant estimé et prochaine relance.",
      href: "/prospects/nouveau",
      cta: "Nouveau prospect",
      primary: true,
    },
    {
      icon: Upload,
      title: "Ou importe ta liste",
      text: "Un fichier CSV / Excel avec tes prospects existants.",
      href: "/prospects",
      cta: "Importer un CSV",
    },
    {
      icon: Target,
      title: "Fixe tes objectifs du mois",
      text: "Nombre de signatures et CA visés, suivis ici en temps réel.",
      href: "/parametres",
      cta: "Définir les objectifs",
    },
  ];
  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-6 py-5">
        <h2 className="text-base font-semibold tracking-tight">Bienvenue sur RonyIA</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Ton tableau de bord se remplira automatiquement au fur et à mesure que tu ajoutes des prospects.
        </p>
      </div>
      <div className="grid md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className={cn("flex flex-col gap-3 px-6 py-5", i > 0 && "border-t md:border-t-0 md:border-l")}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="grid size-5 place-items-center rounded-full border tabular-nums">{i + 1}</span>
              Étape {i + 1}
            </div>
            <div>
              <p className="text-[13px] font-medium">{s.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.text}</p>
            </div>
            <Link href={s.href} className={cn(buttonVariants({ variant: s.primary ? "default" : "outline", size: "sm" }), "mt-auto w-fit")}>
              <s.icon />
              {s.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
