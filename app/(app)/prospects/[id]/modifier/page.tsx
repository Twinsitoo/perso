import type { Metadata } from "next";
import { EditProspectView } from "@/components/views/simple-views";

export const metadata: Metadata = { title: "Modifier le prospect" };

export default async function EditProspectPage({ params }: PageProps<"/prospects/[id]/modifier">) {
  const { id } = await params;
  return <EditProspectView id={id} />;
}
