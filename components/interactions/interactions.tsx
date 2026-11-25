"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { CalendarCheck, Loader2, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { LinkedinIcon as Linkedin } from "@/components/ui/linkedin-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { INTERACTION_TYPES, interactionLabel } from "@/lib/constants";
import { formatDateTime, isoToParisLocal } from "@/lib/format";
import { addInteraction, deleteInteraction, type FormState } from "@/lib/actions/prospects";
import { cn } from "@/lib/utils";
import type { Interaction } from "@/types/database";

const ICONS = { call: Phone, email: Mail, linkedin: Linkedin, rdv: CalendarCheck } as const;
const COLORS = {
  call: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  email: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
  linkedin: "bg-blue-600/12 text-blue-700 dark:text-blue-400",
  rdv: "bg-red-600/12 text-red-600 dark:text-red-400",
} as const;

export function Interactions({ prospectId, interactions }: { prospectId: string; interactions: Interaction[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addInteraction, undefined);
  const [deleting, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const lastCount = useRef(interactions.length);

  useEffect(() => {
    if (interactions.length > lastCount.current) toast.success("Interaction ajoutée");
    lastCount.current = interactions.length;
  }, [interactions.length]);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des interactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form ref={formRef} action={action} className="space-y-3 rounded-xl border border-dashed p-3">
          <input type="hidden" name="prospect_id" value={prospectId} />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <NativeSelect id="type" name="type" defaultValue="call">
                {INTERACTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="occurred_at">Date</Label>
              <Input
                id="occurred_at"
                name="occurred_at"
                type="datetime-local"
                defaultValue={isoToParisLocal(new Date().toISOString())}
                suppressHydrationWarning
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next_follow_up_i">Prochaine relance</Label>
              <Input id="next_follow_up_i" name="next_follow_up" type="date" />
            </div>
          </div>
          <Textarea name="notes" rows={2} placeholder="Ce qui s'est dit, prochaines étapes…" />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Plus />}
              Ajouter
            </Button>
          </div>
        </form>

        {interactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Aucune interaction pour l&apos;instant.</p>
        ) : (
          <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-border">
            {interactions.map((i) => {
              const Icon = ICONS[i.type] ?? Phone;
              return (
                <li key={i.id} className="group relative flex gap-3">
                  <div className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-card", COLORS[i.type])}>
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{interactionLabel(i.type)}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(i.occurred_at)}</span>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() =>
                          startTransition(async () => {
                            const res = await deleteInteraction(i.id);
                            if (!res.ok) toast.error(res.error);
                          })
                        }
                        className="ml-auto rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus:opacity-100"
                        aria-label="Supprimer l'interaction"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    {i.notes && <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{i.notes}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
