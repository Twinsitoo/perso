import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { formatEUR } from "@/lib/format";
import { loadWorkspace } from "@/lib/queries";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const { settings, prospects } = await loadWorkspace();
  const openKeys = new Set(settings.stages.filter((s) => s.type === "open").map((s) => s.key));
  const open = prospects.filter((p) => openKeys.has(p.stage));
  const potential = open.reduce((s, p) => s + p.estimated_amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description={
          <>
            {open.length} opportunités en cours · <span className="font-medium text-foreground">{formatEUR(potential)}</span> de CA
            potentiel. Glisse les cartes pour changer d&apos;étape.
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
}
