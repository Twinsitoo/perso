"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITIES } from "@/lib/constants";
import { isoToParisLocal } from "@/lib/format";
import { saveProspect, type FormState } from "@/lib/actions/prospects";
import { cn } from "@/lib/utils";
import type { Prospect, Settings } from "@/types/database";

function Field({
  label,
  name,
  error,
  className,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function ProspectForm({ prospect, settings }: { prospect?: Prospect; settings: Settings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProspect, undefined);
  const fe = state?.fieldErrors ?? {};
  const p = prospect;
  const sources = p?.source && !settings.sources.includes(p.source) ? [...settings.sources, p.source] : settings.sources;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        // Soumission manuelle : évite la remise à zéro automatique du formulaire en cas d'erreur.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      {p && <input type="hidden" name="id" value={p.id} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Entreprise &amp; contact</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Entreprise *" name="company" error={fe.company} className="sm:col-span-2">
                <Input id="company" name="company" defaultValue={p?.company} required placeholder="Ex : Horizon Immobilier" />
              </Field>
              <Field label="Nom du contact" name="contact_name" error={fe.contact_name}>
                <Input id="contact_name" name="contact_name" defaultValue={p?.contact_name ?? ""} />
              </Field>
              <Field label="Poste" name="job_title" error={fe.job_title}>
                <Input id="job_title" name="job_title" defaultValue={p?.job_title ?? ""} placeholder="Gérant, CEO…" />
              </Field>
              <Field label="Secteur" name="sector" error={fe.sector}>
                <Input id="sector" name="sector" defaultValue={p?.sector ?? ""} placeholder="Immobilier, e-commerce…" />
              </Field>
              <Field label="Ville" name="city" error={fe.city}>
                <Input id="city" name="city" defaultValue={p?.city ?? ""} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" name="email" error={fe.email}>
                <Input id="email" name="email" type="email" defaultValue={p?.email ?? ""} />
              </Field>
              <Field label="Téléphone" name="phone" error={fe.phone}>
                <Input id="phone" name="phone" type="tel" defaultValue={p?.phone ?? ""} />
              </Field>
              <Field label="LinkedIn" name="linkedin_url" error={fe.linkedin_url}>
                <Input
                  id="linkedin_url"
                  name="linkedin_url"
                  defaultValue={p?.linkedin_url ?? ""}
                  placeholder="linkedin.com/in/…"
                />
              </Field>
              <Field label="Site web" name="website" error={fe.website}>
                <Input id="website" name="website" defaultValue={p?.website ?? ""} placeholder="exemple.fr" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Besoins</CardTitle>
              <CardDescription>Automatisations envisagées, contexte, outils utilisés…</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="needs"
                name="needs"
                rows={6}
                defaultValue={p?.needs ?? ""}
                placeholder="Ex : relances automatiques des leads via n8n, agent IA de prise de RDV…"
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Suivi commercial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Étape" name="stage" error={fe.stage}>
              <NativeSelect id="stage" name="stage" defaultValue={p?.stage ?? settings.stages[0]?.key}>
                {settings.stages.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Priorité" name="priority" error={fe.priority}>
              <NativeSelect id="priority" name="priority" defaultValue={p?.priority ?? "moyenne"}>
                {PRIORITIES.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Source" name="source" error={fe.source}>
              <NativeSelect id="source" name="source" defaultValue={p?.source ?? ""}>
                <option value="">—</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Montant estimé (€ HT)" name="estimated_amount" error={fe.estimated_amount}>
              <Input
                id="estimated_amount"
                name="estimated_amount"
                inputMode="decimal"
                defaultValue={p ? String(p.estimated_amount) : ""}
                placeholder="5000"
              />
            </Field>
            <Field label="Prochaine relance" name="next_follow_up" error={fe.next_follow_up}>
              <Input id="next_follow_up" name="next_follow_up" type="date" defaultValue={p?.next_follow_up ?? ""} />
            </Field>
            <Field label="Call / démo prévu" name="next_call_at" error={fe.next_call_at}>
              <Input
                id="next_call_at"
                name="next_call_at"
                type="datetime-local"
                defaultValue={isoToParisLocal(p?.next_call_at)}
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={p ? `/prospects/${p.id}` : "/prospects"} className={buttonVariants({ variant: "outline", size: "lg" })}>
          Annuler
        </Link>
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {p ? "Enregistrer" : "Créer le prospect"}
        </Button>
      </div>
    </form>
  );
}
