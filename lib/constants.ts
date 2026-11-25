import type { InteractionType, Priority, Stage } from "@/types/database";

export const APP_NAME = "RonyIA";

export const DEFAULT_STAGES: Stage[] = [
  { key: "nouveau", label: "Nouveau lead", color: "slate", type: "open" },
  { key: "contacte", label: "Contacté", color: "sky", type: "open" },
  { key: "discussion", label: "En discussion", color: "violet", type: "open" },
  { key: "call", label: "Call / Démo prévu", color: "amber", type: "open" },
  { key: "devis", label: "Devis envoyé", color: "orange", type: "open" },
  { key: "negociation", label: "Négociation", color: "rose", type: "open" },
  { key: "signe", label: "Signé", color: "emerald", type: "won" },
  { key: "perdu", label: "Perdu", color: "zinc", type: "lost" },
];

export const DEFAULT_SOURCES = [
  "LinkedIn",
  "Bouche-à-oreille",
  "Cold email",
  "Réseau",
  "Événement",
  "Site web",
  "Autre",
];

/** Couleurs disponibles pour les étapes (classes Tailwind écrites en entier pour être détectées). */
export const STAGE_COLORS: Record<string, { dot: string; badge: string; hex: string; label: string }> = {
  slate: { dot: "bg-slate-400", badge: "bg-slate-500/12 text-slate-700 dark:text-slate-300", hex: "#94a3b8", label: "Gris" },
  sky: { dot: "bg-sky-500", badge: "bg-sky-500/12 text-sky-700 dark:text-sky-300", hex: "#0ea5e9", label: "Bleu" },
  violet: { dot: "bg-violet-500", badge: "bg-violet-500/12 text-violet-700 dark:text-violet-300", hex: "#8b5cf6", label: "Violet" },
  amber: { dot: "bg-amber-500", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300", hex: "#f59e0b", label: "Ambre" },
  orange: { dot: "bg-orange-500", badge: "bg-orange-500/12 text-orange-700 dark:text-orange-300", hex: "#f97316", label: "Orange" },
  rose: { dot: "bg-rose-500", badge: "bg-rose-500/12 text-rose-700 dark:text-rose-300", hex: "#f43f5e", label: "Rose" },
  red: { dot: "bg-red-600", badge: "bg-red-600/12 text-red-700 dark:text-red-300", hex: "#dc2626", label: "Rouge" },
  emerald: { dot: "bg-emerald-500", badge: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300", hex: "#10b981", label: "Vert" },
  zinc: { dot: "bg-zinc-600", badge: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300", hex: "#52525b", label: "Anthracite" },
};

export function stageColor(color: string) {
  return STAGE_COLORS[color] ?? STAGE_COLORS.slate;
}

export const PRIORITIES: { value: Priority; label: string; badge: string }[] = [
  { value: "haute", label: "Haute", badge: "bg-red-600/12 text-red-700 dark:text-red-300 ring-1 ring-red-600/20" },
  { value: "moyenne", label: "Moyenne", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20" },
  { value: "basse", label: "Basse", badge: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 ring-1 ring-zinc-500/20" },
];

export function priorityMeta(p: string) {
  return PRIORITIES.find((x) => x.value === p) ?? PRIORITIES[1];
}

export const INTERACTION_TYPES: { value: InteractionType; label: string }[] = [
  { value: "call", label: "Appel" },
  { value: "email", label: "Email" },
  { value: "linkedin", label: "Message LinkedIn" },
  { value: "rdv", label: "Rendez-vous" },
];

export function interactionLabel(t: string) {
  return INTERACTION_TYPES.find((x) => x.value === t)?.label ?? t;
}

export const LOST_REASONS = [
  "Budget insuffisant",
  "Pas le bon timing",
  "A choisi un concurrent",
  "Pas de réponse",
  "Besoin non prioritaire",
  "Autre",
];
