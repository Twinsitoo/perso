import { Logo } from "@/components/layout/logo";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full bg-red-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 -bottom-48 size-[420px] rounded-full bg-red-900/30 blur-3xl" />
        <Logo className="relative" />
        <div className="relative mt-auto max-w-md space-y-4">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Ta prospection, <span className="text-red-500">pilotée</span> comme un pipeline d&apos;automatisation.
          </h2>
          <p className="text-sm text-sidebar-foreground/60">
            Suivi des prospects, relances, calls et chiffre d&apos;affaires de l&apos;agence, au même endroit.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <Logo className="lg:hidden [&_span.border-sidebar]:border-background" />
          {!isSupabaseConfigured && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
              Supabase n&apos;est pas encore configuré. Crée le fichier <code className="font-mono">.env.local</code>{" "}
              (voir le README) puis relance l&apos;application.
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
