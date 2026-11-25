"use client";

import Link from "next/link";
import { ArrowLeft, BellRing, Building2, CalendarClock, Euro, Globe, MapPin, Sparkles, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WithData } from "@/components/layout/app-shell";
import { Interactions } from "@/components/interactions/interactions";
import { PriorityBadge, StageBadge } from "@/components/prospects/badges";
import { ProspectActions } from "@/components/prospects/prospect-actions";
import { formatDate, formatDateTime, formatEUR, relativeDay, todayYMD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NotFoundProspect } from "./simple-views";

function Info({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="truncate text-sm font-medium">{children || "—"}</div>
      </div>
    </div>
  );
}

export function ProspectDetailView({ id }: { id: string }) {
  return (
    <WithData>
      {({ settings, prospects, interactions: all }) => {
        const p = prospects.find((x) => x.id === id);
        if (!p) return <NotFoundProspect />;
        const interactions = all
          .filter((i) => i.prospect_id === id)
          .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
        const today = todayYMD();
        const stageType = settings.stages.find((s) => s.key === p.stage)?.type ?? "open";
        const overdue = stageType === "open" && p.next_follow_up && p.next_follow_up < today;

        return (
          <div className="space-y-6">
            <title>{`${p.company} · RonyIA`}</title>
            <Link href="/prospects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
              Prospects
            </Link>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-neutral-800 to-black text-xl font-bold text-white ring-1 ring-white/10 dark:from-neutral-700 dark:to-neutral-900">
                  {p.company.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 space-y-1.5">
                  <h1 className="text-2xl font-semibold tracking-tight">{p.company}</h1>
                  <p className="text-sm text-muted-foreground">
                    {[p.contact_name, p.job_title].filter(Boolean).join(" · ") || "Contact non renseigné"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <StageBadge stage={p.stage} stages={settings.stages} />
                    <PriorityBadge priority={p.priority} />
                    {p.is_demo && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">démo</span>}
                  </div>
                </div>
              </div>
              <ProspectActions prospect={p} stages={settings.stages} />
            </div>

            {p.lost_reason && (
              <div className="rounded-xl border border-zinc-500/20 bg-zinc-500/8 px-4 py-3 text-sm">
                <span className="font-medium">Raison de la perte :</span> {p.lost_reason}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Suivi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Info icon={Euro} label="Montant estimé">
                      <span className="text-base">{formatEUR(p.estimated_amount)}</span>
                    </Info>
                    <Info icon={BellRing} label="Prochaine relance">
                      {p.next_follow_up ? (
                        <span className={cn(overdue && "text-destructive")}>
                          {formatDate(p.next_follow_up)}
                          {stageType === "open" && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                              ({relativeDay(p.next_follow_up, today)})
                            </span>
                          )}
                        </span>
                      ) : null}
                    </Info>
                    <Info icon={CalendarClock} label="Call / démo prévu">
                      {p.next_call_at ? formatDateTime(p.next_call_at) : null}
                    </Info>
                    {p.signed_at && (
                      <Info icon={Sparkles} label="Signé le">
                        {formatDate(p.signed_at)}
                      </Info>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Informations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Info icon={Building2} label="Secteur">{p.sector}</Info>
                    <Info icon={MapPin} label="Ville">{p.city}</Info>
                    <Info icon={Tag} label="Source">{p.source}</Info>
                    <Info icon={Globe} label="Site web">
                      {p.website ? (
                        <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {p.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : null}
                    </Info>
                    <div className="border-t pt-3 text-xs text-muted-foreground">
                      Ajouté le {formatDate(p.created_at)} · {p.email ?? "pas d'email"} · {p.phone ?? "pas de téléphone"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6 lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Besoins &amp; automatisations envisagées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-line text-muted-foreground">
                      {p.needs || "Aucun besoin renseigné pour l'instant."}
                    </p>
                  </CardContent>
                </Card>
                <Interactions prospectId={p.id} interactions={interactions} />
              </div>
            </div>
          </div>
        );
      }}
    </WithData>
  );
}
