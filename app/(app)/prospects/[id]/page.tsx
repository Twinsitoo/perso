import { ProspectDetailView } from "@/components/views/prospect-detail-view";

export default async function ProspectPage({ params }: PageProps<"/prospects/[id]">) {
  const { id } = await params;
  return <ProspectDetailView id={id} />;
}
