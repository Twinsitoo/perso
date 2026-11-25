import { addDaysYMD, monthKey, toYMD, todayYMD, weekRangeYMD } from "@/lib/format";
import type { Prospect, Settings } from "@/types/database";

export type DashboardStats = ReturnType<typeof computeStats>;

export function computeStats(prospects: Prospect[], settings: Settings) {
  const today = todayYMD();
  const week = weekRangeYMD(today);
  const thisMonth = today.slice(0, 7);
  const typeOf = new Map(settings.stages.map((s) => [s.key, s.type]));
  const type = (p: Prospect) => typeOf.get(p.stage) ?? "open";

  const open = prospects.filter((p) => type(p) === "open");
  const won = prospects.filter((p) => type(p) === "won");
  const lost = prospects.filter((p) => type(p) === "lost");
  const wonThisMonth = won.filter((p) => p.signed_at && monthKey(p.signed_at) === thisMonth);

  const callsThisWeek = open.filter((p) => {
    if (!p.next_call_at) return false;
    const d = toYMD(p.next_call_at);
    return d >= week.start && d <= week.end;
  });

  const sum = (list: Prospect[]) => list.reduce((s, p) => s + p.estimated_amount, 0);
  const closed = won.length + lost.length;

  // 12 derniers mois (y compris le mois courant)
  const months: { key: string; deals: number; revenue: number }[] = [];
  const [y, m] = thisMonth.split("-").map(Number);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    months.push({ key: d.toISOString().slice(0, 7), deals: 0, revenue: 0 });
  }
  const monthIdx = new Map(months.map((mo, i) => [mo.key, i]));
  for (const p of won) {
    if (!p.signed_at) continue;
    const i = monthIdx.get(monthKey(p.signed_at));
    if (i === undefined) continue;
    months[i].deals += 1;
    months[i].revenue += p.estimated_amount;
  }

  const byStage = settings.stages.map((s) => {
    const list = prospects.filter((p) => p.stage === s.key);
    return { key: s.key, label: s.label, color: s.color, type: s.type, count: list.length, amount: sum(list) };
  });

  const followUps = open
    .filter((p) => p.next_follow_up && p.next_follow_up <= today)
    .sort((a, b) => a.next_follow_up!.localeCompare(b.next_follow_up!));
  const callsToday = open
    .filter((p) => p.next_call_at && toYMD(p.next_call_at) === today)
    .sort((a, b) => a.next_call_at!.localeCompare(b.next_call_at!));
  const upcoming = open
    .filter((p) => p.next_follow_up && p.next_follow_up > today && p.next_follow_up <= addDaysYMD(today, 7))
    .sort((a, b) => a.next_follow_up!.localeCompare(b.next_follow_up!))
    .slice(0, 4);

  return {
    today,
    total: prospects.length,
    active: open.length,
    callsThisWeek: callsThisWeek.length,
    dealsThisMonth: wonThisMonth.length,
    revenueThisMonth: sum(wonThisMonth),
    revenueTotal: sum(won),
    pipelineValue: sum(open),
    conversionRate: closed ? won.length / closed : null,
    wonCount: won.length,
    lostCount: lost.length,
    months,
    byStage,
    followUps,
    callsToday,
    upcoming,
    recent: [...prospects].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
  };
}
