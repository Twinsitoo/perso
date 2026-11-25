import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AgendaView } from "@/components/agenda/agenda-view";
import { loadWorkspace } from "@/lib/queries";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage() {
  const { settings, prospects } = await loadWorkspace();
  return (
    <div className="space-y-6">
      <PageHeader title="Agenda" description="Tes relances et tes calls, mois par mois. Les retards sont en rouge." />
      <AgendaView prospects={prospects} stages={settings.stages} />
    </div>
  );
}
