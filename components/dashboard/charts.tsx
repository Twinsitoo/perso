"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEUR, formatEURCompact, monthLabel } from "@/lib/format";

type TooltipPayload = { value: number; payload: Record<string, unknown> }[];

function ChartTooltip({
  active,
  payload,
  title,
  format,
}: {
  active?: boolean;
  payload?: TooltipPayload;
  title: (row: Record<string, unknown>) => string;
  format: (row: Record<string, unknown>) => React.ReactNode;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
      <p className="font-medium">{title(row)}</p>
      <div className="mt-0.5 text-muted-foreground">{format(row)}</div>
    </div>
  );
}

const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
} as const;

/** Nombre de prospects par étape : une barre horizontale par étape, couleur de l'étape. */
export function StageChart({
  data,
}: {
  data: { key: string; label: string; type: string; count: number; amount: number }[];
}) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }} barCategoryGap={8}>
          <XAxis type="number" allowDecimals={false} hide />
          <YAxis type="category" dataKey="label" width={112} {...axisProps} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            content={(p) => (
              <ChartTooltip
                active={p.active}
                payload={p.payload as unknown as TooltipPayload}
                title={(r) => String(r.label)}
                format={(r) => (
                  <>
                    {String(r.count)} prospect{Number(r.count) > 1 ? "s" : ""} · {formatEUR(Number(r.amount))}
                  </>
                )}
              />
            )}
          />
          <Bar
            dataKey="count"
            radius={[0, 3, 3, 0]}
            maxBarSize={14}
            label={{ position: "right", fill: "var(--muted-foreground)", fontSize: 11 }}
          >
            {data.map((d) => (
              <Cell
                key={d.key}
                fill={d.type === "won" ? "var(--chart-1)" : d.type === "lost" ? "var(--chart-4)" : "var(--chart-3)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Évolution mensuelle : deux petits graphiques alignés (CA signé, puis nombre de signatures)
 * plutôt qu'un graphique à double axe, plus lisible.
 */
export function MonthlyCharts({ data }: { data: { key: string; deals: number; revenue: number }[] }) {
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.key) }));
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">CA signé (€ HT)</p>
        <div className="h-[170px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={8} />
              <YAxis width={48} {...axisProps} tickFormatter={(v) => formatEURCompact(v)} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                content={(p) => (
                  <ChartTooltip
                    active={p.active}
                    payload={p.payload as unknown as TooltipPayload}
                    title={(r) => monthLabel(String(r.key), true)}
                    format={(r) => (
                      <>
                        {formatEUR(Number(r.revenue))} · {String(r.deals)} signature{Number(r.deals) > 1 ? "s" : ""}
                      </>
                    )}
                  />
                )}
              />
              <Bar dataKey="revenue" fill="var(--chart-1)" radius={[3, 3, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Nombre de signatures</p>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={8} />
              <YAxis width={48} allowDecimals={false} {...axisProps} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                content={(p) => (
                  <ChartTooltip
                    active={p.active}
                    payload={p.payload as unknown as TooltipPayload}
                    title={(r) => monthLabel(String(r.key), true)}
                    format={(r) => (
                      <>
                        {String(r.deals)} signature{Number(r.deals) > 1 ? "s" : ""} · {formatEUR(Number(r.revenue))}
                      </>
                    )}
                  />
                )}
              />
              <Bar dataKey="deals" fill="var(--chart-3)" radius={[3, 3, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
