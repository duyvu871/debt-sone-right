"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CircleDollarSign,
  CirclePlus,
  Pencil,
  ScrollText,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAppendDebtPrincipal } from "@/features/debt/hooks/useAppendDebtPrincipal";
import { useDeleteDebt } from "@/features/debt/hooks/useDeleteDebt";
import { useUpdateDebt } from "@/features/debt/hooks/useUpdateDebt";
import { useCreateRepayment } from "@/features/repayment/hooks/useCreateRepayment";
import { useDeleteRepayment } from "@/features/repayment/hooks/useDeleteRepayment";
import { useUpdateRepayment } from "@/features/repayment/hooks/useUpdateRepayment";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/shared/components/Breadcrumb";
import { DebtRepaymentChart } from "@/shared/components/charts/DebtRepaymentChart";
import { DetailHeader } from "@/shared/components/DetailHeader";
import { EmptyState } from "@/shared/components/EmptyState";
import { FormAlert } from "@/shared/components/FormAlert";
import { InfoGrid } from "@/shared/components/InfoGrid";
import { ListPageToolbar } from "@/shared/components/ListPageToolbar";
import { MutationSubmitButton } from "@/shared/components/MutationSubmitButton";
import { PageShell } from "@/shared/components/PageShell";
import type { CreditorWithDebtCount } from "@/shared/dal/creditorDal";
import type { DebtDTO } from "@/shared/dal/debtDal";
import type { RepaymentListItemDTO } from "@/shared/dal/repaymentDal";
import { crumbLabel } from "@/shared/lib/breadcrumbLabels";
import { debtStatusLabel, formatMoney, mapErr } from "@/shared/lib/format";
import { formFull, formGrid, selectClass } from "@/shared/lib/formClasses";
import { matchesSearch } from "@/shared/lib/listFilter";
import { Badge } from "@/shared/ui/badge";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import FadeContent from "@/shared/ui/fade-content";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { MoneyInput } from "@/shared/ui/money-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

type DebtDetailPayload = {
  debt: DebtDTO;
  outstanding: number;
  repaid: number;
  repayments: RepaymentListItemDTO[];
};

export function DebtDetailPage({ debtId }: { debtId: string }) {
  const router = useRouter();
  const updateDebt = useUpdateDebt();
  const deleteDebt = useDeleteDebt();
  const appendDebtPrincipal = useAppendDebtPrincipal();
  const createRepayment = useCreateRepayment();
  const updateRepayment = useUpdateRepayment();
  const deleteRepayment = useDeleteRepayment();
  const [sheet, setSheet] = useState<
    | null
    | "debt-edit"
    | "debt-append"
    | "debt-repay"
    | "repay-edit"
    | "repay-delete"
  >(null);
  const [editRepay, setEditRepay] = useState<RepaymentListItemDTO | null>(null);
  const clearEditsAfterCloseRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const editDebtPending = updateDebt.isPending || deleteDebt.isPending;
  const repayEditPending =
    updateRepayment.isPending || deleteRepayment.isPending;
  const [repaySearch, setRepaySearch] = useState("");

  useEffect(() => {
    return () => {
      if (clearEditsAfterCloseRef.current) {
        clearTimeout(clearEditsAfterCloseRef.current);
        clearEditsAfterCloseRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (sheet !== null && clearEditsAfterCloseRef.current) {
      clearTimeout(clearEditsAfterCloseRef.current);
      clearEditsAfterCloseRef.current = null;
    }
  }, [sheet]);

  const detailQuery = useQuery({
    queryKey: ["debt", debtId],
    queryFn: async () => {
      const res = await fetch(`/api/debts/${debtId}`);
      const json = (await res.json()) as
        | { data: DebtDetailPayload }
        | { error: string };
      if (res.status === 404) throw new Error("not_found");
      if (!res.ok || "error" in json) {
        throw new Error("error" in json ? json.error : "fetch_failed");
      }
      return json.data;
    },
  });

  const creditorsQuery = useQuery({
    queryKey: ["creditors"],
    queryFn: async () => {
      const res = await fetch("/api/creditors");
      const json = (await res.json()) as
        | { data: CreditorWithDebtCount[] }
        | { error: string };
      if (!res.ok || "error" in json)
        throw new Error("error" in json ? json.error : "fetch_failed");
      return json.data;
    },
  });

  function resetDetailMutations() {
    updateDebt.reset();
    deleteDebt.reset();
    appendDebtPrincipal.reset();
    createRepayment.reset();
    updateRepayment.reset();
    deleteRepayment.reset();
  }

  function closeSheet() {
    if (clearEditsAfterCloseRef.current) {
      clearTimeout(clearEditsAfterCloseRef.current);
      clearEditsAfterCloseRef.current = null;
    }
    resetDetailMutations();
    setSheet(null);
    clearEditsAfterCloseRef.current = setTimeout(() => {
      clearEditsAfterCloseRef.current = null;
      setEditRepay(null);
    }, 320);
  }

  const detail = detailQuery.data;
  const debt = detail?.debt;
  const creditors = creditorsQuery.data;
  const maxAnimatedItems = 6;

  const repayments = detail?.repayments ?? [];
  const filteredRepayments = useMemo(() => {
    return repayments.filter((r) => {
      const blob = [
        r.note ?? "",
        formatMoney(Number(r.deltaAmount), r.currency),
        new Date(r.happenedAt).toLocaleString("vi-VN"),
      ].join(" ");
      return matchesSearch(blob, repaySearch);
    });
  }, [repayments, repaySearch]);

  if (detailQuery.isLoading && !detail) {
    return (
      <PageShell className="space-y-4">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Khoản nợ", href: "/debts" },
            { label: "Đang tải…" },
          ]}
        />
        <div className="animate-pulse rounded-2xl border border-white/40 bg-white/35 p-12" />
      </PageShell>
    );
  }

  if (
    detailQuery.error &&
    (detailQuery.error as Error).message === "not_found"
  ) {
    return (
      <PageShell className="space-y-4 py-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Khoản nợ", href: "/debts" },
            { label: "Không tìm thấy" },
          ]}
        />
        <EmptyState
          icon={AlertCircle}
          title="Không có khoản nợ này"
          action={
            <Button asChild size="sm" className="cursor-pointer">
              <Link href="/debts">Danh sách khoản nợ</Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  if (detailQuery.error && !detail) {
    return (
      <PageShell className="space-y-4 py-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Khoản nợ", href: "/debts" },
            { label: "Lỗi tải" },
          ]}
        />
        <EmptyState
          icon={AlertCircle}
          title="Lỗi tải dữ liệu"
          action={
            <Button
              type="button"
              size="sm"
              className="cursor-pointer"
              onClick={() => detailQuery.refetch()}
            >
              Thử lại
            </Button>
          }
        />
      </PageShell>
    );
  }

  if (!debt) return null;

  const canRepay = (detail?.outstanding ?? 0) > 0;

  const statusVariant =
    debt.status === "OVERDUE"
      ? "destructive"
      : debt.status === "COMPLETED"
        ? "outline"
        : "secondary";

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Chủ nợ", href: "/creditors" },
          {
            label: crumbLabel(debt.creditorName),
            href: `/creditors/${debt.creditorId}`,
          },
          {
            label: `${formatMoney(Number(debt.totalAmount), debt.currency)} · ${debtStatusLabel(debt.status)}`,
          },
        ]}
      />

      <DetailHeader
        title={
          <h1 className="text-2xl font-bold tabular-nums tracking-tight md:text-3xl">
            {formatMoney(detail?.outstanding ?? 0, debt.currency)}
          </h1>
        }
        subtitle={debt.creditorName}
        badge={
          <Badge variant={statusVariant}>{debtStatusLabel(debt.status)}</Badge>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="cursor-pointer"
              aria-label="Sửa hoặc xóa khoản nợ"
              onClick={() => {
                resetDetailMutations();
                setSheet("debt-edit");
              }}
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer gap-1.5"
              aria-label="Bổ sung nợ (tăng gốc)"
              onClick={() => {
                resetDetailMutations();
                setSheet("debt-append");
              }}
            >
              <CirclePlus className="size-3.5" aria-hidden />
              Bổ sung nợ
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="cursor-pointer gap-1.5 transition-colors duration-200"
              disabled={!canRepay}
              title={!canRepay ? "Không còn dư nợ" : undefined}
              onClick={() => {
                resetDetailMutations();
                setSheet("debt-repay");
              }}
            >
              <CircleDollarSign className="size-3.5" aria-hidden />
              Trả nợ
            </Button>
          </>
        }
      />

      <InfoGrid
        items={[
          {
            label: "Gốc",
            value: formatMoney(Number(debt.totalAmount), debt.currency),
          },
          {
            label: "Đã trả",
            value: formatMoney(detail?.repaid ?? 0, debt.currency),
          },
          {
            label: "Ngày phát sinh",
            value: new Date(debt.occurredAt).toLocaleString("vi-VN"),
          },
          {
            label: "Hạn",
            value: new Date(debt.dueAt).toLocaleString("vi-VN"),
          },
          {
            label: "Chủ nợ",
            value: (
              <Link
                href={`/creditors/${debt.creditorId}`}
                className="cursor-pointer text-primary underline-offset-4 transition-colors duration-200 hover:underline"
              >
                {debt.creditorName}
              </Link>
            ),
          },
          ...(debt.note
            ? [{ label: "Nội dung", value: debt.note }]
            : []),
        ]}
      />

      {repayments.length > 0 ? (
        <DebtRepaymentChart
          currency={debt.currency}
          totalPrincipal={Number(debt.totalAmount)}
          repayments={repayments}
          debtOccurredAt={new Date(debt.occurredAt)}
        />
      ) : null}

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">
          Lịch sử trả nợ
        </h2>
        {!repayments.length ? (
          <EmptyState
            icon={ScrollText}
            title="Chưa có lịch sử trả"
            description="Ghi nhận trả nợ từ nút «Trả nợ»."
          />
        ) : (
          <>
            <ListPageToolbar
              searchId="debt-detail-repay-search"
              searchValue={repaySearch}
              onSearchChange={setRepaySearch}
              searchPlaceholder="Ngày, số tiền, ghi chú…"
              end={
                <span className="text-xs tabular-nums text-muted-foreground">
                  {filteredRepayments.length}/{repayments.length}
                </span>
              }
            />
            <p className="text-xs text-muted-foreground">
              Sửa / xóa cần xác thực (một lần mỗi giờ).
            </p>
            {filteredRepayments.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Không có bản ghi khớp tìm kiếm.
              </p>
            ) : (
              <>
                <ul className="space-y-2 md:hidden">
                  {filteredRepayments.map((r, i) => {
                    const row = (
                      <div className="rounded-xl border border-white/55 bg-white/40 p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
                        <Link
                          href={`/repayments/${r.id}`}
                          className="block cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium">
                              {formatMoney(Number(r.deltaAmount), r.currency)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(r.happenedAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          {r.note ? (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {r.note}
                            </p>
                          ) : null}
                        </Link>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full cursor-pointer gap-1"
                            onClick={() => {
                              resetDetailMutations();
                              setEditRepay(r);
                              setSheet("repay-edit");
                            }}
                          >
                            <Pencil className="size-3.5" aria-hidden />
                            Sửa
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full cursor-pointer gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              resetDetailMutations();
                              setEditRepay(r);
                              setSheet("repay-delete");
                            }}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            Xóa
                          </Button>
                        </div>
                      </div>
                    );
                    if (i >= maxAnimatedItems) return <li key={r.id}>{row}</li>;
                    return (
                      <li key={r.id}>
                        <FadeContent
                          trigger="mount"
                          duration={420}
                          ease="power2.out"
                          delay={i * 0.05}
                        >
                          {row}
                        </FadeContent>
                      </li>
                    );
                  })}
                </ul>
                <div
                  className={cn(
                    "hidden md:block max-h-[min(70vh,36rem)] overflow-auto rounded-xl border border-white/50 dark:border-white/10",
                  )}
                >
                  <Table flush className="w-full min-w-[32rem]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Ghi chú</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRepayments.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <Link
                              href={`/repayments/${r.id}`}
                              className="cursor-pointer text-primary hover:underline"
                            >
                              {new Date(r.happenedAt).toLocaleString("vi-VN")}
                            </Link>
                          </TableCell>
                          <TableCell className="tabular-nums font-medium">
                            {formatMoney(Number(r.deltaAmount), r.currency)}
                          </TableCell>
                          <TableCell
                            className="max-w-48 truncate text-muted-foreground"
                            title={r.note}
                          >
                            {r.note}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="cursor-pointer gap-1"
                                onClick={() => {
                                  resetDetailMutations();
                                  setEditRepay(r);
                                  setSheet("repay-edit");
                                }}
                              >
                                <Pencil className="size-3.5" aria-hidden />
                                Sửa
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="cursor-pointer gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  resetDetailMutations();
                                  setEditRepay(r);
                                  setSheet("repay-delete");
                                }}
                              >
                                <Trash2 className="size-3.5" aria-hidden />
                                Xóa
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </>
        )}
      </section>

      <BottomSheet
        open={sheet === "debt-edit" && !!debt && !!creditors}
        title="Sửa / xóa khoản nợ"
        onClose={closeSheet}
      >
        {debt && creditors ? (
          <>
            <form
              className={cn(formGrid, "mb-4")}
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("id", debt.id);
                updateDebt.mutate(fd, {
                  onSuccess: () => closeSheet(),
                });
              }}
            >
              <input type="hidden" name="id" value={debt.id} />
              <div className={cn("grid gap-1.5", formFull)}>
                <Label htmlFor="dde-cred">Chủ nợ</Label>
                <select
                  id="dde-cred"
                  name="creditorId"
                  required
                  className={selectClass}
                  defaultValue={debt.creditorId}
                  disabled={editDebtPending}
                >
                  {creditors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="dde-amt">Số tiền gốc</Label>
                <MoneyInput
                  id="dde-amt"
                  name="totalAmount"
                  required
                  defaultValue={debt.totalAmount}
                  disabled={editDebtPending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="dde-cur">Tiền tệ</Label>
                <select
                  id="dde-cur"
                  name="currency"
                  className={selectClass}
                  defaultValue={debt.currency}
                  disabled={editDebtPending}
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="dde-oc">Ngày phát sinh</Label>
                <Input
                  id="dde-oc"
                  name="occurredAt"
                  type="datetime-local"
                  required
                  defaultValue={new Date(debt.occurredAt)
                    .toISOString()
                    .slice(0, 16)}
                  disabled={editDebtPending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="dde-due">Hạn</Label>
                <Input
                  id="dde-due"
                  name="dueAt"
                  type="datetime-local"
                  required
                  defaultValue={new Date(debt.dueAt).toISOString().slice(0, 16)}
                  disabled={editDebtPending}
                />
              </div>
              <div className={cn("grid gap-1.5", formFull)}>
                <Label htmlFor="dde-st">Trạng thái</Label>
                <select
                  id="dde-st"
                  name="status"
                  className={selectClass}
                  defaultValue={debt.status}
                  disabled={editDebtPending}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="OVERDUE">OVERDUE</option>
                </select>
              </div>
              <div className={cn("grid gap-1.5", formFull)}>
                <Label htmlFor="dde-note">Nội dung</Label>
                <Input
                  id="dde-note"
                  name="note"
                  placeholder="Nợ để làm gì, mua gì…"
                  defaultValue={debt.note ?? ""}
                  disabled={editDebtPending}
                />
              </div>
              {updateDebt.error ? (
                <FormAlert className={formFull}>
                  {mapErr(updateDebt.error)}
                </FormAlert>
              ) : null}
              <MutationSubmitButton
                pending={updateDebt.isPending}
                pendingLabel="Đang cập nhật…"
                className={cn(formFull, "cursor-pointer")}
              >
                Cập nhật khoản nợ
              </MutationSubmitButton>
            </form>
            <form
              className={cn(formGrid, "mt-4 border-t pt-4")}
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("id", debt.id);
                deleteDebt.mutate(fd, {
                  onSuccess: () => {
                    closeSheet();
                    router.push("/debts");
                  },
                });
              }}
            >
              <input type="hidden" name="id" value={debt.id} />
              {deleteDebt.error ? (
                <FormAlert className={formFull}>
                  {mapErr(deleteDebt.error)}
                </FormAlert>
              ) : null}
              <MutationSubmitButton
                pending={deleteDebt.isPending}
                pendingLabel="Đang xóa…"
                variant="destructive"
                className={cn(formFull, "cursor-pointer")}
              >
                Xóa khoản nợ
              </MutationSubmitButton>
            </form>
          </>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={sheet === "debt-append" && !!debt}
        title="Bổ sung nợ (tăng gốc)"
        onClose={closeSheet}
      >
        {debt ? (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              Cộng thêm số tiền vào <strong>gốc</strong> khoản này. Dư nợ sẽ
              tăng tương ứng (trừ các lần trả đã ghi). Không tạo bản ghi trả nợ.
            </p>
            <div className="mb-4 rounded-xl border border-white/60 bg-white/45 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <div className="font-medium">{debt.creditorName}</div>
              <div className="mt-1 tabular-nums text-muted-foreground">
                Gốc hiện tại:{" "}
                <span className="font-semibold text-foreground">
                  {formatMoney(Number(debt.totalAmount), debt.currency)}
                </span>
              </div>
              <div className="mt-0.5 tabular-nums text-muted-foreground">
                Đã trả:{" "}
                <span className="font-medium text-foreground">
                  {formatMoney(detail?.repaid ?? 0, debt.currency)}
                </span>{" "}
                · Dư:{" "}
                <span className="font-semibold text-foreground">
                  {formatMoney(detail?.outstanding ?? 0, debt.currency)}
                </span>
              </div>
            </div>
            <form
              className={formGrid}
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("debtId", debt.id);
                appendDebtPrincipal.mutate(fd, {
                  onSuccess: async () => {
                    await detailQuery.refetch();
                    closeSheet();
                  },
                });
              }}
            >
              <input type="hidden" name="debtId" value={debt.id} />
              <div className={cn("grid gap-1.5", formFull)}>
                <Label htmlFor="dda-amt">
                  Số tiền bổ sung ({debt.currency})
                </Label>
                <MoneyInput
                  id="dda-amt"
                  name="additionalAmount"
                  required
                  placeholder="Ví dụ: 5000000"
                  disabled={appendDebtPrincipal.isPending}
                />
              </div>
              {appendDebtPrincipal.error ? (
                <FormAlert className={formFull}>
                  {mapErr(appendDebtPrincipal.error)}
                </FormAlert>
              ) : null}
              <MutationSubmitButton
                pending={appendDebtPrincipal.isPending}
                pendingLabel="Đang cập nhật…"
                className={cn(formFull, "cursor-pointer")}
              >
                Cập nhật gốc
              </MutationSubmitButton>
            </form>
          </>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={sheet === "debt-repay" && !!debt}
        title="Ghi trả nợ"
        onClose={closeSheet}
      >
        {debt ? (
          <>
            <div className="mb-3 rounded-xl border border-white/60 bg-white/45 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <div className="font-medium">{debt.creditorName}</div>
              <div className="mt-0.5 tabular-nums text-muted-foreground">
                Dư nợ ước tính:{" "}
                <span className="font-semibold text-foreground">
                  {formatMoney(detail?.outstanding ?? 0, debt.currency)}
                </span>
              </div>
            </div>
            <form
              className={formGrid}
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("debtId", debt.id);
                createRepayment.mutate(fd, {
                  onSuccess: () => closeSheet(),
                });
              }}
            >
              <input type="hidden" name="debtId" value={debt.id} />
              <div className="grid gap-1.5">
                <Label htmlFor="ddr-when">Thời điểm</Label>
                <Input
                  id="ddr-when"
                  name="happenedAt"
                  type="datetime-local"
                  defaultValue={new Date().toISOString().slice(0, 16)}
                  required
                  disabled={createRepayment.isPending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ddr-amt">Số tiền trả</Label>
                <MoneyInput
                  id="ddr-amt"
                  name="deltaAmount"
                  required
                  disabled={createRepayment.isPending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ddr-note">Ghi chú</Label>
                <Input
                  id="ddr-note"
                  name="note"
                  required
                  disabled={createRepayment.isPending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ddr-proof">Link chứng từ (tuỳ chọn)</Label>
                <Input
                  id="ddr-proof"
                  name="proofUrl"
                  disabled={createRepayment.isPending}
                />
              </div>
              {createRepayment.error ? (
                <FormAlert className={formFull}>
                  {mapErr(createRepayment.error)}
                </FormAlert>
              ) : null}
              <MutationSubmitButton
                pending={createRepayment.isPending}
                pendingLabel="Đang ghi nhận…"
                className={cn(formFull, "cursor-pointer")}
              >
                Ghi nhận trả nợ
              </MutationSubmitButton>
            </form>
          </>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={sheet === "repay-edit" && !!editRepay}
        title="Sửa bản ghi trả nợ"
        onClose={closeSheet}
      >
        {editRepay ? (
          <form
            className={formGrid}
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("id", editRepay.id);
              updateRepayment.mutate(fd, {
                onSuccess: () => closeSheet(),
              });
            }}
          >
            <input type="hidden" name="id" value={editRepay.id} />
            <div className="grid gap-1.5">
              <Label htmlFor="dre-when">Thời điểm</Label>
              <Input
                id="dre-when"
                name="happenedAt"
                type="datetime-local"
                required
                defaultValue={new Date(editRepay.happenedAt)
                  .toISOString()
                  .slice(0, 16)}
                disabled={repayEditPending}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dre-amt">Số tiền</Label>
              <MoneyInput
                id="dre-amt"
                name="deltaAmount"
                required
                defaultValue={editRepay.deltaAmount}
                disabled={repayEditPending}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dre-note">Ghi chú</Label>
              <Input
                id="dre-note"
                name="note"
                required
                defaultValue={editRepay.note}
                disabled={repayEditPending}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dre-proof">Link chứng từ</Label>
              <Input
                id="dre-proof"
                name="proofUrl"
                defaultValue={editRepay.proofUrl}
                disabled={repayEditPending}
              />
            </div>
            {updateRepayment.error ? (
              <FormAlert className={formFull}>
                {mapErr(updateRepayment.error)}
              </FormAlert>
            ) : null}
            <MutationSubmitButton
              pending={updateRepayment.isPending}
              pendingLabel="Đang cập nhật…"
              className={cn(formFull, "cursor-pointer")}
            >
              Cập nhật
            </MutationSubmitButton>
          </form>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={sheet === "repay-delete" && !!editRepay}
        title="Xóa bản ghi trả nợ"
        onClose={closeSheet}
      >
        {editRepay ? (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              Hành động này không hoàn tác. Xác nhận để xóa.
            </p>
            <div className="mb-4 rounded-xl border border-white/60 bg-white/45 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <div className="font-medium">{editRepay.creditorName}</div>
              <div className="mt-0.5 tabular-nums text-muted-foreground">
                {formatMoney(Number(editRepay.deltaAmount), editRepay.currency)}{" "}
                · {new Date(editRepay.happenedAt).toLocaleString("vi-VN")}
              </div>
              {editRepay.note ? (
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {editRepay.note}
                </div>
              ) : null}
            </div>
            <form
              className={formGrid}
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("id", editRepay.id);
                deleteRepayment.mutate(fd, {
                  onSuccess: () => closeSheet(),
                });
              }}
            >
              <input type="hidden" name="id" value={editRepay.id} />
              {deleteRepayment.error ? (
                <FormAlert className={formFull}>
                  {mapErr(deleteRepayment.error)}
                </FormAlert>
              ) : null}
              <MutationSubmitButton
                pending={deleteRepayment.isPending}
                pendingLabel="Đang xóa…"
                variant="destructive"
                className={cn(formFull, "cursor-pointer")}
              >
                Xóa vĩnh viễn
              </MutationSubmitButton>
            </form>
          </>
        ) : null}
      </BottomSheet>
    </PageShell>
  );
}
