import type { Metadata } from "next";
import { PipelineView } from "@/components/views/simple-views";

export const metadata: Metadata = { title: "Pipeline" };

export default function PipelinePage() {
  return <PipelineView />;
}
