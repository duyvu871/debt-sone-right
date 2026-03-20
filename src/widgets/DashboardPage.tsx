"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Banknote,
  RefreshCw,
  ScrollText,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/shared/components/Breadcrumb";
import { LedgerOverviewChart } from "@/shared/components/charts/LedgerOverviewChart";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageShell } from "@/shared/components/PageShell";
import { PageSkeleton } from "@/shared/components/PageSkeleton";
import type { CreditorDTO } from "@/shared/dal/creditorDal";
import type { DebtDTO } from "@/shared/dal/debtDal";
import type { RepaymentListItemDTO } from "@/shared/dal/repaymentDal";
import { formatMoney } from "@/shared/lib/format";
import type { LedgerStats } from "@/shared/model/ledgerStats";
import { BentoGrid, BentoPanel } from "@/shared/ui/bento-grid";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import FadeContent from "@/shared/ui/fade-content";
import { Progress } from "@/shared/ui/progress";

type LedgerPayload = {
  creditors: CreditorDTO[];
  debts: DebtDTO[];
  repayments: RepaymentListItemDTO[];
  stats: LedgerStats;
};

function repaidVsPrincipalPercent(principal: number, repaid: number): number {
  if (principal <= 0) return 0;
  return Math.min(100, (repaid / principal) * 100);
}

export function DashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["ledger"],
    queryFn: async () => {
      const res = await fetch("/api/ledger");
      const json = (await res.json()) as
        | { data: LedgerPayload }
        | { error: string };
      if (!res.ok || "error" in json) {
        throw new Error("error" in json ? json.error : "fetch_failed");
      }
      return json.data;
    },
  });

  const stats = data?.stats;

  return (
    <PageShell className="max-w-[min(100%,88rem)] 2xl:max-w-[min(100%,96rem)] xl:px-8">
      <Breadcrumb items={[{ label: "Trang chủ" }]} />

      {error && data ? (
        <FadeContent
          trigger="mount"
          duration={420}
          ease="power2.out"
          delay={0.04}
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/65 px-4 py-3 text-sm shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/10"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="text-muted-foreground">
              Không làm mới được dữ liệu — đang hiển thị bản đã tải trước đó.
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 cursor-pointer gap-1.5"
            onClick={() => refetch()}
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Thử lại
          </Button>
        </FadeContent>
      ) : null}

      {isLoading && !data ? (
        <PageSkeleton />
      ) : error && !data ? (
        <EmptyState
          icon={AlertCircle}
          title="Không tải được dữ liệu"
          description={
            (error as Error).message === "fetch_failed"
              ? "Kiểm tra kết nối hoặc máy chủ rồi thử lại."
              : String((error as Error).message)
          }
          action={
            <Button
              type="button"
              size="sm"
              className="cursor-pointer gap-1.5"
              onClick={() => refetch()}
            >
              <RefreshCw className="size-3.5" aria-hidden />
              Tải lại
            </Button>
          }
        />
      ) : null}

      {data ? (
        <BentoGrid>
          {stats ? (
            <BentoPanel className="lg:col-span-12" stagger="none">
              <div className="grid gap-4 lg:grid-cols-12 lg:gap-5 lg:items-stretch">
                <div className="flex min-h-0 flex-col lg:col-span-5">
                  <Card className="h-full gap-0 py-4 shadow-sm transition-shadow duration-300 hover:shadow-xl lg:min-h-[min(22rem,50vh)]">
                    <CardHeader className="px-6 pb-2 pt-0">
                      <CardTitle className="text-base">
                        Tổng quan số liệu
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Gốc, đã trả và dư nợ theo từng loại tiền.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 px-6 sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2">
                      {(["VND", "USD"] as const).map((cur) => {
                        const row = stats.byCurrency[cur] ?? {
                          principal: 0,
                          repaid: 0,
                          outstanding: 0,
                        };
                        const pct = repaidVsPrincipalPercent(
                          row.principal,
                          row.repaid,
                        );
                        const pctRounded = Math.round(pct * 10) / 10;
                        const hasPrincipal = row.principal > 0;
                        return (
                          <div
                            key={cur}
                            className="flex flex-col gap-3 rounded-xl border border-white/60 bg-white/45 p-4 shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-white/5 xl:col-span-2"
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {cur}
                              </span>
                              {hasPrincipal ? (
                                <span className="text-xs font-semibold tabular-nums text-primary">
                                  Đã trả {pctRounded}%
                                </span>
                              ) : (
                                <span className="text-xs tabular-nums text-muted-foreground">
                                  —
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Dư nợ
                              </div>
                              <div className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-[1.65rem]">
                                {formatMoney(row.outstanding, cur)}
                              </div>
                            </div>
                            {hasPrincipal ? (
                              <div className="space-y-1.5">
                                <Progress
                                  aria-label={`${cur}: đã trả ${pctRounded}% so với gốc`}
                                  value={pct}
                                  className="h-2.5 bg-primary/10"
                                />
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums text-muted-foreground">
                                  <span className="font-medium text-foreground/80">
                                    Gốc{" "}
                                    <span className="text-foreground">
                                      {formatMoney(row.principal, cur)}
                                    </span>
                                  </span>
                                  <span className="font-medium text-foreground/80">
                                    Đã trả{" "}
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      {formatMoney(row.repaid, cur)}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs tabular-nums text-muted-foreground">
                                Chưa có gốc theo {cur}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="flex flex-col justify-center gap-3 rounded-xl border border-dashed border-white/50 bg-white/30 px-3 py-3 dark:border-white/10 dark:bg-white/5 sm:col-span-2 lg:col-span-1 xl:col-span-2">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-secondary/60 px-1 py-2">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Mở
                            </div>
                            <div className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
                              {stats.openCount}
                            </div>
                          </div>
                          <div className="rounded-lg bg-destructive/10 px-1 py-2">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-destructive">
                              Quá hạn
                            </div>
                            <div className="mt-0.5 text-xl font-bold tabular-nums text-destructive">
                              {stats.overdueCount}
                            </div>
                          </div>
                          <div className="rounded-lg bg-muted/50 px-1 py-2">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Xong
                            </div>
                            <div className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
                              {stats.completedCount}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5 text-center text-sm tabular-nums">
                          <span className="font-semibold text-foreground">
                            {stats.debtCount}
                          </span>
                          <span className="text-muted-foreground">
                            khoản nợ
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-semibold text-foreground">
                            {stats.repaymentCount}
                          </span>
                          <span className="text-muted-foreground">lần trả</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex min-h-[18rem] flex-col lg:col-span-7 lg:min-h-[min(24rem,55vh)]">
                  <LedgerOverviewChart
                    stats={stats}
                    repayments={data.repayments}
                  />
                </div>
              </div>
            </BentoPanel>
          ) : null}

          <BentoPanel className="lg:col-span-4" stagger="short">
            <Link href="/creditors" className="block cursor-pointer">
              <Card className="gap-3 py-4 transition-shadow duration-300 hover:shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Users
                      className="size-10 text-muted-foreground"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <div>
                      <CardTitle className="text-base">Chủ nợ</CardTitle>
                      <CardDescription className="text-xs">
                        Danh sách và chi tiết
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-end justify-between gap-3">
                  <div className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                    {data.creditors.length}
                    <span className="ml-1 text-base font-semibold text-muted-foreground">
                      người
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-primary">
                    Mở danh sách →
                  </span>
                </CardContent>
              </Card>
            </Link>
          </BentoPanel>

          <BentoPanel className="lg:col-span-4" stagger="medium">
            <Link href="/debts" className="block cursor-pointer">
              <Card className="gap-3 py-4 transition-shadow duration-300 hover:shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Banknote
                      className="size-10 text-muted-foreground"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <div>
                      <CardTitle className="text-base">Khoản nợ</CardTitle>
                      <CardDescription className="text-xs">
                        Trả nợ và lịch sử
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-end justify-between gap-3">
                  <div className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                    {data.debts.length}
                    <span className="ml-1 text-base font-semibold text-muted-foreground">
                      khoản
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-primary">
                    Mở danh sách →
                  </span>
                </CardContent>
              </Card>
            </Link>
          </BentoPanel>

          <BentoPanel className="lg:col-span-4" stagger="long">
            <Link href="/repayments" className="block cursor-pointer">
              <Card className="gap-3 py-4 transition-shadow duration-300 hover:shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <ScrollText
                      className="size-10 text-muted-foreground"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <div>
                      <CardTitle className="text-base">Lịch sử trả</CardTitle>
                      <CardDescription className="text-xs">
                        Các lần ghi có trả
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-end justify-between gap-3">
                  <div className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                    {data.repayments.length}
                    <span className="ml-1 text-base font-semibold text-muted-foreground">
                      bản ghi
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-primary">
                    Mở danh sách →
                  </span>
                </CardContent>
              </Card>
            </Link>
          </BentoPanel>
        </BentoGrid>
      ) : null}
    </PageShell>
  );
}
