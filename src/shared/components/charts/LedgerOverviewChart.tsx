"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  compactAxisMoney,
  TradingChartSurface,
  TradingMoneyTooltip,
  tradingAxisTickX,
  tradingAxisTickY,
  tradingCursor,
  tradingGrid,
} from "@/shared/components/charts/TradingChartPrimitives";
import type { RepaymentListItemDTO } from "@/shared/dal/repaymentDal";
import { formatMoney } from "@/shared/lib/format";
import { formatPercentChange } from "@/shared/lib/formatPct";
import { selectClass } from "@/shared/lib/formClasses";
import type { LedgerStats } from "@/shared/model/ledgerStats";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/shared/ui/chart";
import { Label } from "@/shared/ui/label";

type Props = {
  stats: LedgerStats;
  repayments: RepaymentListItemDTO[];
};

type CurrencyFilter = "ALL" | "VND" | "USD";
type ViewMode = "structure" | "trend";

export function LedgerOverviewChart({ stats, repayments }: Props) {
  const [currency, setCurrency] = useState<CurrencyFilter>("ALL");
  const [view, setView] = useState<ViewMode>("structure");

  const structureRows = useMemo(() => {
    const keys: ("VND" | "USD")[] =
      currency === "ALL" ? ["VND", "USD"] : [currency];
    return keys.map((c) => {
      const row = stats.byCurrency[c] ?? {
        principal: 0,
        repaid: 0,
        outstanding: 0,
      };
      return {
        name: c,
        principal: row.principal,
        repaid: row.repaid,
        outstanding: row.outstanding,
      };
    });
  }, [stats.byCurrency, currency]);

  const trendRows = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const r of repayments) {
      if (currency !== "ALL" && r.currency !== currency) continue;
      const d = new Date(r.happenedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const prev = map.get(key) ?? { total: 0, count: 0 };
      map.set(key, {
        total: prev.total + Number(r.deltaAmount),
        count: prev.count + 1,
      });
    }
    const sortedEntries = [...map.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    let cumulative = 0;
    return sortedEntries.map(([month, v], i) => {
      const prevMonth = i > 0 ? sortedEntries[i - 1]?.[1] : undefined;
      const prevTotal = prevMonth?.total ?? null;
      cumulative += v.total;
      const avgPayment = v.count > 0 ? v.total / v.count : 0;
      const deltaPrev = prevTotal != null ? v.total - prevTotal : null;
      const pctVsPrev =
        prevTotal != null && prevTotal !== 0
          ? formatPercentChange(prevTotal, v.total)
          : prevTotal === 0 && v.total > 0
            ? "Kỳ đầu có trả"
            : "—";
      return {
        month: month.replace("-", "/"),
        monthRaw: month,
        total: v.total,
        count: v.count,
        avgPayment,
        prevTotal,
        deltaPrevMonth: deltaPrev,
        pctVsPrev,
        cumulativeInView: cumulative,
      };
    });
  }, [repayments, currency]);

  const sampleCurrency = currency === "ALL" ? "VND" : currency;

  const lineColor = useMemo(() => {
    if (trendRows.length < 2) return "#34d399";
    const a = trendRows[0]?.total ?? 0;
    const b = trendRows[trendRows.length - 1]?.total ?? 0;
    return b >= a ? "#34d399" : "#f87171";
  }, [trendRows]);

  const ledgerTrendChartConfig = useMemo(
    () =>
      ({
        total: {
          label: "Tổng trả tháng",
          color: lineColor,
        },
      }) satisfies ChartConfig,
    [lineColor],
  );

  const trendFooter = useMemo(() => {
    if (trendRows.length === 0) return null;
    const sum = trendRows.reduce((s, r) => s + r.total, 0);
    const avgMonth = sum / trendRows.length;
    const max = trendRows.reduce((m, r) => Math.max(m, r.total), 0);
    const positive = trendRows.map((r) => r.total).filter((t) => t > 0);
    const min = positive.length ? Math.min(...positive) : 0;
    return { sum, avgMonth, max, min };
  }, [trendRows]);

  return (
    <section
      aria-label="Biểu đồ tổng quan sổ nợ"
      className="rounded-xl border border-white/55 bg-white/40 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Biểu đồ tổng
          </h2>
          <p className="text-xs text-muted-foreground">
            Cột (cơ cấu) hoặc area theo{" "}
            <a
              href="https://ui.shadcn.com/charts/area"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              shadcn/ui Charts
            </a>{" "}
            (Recharts) — xu hướng trả theo tháng.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="grid gap-1">
            <Label htmlFor="ledger-chart-cur" className="text-xs">
              Tiền tệ
            </Label>
            <select
              id="ledger-chart-cur"
              className={selectClass}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyFilter)}
            >
              <option value="ALL">Tất cả</option>
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="ledger-chart-view" className="text-xs">
              Dạng biểu đồ
            </Label>
            <select
              id="ledger-chart-view"
              className={selectClass}
              value={view}
              onChange={(e) => setView(e.target.value as ViewMode)}
            >
              <option value="structure">Cột — cơ cấu nợ</option>
              <option value="trend">Area — trả theo tháng</option>
            </select>
          </div>
        </div>
      </div>

      <TradingChartSurface
        className={cn(
          "h-[min(22rem,55vh)] min-h-[200px] w-full",
          view !== "structure" && trendRows.length === 0 && "flex items-center",
        )}
      >
        {view === "structure" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={structureRows}
              margin={{ top: 6, right: 6, left: 2, bottom: 4 }}
            >
              <CartesianGrid {...tradingGrid} />
              <XAxis
                dataKey="name"
                tick={tradingAxisTickX}
                tickLine={false}
                axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
              />
              <YAxis
                orientation="right"
                tick={tradingAxisTickY}
                tickLine={false}
                axisLine={false}
                tickFormatter={compactAxisMoney}
              />
              <Tooltip
                cursor={tradingCursor}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const cur = String(label);
                  const moneyCur: "VND" | "USD" =
                    cur === "USD" || cur === "VND" ? cur : sampleCurrency;
                  const pr = payload.find((p) => p.dataKey === "principal");
                  const rp = payload.find((p) => p.dataKey === "repaid");
                  const ou = payload.find((p) => p.dataKey === "outstanding");
                  const principalAmt = Number(pr?.value ?? 0);
                  const repaidAmt = Number(rp?.value ?? 0);
                  const outstandingAmt = Number(ou?.value ?? 0);
                  const pctRepaid =
                    principalAmt > 0
                      ? ((repaidAmt / principalAmt) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <TradingMoneyTooltip
                      active={active}
                      payload={payload}
                      title={`Loại tiền: ${cur}`}
                      subtitle="Gốc · đã trả · dư nợ (theo dữ liệu hiện tại)"
                      primaryMetricLabel="Dư nợ"
                      primaryOverride={formatMoney(outstandingAmt, moneyCur)}
                      accentColorHex="#38bdf8"
                      currency={sampleCurrency}
                      extraRows={[
                        {
                          label: "Gốc",
                          value: formatMoney(principalAmt, moneyCur),
                        },
                        {
                          label: "Đã trả",
                          value: formatMoney(repaidAmt, moneyCur),
                        },
                        {
                          label: "Đã trả / gốc",
                          value: `${pctRepaid}%`,
                          emphasize: true,
                        },
                        {
                          label: "Còn phải trả / gốc",
                          value:
                            principalAmt > 0
                              ? `${((outstandingAmt / principalAmt) * 100).toFixed(1)}%`
                              : "—",
                        },
                      ]}
                    />
                  );
                }}
              />
              <Legend
                wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }}
                formatter={(value) =>
                  value === "principal"
                    ? "Gốc"
                    : value === "repaid"
                      ? "Đã trả"
                      : "Dư nợ"
                }
              />
              <Bar
                dataKey="principal"
                name="principal"
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
              <Bar
                dataKey="repaid"
                name="repaid"
                fill="var(--chart-2)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
              <Bar
                dataKey="outstanding"
                name="outstanding"
                fill="var(--chart-3)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : trendRows.length === 0 ? (
          <p className="w-full px-4 text-center text-sm text-slate-400">
            Chưa có dữ liệu trả nợ để hiển thị xu hướng.
          </p>
        ) : (
          <ChartContainer
            config={ledgerTrendChartConfig}
            className="aspect-auto h-full min-h-[200px] w-full min-w-0"
          >
            <AreaChart
              accessibilityLayer
              data={trendRows}
              margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={compactAxisMoney}
              />
              <ChartTooltip
                cursor={tradingCursor}
                content={({ active, payload, label }) => {
                  const p = payload?.find((x) => x.dataKey === "total");
                  const row = trendRows.find((r) => r.month === label);
                  const extra =
                    row == null
                      ? undefined
                      : [
                          {
                            label: "Số lần trả",
                            value: String(row.count),
                          },
                          {
                            label: "Trung bình mỗi lần",
                            value: formatMoney(row.avgPayment, sampleCurrency),
                          },
                          {
                            label: "Chênh so với tháng trước",
                            value:
                              row.deltaPrevMonth == null
                                ? "—"
                                : `${row.deltaPrevMonth >= 0 ? "+" : "−"}${formatMoney(Math.abs(row.deltaPrevMonth), sampleCurrency)}`,
                            emphasize: true,
                          },
                          {
                            label: "% so với tháng trước",
                            value: row.pctVsPrev,
                          },
                          {
                            label: "Lũy kế đến tháng này (trong khung)",
                            value: formatMoney(
                              row.cumulativeInView,
                              sampleCurrency,
                            ),
                          },
                          ...(row.monthRaw
                            ? [
                                {
                                  label: "Kỳ dữ liệu",
                                  value: row.monthRaw,
                                },
                              ]
                            : []),
                        ];
                  return (
                    <TradingMoneyTooltip
                      active={active}
                      payload={p ? [p] : payload}
                      title={
                        row ? `Tháng ${row.month}` : `Tháng ${label ?? ""}`
                      }
                      subtitle="Tổng tiền trả ghi nhận trong kỳ"
                      primaryMetricLabel="Tổng trả trong tháng"
                      accentColorHex={lineColor}
                      currency={sampleCurrency}
                      extraRows={extra}
                    />
                  );
                }}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="total"
                name="total"
                type="monotone"
                fill="var(--color-total)"
                fillOpacity={0.35}
                stroke="var(--color-total)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </TradingChartSurface>

      {view === "trend" && trendFooter && trendRows.length > 0 ? (
        <div className="mt-3 grid gap-3 rounded-lg border border-white/40 bg-white/25 px-3 py-3 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-sm text-muted-foreground md:text-base">
              Tổng trong các tháng hiển thị
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-foreground md:text-xl">
              {formatMoney(trendFooter.sum, sampleCurrency)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground md:text-base">
              Trung bình / tháng
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-foreground md:text-xl">
              {formatMoney(trendFooter.avgMonth, sampleCurrency)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground md:text-base">
              Tháng trả cao nhất
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-foreground md:text-xl">
              {formatMoney(trendFooter.max, sampleCurrency)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground md:text-base">
              Tháng trả thấp nhất (&gt;0)
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-foreground md:text-xl">
              {trendFooter.min > 0
                ? formatMoney(trendFooter.min, sampleCurrency)
                : "—"}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
