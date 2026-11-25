import type { Metadata } from "next";
import { ProspectsView } from "@/components/views/simple-views";

export const metadata: Metadata = { title: "Prospects" };

export default function ProspectsPage() {
  return <ProspectsView />;
}
