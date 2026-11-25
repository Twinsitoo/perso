import { z } from "zod";
import { parisLocalToISO } from "@/lib/format";

const emptyToNull = (v: unknown) => {
  if (typeof v !== "string") return v ?? null;
  const t = v.trim();
  return t === "" ? null : t;
};

const optionalText = z.preprocess(emptyToNull, z.string().max(5000).nullable());

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

export const prospectSchema = z.object({
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
  next_follow_up: z.preprocess(emptyToNull, z.iso.date({ error: "Date invalide" }).nullable()),
  next_call_at: z.preprocess((v) => parisLocalToISO(String(v ?? "")), z.string().nullable()),
  needs: optionalText,
});

export type ProspectInput = z.infer<typeof prospectSchema>;

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const k = String(issue.path[0]);
    out[k] ??= issue.message;
  }
  return out;
}
