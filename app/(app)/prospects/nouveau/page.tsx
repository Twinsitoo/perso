import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ProspectForm } from "@/components/prospects/prospect-form";
import { getSettings } from "@/lib/queries";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nouveau prospect" };

export default async function NewProspectPage() {
  const { supabase, user } = await requireUser();
  const settings = await getSettings(supabase, user.id);
  return (
    <div className="space-y-6">
      <PageHeader title="Nouveau prospect" description="Ajoute une entreprise à ton pipeline." />
      <ProspectForm settings={settings} />
    </div>
  );
}
