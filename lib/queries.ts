import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SOURCES, DEFAULT_STAGES } from "@/lib/constants";
import { requireUser } from "@/lib/supabase/server";
import type { Interaction, Prospect, Settings } from "@/types/database";

function normalizeProspect(p: Prospect): Prospect {
  return { ...p, estimated_amount: Number(p.estimated_amount ?? 0) };
}

export async function getSettings(supabase: SupabaseClient, userId: string): Promise<Settings> {
  const { data } = await supabase.from("settings").select("*").eq("user_id", userId).maybeSingle();
  if (data) {
    return {
      ...data,
      stages: Array.isArray(data.stages) && data.stages.length ? data.stages : DEFAULT_STAGES,
      sources: Array.isArray(data.sources) ? data.sources : DEFAULT_SOURCES,
      monthly_goal_deals: Number(data.monthly_goal_deals ?? 0),
      monthly_goal_revenue: Number(data.monthly_goal_revenue ?? 0),
    } as Settings;
  }
  // Filet de sécurité si le trigger d'inscription n'a pas créé la ligne.
  const fallback = {
    user_id: userId,
    stages: DEFAULT_STAGES,
    sources: DEFAULT_SOURCES,
    monthly_goal_deals: 4,
    monthly_goal_revenue: 15000,
  };
  await supabase.from("settings").upsert(fallback);
  return { ...fallback, updated_at: new Date().toISOString() };
}

export async function getProspects(supabase: SupabaseClient): Promise<Prospect[]> {
  const { data, error } = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeProspect);
}

/** Charge tout ce dont une page a besoin : utilisateur, réglages et prospects. */
export async function loadWorkspace() {
  const { supabase, user } = await requireUser();
  const [settings, prospects] = await Promise.all([getSettings(supabase, user.id), getProspects(supabase)]);
  return { supabase, user, settings, prospects };
}

export async function getProspect(supabase: SupabaseClient, id: string) {
  const [{ data: prospect }, { data: interactions }] = await Promise.all([
    supabase.from("prospects").select("*").eq("id", id).maybeSingle(),
    supabase.from("interactions").select("*").eq("prospect_id", id).order("occurred_at", { ascending: false }),
  ]);
  return {
    prospect: prospect ? normalizeProspect(prospect as Prospect) : null,
    interactions: (interactions ?? []) as Interaction[],
  };
}
