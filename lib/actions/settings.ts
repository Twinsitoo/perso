"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { STAGE_COLORS } from "@/lib/constants";
import { requireUser } from "@/lib/supabase/server";
import type { Stage } from "@/types/database";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const stageSchema = z.object({
  key: z.string().regex(/^[a-z0-9_-]{1,40}$/),
  label: z.string().trim().min(1, "Chaque étape doit avoir un nom").max(40),
  color: z.string().refine((c) => c in STAGE_COLORS),
  type: z.enum(["open", "won", "lost"]),
});

export async function saveStages(stages: Stage[]): Promise<Result> {
  const { supabase, user } = await requireUser();
  const parsed = z.array(stageSchema).min(3).max(20).safeParse(stages);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Étapes invalides" };
  const list = parsed.data;

  if (new Set(list.map((s) => s.key)).size !== list.length) return { ok: false, error: "Deux étapes ont le même identifiant." };
  if (list.filter((s) => s.type === "won").length !== 1 || list.filter((s) => s.type === "lost").length !== 1) {
    return { ok: false, error: "Il faut exactement une étape « gagnée » et une étape « perdue »." };
  }
  if (!list.some((s) => s.type === "open")) return { ok: false, error: "Il faut au moins une étape en cours." };

  // Les étapes gagnée / perdue restent en fin de pipeline.
  const ordered = [...list.filter((s) => s.type === "open"), ...list.filter((s) => s.type === "won"), ...list.filter((s) => s.type === "lost")];

  // Les prospects d'une étape supprimée retournent dans la première étape.
  const keys = ordered.map((s) => s.key);
  const { data: orphans } = await supabase.from("prospects").select("id, stage");
  const orphanIds = (orphans ?? []).filter((p) => !keys.includes(p.stage)).map((p) => p.id);
  if (orphanIds.length) {
    const { error } = await supabase.from("prospects").update({ stage: ordered[0].key }).in("id", orphanIds);
    if (error) return { ok: false, error: error.message };
  }

  const { error } = await supabase.from("settings").upsert({ user_id: user.id, stages: ordered });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: orphanIds.length ? `${orphanIds.length} prospect(s) déplacé(s) vers « ${ordered[0].label} »` : undefined,
  };
}

export async function saveSources(sources: string[]): Promise<Result> {
  const { supabase, user } = await requireUser();
  const clean = [...new Set(sources.map((s) => s.trim()).filter(Boolean))].slice(0, 30);
  if (clean.length === 0) return { ok: false, error: "Garde au moins une source." };
  const { error } = await supabase.from("settings").upsert({ user_id: user.id, sources: clean });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveGoals(goals: { deals: number; revenue: number }): Promise<Result> {
  const { supabase, user } = await requireUser();
  const deals = Math.max(0, Math.round(Number(goals.deals) || 0));
  const revenue = Math.max(0, Number(goals.revenue) || 0);
  const { error } = await supabase
    .from("settings")
    .upsert({ user_id: user.id, monthly_goal_deals: deals, monthly_goal_revenue: revenue });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function loadDemoData(): Promise<Result> {
  const { supabase } = await requireUser();
  const { count } = await supabase.from("prospects").select("id", { count: "exact", head: true }).eq("is_demo", true);
  if ((count ?? 0) > 0) return { ok: false, error: "Les données de démo sont déjà chargées." };
  const { data, error } = await supabase.rpc("seed_demo_data");
  if (error) {
    if (error.message.includes("seed_demo_data")) {
      return { ok: false, error: "Fonction seed_demo_data introuvable : exécute supabase/seed.sql dans Supabase (voir README)." };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: `${data} prospects de démo chargés` };
}

export async function clearDemoData(): Promise<Result> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("prospects").delete().eq("is_demo", true);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: "Données de démo supprimées" };
}
