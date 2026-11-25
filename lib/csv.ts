import Papa from "papaparse";
import { priorityMeta } from "@/lib/constants";
import type { Prospect, Stage } from "@/types/database";

/** Colonnes CSV ↔ champs de la base. Le premier libellé est utilisé à l'export. */
const COLUMNS: { field: keyof Prospect; labels: string[] }[] = [
  { field: "company", labels: ["Entreprise", "Société", "Company", "Raison sociale"] },
  { field: "contact_name", labels: ["Contact", "Nom du contact", "Nom", "Name"] },
  { field: "job_title", labels: ["Poste", "Fonction", "Job title", "Titre"] },
  { field: "email", labels: ["Email", "E-mail", "Mail", "Courriel"] },
  { field: "phone", labels: ["Téléphone", "Telephone", "Tél", "Tel", "Phone", "Mobile"] },
  { field: "linkedin_url", labels: ["LinkedIn", "Linkedin URL", "Profil LinkedIn"] },
  { field: "website", labels: ["Site web", "Site", "Website", "URL"] },
  { field: "city", labels: ["Ville", "City"] },
  { field: "sector", labels: ["Secteur", "Industrie", "Industry", "Sector"] },
  { field: "source", labels: ["Source", "Origine"] },
  { field: "stage", labels: ["Étape", "Etape", "Statut", "Stage", "Status"] },
  { field: "estimated_amount", labels: ["Montant estimé", "Montant", "Budget", "Amount", "CA"] },
  { field: "priority", labels: ["Priorité", "Priorite", "Priority"] },
  { field: "next_follow_up", labels: ["Prochaine relance", "Relance", "Follow-up", "Next follow up"] },
  { field: "needs", labels: ["Besoins", "Besoin", "Notes", "Needs"] },
];

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export function exportProspectsCSV(prospects: Prospect[], stages: Stage[]) {
  const rows = prospects.map((p) => {
    const row: Record<string, string | number> = {};
    for (const c of COLUMNS) {
      let v: unknown = p[c.field];
      if (c.field === "stage") v = stages.find((s) => s.key === p.stage)?.label ?? p.stage;
      if (c.field === "priority") v = priorityMeta(p.priority).label;
      row[c.labels[0]] = (v as string | number | null) ?? "";
    }
    row["Raison de perte"] = p.lost_reason ?? "";
    row["Créé le"] = p.created_at.slice(0, 10);
    return row;
  });
  // « ; » + BOM : s'ouvre directement et proprement dans Excel en français.
  const csv = Papa.unparse(rows, { delimiter: ";" });
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prospects-ronyia-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse un fichier CSV et le convertit en lignes prêtes pour importProspects(). */
export function parseProspectsCSV(file: File, stages: Stage[]): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (res) => {
        const headerMap = new Map<string, keyof Prospect>();
        for (const h of res.meta.fields ?? []) {
          const n = normalize(h);
          const col = COLUMNS.find((c) => c.labels.some((l) => normalize(l) === n) || normalize(c.field) === n);
          if (col) headerMap.set(h, col.field);
        }
        if (![...headerMap.values()].includes("company")) {
          reject(new Error("Colonne « Entreprise » introuvable dans le fichier."));
          return;
        }
        const rows = res.data.map((raw) => {
          const row: Record<string, string> = {};
          for (const [header, field] of headerMap) {
            const v = (raw[header] ?? "").trim();
            if (!v) continue;
            if (field === "stage") {
              const st = stages.find((s) => normalize(s.label) === normalize(v) || s.key === v);
              if (st) row.stage = st.key;
            } else if (field === "priority") {
              const pv = normalize(v);
              row.priority = pv.startsWith("h") ? "haute" : pv.startsWith("b") ? "basse" : "moyenne";
            } else if (field === "next_follow_up") {
              // Accepte AAAA-MM-JJ ou JJ/MM/AAAA
              const fr = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
              row.next_follow_up = fr ? `${fr[3]}-${fr[2].padStart(2, "0")}-${fr[1].padStart(2, "0")}` : v.slice(0, 10);
            } else {
              row[field] = v;
            }
          }
          return row;
        });
        resolve(rows.filter((r) => r.company));
      },
      error: (err) => reject(err),
    });
  });
}
