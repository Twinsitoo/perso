"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parisLocalToISO } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;
export type ActionResult = { ok: true } | { ok: false; error: string };

const emptyToNull = (v: unknown) => {
  if (typeof v !== "string") return v ?? null;
  const t = v.trim();
  return t === "" ? null : t;
};

const optionalText = z.preprocess(emptyToNull, z.string().max(2000).nullable());

const amount = z.preprocess((v) => {
  if (v === null || v === undefined) return 0;
  const s = String(v).replace(/[\s €]/g, "").replace(",", ".");
  return s === "" ? 0 : Number(s);
}, z.number({ error: "Montant invalide" }).min(0, "Le montant doit être positif").max(10_000_000));

const url = z.preprocess(
  (v) => {
    const t = emptyToNull(v);
    if (typeof t === "string" && !/^https?:\/\//i.test(t)) return `https://${t}`;
    return t;
  },
  z.url({ error: "Lien invalide" }).nullable(),
);

const prospectSchema = z.object({
  company: z.string().trim().min(1, "Le nom de l'entreprise est obligatoire").max(200),
  contact_name: optionalText,
  job_title: optionalText,
  email: z.preprocess(emptyToNull, z.email({ error: "Email invalide" }).nullable()),
  phone: optionalText,
  linkedin_url: url,
  website: url,
  city: optionalText,
  sector: optionalText,
  source: optionalText,
  stage: z.string().min(1),
  estimated_amount: amount,
  priority: z.enum(["haute", "moyenne", "basse"]),
  next_follow_up: z.preprocess(emptyToNull, z.iso.date().nullable()),
  next_call_at: z.preprocess((v) => parisLocalToISO(String(v ?? "")), z.string().nullable()),
  needs: optionalText,
});

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function saveProspect(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const id = formData.get("id") ? String(formData.get("id")) : null;

  const parsed = prospectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0]);
      fieldErrors[k] ??= issue.message;
    }
    return { error: "Certains champs sont à corriger.", fieldErrors };
  }

  let prospectId = id;
  if (id) {
    const { error } = await supabase.from("prospects").update(parsed.data).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase.from("prospects").insert(parsed.data).select("id").single();
    if (error) return { error: error.message };
    prospectId = data.id;
  }

  revalidateAll();
  redirect(`/prospects/${prospectId}`);
}

export async function deleteProspect(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("prospects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message } as ActionResult;
  revalidateAll();
  redirect("/prospects");
}

export async function updateStage(id: string, stage: string, lostReason?: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const patch: Record<string, unknown> = { stage };
  if (lostReason !== undefined) patch.lost_reason = lostReason || null;
  const { error } = await supabase.from("prospects").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function setFollowUp(id: string, date: string | null): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("prospects").update({ next_follow_up: date }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

const interactionSchema = z.object({
  prospect_id: z.uuid(),
  type: z.enum(["call", "email", "linkedin", "rdv"]),
  occurred_at: z.preprocess((v) => parisLocalToISO(String(v ?? "")) ?? new Date().toISOString(), z.string()),
  notes: optionalText,
});

export async function addInteraction(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = interactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Interaction invalide." };
  const { error } = await supabase.from("interactions").insert(parsed.data);
  if (error) return { error: error.message };

  const nextFollowUp = formData.get("next_follow_up");
  if (typeof nextFollowUp === "string" && nextFollowUp) {
    await supabase.from("prospects").update({ next_follow_up: nextFollowUp }).eq("id", parsed.data.prospect_id);
  }

  revalidateAll();
  return undefined;
}

export async function deleteInteraction(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("interactions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Import CSV
// ---------------------------------------------------------------------------

export async function importProspects(
  rows: Record<string, unknown>[],
): Promise<{ ok: true; count: number; skipped: number } | { ok: false; error: string }> {
  const { supabase } = await requireUser();
  if (!Array.isArray(rows) || rows.length === 0) return { ok: false, error: "Le fichier est vide." };
  if (rows.length > 2000) return { ok: false, error: "2000 lignes maximum par import." };

  const valid = [];
  let skipped = 0;
  for (const row of rows) {
    const parsed = prospectSchema.safeParse({
      ...row,
      stage: row.stage || "nouveau",
      priority: row.priority || "moyenne",
      next_call_at: "",
    });
    if (parsed.success) valid.push(parsed.data);
    else skipped++;
  }
  if (valid.length === 0) return { ok: false, error: "Aucune ligne valide (la colonne « Entreprise » est obligatoire)." };

  const { error } = await supabase.from("prospects").insert(valid);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true, count: valid.length, skipped };
}
