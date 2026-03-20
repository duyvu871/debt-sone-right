"use client";

import type { ReactNode } from "react";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/shared/lib/format";

/** Khung vùng vẽ giống dashboard tài chính (nền tối, tối ưu độ tương phản). */
export function TradingChartSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-700/80 bg-gradient-to-b from-slate-950/98 via-slate-900/98 to-slate-950 p-1 shadow-inner ring-1 ring-white/5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function compactAxisMoney(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return String(Math.round(v));
}

const axisTick = { fill: "#94a3b8", fontSize: 11 } as const;

export const tradingAxisTickX = {
  ...axisTick,
  fontSize: 10,
};

export const tradingAxisTickY = axisTick;

export const tradingGrid = {
  stroke: "rgba(148, 163, 184, 0.12)",
  strokeDasharray: "4 4" as const,
};

export const tradingCursor = {
  stroke: "rgba(248, 250, 252, 0.28)",
  strokeWidth: 1,
  strokeDasharray: "4 4",
};

export type TooltipExtraRow = {
  label: string;
  value: string;
  /** Hiển thị nhấn mạnh (số tiền / % quan trọng) */
  emphasize?: boolean;
};

type MoneyTooltipProps = {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
  label?: string | number;
  currency: "VND" | "USD";
  /** Gắn trước nhãn trục X (vd: "Tháng") — bỏ qua nếu có `title` */
  labelPrefix?: string;
  /** Tiêu đề chính (ưu tiên hơn labelPrefix + label) */
  title?: string;
  /** Dòng phụ dưới tiêu đề */
  subtitle?: string;
  /** Nhãn phía trên số tiền chính */
  primaryMetricLabel?: string;
  /** Màu chấm accent (Tailwind class) */
  accentDotClass?: string;
  /** Ghi đè màu chấm (hex, ưu tiên hơn class) */
  accentColorHex?: string;
  /** Bỏ qua payload, hiển thị số tiền cố định */
  primaryOverride?: string;
  /** Dòng chi tiết (được phân tách rõ ràng) */
  extraRows?: TooltipExtraRow[];
};

/** Tooltip chi tiết (dùng chung cho Recharts và Lightweight Charts). */
export function TradingDetailTooltip({
  title,
  subtitle,
  primaryMetricLabel,
  primaryText,
  accentDotClass = "bg-emerald-400",
  accentColorHex,
  extraRows,
}: {
  title: string;
  subtitle?: string;
  primaryMetricLabel?: string;
  primaryText: string;
  accentDotClass?: string;
  accentColorHex?: string;
  extraRows?: TooltipExtraRow[];
}) {
  return (
    <div className="max-w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-600/90 bg-slate-950/95 px-3 py-2.5 text-xs shadow-xl ring-1 ring-white/10 backdrop-blur-md">
      <p className="font-medium text-slate-200 leading-snug">{title}</p>
      {subtitle ? (
        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
          {subtitle}
        </p>
      ) : null}
      {primaryMetricLabel ? (
        <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {primaryMetricLabel}
        </p>
      ) : null}
      <div className="mt-0.5 flex items-baseline gap-2 tabular-nums text-slate-100">
        <span
          className={cn(
            "mt-1 size-2 shrink-0 self-center rounded-full",
            !accentColorHex && accentDotClass,
          )}
          style={
            accentColorHex ? { backgroundColor: accentColorHex } : undefined
          }
          aria-hidden
        />
        <span className="text-sm font-semibold tracking-tight">
          {primaryText}
        </span>
      </div>
      {extraRows?.length ? (
        <ul className="mt-2.5 space-y-1.5 border-t border-slate-700/80 pt-2.5">
          {extraRows.map((r) => (
            <li
              key={r.label}
              className="flex justify-between gap-4 text-[11px] leading-snug"
            >
              <span className="shrink-0 text-slate-500">{r.label}</span>
              <span
                className={cn(
                  "min-w-0 break-words text-right",
                  r.emphasize ? "font-medium text-slate-100" : "text-slate-300",
                )}
              >
                {r.value}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function TradingMoneyTooltip({
  active,
  payload,
  label,
  currency,
  labelPrefix,
  title,
  subtitle,
  primaryMetricLabel,
  accentDotClass = "bg-emerald-400",
  accentColorHex,
  primaryOverride,
  extraRows,
}: MoneyTooltipProps) {
  if (!active) return null;
  if (!primaryOverride && !payload?.length) return null;
  const row = payload?.[0];
  const num =
    row != null && typeof row.value === "number"
      ? row.value
      : row != null
        ? Number(row.value)
        : NaN;
  const primaryText =
    primaryOverride ??
    (Number.isFinite(num) ? formatMoney(num, currency) : "—");
  const labelText =
    title ??
    (labelPrefix != null && label !== undefined
      ? `${labelPrefix} ${label}`
      : String(label ?? ""));

  return (
    <TradingDetailTooltip
      title={labelText}
      subtitle={subtitle}
      primaryMetricLabel={primaryMetricLabel}
      primaryText={primaryText}
      accentDotClass={accentDotClass}
      accentColorHex={accentColorHex}
      extraRows={extraRows}
    />
  );
}

/** Gradient fill dưới đường line/area (đỉnh đậm → đáy trong suốt). */
export function TradingAreaGradient({
  id,
  colorHex,
}: {
  id: string;
  colorHex: string;
}) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={colorHex} stopOpacity={0.45} />
        <stop offset="55%" stopColor={colorHex} stopOpacity={0.12} />
        <stop offset="100%" stopColor={colorHex} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}
