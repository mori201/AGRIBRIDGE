"use client";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function SimpleBarChart({ data, height = 220, color = "#1f6a39" }: { data: { label: string; value: number; color?: string }[]; height?: number; color?: string }) {
  if (!data.some((d) => d.value > 0)) return <p className="py-10 text-center text-sm text-muted">Pas encore de données.</p>;
  return (
    <div style={{ height }} role="img" aria-label={data.map((d) => `${d.label} : ${d.value}`).join(", ")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} interval={0} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "var(--surface-2)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 12 }} />
          <Bar dataKey="value" name="Nombre" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color ?? color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleLineArea({ data, height = 200 }: { data: { label: string; value: number }[]; height?: number }) {
  return <SimpleBarChart data={data} height={height} color="#c9a13b" />;
}
