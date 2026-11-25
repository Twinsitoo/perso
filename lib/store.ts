"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_SOURCES, DEFAULT_STAGES } from "@/lib/constants";
import { buildDemoData } from "@/lib/demo-data";
import { prospectSchema, type ProspectInput } from "@/lib/validation";
import type { Interaction, InteractionType, Prospect, Settings, Stage } from "@/types/database";

/**
 * Données de l'app, enregistrées dans le navigateur (localStorage).
 * Aucune connexion ni serveur : tout reste sur l'appareil. Sauvegarde / restauration en JSON dans Paramètres.
 */
export type AppData = {
  version: number;
  prospects: Prospect[];
  interactions: Interaction[];
  settings: Settings;
};

const STORAGE_KEY = "ronyia:data:v1";

function defaultSettings(): Settings {
  return {
    user_id: "local",
    stages: DEFAULT_STAGES,
    sources: DEFAULT_SOURCES,
    monthly_goal_deals: 4,
    monthly_goal_revenue: 15000,
    updated_at: new Date().toISOString(),
  };
}

function freshData(withDemo: boolean): AppData {
  const demo = withDemo ? buildDemoData() : { prospects: [], interactions: [] };
  return { version: DATA_VERSION, ...demo, settings: defaultSettings() };
}

/** v2 : l'app démarre vide ; les données de démo chargées automatiquement en v1 sont retirées. */
const DATA_VERSION = 2;

function migrate(data: AppData): AppData {
  if (data.version >= DATA_VERSION) return data;
  const demoIds = new Set(data.prospects.filter((p) => p.is_demo).map((p) => p.id));
  return {
    ...data,
    version: DATA_VERSION,
    prospects: data.prospects.filter((p) => !p.is_demo),
    interactions: data.interactions.filter((i) => !demoIds.has(i.prospect_id)),
  };
}

function isAppData(v: unknown): v is AppData {
  const d = v as AppData;
  return Boolean(d && Array.isArray(d.prospects) && Array.isArray(d.interactions) && d.settings && Array.isArray(d.settings.stages));
}

// ---------------------------------------------------------------------------
// Store externe (compatible useSyncExternalStore)
// ---------------------------------------------------------------------------

let state: AppData | null = null;
const listeners = new Set<() => void>();

function load(): AppData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isAppData(parsed)) {
        const migrated = migrate(parsed);
        if (migrated !== parsed) persist(migrated);
        return migrated;
      }
    }
  } catch {
    // stockage indisponible ou corrompu : on repart des données de démo
  }
  const data = freshData(false);
  persist(data);
  return data;
}

function persist(data: AppData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // navigation privée / quota : les données restent en mémoire pour la session
  }
}

function getSnapshot() {
  if (state === null && typeof window !== "undefined") state = load();
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Synchronise les onglets ouverts en même temps
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    state = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function update(fn: (d: AppData) => AppData) {
  const current = getSnapshot();
  if (!current) return;
  state = fn(current);
  persist(state);
  listeners.forEach((l) => l());
}

/** Données courantes ; null pendant le rendu serveur / avant le chargement dans le navigateur. */
export function useAppData(): AppData | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

// ---------------------------------------------------------------------------
// Règles métier
// ---------------------------------------------------------------------------

const nowISO = () => new Date().toISOString();

function stageType(stages: Stage[], key: string) {
  return stages.find((s) => s.key === key)?.type ?? (key === "signe" ? "won" : key === "perdu" ? "lost" : "open");
}

/** Même logique que le trigger SQL : date de signature et raison de perte gérées automatiquement. */
function applyStageRules(p: Prospect, stages: Stage[]): Prospect {
  const t = stageType(stages, p.stage);
  return {
    ...p,
    signed_at: t === "won" ? (p.signed_at ?? nowISO()) : null,
    lost_reason: t === "lost" ? p.lost_reason : null,
  };
}

export type Result<T = void> = { ok: true; value: T; message?: string } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Actions : prospects
// ---------------------------------------------------------------------------

export function saveProspect(input: ProspectInput, id?: string): string {
  const newId = id ?? crypto.randomUUID();
  update((d) => {
    const now = nowISO();
    if (id) {
      return {
        ...d,
        prospects: d.prospects.map((p) =>
          p.id === id ? applyStageRules({ ...p, ...input, updated_at: now }, d.settings.stages) : p,
        ),
      };
    }
    const p: Prospect = applyStageRules(
      {
        id: newId,
        user_id: "local",
        ...input,
        lost_reason: null,
        signed_at: null,
        is_demo: false,
        created_at: now,
        updated_at: now,
      },
      d.settings.stages,
    );
    return { ...d, prospects: [p, ...d.prospects] };
  });
  return newId;
}

export function updateStage(id: string, stage: string, lostReason?: string) {
  update((d) => ({
    ...d,
    prospects: d.prospects.map((p) =>
      p.id === id
        ? applyStageRules(
            { ...p, stage, lost_reason: lostReason !== undefined ? lostReason || null : p.lost_reason, updated_at: nowISO() },
            d.settings.stages,
          )
        : p,
    ),
  }));
}

export function deleteProspect(id: string) {
  update((d) => ({
    ...d,
    prospects: d.prospects.filter((p) => p.id !== id),
    interactions: d.interactions.filter((i) => i.prospect_id !== id),
  }));
}

export function importProspects(rows: Record<string, unknown>[]): Result<{ count: number; skipped: number }> {
  if (!Array.isArray(rows) || rows.length === 0) return { ok: false, error: "Le fichier est vide." };
  if (rows.length > 5000) return { ok: false, error: "5000 lignes maximum par import." };
  const valid: ProspectInput[] = [];
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
  update((d) => {
    const now = nowISO();
    const created = valid.map((input) =>
      applyStageRules(
        {
          id: crypto.randomUUID(),
          user_id: "local",
          ...input,
          stage: d.settings.stages.some((s) => s.key === input.stage) ? input.stage : d.settings.stages[0].key,
          lost_reason: null,
          signed_at: null,
          is_demo: false,
          created_at: now,
          updated_at: now,
        },
        d.settings.stages,
      ),
    );
    return { ...d, prospects: [...created, ...d.prospects] };
  });
  return { ok: true, value: { count: valid.length, skipped } };
}

// ---------------------------------------------------------------------------
// Actions : interactions
// ---------------------------------------------------------------------------

export function addInteraction(input: {
  prospect_id: string;
  type: InteractionType;
  occurred_at: string;
  notes: string | null;
  next_follow_up?: string | null;
}) {
  update((d) => {
    const now = nowISO();
    const interaction: Interaction = {
      id: crypto.randomUUID(),
      user_id: "local",
      prospect_id: input.prospect_id,
      type: input.type,
      occurred_at: input.occurred_at,
      notes: input.notes,
      created_at: now,
    };
    return {
      ...d,
      interactions: [interaction, ...d.interactions],
      prospects: input.next_follow_up
        ? d.prospects.map((p) =>
            p.id === input.prospect_id ? { ...p, next_follow_up: input.next_follow_up ?? null, updated_at: now } : p,
          )
        : d.prospects,
    };
  });
}

export function deleteInteraction(id: string) {
  update((d) => ({ ...d, interactions: d.interactions.filter((i) => i.id !== id) }));
}

// ---------------------------------------------------------------------------
// Actions : paramètres
// ---------------------------------------------------------------------------

export function saveStages(list: Stage[]): Result<number> {
  const cleaned = list.map((s) => ({ ...s, label: s.label.trim() }));
  if (cleaned.some((s) => !s.label)) return { ok: false, error: "Chaque étape doit avoir un nom." };
  if (new Set(cleaned.map((s) => s.key)).size !== cleaned.length) return { ok: false, error: "Deux étapes ont le même identifiant." };
  if (cleaned.filter((s) => s.type === "won").length !== 1 || cleaned.filter((s) => s.type === "lost").length !== 1) {
    return { ok: false, error: "Il faut exactement une étape « gagnée » et une étape « perdue »." };
  }
  if (!cleaned.some((s) => s.type === "open")) return { ok: false, error: "Il faut au moins une étape en cours." };

  const ordered = [
    ...cleaned.filter((s) => s.type === "open"),
    ...cleaned.filter((s) => s.type === "won"),
    ...cleaned.filter((s) => s.type === "lost"),
  ];
  const keys = new Set(ordered.map((s) => s.key));
  let moved = 0;
  update((d) => ({
    ...d,
    settings: { ...d.settings, stages: ordered, updated_at: nowISO() },
    prospects: d.prospects.map((p) => {
      if (keys.has(p.stage)) return p;
      moved++;
      return { ...p, stage: ordered[0].key };
    }),
  }));
  return {
    ok: true,
    value: moved,
    message: moved ? `${moved} prospect(s) déplacé(s) vers « ${ordered[0].label} »` : undefined,
  };
}

export function saveSources(sources: string[]): Result {
  const clean = [...new Set(sources.map((s) => s.trim()).filter(Boolean))].slice(0, 30);
  if (clean.length === 0) return { ok: false, error: "Garde au moins une source." };
  update((d) => ({ ...d, settings: { ...d.settings, sources: clean, updated_at: nowISO() } }));
  return { ok: true, value: undefined };
}

export function saveGoals(goals: { deals: number; revenue: number }): Result {
  const deals = Math.max(0, Math.round(Number(goals.deals) || 0));
  const revenue = Math.max(0, Number(goals.revenue) || 0);
  update((d) => ({
    ...d,
    settings: { ...d.settings, monthly_goal_deals: deals, monthly_goal_revenue: revenue, updated_at: nowISO() },
  }));
  return { ok: true, value: undefined };
}

export function loadDemoData(): Result<number> {
  const demo = buildDemoData();
  let already = false;
  update((d) => {
    if (d.prospects.some((p) => p.is_demo)) {
      already = true;
      return d;
    }
    return { ...d, prospects: [...demo.prospects, ...d.prospects], interactions: [...demo.interactions, ...d.interactions] };
  });
  if (already) return { ok: false, error: "Les données de démo sont déjà chargées." };
  return { ok: true, value: demo.prospects.length, message: `${demo.prospects.length} prospects de démo chargés` };
}

export function clearDemoData(): Result {
  update((d) => {
    const demoIds = new Set(d.prospects.filter((p) => p.is_demo).map((p) => p.id));
    return {
      ...d,
      prospects: d.prospects.filter((p) => !p.is_demo),
      interactions: d.interactions.filter((i) => !demoIds.has(i.prospect_id)),
    };
  });
  return { ok: true, value: undefined, message: "Données de démo supprimées" };
}

// ---------------------------------------------------------------------------
// Sauvegarde / restauration
// ---------------------------------------------------------------------------

export function exportBackup() {
  const data = getSnapshot();
  if (!data) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ronyia-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function restoreBackup(file: File): Promise<Result> {
  try {
    const parsed = JSON.parse(await file.text());
    if (!isAppData(parsed)) return { ok: false, error: "Ce fichier n'est pas une sauvegarde RonyIA." };
    // Une sauvegarde est restaurée telle quelle (démo incluse si elle en contenait).
    update(() => ({ ...parsed, version: DATA_VERSION }));
    return { ok: true, value: undefined, message: `${parsed.prospects.length} prospects restaurés` };
  } catch {
    return { ok: false, error: "Fichier illisible." };
  }
}

export function resetAll(withDemo: boolean) {
  update(() => freshData(withDemo));
}
