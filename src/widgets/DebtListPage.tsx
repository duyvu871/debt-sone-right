"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Banknote,
  CircleDollarSign,
  CirclePlus,
  Pencil,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { CreditorAvatar } from "@/entities/creditor/CreditorAvatar";
import { useAppendDebtPrincipal } from "@/features/debt/hooks/useAppendDebtPrincipal";
import { useCreateDebt } from "@/features/debt/hooks/useCreateDebt";
import { useDeleteDebt } from "@/features/debt/hooks/useDeleteDebt";
import { useUpdateDebt } from "@/features/debt/hooks/useUpdateDebt";
import { useCreateRepayment } from "@/features/repayment/hooks/useCreateRepayment";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/shared/components/Breadcrumb";
import { EmptyState } from "@/shared/components/EmptyState";
import { FormAlert } from "@/shared/components/FormAlert";
import { ListPageToolbar } from "@/shared/components/ListPageToolbar";
import { MutationSubmitButton } from "@/shared/components/MutationSubmitButton";
import { PageShell } from "@/shared/components/PageShell";
import type { CreditorWithDebtCount } from "@/shared/dal/creditorDal";
import type { DebtDTO } from "@/shared/dal/debtDal";
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

type DebtRow = DebtDTO & { outstanding: number; repaid: number };

export function DebtListPage() {
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();
  const deleteDebt = useDeleteDebt();
  const appendDebtPrincipal = useAppendDebtPrincipal();
  const createRepayment = useCreateRepayment();
  const [sheet, setSheet] = useState<
    null | "debt-create" | "debt-edit" | "debt-append" | "debt-repay"
  >(null);
  const [editDebt, setEditDebt] = useState<DebtRow | null>(null);
  const clearEditsAfterCloseRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const editDebtPending = updateDebt.isPending || deleteDebt.isPending;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | DebtDTO["status"]>(
    "ALL",
  );
  const [currencyFilter, setCurrencyFilter] = useState<"ALL" | "VND" | "USD">(
    "ALL",
  );

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

  const debtsQuery = useQuery({
    queryKey: ["debts"],
    queryFn: async () => {
      const res = await fetch("/api/debts");
      const json = (await res.json()) as
        | { data: DebtRow[] }
        | { error: string };
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
      if (!res.ok || "error" in json) {
        throw new Error("error" in json ? json.error : "fetch_failed");
      }
      return json.data;
    },
  });

  const data = debtsQuery.data;
  const creditors = creditorsQuery.data;
  const error = debtsQuery.error ?? creditorsQuery.error;

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((d) => {
      if (!matchesSearch(d.creditorName, search)) return false;
      if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
      if (currencyFilter !== "ALL" && d.currency !== currencyFilter)
        return false;
      return true;
    });
  }, [data, search, statusFilter, currencyFilter]);

  function resetDebtMutations() {
    createDebt.reset();
    updateDebt.reset();
    deleteDebt.reset();
    appendDebtPrincipal.reset();
    createRepayment.reset();
  }

  function closeSheet() {
    if (clearEditsAfterCloseRef.current) {
      clearTimeout(clearEditsAfterCloseRef.current);
      clearEditsAfterCloseRef.current = null;
    }
    resetDebtMutations();
    setSheet(null);
    clearEditsAfterCloseRef.current = setTimeout(() => {
      clearEditsAfterCloseRef.current = null;
      setEditDebt(null);
    }, 320);
  }

  const maxAnimatedItems = 6;

  return (
    <PageShell>
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Khoản nợ" }]}
      />

      {error && data ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/65 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">Không làm mới được.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => {
              void debtsQuery.refetch();
              void creditorsQuery.refetch();
            }}
          >
            Thử lại
          </Button>
        </div>
      ) : null}

      {debtsQuery.isLoading && !data ? (
        <div className="animate-pulse rounded-2xl border border-white/40 bg-white/35 p-12" />
      ) : debtsQuery.error && !data ? (
        <EmptyState
          icon={AlertCircle}
          title="Không tải được dữ liệu"
          action={
            <Button
              type="button"
              size="sm"
              className="cursor-pointer"
              onClick={() => debtsQuery.refetch()}
            >
              Tải lại
            </Button>
          }
        />
      ) : null}

      {data && creditors ? (
        !creditors.length ? (
          <EmptyState
            icon={Users}
            title="Chưa thể tạo khoản nợ"
            description="Thêm ít nhất một chủ nợ trước khi ghi nợ."
            action={
              <Button asChild size="sm" className="cursor-pointer">
                <Link href="/creditors">Thêm chủ nợ</Link>
              </Button>
            }
          />
        ) : (
          <section className="space-y-4">
            <ListPageToolbar
              searchId="debt-search"
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Tên chủ nợ…"
              filters={
                <>
                  <div className="grid gap-1">
                    <Label
                      htmlFor="debt-status-filter"
                      className="text-xs text-muted-foreground"
                    >
                      Trạng thái
                    </Label>
                    <select
                      id="debt-status-filter"
                      className={cn(selectClass, "h-9 min-w-[9rem] py-1")}
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(
                          e.target.value as "ALL" | DebtDTO["status"],
                        )
                      }
                    >
                      <option value="ALL">Tất cả</option>
                      <option value="OPEN">Đang mở</option>
                      <option value="OVERDUE">Quá hạn</option>
                      <option value="COMPLETED">Hoàn thành</option>
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <Label
                      htmlFor="debt-currency-filter"
                      className="text-xs text-muted-foreground"
                    >
                      Tiền tệ
                    </Label>
                    <select
                      id="debt-currency-filter"
                      className={cn(selectClass, "h-9 min-w-[7rem] py-1")}
                      value={currencyFilter}
                      onChange={(e) =>
                        setCurrencyFilter(
                          e.target.value as "ALL" | "VND" | "USD",
                        )
                      }
                    >
                      <option value="ALL">Tất cả</option>
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </>
              }
              end={
                <>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {filtered.length}/{data.length}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    className="cursor-pointer shadow-sm"
                    onClick={() => {
                      resetDebtMutations();
                      setSheet("debt-create");
                    }}
                    title={
                      !creditors?.length
                        ? "Thêm ít nhất một chủ nợ trước"
                        : undefined
                    }
                  >
                    Thêm khoản
                  </Button>
                </>
              }
            />
            <p className="text-xs text-muted-foreground">
              CRUD và ghi trả cần xác thực (một lần mỗi giờ).
            </p>
            {data.length === 0 ? (
              <EmptyState
                icon={Banknote}
                title="Chưa có khoản nợ"
                description="Tạo khoản nợ và theo dõi tại đây."
                action={
                  <Button
                    type="button"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => {
                      resetDebtMutations();
                      setSheet("debt-create");
                    }}
                  >
                    Thêm khoản nợ
                  </Button>
                }
              />
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Không có khoản nợ khớp tìm kiếm hoặc bộ lọc.
              </p>
            ) : (
              <>
                <ul className="space-y-2 md:hidden">
                  {filtered.map((d, i) => {
                    const canRepay = d.outstanding > 0;
                    const row = (
                      <div className="rounded-xl border border-white/55 bg-white/40 p-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                        <Link
                          href={`/debts/${d.id}`}
                          className="block cursor-pointer rounded-lg transition-colors duration-200 hover:bg-white/40 dark:hover:bg-white/10"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <CreditorAvatar name={d.creditorName} />
                              <div className="min-w-0">
                                <div className="truncate font-medium">
                                  {d.creditorName}
                                </div>
                                <Badge
                                  className="mt-1"
                                  variant={
                                    d.status === "OVERDUE"
                                      ? "destructive"
                                      : d.status === "COMPLETED"
                                        ? "outline"
                                        : "secondary"
                                  }
                                >
                                  {debtStatusLabel(d.status)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              <dt className="font-medium text-foreground/80">
                                Gốc
                              </dt>
                              <dd className="tabular-nums">
                                {formatMoney(Number(d.totalAmount), d.currency)}
                              </dd>
                            </div>
                            <div>
                              <dt className="font-medium text-foreground/80">
                                Dư nợ
                              </dt>
                              <dd className="tabular-nums font-semibold text-foreground">
                                {formatMoney(d.outstanding, d.currency)}
                              </dd>
                            </div>
                          </dl>
                        </Link>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full cursor-pointer gap-1"
                            onClick={() => {
                              resetDebtMutations();
                              setEditDebt(d);
                              setSheet("debt-edit");
                            }}
                          >
                            <Pencil className="size-3.5 shrink-0" aria-hidden />
                            Sửa
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="w-full cursor-pointer gap-1"
                            disabled={!canRepay}
                            title={
                              !canRepay
                                ? "Không còn dư nợ để ghi trả"
                                : undefined
                            }
                            onClick={() => {
                              resetDebtMutations();
                              setEditDebt(d);
                              setSheet("debt-repay");
                            }}
                          >
                            <CircleDollarSign
                              className="size-3.5 shrink-0"
                              aria-hidden
                            />
                            Trả nợ
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="col-span-2 w-full cursor-pointer gap-1"
                            onClick={() => {
                              resetDebtMutations();
                              setEditDebt(d);
                              setSheet("debt-append");
                            }}
                          >
                            <CirclePlus
                              className="size-3.5 shrink-0"
                              aria-hidden
                            />
                            Bổ sung nợ
                          </Button>
                        </div>
                      </div>
                    );
                    if (i >= maxAnimatedItems) return <li key={d.id}>{row}</li>;
                    return (
                      <li key={d.id}>
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
                  <Table flush className="w-full min-w-[36rem]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chủ nợ</TableHead>
                        <TableHead>Gốc</TableHead>
                        <TableHead>Dư</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((d) => {
                        const canRepay = d.outstanding > 0;
                        return (
                          <TableRow key={d.id}>
                            <TableCell>
                              <Link
                                href={`/debts/${d.id}`}
                                className="flex cursor-pointer items-center gap-2 rounded-md transition-colors duration-200 hover:bg-white/50 dark:hover:bg-white/10"
                              >
                                <CreditorAvatar name={d.creditorName} />
                                <span className="max-w-[10rem] truncate lg:max-w-none">
                                  {d.creditorName}
                                </span>
                              </Link>
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {formatMoney(Number(d.totalAmount), d.currency)}
                            </TableCell>
                            <TableCell className="tabular-nums font-medium">
                              {formatMoney(d.outstanding, d.currency)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  d.status === "OVERDUE"
                                    ? "destructive"
                                    : d.status === "COMPLETED"
                                      ? "outline"
                                      : "secondary"
                                }
                              >
                                {debtStatusLabel(d.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="cursor-pointer gap-1"
                                  onClick={() => {
                                    resetDebtMutations();
                                    setEditDebt(d);
                                    setSheet("debt-edit");
                                  }}
                                >
                                  <Pencil className="size-3.5" aria-hidden />
                                  Sửa
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="cursor-pointer gap-1"
                                  onClick={() => {
                                    resetDebtMutations();
                                    setEditDebt(d);
                                    setSheet("debt-append");
                                  }}
                                >
                                  <CirclePlus
                                    className="size-3.5"
                                    aria-hidden
                                  />
                                  Bổ sung
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="cursor-pointer gap-1"
                                  disabled={!canRepay}
                                  title={
                                    !canRepay
                                      ? "Không còn dư nợ để ghi trả"
                                      : undefined
                                  }
                                  onClick={() => {
                                    resetDebtMutations();
                                    setEditDebt(d);
                                    setSheet("debt-repay");
                                  }}
                                >
                                  <CircleDollarSign
                                    className="size-3.5"
                                    aria-hidden
                                  />
                                  Trả nợ
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </section>
        )
      ) : null}

      <BottomSheet
        open={sheet === "debt-create"}
        title="Thêm khoản nợ"
        onClose={closeSheet}
      >
        <form
          className={formGrid}
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            createDebt.mutate(new FormData(e.currentTarget), {
              onSuccess: () => closeSheet(),
            });
          }}
        >
          <div className={cn("grid gap-1.5", formFull)}>
            <Label htmlFor="d-cred">Chủ nợ</Label>
            <select
              id="d-cred"
              name="creditorId"
              required
              className={selectClass}
              defaultValue=""
              disabled={createDebt.isPending}
            >
              <option value="" disabled>
                Chọn…
              </option>
              {creditors?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="d-amt">Số tiền gốc</Label>
            <MoneyInput
              id="d-amt"
              name="totalAmount"
              required
              disabled={createDebt.isPending}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="d-cur">Tiền tệ</Label>
            <select
              id="d-cur"
              name="currency"
              className={selectClass}
              disabled={createDebt.isPending}
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="d-oc">Ngày phát sinh</Label>
            <Input
              id="d-oc"
              name="occurredAt"
              type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)}
              required
              disabled={createDebt.isPending}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="d-due">Hạn</Label>
            <Input
              id="d-due"
              name="dueAt"
              type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)}
              required
              disabled={createDebt.isPending}
            />
          </div>
          <div className={cn("grid gap-1.5", formFull)}>
            <Label htmlFor="d-st">Trạng thái</Label>
            <select
              id="d-st"
              name="status"
              className={selectClass}
              disabled={createDebt.isPending}
            >
              <option value="OPEN">OPEN</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>
          </div>
          {createDebt.error ? (
            <FormAlert className={formFull}>
              {mapErr(createDebt.error)}
            </FormAlert>
          ) : null}
          <MutationSubmitButton
            pending={createDebt.isPending}
            pendingLabel="Đang lưu…"
            className={cn(formFull, "cursor-pointer")}
          >
            Lưu
          </MutationSubmitButton>
        </form>
      </BottomSheet>

      <BottomSheet
        open={sheet === "debt-edit" && !!editDebt}
        title="Sửa / xóa khoản nợ"
        onClose={closeSheet}
      >
        {editDebt && creditors ? (
          <>
            <form
              className={cn(formGrid, "mb-4")}
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("id", editDebt.id);
                updateDebt.mutate(fd, {
                  onSuccess: () => closeSheet(),
                });
              }}
            >
              <input type="hidden" name="id" value={editDebt.id} />
              <div className={cn("grid gap-1.5", formFull)}>
                <Label htmlFor="de-cred">Chủ nợ</Label>
                <select
                  id="de-cred"
                  name="creditorId"
                  required
                  className={selectClass}
                  defaultValue={editDebt.creditorId}
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
                <Label htmlFor="de-amt">Số tiền gốc</Label>
                <MoneyInput
                  id="de-amt"
                  name="totalAmount"
                  required
                  defaultValue={editDebt.totalAmount}
                  disabled={editDebtPending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="de-cur">Tiền tệ</Label>
                <select
                  id="de-cur"
                  name="currency"
                  className={selectClass}
                  defaultValue={editDebt.currency}
                  disabled={editDebtPending}
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="de-oc">Ngày phát sinh</Label>
                <Input
                  id="de-oc"
                  name="occurredAt"
                  type="datetime-local"
                  required
                  defaultValue={new Date(editDebt.occurredAt)
                    .toISOString()
                    .slice(0, 16)}
                  disabled={editDebtPending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="de-due">Hạn</Label>
                <Input
                  id="de-due"
                  name="dueAt"
                  type="datetime-local"
                  required
                  defaultValue={new Date(editDebt.dueAt)
                    .toISOString()
                    .slice(0, 16)}
                  disabled={editDebtPending}
                />
              </div>
              <div className={cn("grid gap-1.5", formFull)}>
                <Label htmlFor="de-st">Trạng thái</Label>
                <select
                  id="de-st"
                  name="status"
                  className={selectClass}
                  defaultValue={editDebt.status}
                  disabled={editDebtPending}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="OVERDUE">OVERDUE</option>
                </select>
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
                fd.set("id", editDebt.id);
                deleteDebt.mutate(fd, {
                  onSuccess: () => closeSheet(),
                });
              }}
            >
              <input type="hidden" name="id" value={editDebt.id} />
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
        open={sheet === "debt-append" && !!editDebt}
        title="Bổ sung nợ (tăng gốc)"
        onClose={closeSheet}
      >
        {editDebt ? (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              Cộng thêm vào gốc khoản này. Dư nợ sẽ tăng tương ứng. Không tạo
              bản ghi trả nợ.
            </p>
            <div className="mb-4 rounded-xl border border-white/60 bg-white/45 px-3 py-2 text-sm shadow-inner backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <div className="font-medium">{editDebt.creditorName}</div>
              <div className="mt-1 tabular-nums text-muted-foreground">
                Gốc hiện tại:{" "}
                <span className="font-semibold text-foreground">
                  {formatMoney(Number(editDebt.totalAmount), editDebt.currency)}
                </span>
              </div>
              <div className="mt-0.5 tabular-nums text-muted-foreground">
                Đã trả:{" "}
                <span className="font-medium text-foreground">
                  {formatMoney(editDebt.repaid, editDebt.currency)}
                </span>{" "}
                · Dư:{" "}
                <span className="font-semibold text-foreground">
                  {formatMoney(editDebt.outstanding, editDebt.currency)}
                </span>
              </div>
            </div>
            <form
              className={formGrid}
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("debtId", editDebt.id);
                appendDebtPrincipal.mutate(fd, {
                  onSuccess: () => closeSheet(),
                });
              }}
            >
              <input type="hidden" name="debtId" value={editDebt.id} />
              <div className={cn("grid gap-1.5", formFull)}>
                <Label htmlFor="dla-amt">
                  Số tiền bổ sung ({editDebt.currency})
                </Label>
                <MoneyInput
                  id="dla-amt"
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
        open={sheet === "debt-repay" && !!editDebt}
        title="Ghi trả nợ"
        onClose={closeSheet}
      >
        {editDebt ? (
          <>
            <div className="mb-3 rounded-xl border border-white/60 bg-white/45 px-3 py-2 text-sm shadow-inner backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <div className="font-medium">{editDebt.creditorName}</div>
              <div className="mt-0.5 tabular-nums text-muted-foreground">
                Dư nợ ước tính:{" "}
                <span className="font-semibold text-foreground">
                  {formatMoney(editDebt.outstanding, editDebt.currency)}
                </span>
              </div>
            </div>
            <form
              className={formGrid}
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("debtId", editDebt.id);
                createRepayment.mutate(fd, {
                  onSuccess: () => closeSheet(),
                });
              }}
            >
              <input type="hidden" name="debtId" value={editDebt.id} />
              <div className="grid gap-1.5">
                <Label htmlFor="dr-when">Thời điểm</Label>
                <Input
                  id="dr-when"
                  name="happenedAt"
                  type="datetime-local"
                  defaultValue={new Date().toISOString().slice(0, 16)}
                  required
                  disabled={createRepayment.isPending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="dr-amt">Số tiền trả</Label>
                <MoneyInput
                  id="dr-amt"
                  name="deltaAmount"
                  required
                  disabled={createRepayment.isPending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="dr-note">Ghi chú</Label>
                <Input
                  id="dr-note"
                  name="note"
                  required
                  disabled={createRepayment.isPending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="dr-proof">Link chứng từ (tuỳ chọn)</Label>
                <Input
                  id="dr-proof"
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
    </PageShell>
  );
}
