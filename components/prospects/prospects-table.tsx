"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Loader2, Plus, Search, Upload, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PRIORITIES } from "@/lib/constants";
import { exportProspectsCSV, parseProspectsCSV } from "@/lib/csv";
import { formatDate, formatEUR, todayYMD } from "@/lib/format";
import { importProspects } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Prospect, Settings } from "@/types/database";
import { PriorityBadge, StageBadge } from "./badges";

type SortKey = "company" | "city" | "stage" | "estimated_amount" | "priority" | "next_follow_up" | "created_at";
const PRIORITY_RANK = { haute: 0, moyenne: 1, basse: 2 } as const;
type SortState = { key: SortKey; dir: "asc" | "desc" };

function SortHeader({
  k,
  sort,
  onSort,
  children,
  className,
}: {
  k: SortKey;
  sort: SortState;
  onSort: (k: SortKey) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = sort.key !== k ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={cn("px-3 py-2.5 text-left font-medium", className)}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn("inline-flex items-center gap-1 hover:text-foreground", sort.key === k && "text-foreground")}
      >
        {children}
        <Icon className="size-3 opacity-60" />
      </button>
    </th>
  );
}

export function ProspectsTable({ prospects, settings }: { prospects: Prospect[]; settings: Settings }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [priority, setPriority] = useState("");
  const [source, setSource] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "created_at", dir: "desc" });
  const [importing, startImport] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const today = todayYMD();

  const stageIndex = useMemo(() => new Map(settings.stages.map((s, i) => [s.key, i])), [settings.stages]);
  const cities = useMemo(
    () => [...new Set(prospects.map((p) => p.city).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "fr")),
    [prospects],
  );
  const sources = useMemo(
    () => [...new Set([...settings.sources, ...(prospects.map((p) => p.source).filter(Boolean) as string[])])],
    [prospects, settings.sources],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = prospects.filter((p) => {
      if (stage && p.stage !== stage) return false;
      if (priority && p.priority !== priority) return false;
      if (source && p.source !== source) return false;
      if (city && p.city !== city) return false;
      if (!needle) return true;
      return [p.company, p.contact_name, p.email, p.city, p.sector, p.needs]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      let av: string | number, bv: string | number;
      switch (sort.key) {
        case "estimated_amount":
          av = a.estimated_amount;
          bv = b.estimated_amount;
          break;
        case "priority":
          av = PRIORITY_RANK[a.priority];
          bv = PRIORITY_RANK[b.priority];
          break;
        case "stage":
          av = stageIndex.get(a.stage) ?? 99;
          bv = stageIndex.get(b.stage) ?? 99;
          break;
        case "next_follow_up":
          // Les prospects sans relance vont toujours à la fin.
          if (!a.next_follow_up && !b.next_follow_up) return 0;
          if (!a.next_follow_up) return 1;
          if (!b.next_follow_up) return -1;
          av = a.next_follow_up;
          bv = b.next_follow_up;
          break;
        default:
          av = String(a[sort.key] ?? "").toLowerCase();
          bv = String(b[sort.key] ?? "").toLowerCase();
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [prospects, q, stage, priority, source, city, sort, stageIndex]);

  const hasFilters = q || stage || priority || source || city;
  const total = rows.reduce((s, p) => s + p.estimated_amount, 0);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "company" || key === "city" ? "asc" : "desc" }));
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    startImport(async () => {
      try {
        const parsed = await parseProspectsCSV(file, settings.stages);
        const res = importProspects(parsed);
        if (res.ok) {
          const { count, skipped } = res.value;
          toast.success(`${count} prospect(s) importé(s)${skipped ? `, ${skipped} ligne(s) ignorée(s)` : ""}`);
        } else toast.error(res.error);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Import impossible");
      } finally {
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une entreprise, un contact, un besoin…"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 className="animate-spin" /> : <Upload />}
            Importer CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button variant="outline" onClick={() => exportProspectsCSV(rows, settings.stages)} disabled={rows.length === 0}>
            <Download />
            Exporter
          </Button>
          <Link href="/prospects/nouveau" className={buttonVariants()}>
            <Plus />
            Nouveau prospect
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <NativeSelect value={stage} onChange={(e) => setStage(e.target.value)} className="sm:w-44" aria-label="Filtrer par étape">
          <option value="">Toutes les étapes</option>
          {settings.stages.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect value={priority} onChange={(e) => setPriority(e.target.value)} className="sm:w-40" aria-label="Filtrer par priorité">
          <option value="">Toutes priorités</option>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect value={source} onChange={(e) => setSource(e.target.value)} className="sm:w-44" aria-label="Filtrer par source">
          <option value="">Toutes les sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect value={city} onChange={(e) => setCity(e.target.value)} className="sm:w-40" aria-label="Filtrer par ville">
          <option value="">Toutes les villes</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </NativeSelect>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setQ("");
              setStage("");
              setPriority("");
              setSource("");
              setCity("");
            }}
          >
            <X />
            Réinitialiser
          </Button>
        )}
        <p className="col-span-2 text-xs text-muted-foreground sm:ml-auto">
          {rows.length} prospect{rows.length > 1 ? "s" : ""} · {formatEUR(total)}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <SortHeader sort={sort} onSort={toggleSort} k="company">Entreprise</SortHeader>
                <SortHeader sort={sort} onSort={toggleSort} k="city">Ville</SortHeader>
                <SortHeader sort={sort} onSort={toggleSort} k="stage">Étape</SortHeader>
                <SortHeader sort={sort} onSort={toggleSort} k="estimated_amount" className="text-right">Montant</SortHeader>
                <SortHeader sort={sort} onSort={toggleSort} k="priority">Priorité</SortHeader>
                <SortHeader sort={sort} onSort={toggleSort} k="next_follow_up">Relance</SortHeader>
                <th className="px-3 py-2.5 text-left font-medium">Source</th>
                <SortHeader sort={sort} onSort={toggleSort} k="created_at">Ajouté</SortHeader>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const type = settings.stages.find((s) => s.key === p.stage)?.type ?? "open";
                const overdue = type === "open" && p.next_follow_up && p.next_follow_up < today;
                const dueToday = type === "open" && p.next_follow_up === today;
                return (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/prospects/${p.id}`)}
                    className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-3 py-2.5">
                      <Link href={`/prospects/${p.id}`} className="font-medium hover:text-primary" onClick={(e) => e.stopPropagation()}>
                        {p.company}
                      </Link>
                      <p className="text-xs text-muted-foreground">{p.contact_name ?? "—"}</p>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{p.city ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <StageBadge stage={p.stage} stages={settings.stages} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">{formatEUR(p.estimated_amount)}</td>
                    <td className="px-3 py-2.5">
                      <PriorityBadge priority={p.priority} />
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2.5 whitespace-nowrap tabular-nums",
                        overdue ? "font-medium text-destructive" : dueToday ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground",
                      )}
                    >
                      {p.next_follow_up ? formatDate(p.next_follow_up) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{p.source ?? "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{formatDate(p.created_at)}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-16 text-center text-muted-foreground">
                    {prospects.length === 0 ? (
                      <>
                        Aucun prospect pour l&apos;instant.{" "}
                        <Link href="/prospects/nouveau" className="text-primary hover:underline">
                          Ajoute le premier
                        </Link>{" "}
                        ou charge les données de démo dans les Paramètres.
                      </>
                    ) : (
                      "Aucun résultat avec ces filtres."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Import CSV : colonnes reconnues : Entreprise (obligatoire), Contact, Poste, Email, Téléphone, LinkedIn, Site web, Ville, Secteur,
        Source, Étape, Montant estimé, Priorité, Prochaine relance, Besoins. Séparateur « , » ou « ; ».
      </p>
    </div>
  );
}
