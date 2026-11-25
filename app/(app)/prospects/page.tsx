import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ProspectsTable } from "@/components/prospects/prospects-table";
import { loadWorkspace } from "@/lib/queries";

export const metadata: Metadata = { title: "Prospects" };

export default async function ProspectsPage() {
  const { settings, prospects } = await loadWorkspace();
  return (
    <div className="space-y-6">
      <PageHeader title="Prospects" description="Tous tes prospects, filtrables et exportables." />
      <ProspectsTable prospects={prospects} settings={settings} />
    </div>
  );
}
