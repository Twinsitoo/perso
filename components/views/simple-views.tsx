"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { WithData } from "@/components/layout/app-shell";
import { AgendaView } from "@/components/agenda/agenda-view";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { ProspectForm } from "@/components/prospects/prospect-form";
import { ProspectsTable } from "@/components/prospects/prospects-table";
import { DemoDataCard, BackupCard, GoalsForm, SourcesEditor, StagesEditor } from "@/components/settings/settings-forms";
import { formatEUR } from "@/lib/format";

export function PipelineView() {
  return (
    <WithData>
      {({ settings, prospects }) => {
        const openKeys = new Set(settings.stages.filter((s) => s.type === "open").map((s) => s.key));
        const open = prospects.filter((p) => openKeys.has(p.stage));
        const potential = open.reduce((s, p) => s + p.estimated_amount, 0);
        return (
          <div className="space-y-6">
            <PageHeader
              title="Pipeline"
              description={
                <>
                  {open.length} opportunités en cours · <span className="font-medium text-foreground">{formatEUR(potential)}</span> de
                  CA potentiel. Glisse les cartes pour changer d&apos;étape.
                </>
              }
              actions={
                <Link href="/prospects/nouveau" className={buttonVariants()}>
                  <Plus />
                  Nouveau prospect
                </Link>
              }
            />
            <KanbanBoard prospects={prospects} stages={settings.stages} />
          </div>
        );
      }}
    </WithData>
  );
}

export function ProspectsView() {
  return (
    <WithData>
      {({ settings, prospects }) => (
        <div className="space-y-6">
          <PageHeader title="Prospects" description="Tous tes prospects, filtrables et exportables." />
          <ProspectsTable prospects={prospects} settings={settings} />
        </div>
      )}
    </WithData>
  );
}

export function NewProspectView() {
  return (
    <WithData>
      {({ settings }) => (
        <div className="space-y-6">
          <PageHeader title="Nouveau prospect" description="Ajoute une entreprise à ton pipeline." />
          <ProspectForm settings={settings} />
        </div>
      )}
    </WithData>
  );
}

export function EditProspectView({ id }: { id: string }) {
  return (
    <WithData>
      {({ settings, prospects }) => {
        const prospect = prospects.find((p) => p.id === id);
        if (!prospect) return <NotFoundProspect />;
        return (
          <div className="space-y-6">
            <PageHeader title={`Modifier · ${prospect.company}`} />
            <ProspectForm key={prospect.updated_at} prospect={prospect} settings={settings} />
          </div>
        );
      }}
    </WithData>
  );
}

export function NotFoundProspect() {
  return (
    <div className="grid place-items-center gap-3 py-24 text-center">
      <p className="text-lg font-medium">Prospect introuvable</p>
      <p className="text-sm text-muted-foreground">Il a peut-être été supprimé.</p>
      <Link href="/prospects" className={buttonVariants({ variant: "outline" })}>
        Retour aux prospects
      </Link>
    </div>
  );
}

export function AgendaPageView() {
  return (
    <WithData>
      {({ settings, prospects }) => (
        <div className="space-y-6">
          <PageHeader title="Agenda" description="Tes relances et tes calls, mois par mois. Les retards sont en rouge." />
          <AgendaView prospects={prospects} stages={settings.stages} />
        </div>
      )}
    </WithData>
  );
}

export function SettingsView() {
  return (
    <WithData>
      {({ settings, prospects }) => {
        const counts: Record<string, number> = {};
        for (const p of prospects) counts[p.stage] = (counts[p.stage] ?? 0) + 1;
        const demoCount = prospects.filter((p) => p.is_demo).length;
        const version = settings.updated_at;
        return (
          <div className="space-y-6">
            <PageHeader title="Paramètres" description="Personnalise ton pipeline, tes sources et tes objectifs." />
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-6">
                <StagesEditor key={`stages-${version}`} initial={settings.stages} counts={counts} />
                <BackupCard total={prospects.length} />
              </div>
              <div className="space-y-6">
                <GoalsForm key={`goals-${version}`} settings={settings} />
                <SourcesEditor key={`sources-${version}`} initial={settings.sources} />
                <DemoDataCard demoCount={demoCount} />
              </div>
            </div>
          </div>
        );
      }}
    </WithData>
  );
}
