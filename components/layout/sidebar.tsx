"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Columns3, LayoutDashboard, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Columns3 },
  { href: "/prospects", label: "Prospects", icon: Users },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function NavLinks({ onNavigate, overdueCount = 0 }: { onNavigate?: () => void; overdueCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-px">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
            {label}
            {href === "/agenda" && overdueCount > 0 && (
              <span className="ml-auto text-[11px] font-medium text-primary tabular-nums" title="Relances en retard">
                {overdueCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarFooter() {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <Link
        href="/parametres#sauvegarde"
        className="truncate text-[11px] text-muted-foreground hover:text-foreground"
        title="Données enregistrées dans ce navigateur. Sauvegarde dans Paramètres."
      >
        Données locales · Sauvegarde
      </Link>
      <ThemeToggle />
    </div>
  );
}

export function Sidebar({ overdueCount }: { overdueCount: number }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-5 border-r border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground md:flex">
      <Logo className="px-1.5" />
      <NavLinks overdueCount={overdueCount} />
      <div className="mt-auto">
        <SidebarFooter />
      </div>
    </aside>
  );
}
