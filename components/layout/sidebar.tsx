"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Columns3, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
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

export function SidebarFooter({ email }: { email: string }) {
  return (
    <div className="space-y-2 border-t border-sidebar-border pt-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-7 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold uppercase">
            {email.slice(0, 1)}
          </div>
          <span className="truncate text-xs text-sidebar-foreground/70">{email}</span>
        </div>
        <ThemeToggle />
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <LogOut className="size-4" />
          Déconnexion
        </button>
      </form>
    </div>
  );
}

export function Sidebar({ email, overdueCount }: { email: string; overdueCount: number }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 bg-sidebar p-3 text-sidebar-foreground md:flex">
      <Logo className="px-2 pt-2" />
      <NavLinks overdueCount={overdueCount} />
      <div className="mt-auto">
        <SidebarFooter email={email} />
      </div>
    </aside>
  );
}
