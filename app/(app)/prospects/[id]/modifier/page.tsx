import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ProspectForm } from "@/components/prospects/prospect-form";
import { getProspect, getSettings } from "@/lib/queries";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Modifier le prospect" };

export default async function EditProspectPage({ params }: PageProps<"/prospects/[id]/modifier">) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const [settings, { prospect }] = await Promise.all([getSettings(supabase, user.id), getProspect(supabase, id)]);
  if (!prospect) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Modifier · ${prospect.company}`} />
      <ProspectForm prospect={prospect} settings={settings} />
    </div>
  );
}
