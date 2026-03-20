"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import {
  compactAxisMoney,
  TradingChartSurface,
  TradingMoneyTooltip,
  tradingCursor,
} from "@/shared/components/charts/TradingChartPrimitives";
import type { RepaymentListItemDTO } from "@/shared/dal/repaymentDal";
import { formatMoney } from "@/shared/lib/format";
import { selectClass } from "@/shared/lib/formClasses";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/shared/ui/chart";
import { Label } from "@/shared/ui/label";

type DebtChartRow = {
  key: string;
  label: string;
  each: number;
  cumulative: number;
  remaining: number;
  /** Điểm “Đầu kỳ” trước mọi lần trả (chỉ cumulative / remaining) */
  isBaseline?: boolean;
  /** Nhãn thời gian đầy đủ (VN) */
  happenedAtLabel?: string;
  /** Nội dung ghi chú khoản trả (rút gọn trong tooltip nếu dài) */
  note?: string;
};

type Props = {
  currency: "VND" | "USD";
  totalPrincipal: number;
  repayments: RepaymentListItemDTO[];
  /** Điểm bắt đầu cho biểu đồ lũy kế / dư nợ */
  debtOccurredAt: Date;
};

type SeriesMode = "each" | "cumulative" | "remaining";

export function DebtRepaymentChart({
  currency,
  totalPrincipal,
  repayments,
  debtOccurredAt,
}: Props) {
  const [mode, setMode] = useState<SeriesMode>("remaining");

  const paymentRows = useMemo((): DebtChartRow[] => {
    const sorted = [...repayments].sort(
      (a, b) =>
        new Date(a.happenedAt).getTime() - new Date(b.happenedAt).getTime(),
    );
    let cum = 0;
    return sorted.map((r, i) => {
      const amt = Number(r.deltaAmount);
      cum += amt;
      const t = new Date(r.happenedAt);
      const label = t.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
      const happenedAtLabel = t.toLocaleString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const noteTrim = r.note.trim();
      return {
        key: r.id,
        label: `${label} (#${i + 1})`,
        each: amt,
        cumulative: cum,
        remaining: Math.max(0, totalPrincipal - cum),
        happenedAtLabel,
        note: noteTrim.length ? noteTrim : undefined,
      };
    });
  }, [repayments, totalPrincipal]);

  const rowsWithStart = useMemo((): DebtChartRow[] => {
    const startLabel = new Date(debtOccurredAt).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
    const baselineAtLabel = new Date(debtOccurredAt).toLocaleString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return [
      {
        key: "start",
        label: `Đầu (${startLabel})`,
        each: 0,
        cumulative: 0,
        remaining: totalPrincipal,
        isBaseline: true,
        happenedAtLabel: baselineAtLabel,
      },
      ...paymentRows,
    ];
  }, [paymentRows, debtOccurredAt, totalPrincipal]);

  const rows: DebtChartRow[] = mode === "each" ? paymentRows : rowsWithStart;

  const dataKey = mode;
  const nameVi =
    mode === "each"
      ? "Từng lần trả (area)"
      : mode === "cumulative"
        ? "Đã trả lũy kế"
        : "Dư nợ còn lại";

  const lineColor = useMemo((): string => {
    if (mode === "each") return "#a78bfa";
    if (rows.length < 2) return "#34d399";
    const f = rows[0]?.[dataKey] ?? 0;
    const l = rows[rows.length - 1]?.[dataKey] ?? 0;
    if (mode === "cumulative") return l >= f ? "#34d399" : "#f87171";
    if (mode === "remaining") return l <= f ? "#34d399" : "#f87171";
    return "#34d399";
  }, [rows, dataKey, mode]);

  const areaType = mode === "each" ? "stepAfter" : "monotone";

  const modeSubtitle =
    mode === "each"
      ? "Số tiền từng lần ghi nhận"
      : mode === "cumulative"
        ? "Tổng đã trả tích lũy theo thời gian"
        : "Dư nợ còn lại sau mỗi lần trả";

  const debtAreaChartConfig = useMemo(() => {
    const k = dataKey;
    return {
      [k]: {
        label: nameVi,
        color: lineColor,
      },
    } satisfies ChartConfig;
  }, [dataKey, nameVi, lineColor]);

  if (repayments.length === 0) return null;

  const fillVar = `var(--color-${dataKey})`;

  return (
    <section
      aria-label="Biểu đồ trả nợ theo khoản"
      className="rounded-xl border border-white/55 bg-white/40 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Biểu đồ theo khoản
          </h2>
          <p className="text-xs text-muted-foreground">
            Area theo{" "}
            <a
              href="https://ui.shadcn.com/charts/area"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              shadcn/ui Charts
            </a>
            : fill/stroke qua <code className="text-[10px]">ChartConfig</code>.
            Từng lần trả dùng bậc thang (step).
          </p>
        </div>
        <div className="grid gap-1 sm:min-w-[14rem]">
          <Label htmlFor="debt-chart-mode" className="text-xs">
            Chuỗi số liệu
          </Label>
          <select
            id="debt-chart-mode"
            className={selectClass}
            value={mode}
            onChange={(e) => setMode(e.target.value as SeriesMode)}
          >
            <option value="each">Area — mỗi lần trả (step)</option>
            <option value="cumulative">Area — đã trả lũy kế</option>
            <option value="remaining">Area — dư nợ còn lại</option>
          </select>
        </div>
      </div>

      <TradingChartSurface
        className={cn(
          "h-[min(20rem,50vh)] min-h-[180px] w-full",
          mode === "each" ? "min-h-[200px]" : "",
        )}
      >
        <ChartContainer
          config={debtAreaChartConfig}
          className={cn(
            "aspect-auto h-full min-h-[180px] w-full min-w-0",
            mode === "each" && "min-h-[200px]",
          )}
        >
          <AreaChart
            accessibilityLayer
            data={rows}
            margin={{ top: 8, right: 12, left: 4, bottom: 36 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="4 4" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              angle={-32}
              textAnchor="end"
              height={52}
              interval={rows.length > 10 ? "preserveStartEnd" : 0}
              tickMargin={8}
            />
            <YAxis
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickFormatter={compactAxisMoney}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={tradingCursor}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const raw = payload[0]?.payload as DebtChartRow | undefined;
                const pctThisOnPrincipal =
                  totalPrincipal > 0 && raw && raw.isBaseline !== true
                    ? `${((raw.each / totalPrincipal) * 100).toFixed(2)}%`
                    : "—";

                if (raw?.isBaseline === true) {
                  return (
                    <TradingMoneyTooltip
                      active={active}
                      payload={payload}
                      title="Đầu kỳ"
                      subtitle="Trước mọi lần trả được ghi nhận trong hệ thống"
                      primaryMetricLabel={
                        mode === "remaining"
                          ? "Dư nợ (bằng gốc ban đầu)"
                          : nameVi
                      }
                      accentColorHex={lineColor}
                      currency={currency}
                      extraRows={[
                        {
                          label: "Gốc khoản",
                          value: formatMoney(totalPrincipal, currency),
                          emphasize: true,
                        },
                        {
                          label: "Mốc thời gian (khoản)",
                          value: raw.happenedAtLabel ?? "—",
                        },
                        {
                          label: "Đã trả lũy kế",
                          value: formatMoney(0, currency),
                        },
                        {
                          label: "Dư nợ",
                          value: formatMoney(raw.remaining, currency),
                        },
                      ]}
                    />
                  );
                }

                const noteDisplay =
                  raw?.note == null || raw.note.length === 0
                    ? null
                    : raw.note.length > 96
                      ? `${raw.note.slice(0, 96)}…`
                      : raw.note;

                return (
                  <TradingMoneyTooltip
                    active={active}
                    payload={payload}
                    title={String(label ?? "")}
                    subtitle={modeSubtitle}
                    primaryMetricLabel={nameVi}
                    accentColorHex={lineColor}
                    currency={currency}
                    extraRows={[
                      ...(raw?.happenedAtLabel != null
                        ? [
                            {
                              label: "Thời điểm ghi nhận",
                              value: raw.happenedAtLabel,
                            },
                          ]
                        : []),
                      {
                        label: "Lần này",
                        value: formatMoney(raw?.each ?? 0, currency),
                        emphasize: mode === "each",
                      },
                      {
                        label: "Lũy kế đã trả",
                        value: formatMoney(raw?.cumulative ?? 0, currency),
                        emphasize: mode === "cumulative",
                      },
                      {
                        label: "Dư nợ còn lại",
                        value: formatMoney(raw?.remaining ?? 0, currency),
                        emphasize: mode === "remaining",
                      },
                      {
                        label: "% lần này / gốc",
                        value: pctThisOnPrincipal,
                      },
                      ...(noteDisplay != null
                        ? [{ label: "Ghi chú", value: noteDisplay }]
                        : []),
                    ]}
                  />
                );
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type={areaType}
              dataKey={dataKey}
              name={dataKey}
              fill={fillVar}
              fillOpacity={0.35}
              stroke={fillVar}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>
      </TradingChartSurface>
    </section>
  );
}
