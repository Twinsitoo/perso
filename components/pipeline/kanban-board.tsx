"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { BellRing, CalendarClock, GripVertical, Plus, User } from "lucide-react";
import { LostDialog } from "@/components/prospects/lost-dialog";
import { PriorityBadge } from "@/components/prospects/badges";
import { stageColor } from "@/lib/constants";
import { formatDate, formatDateTime, formatEUR, formatEURCompact, todayYMD } from "@/lib/format";
import { updateStage } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Prospect, Stage } from "@/types/database";

function ProspectCard({ prospect, stageType, overlay = false }: { prospect: Prospect; stageType: string; overlay?: boolean }) {
  const today = todayYMD();
  const overdue = stageType === "open" && prospect.next_follow_up && prospect.next_follow_up < today;
  const dueToday = stageType === "open" && prospect.next_follow_up === today;
  return (
    <div
      className={cn(
        "group rounded-xl border bg-card p-3 text-left shadow-xs transition-shadow",
        overlay ? "rotate-2 shadow-xl ring-2 ring-primary/40" : "hover:shadow-md",
        overdue && "border-destructive/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/prospects/${prospect.id}`}
          className="line-clamp-2 text-sm leading-snug font-semibold hover:text-primary"
          onClick={(e) => overlay && e.preventDefault()}
        >
          {prospect.company}
        </Link>
        <GripVertical className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground" />
      </div>
      {prospect.contact_name && (
        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <User className="size-3" />
          {prospect.contact_name}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">{formatEUR(prospect.estimated_amount)}</span>
        <PriorityBadge priority={prospect.priority} />
      </div>
      {(prospect.next_follow_up || prospect.next_call_at) && stageType === "open" && (
        <div className="mt-2.5 space-y-1 border-t pt-2.5 text-xs">
          {prospect.next_follow_up && (
            <p
              className={cn(
                "flex items-center gap-1.5",
                overdue ? "font-medium text-destructive" : dueToday ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground",
              )}
            >
              <BellRing className="size-3" />
              Relance {overdue ? "en retard · " : ""}
              {formatDate(prospect.next_follow_up)}
            </p>
          )}
          {prospect.next_call_at && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarClock className="size-3" />
              {formatDateTime(prospect.next_call_at)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DraggableCard({ prospect, stageType }: { prospect: Prospect; stageType: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: prospect.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn("touch-manipulation cursor-grab active:cursor-grabbing", isDragging && "opacity-30")}
    >
      <ProspectCard prospect={prospect} stageType={stageType} />
    </div>
  );
}

function Column({ stage, prospects, isFirst }: { stage: Stage; prospects: Prospect[]; isFirst: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const total = prospects.reduce((s, p) => s + p.estimated_amount, 0);
  const color = stageColor(stage.color);
  return (
    <div className="flex w-[280px] shrink-0 flex-col">
      <div className="mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", color.dot)} />
          <h2 className="truncate text-sm font-semibold">{stage.label}</h2>
          <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">{prospects.length}</span>
        </div>
        <p className="mt-0.5 pl-4 text-xs font-medium text-muted-foreground tabular-nums" title={formatEUR(total)}>
          {formatEURCompact(total)}
        </p>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-40 flex-1 flex-col gap-2 rounded-2xl border border-transparent bg-muted/50 p-2 transition-colors",
          isOver && "border-primary/40 bg-primary/5",
        )}
      >
        {prospects.map((p) => (
          <DraggableCard key={p.id} prospect={p} stageType={stage.type} />
        ))}
        {prospects.length === 0 && (
          <div className="grid flex-1 place-items-center rounded-xl border border-dashed py-8 text-xs text-muted-foreground">
            Glisse un prospect ici
          </div>
        )}
        {isFirst && (
          <Link
            href="/prospects/nouveau"
            className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Ajouter
          </Link>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ prospects, stages }: { prospects: Prospect[]; stages: Stage[] }) {
  const items = prospects;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingLost, setPendingLost] = useState<Prospect | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const byStage = useMemo(() => {
    const map = new Map<string, Prospect[]>(stages.map((s) => [s.key, []]));
    for (const p of items) {
      (map.get(p.stage) ?? map.get(stages[0]?.key ?? ""))?.push(p);
    }
    // Priorité haute en premier, puis relance la plus proche.
    const rank = { haute: 0, moyenne: 1, basse: 2 } as const;
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          rank[a.priority] - rank[b.priority] ||
          (a.next_follow_up ?? "9999").localeCompare(b.next_follow_up ?? "9999"),
      );
    }
    return map;
  }, [items, stages]);

  const active = activeId ? items.find((p) => p.id === activeId) : null;
  const lostStage = stages.find((s) => s.type === "lost");

  function move(prospect: Prospect, stage: string, lostReason?: string) {
    updateStage(prospect.id, stage, lostReason);
    const label = stages.find((s) => s.key === stage)?.label ?? stage;
    toast.success(`${prospect.company} → ${label}`);
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const target = e.over?.id ? String(e.over.id) : null;
    const prospect = items.find((p) => p.id === e.active.id);
    if (!target || !prospect || prospect.stage === target) return;
    if (target === lostStage?.key) {
      setPendingLost(prospect);
      return;
    }
    move(prospect, target);
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
          <div className="flex min-h-[60vh] gap-3">
            {stages.map((s, i) => (
              <Column key={s.key} stage={s} prospects={byStage.get(s.key) ?? []} isFirst={i === 0} />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {active ? (
            <div className="w-[264px]">
              <ProspectCard
                prospect={active}
                stageType={stages.find((s) => s.key === active.stage)?.type ?? "open"}
                overlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <LostDialog
        open={pendingLost !== null}
        onOpenChange={(o) => !o && setPendingLost(null)}
        company={pendingLost?.company}
        onConfirm={async (reason) => {
          if (pendingLost && lostStage) {
            const p = pendingLost;
            setPendingLost(null);
            move(p, lostStage.key, reason);
          }
        }}
      />
    </>
  );
}
