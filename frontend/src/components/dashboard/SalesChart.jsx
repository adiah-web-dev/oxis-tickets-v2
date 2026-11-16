import { BarChart3 } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  toNumber,
} from "../../lib/format";
import { EmptyState } from "../common/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { Tabs, TabsList, TabsTrigger } from "../ui/Tabs";

export function SalesChart({ data, isLoading }) {
  const [metric, setMetric] = useState("tickets");
  const series = (data ?? []).map((p) => ({
    date: p.date,
    tickets: p.tickets,
    revenue: toNumber(p.revenue),
  }));
  const total = series.reduce((sum, p) => sum + p[metric], 0);
  const hasData = series.some((p) => p.tickets > 0 || p.revenue > 0);

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-[15px]">
            Ticket sales · last 30 days
          </CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading..."
              : metric === "tickets"
                ? `${formatNumber(total)} tickets issued`
                : `${formatCurrency(total)} from confirmed orders`}
          </CardDescription>
        </div>
        <Tabs value={metric} onValueChange={(v) => setMetric(v)}>
          <TabsList>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : !hasData ? (
          <EmptyState
            icon={BarChart3}
            title="No sales yet"
            description="Sales will appear her once orders are created."
            className="h-[260px] py-0"
          />
        ) : (
          <div
            className="h-[260px]"
            role="img"
            aria-label={`Chart of ${metric} per day`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={series}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#e2e8f0"
                  strokeDasharry="3 3"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                  tickFormatter={(d) => formatDate(d, "d MM")}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v) =>
                    metric === "revenue" ? `${v}` : String(v)
                  }
                />
                <Tooltip
                  cursor={{ stroke: "#94a3b8", strokeDasharry: "3 3" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(15, 31, 61, 0.08)",
                  }}
                  labelFormatter={(value) => [
                    metric === "revenue"
                      ? formatCurrency(value)
                      : formatNumber(value),
                    metric === "revenue" ? "Revenue" : "Tickets",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="#2653eb"
                  fillOpacity={0.08}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
