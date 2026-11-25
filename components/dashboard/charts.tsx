"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEUR, formatEURCompact, monthLabel } from "@/lib/format";

type Row = { key: string; deals: number; revenue: number };

function RevenueTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
      <p className="font-medium first-letter:uppercase">{monthLabel(r.key, true)}</p>
      <p className="mt-0.5 text-muted-foreground tabular-nums">
        {formatEUR(r.revenue)} · {r.deals} signature{r.deals > 1 ? "s" : ""}
      </p>
    </div>
  );
}

const axis = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
} as const;

/** CA signé par mois sur 12 mois (le nombre de signatures est dans l'infobulle). */
export function RevenueChart({ data }: { data: Row[] }) {
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.key) }));
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={12} />
          <YAxis width={44} {...axis} tickFormatter={(v) => (v === 0 ? "0" : formatEURCompact(v))} allowDecimals={false} />
          <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<RevenueTooltip />} />
          <Bar dataKey="revenue" fill="var(--chart-1)" radius={[3, 3, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
