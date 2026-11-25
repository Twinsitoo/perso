"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Database, Loader2, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { DEFAULT_SOURCES, DEFAULT_STAGES, STAGE_COLORS, stageColor } from "@/lib/constants";
import { clearDemoData, loadDemoData, saveGoals, saveSources, saveStages } from "@/lib/actions/settings";
import { cn } from "@/lib/utils";
import type { Settings, Stage } from "@/types/database";

function slugify(label: string, existing: string[]) {
  const base =
    label
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || "etape";
  let key = base;
  let i = 2;
  while (existing.includes(key)) key = `${base}-${i++}`;
  return key;
}

function useAction() {
  const [pending, start] = useTransition();
  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, success: string) {
    start(async () => {
      const res = await fn();
      if (res.ok) toast.success(res.message ?? success);
      else toast.error(res.error ?? "Erreur");
    });
  }
  return { pending, run };
}

export function StagesEditor({ initial, counts }: { initial: Stage[]; counts: Record<string, number> }) {
  const [stages, setStages] = useState(initial);
  const [newLabel, setNewLabel] = useState("");
  const { pending, run } = useAction();
  const dirty = JSON.stringify(stages) !== JSON.stringify(initial);

  const update = (key: string, patch: Partial<Stage>) => setStages((l) => l.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const move = (index: number, dir: -1 | 1) =>
    setStages((l) => {
      const next = [...l];
      const j = index + dir;
      if (j < 0 || j >= next.length || next[j].type !== "open") return l;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  function add() {
    const label = newLabel.trim();
    if (!label) return;
    setStages((l) => {
      const open = l.filter((s) => s.type === "open");
      const closed = l.filter((s) => s.type !== "open");
      return [...open, { key: slugify(label, l.map((s) => s.key)), label, color: "violet", type: "open" }, ...closed];
    });
    setNewLabel("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Étapes du pipeline</CardTitle>
        <CardDescription>
          Renomme, réordonne, colore ou ajoute des étapes. « Signé » et « Perdu » restent toujours en fin de pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {stages.map((s, i) => {
            const isOpen = s.type === "open";
            return (
              <li key={s.key} className="flex flex-wrap items-center gap-2 rounded-xl border bg-background/50 p-2 sm:flex-nowrap">
                <span className={cn("ml-1 size-2.5 shrink-0 rounded-full", stageColor(s.color).dot)} />
                <Input
                  value={s.label}
                  onChange={(e) => update(s.key, { label: e.target.value })}
                  className="min-w-0 flex-1"
                  aria-label="Nom de l'étape"
                />
                <NativeSelect
                  value={s.color}
                  onChange={(e) => update(s.key, { color: e.target.value })}
                  className="w-32"
                  aria-label="Couleur"
                >
                  {Object.entries(STAGE_COLORS).map(([k, c]) => (
                    <option key={k} value={k}>
                      {c.label}
                    </option>
                  ))}
                </NativeSelect>
                <span className="w-20 shrink-0 text-center text-xs text-muted-foreground">
                  {isOpen ? `${counts[s.key] ?? 0} prosp.` : s.type === "won" ? "Gagné" : "Perdu"}
                </span>
                <div className="flex shrink-0 items-center">
                  <Button variant="ghost" size="icon-sm" disabled={!isOpen || i === 0} onClick={() => move(i, -1)} aria-label="Monter">
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!isOpen || stages[i + 1]?.type !== "open"}
                    onClick={() => move(i, 1)}
                    aria-label="Descendre"
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!isOpen || stages.filter((x) => x.type === "open").length <= 1}
                    onClick={() => setStages((l) => l.filter((x) => x.key !== s.key))}
                    aria-label="Supprimer l'étape"
                    className="hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            placeholder="Nouvelle étape (ex : Relance devis)"
          />
          <Button variant="outline" onClick={add} disabled={!newLabel.trim()}>
            <Plus />
            Ajouter
          </Button>
        </div>

        <div className="flex flex-wrap justify-between gap-2 border-t pt-3">
          <Button variant="ghost" onClick={() => setStages(DEFAULT_STAGES)}>
            <RotateCcw />
            Étapes par défaut
          </Button>
          <div className="flex gap-2">
            {dirty && (
              <Button variant="outline" onClick={() => setStages(initial)}>
                Annuler
              </Button>
            )}
            <Button disabled={!dirty || pending} onClick={() => run(() => saveStages(stages), "Étapes enregistrées")}>
              {pending && <Loader2 className="animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Si tu supprimes une étape qui contient des prospects, ils sont replacés dans la première étape.
        </p>
      </CardContent>
    </Card>
  );
}

export function SourcesEditor({ initial }: { initial: string[] }) {
  const [sources, setSources] = useState(initial);
  const [value, setValue] = useState("");
  const { pending, run } = useAction();
  const dirty = JSON.stringify(sources) !== JSON.stringify(initial);

  function add() {
    const v = value.trim();
    if (v && !sources.includes(v)) setSources([...sources, v]);
    setValue("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sources de prospects</CardTitle>
        <CardDescription>D&apos;où viennent tes prospects : utilisées dans les fiches et les filtres.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {sources.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full border bg-background py-1 pr-1 pl-3 text-sm">
              {s}
              <button
                type="button"
                onClick={() => setSources(sources.filter((x) => x !== s))}
                className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Retirer ${s}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            placeholder="Nouvelle source (ex : Malt, Webinar…)"
          />
          <Button variant="outline" onClick={add} disabled={!value.trim()}>
            <Plus />
            Ajouter
          </Button>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t pt-3">
          <Button variant="ghost" onClick={() => setSources(DEFAULT_SOURCES)}>
            <RotateCcw />
            Sources par défaut
          </Button>
          <Button disabled={!dirty || pending} onClick={() => run(() => saveSources(sources), "Sources enregistrées")}>
            {pending && <Loader2 className="animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function GoalsForm({ settings }: { settings: Settings }) {
  const [deals, setDeals] = useState(String(settings.monthly_goal_deals));
  const [revenue, setRevenue] = useState(String(settings.monthly_goal_revenue));
  const { pending, run } = useAction();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Objectifs mensuels</CardTitle>
        <CardDescription>Affichés en barres de progression sur le dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveGoals({ deals: Number(deals), revenue: Number(revenue.replace(/\s/g, "").replace(",", ".")) }), "Objectifs enregistrés");
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="goal-deals">Signatures par mois</Label>
              <Input id="goal-deals" type="number" min={0} value={deals} onChange={(e) => setDeals(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-revenue">CA signé par mois (€ HT)</Label>
              <Input id="goal-revenue" inputMode="decimal" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function DemoDataCard({ demoCount }: { demoCount: number }) {
  const { pending, run } = useAction();
  return (
    <Card id="demo" className="scroll-mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="size-4 text-primary" />
          Données de démo
        </CardTitle>
        <CardDescription>
          20 prospects fictifs (PME de secteurs variés) avec historique, relances et signatures, pour tester l&apos;app ou faire une
          démo client. Ils sont marqués « démo » et se suppriment en un clic.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button disabled={pending || demoCount > 0} onClick={() => run(loadDemoData, "Données de démo chargées")}>
          {pending && <Loader2 className="animate-spin" />}
          Charger les données de démo
        </Button>
        <Button
          variant="outline"
          disabled={pending || demoCount === 0}
          onClick={() => run(clearDemoData, "Données de démo supprimées")}
          className="hover:text-destructive"
        >
          <Trash2 />
          Supprimer les données de démo
        </Button>
        <span className="text-xs text-muted-foreground">
          {demoCount > 0 ? `${demoCount} prospects de démo présents` : "Aucune donnée de démo"}
        </span>
      </CardContent>
    </Card>
  );
}
