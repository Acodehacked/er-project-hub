'use client';

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

/** Analytics charts. Colours come from the --chart-* theme tokens, so they follow light/dark mode. */

export function StatusPie({ data }: { data: { status: string; label: string; value: number }[] }) {
  const config = Object.fromEntries(data.map((d, i) => [d.status, { label: d.label, color: `var(--chart-${(i % 5) + 1})` }])) satisfies ChartConfig;
  const visible = data.filter((d) => d.value > 0);
  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-72">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
        <Pie data={visible} dataKey="value" nameKey="status" innerRadius={60} strokeWidth={4} paddingAngle={2}>
          {visible.map((d) => (
            <Cell key={d.status} fill={`var(--color-${d.status})`} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="status" className="flex-wrap" />} />
      </PieChart>
    </ChartContainer>
  );
}

const totalsConfig = {
  total: { label: 'All projects', color: 'var(--chart-2)' },
  approved: { label: 'Approved', color: 'var(--chart-1)' },
} satisfies ChartConfig;

export function GroupedBars({ data, xKey }: { data: Record<string, string | number>[]; xKey: string }) {
  return (
    <ChartContainer config={totalsConfig} className="h-72 w-full">
      <BarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="total" fill="var(--color-total)" radius={6} />
        <Bar dataKey="approved" fill="var(--color-approved)" radius={6} />
      </BarChart>
    </ChartContainer>
  );
}

const techConfig = { value: { label: 'Projects', color: 'var(--chart-1)' } } satisfies ChartConfig;

export function TechBars({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ChartContainer config={techConfig} className="h-80 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 12 }} accessibilityLayer>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" allowDecimals={false} hide />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={96} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={6} />
      </BarChart>
    </ChartContainer>
  );
}

const trendConfig = {
  submitted: { label: 'Submitted', color: 'var(--chart-2)' },
  approved: { label: 'Approved', color: 'var(--chart-3)' },
  rejected: { label: 'Changes requested', color: 'var(--chart-1)' },
} satisfies ChartConfig;

export function DecisionTrend({ data }: { data: { month: string; approved: number; rejected: number; submitted: number }[] }) {
  return (
    <ChartContainer config={trendConfig} className="h-72 w-full">
      <LineChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line dataKey="submitted" stroke="var(--color-submitted)" strokeWidth={2} dot={false} type="monotone" />
        <Line dataKey="approved" stroke="var(--color-approved)" strokeWidth={2} dot={false} type="monotone" />
        <Line dataKey="rejected" stroke="var(--color-rejected)" strokeWidth={2} dot={false} type="monotone" />
      </LineChart>
    </ChartContainer>
  );
}
