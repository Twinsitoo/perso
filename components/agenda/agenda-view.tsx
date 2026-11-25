"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, BellRing, CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addDaysYMD, formatDate, formatTime, monthLabel, toYMD, todayYMD } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Prospect, Stage } from "@/types/database";

type AgendaEvent = {
  id: string;
  prospectId: string;
  kind: "follow_up" | "call";
  date: string; // AAAA-MM-JJ
  time?: string;
  company: string;
  contact: string | null;
  overdue: boolean;
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function shiftMonth(key: string, n: number) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}

function EventPill({ e, compact = false }: { e: AgendaEvent; compact?: boolean }) {
  const Icon = e.kind === "call" ? CalendarClock : BellRing;
  return (
    <Link
      href={`/prospects/${e.prospectId}`}
      title={`${e.kind === "call" ? "Call" : "Relance"} · ${e.company}`}
      className={cn(
        "flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80",
        e.overdue
          ? "bg-destructive text-white"
          : e.kind === "call"
            ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
            : "bg-primary/10 text-primary",
      )}
    >
      <Icon className="size-3 shrink-0" />
      {!compact && e.time && <span className="tabular-nums">{e.time}</span>}
      <span className="truncate">{e.company}</span>
    </Link>
  );
}

export function AgendaView({ prospects, stages }: { prospects: Prospect[]; stages: Stage[] }) {
  const today = todayYMD();
  const [month, setMonth] = useState(today.slice(0, 7));

  const events = useMemo(() => {
    const openKeys = new Set(stages.filter((s) => s.type === "open").map((s) => s.key));
    const list: AgendaEvent[] = [];
    for (const p of prospects) {
      if (!openKeys.has(p.stage)) continue;
      if (p.next_follow_up) {
        list.push({
          id: `f-${p.id}`,
          prospectId: p.id,
          kind: "follow_up",
          date: p.next_follow_up,
          company: p.company,
          contact: p.contact_name,
          overdue: p.next_follow_up < today,
        });
      }
      if (p.next_call_at) {
        const d = toYMD(p.next_call_at);
        list.push({
          id: `c-${p.id}`,
          prospectId: p.id,
          kind: "call",
          date: d,
          time: formatTime(p.next_call_at),
          company: p.company,
          contact: p.contact_name,
          overdue: d < today,
        });
      }
    }
    return list.sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));
  }, [prospects, stages, today]);

  const byDate = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const e of events) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [events]);

  // Grille du mois : du lundi précédant le 1er au dimanche suivant la fin du mois.
  const days = useMemo(() => {
    const first = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const dow = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // 0 = lundi
    const start = addDaysYMD(first, -dow);
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells = Math.ceil((dow + daysInMonth) / 7) * 7;
    return Array.from({ length: cells }, (_, i) => addDaysYMD(start, i));
  }, [month]);

  const overdue = events.filter((e) => e.overdue);
  const upcoming = events.filter((e) => !e.overdue && e.date >= today).slice(0, 12);
  const monthEvents = events.filter((e) => e.date.startsWith(month));

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <Card className="gap-0 py-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="text-base font-semibold capitalize">{monthLabel(month, true)}</h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setMonth(today.slice(0, 7))}>
              Aujourd&apos;hui
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Mois précédent">
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="Mois suivant">
              <ChevronRight />
            </Button>
          </div>
        </div>

        {/* Grille (tablette / desktop) */}
        <div className="hidden md:block">
          <div className="grid grid-cols-7 border-b text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const inMonth = d.startsWith(month);
              const list = byDate.get(d) ?? [];
              const isToday = d === today;
              return (
                <div
                  key={d}
                  className={cn(
                    "min-h-28 border-r border-b p-1.5 [&:nth-child(7n)]:border-r-0",
                    !inMonth && "bg-muted/30 text-muted-foreground/60",
                  )}
                >
                  <div className="mb-1 flex justify-end">
                    <span
                      className={cn(
                        "grid size-6 place-items-center rounded-full text-xs tabular-nums",
                        isToday && "bg-primary font-semibold text-primary-foreground",
                      )}
                    >
                      {Number(d.slice(8))}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {list.slice(0, 3).map((e) => (
                      <EventPill key={e.id} e={e} />
                    ))}
                    {list.length > 3 && <p className="px-1 text-[11px] text-muted-foreground">+{list.length - 3} autres</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Liste (mobile) */}
        <div className="divide-y md:hidden">
          {monthEvents.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Rien de prévu ce mois-ci.</p>}
          {[...new Set(monthEvents.map((e) => e.date))].map((d) => (
            <div key={d} className="flex gap-3 p-3">
              <div className={cn("w-12 shrink-0 text-center", d === today && "text-primary")}>
                <p className="text-lg leading-none font-semibold">{Number(d.slice(8))}</p>
                <p className="text-[11px] text-muted-foreground">{formatDate(d).split(" ")[1]}</p>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                {byDate.get(d)!.map((e) => (
                  <EventPill key={e.id} e={e} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-6">
        <Card className={cn(overdue.length > 0 && "ring-destructive/40")}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", overdue.length > 0 && "text-destructive")}>
              <AlertTriangle className="size-4" />
              En retard ({overdue.length})
            </CardTitle>
            <CardDescription>Relances et calls dont la date est passée</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {overdue.length === 0 && <p className="text-sm text-muted-foreground">Aucun retard 🎉</p>}
            {overdue.map((e) => (
              <Link
                key={e.id}
                href={`/prospects/${e.prospectId}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-destructive/8"
              >
                <span className="truncate font-medium">
                  {e.kind === "call" ? "Call" : "Relance"} · {e.company}
                </span>
                <span className="shrink-0 text-xs font-medium text-destructive">{formatDate(e.date)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>À venir</CardTitle>
            <CardDescription>Prochaines relances et calls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Rien de planifié.</p>}
            {upcoming.map((e) => (
              <Link
                key={e.id}
                href={`/prospects/${e.prospectId}`}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60"
              >
                {e.kind === "call" ? (
                  <CalendarClock className="size-4 shrink-0 text-amber-500" />
                ) : (
                  <BellRing className="size-4 shrink-0 text-primary" />
                )}
                <span className="min-w-0 flex-1 truncate">{e.company}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {e.date === today ? "Aujourd'hui" : formatDate(e.date)}
                  {e.time ? ` · ${e.time}` : ""}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3 px-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary/30" /> Relance
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-amber-500/40" /> Call / démo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-destructive" /> En retard
          </span>
        </div>
      </div>
    </div>
  );
}
