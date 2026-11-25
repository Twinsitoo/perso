import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { requireUser } from "@/lib/supabase/server";
import { todayYMD } from "@/lib/format";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, user } = await requireUser();

  // Badge « relances en retard » dans la navigation.
  const { count } = await supabase
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .lt("next_follow_up", todayYMD())
    .not("stage", "in", "(signe,perdu)");

  const email = user.email ?? "";
  const overdue = count ?? 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar email={email} overdueCount={overdue} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav email={email} overdueCount={overdue} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
