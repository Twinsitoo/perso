"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { stageColor } from "@/lib/constants";
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
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
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
  data: { key: string; label: string; color: string; count: number; amount: number }[];
}) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} {...axisProps} />
          <YAxis type="category" dataKey="label" width={118} {...axisProps} tick={{ ...axisProps.tick, fill: "var(--foreground)" }} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
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
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
            label={{ position: "right", fill: "var(--muted-foreground)", fontSize: 11 }}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={stageColor(d.color).hex} />
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
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={8} />
              <YAxis width={48} {...axisProps} tickFormatter={(v) => formatEURCompact(v)} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.6 }}
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
              <Bar dataKey="revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Nombre de signatures</p>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={8} />
              <YAxis width={48} allowDecimals={false} {...axisProps} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.6 }}
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
              <Bar dataKey="deals" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
