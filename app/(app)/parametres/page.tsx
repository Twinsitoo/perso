import type { Metadata } from "next";
import { SettingsView } from "@/components/views/simple-views";

export const metadata: Metadata = { title: "Paramètres" };

export default function SettingsPage() {
  return <SettingsView />;
}
