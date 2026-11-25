"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Columns3, HardDrive, LayoutDashboard, Settings, Users } from "lucide-react";
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
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-sidebar-primary" />}
            <Icon className={cn("size-4", active && "text-sidebar-primary")} />
            {label}
            {href === "/agenda" && overdueCount > 0 && (
              <span className="ml-auto rounded-full bg-sidebar-primary px-1.5 py-0.5 text-[10px] leading-none font-semibold text-white">
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
    <div className="flex items-center justify-between gap-2 border-t border-sidebar-border px-1 pt-3">
      <Link
        href="/parametres#sauvegarde"
        className="flex min-w-0 items-center gap-2 text-xs text-sidebar-foreground/55 hover:text-sidebar-foreground"
        title="Données enregistrées dans ce navigateur. Sauvegarde dans Paramètres."
      >
        <HardDrive className="size-3.5 shrink-0" />
        <span className="truncate">Données sur cet appareil</span>
      </Link>
      <ThemeToggle />
    </div>
  );
}

export function Sidebar({ overdueCount }: { overdueCount: number }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 bg-sidebar p-3 text-sidebar-foreground md:flex">
      <Logo className="px-2 pt-2" />
      <NavLinks overdueCount={overdueCount} />
      <div className="mt-auto">
        <SidebarFooter />
      </div>
    </aside>
  );
}
