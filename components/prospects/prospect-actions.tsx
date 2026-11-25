"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Ban, Mail, MoreHorizontal, Pencil, Phone, RotateCcw, Trash2 } from "lucide-react";
import { LinkedinIcon as Linkedin } from "@/components/ui/linkedin-icon";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NativeSelect } from "@/components/ui/native-select";
import { deleteProspect, updateStage } from "@/lib/actions/prospects";
import { cn } from "@/lib/utils";
import type { Prospect, Stage } from "@/types/database";
import { LostDialog } from "./lost-dialog";

function QuickLink({
  href,
  icon: Icon,
  label,
  external,
}: {
  href: string | null;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  external?: boolean;
}) {
  if (!href) {
    return (
      <span className={cn(buttonVariants({ variant: "outline" }), "pointer-events-none opacity-40")}>
        <Icon />
        <span className="hidden sm:inline">{label}</span>
      </span>
    );
  }
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={buttonVariants({ variant: "outline" })}
    >
      <Icon />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}

export function ProspectActions({ prospect, stages }: { prospect: Prospect; stages: Stage[] }) {
  const [lostOpen, setLostOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const lostStage = stages.find((s) => s.type === "lost");
  const firstStage = stages[0];
  const isLost = prospect.stage === lostStage?.key;

  function changeStage(stage: string) {
    if (stage === lostStage?.key) {
      setLostOpen(true);
      return;
    }
    startTransition(async () => {
      const res = await updateStage(prospect.id, stage);
      if (res.ok) toast.success("Étape mise à jour");
      else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <QuickLink href={prospect.phone ? `tel:${prospect.phone.replace(/\s/g, "")}` : null} icon={Phone} label="Appeler" />
      <QuickLink href={prospect.email ? `mailto:${prospect.email}` : null} icon={Mail} label="Email" />
      <QuickLink href={prospect.linkedin_url} icon={Linkedin} label="LinkedIn" external />

      <NativeSelect
        aria-label="Étape du pipeline"
        className="w-44"
        value={prospect.stage}
        disabled={pending}
        onChange={(e) => changeStage(e.target.value)}
      >
        {stages.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </NativeSelect>

      <Link href={`/prospects/${prospect.id}/modifier`} className={buttonVariants()}>
        <Pencil />
        Modifier
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Plus d'actions" />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {isLost ? (
            <DropdownMenuItem onClick={() => firstStage && changeStage(firstStage.key)}>
              <RotateCcw />
              Réactiver le prospect
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setLostOpen(true)}>
              <Ban />
              Marquer comme perdu
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LostDialog
        open={lostOpen}
        onOpenChange={setLostOpen}
        company={prospect.company}
        onConfirm={async (reason) => {
          if (!lostStage) return;
          const res = await updateStage(prospect.id, lostStage.key, reason);
          if (res.ok) {
            toast.success("Prospect marqué comme perdu");
            setLostOpen(false);
          } else toast.error(res.error);
        }}
      />

      <Dialog open={deleteOpen} onOpenChange={(o) => setDeleteOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer {prospect.company} ?</DialogTitle>
            <DialogDescription>
              Le prospect et tout son historique d&apos;interactions seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await deleteProspect(prospect.id);
                  if (res && !res.ok) toast.error(res.error);
                })
              }
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
