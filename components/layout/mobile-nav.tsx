"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { NavLinks, SidebarFooter } from "./sidebar";

export function MobileNav({ overdueCount }: { overdueCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b bg-background px-4 md:hidden">
      <Logo />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Ouvrir le menu"
        >
          <Menu className="size-4" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 gap-5 border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Logo className="px-1.5" />
          <NavLinks onNavigate={() => setOpen(false)} overdueCount={overdueCount} />
          <div className="mt-auto">
            <SidebarFooter />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
