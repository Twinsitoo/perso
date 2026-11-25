"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LOST_REASONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function LostDialog({
  open,
  onOpenChange,
  company,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: string;
  onConfirm: (reason: string) => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    const full = [reason, details.trim()].filter(Boolean).join(" — ");
    await onConfirm(full || "Non précisée");
    setBusy(false);
    setReason("");
    setDetails("");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marquer comme perdu</DialogTitle>
          <DialogDescription>
            {company ? <>Pourquoi l&apos;opportunité {company} n&apos;a pas abouti ?</> : "Pourquoi cette opportunité n'a pas abouti ?"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {LOST_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r === reason ? "" : r)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                r === reason
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted",
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lost-details">Précisions (optionnel)</Label>
          <Textarea id="lost-details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={confirm} disabled={busy}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
