import type { Metadata } from "next";
import { NewProspectView } from "@/components/views/simple-views";

export const metadata: Metadata = { title: "Nouveau prospect" };

export default function NewProspectPage() {
  return <NewProspectView />;
}
