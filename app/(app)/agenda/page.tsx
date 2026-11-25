import type { Metadata } from "next";
import { AgendaPageView } from "@/components/views/simple-views";

export const metadata: Metadata = { title: "Agenda" };

export default function AgendaPage() {
  return <AgendaPageView />;
}
