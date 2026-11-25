import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DemoDataCard, GoalsForm, SourcesEditor, StagesEditor } from "@/components/settings/settings-forms";
import { loadWorkspace } from "@/lib/queries";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const { settings, prospects } = await loadWorkspace();
  const counts: Record<string, number> = {};
  for (const p of prospects) counts[p.stage] = (counts[p.stage] ?? 0) + 1;
  const demoCount = prospects.filter((p) => p.is_demo).length;
  // La clé force le rechargement des formulaires après un enregistrement.
  const version = settings.updated_at;

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Personnalise ton pipeline, tes sources et tes objectifs." />
      <div className="grid gap-6 xl:grid-cols-2">
        <StagesEditor key={`stages-${version}`} initial={settings.stages} counts={counts} />
        <div className="space-y-6">
          <GoalsForm key={`goals-${version}`} settings={settings} />
          <SourcesEditor key={`sources-${version}`} initial={settings.sources} />
          <DemoDataCard demoCount={demoCount} />
        </div>
      </div>
    </div>
  );
}
