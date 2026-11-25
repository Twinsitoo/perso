"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { NavLinks, SidebarFooter } from "./sidebar";

export function MobileNav({ email, overdueCount }: { email: string; overdueCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-sidebar px-4 text-sidebar-foreground md:hidden">
      <Logo />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="grid size-9 place-items-center rounded-lg hover:bg-sidebar-accent"
          aria-label="Ouvrir le menu"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 gap-6 border-sidebar-border bg-sidebar p-3 text-sidebar-foreground">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Logo className="px-2 pt-2" />
          <NavLinks onNavigate={() => setOpen(false)} overdueCount={overdueCount} />
          <div className="mt-auto">
            <SidebarFooter email={email} />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
