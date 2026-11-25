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
import { Plus } from "lucide-react";
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
        "rounded-md border bg-card px-3 py-2.5 text-left transition-colors",
        overlay ? "shadow-lg" : "hover:border-foreground/20",
      )}
    >
      <Link
        href={`/prospects/${prospect.id}`}
        className="line-clamp-2 text-[13px] leading-snug font-medium"
        onClick={(e) => overlay && e.preventDefault()}
      >
        {prospect.company}
      </Link>
      {prospect.contact_name && <p className="mt-0.5 truncate text-xs text-muted-foreground">{prospect.contact_name}</p>}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-[13px] tabular-nums">{formatEUR(prospect.estimated_amount)}</span>
        <PriorityBadge priority={prospect.priority} />
      </div>
      {(prospect.next_follow_up || prospect.next_call_at) && stageType === "open" && (
        <div className="mt-2 space-y-0.5 text-[11px] tabular-nums">
          {prospect.next_follow_up && (
            <p className={cn(overdue ? "text-primary" : dueToday ? "text-foreground" : "text-muted-foreground")}>
              Relance {formatDate(prospect.next_follow_up)}
              {overdue ? " · en retard" : dueToday ? " · aujourd'hui" : ""}
            </p>
          )}
          {prospect.next_call_at && <p className="text-muted-foreground">Call {formatDateTime(prospect.next_call_at)}</p>}
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
    <div className="flex w-[264px] shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1 text-xs">
        <span className={cn("size-1.5 rounded-full", color.dot)} />
        <h2 className="truncate font-medium">{stage.label}</h2>
        <span className="text-muted-foreground tabular-nums">{prospects.length}</span>
        <span className="ml-auto text-muted-foreground tabular-nums" title={formatEUR(total)}>
          {formatEURCompact(total)}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-40 flex-1 flex-col gap-1.5 rounded-lg bg-muted/40 p-1.5 transition-colors",
          isOver && "bg-muted ring-1 ring-foreground/15",
        )}
      >
        {prospects.map((p) => (
          <DraggableCard key={p.id} prospect={p} stageType={stage.type} />
        ))}
        {prospects.length === 0 && (
          <div className="grid flex-1 place-items-center py-8 text-[11px] text-muted-foreground/70">Vide</div>
        )}
        {isFirst && (
          <Link
            href="/prospects/nouveau"
            className="flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs text-muted-foreground hover:bg-background hover:text-foreground"
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
            <div className="w-[252px]">
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
