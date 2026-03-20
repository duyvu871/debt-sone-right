"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Pencil,
  RefreshCw,
  ScrollText,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { deleteRepaymentAction } from "@/features/repayment/actions/deleteRepaymentAction";
import { updateRepaymentAction } from "@/features/repayment/actions/updateRepaymentAction";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/shared/components/Breadcrumb";
import { EmptyState } from "@/shared/components/EmptyState";
import { FormAlert } from "@/shared/components/FormAlert";
import { ListPageToolbar } from "@/shared/components/ListPageToolbar";
import { PageShell } from "@/shared/components/PageShell";
import { PasswordField } from "@/shared/components/PasswordField";
import type { RepaymentListItemWithCreditorId } from "@/shared/dal/repaymentDal";
import { formatMoney, mapErr } from "@/shared/lib/format";
import { formFull, formGrid, selectClass } from "@/shared/lib/formClasses";
import { invalidateLedgerQueries } from "@/shared/lib/invalidateLedgerQueries";
import { matchesSearch } from "@/shared/lib/listFilter";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import FadeContent from "@/shared/ui/fade-content";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

export function RepaymentListPage() {
  const qc = useQueryClient();
  const [sheet, setSheet] = useState<null | "repay-edit" | "repay-delete">(
    null,
  );
  const [editRepay, setEditRepay] =
    useState<RepaymentListItemWithCreditorId | null>(null);
  const clearEditsAfterCloseRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["repayments"],
    queryFn: async () => {
      const res = await fetch("/api/repayments");
      const json = (await res.json()) as
        | { data: RepaymentListItemWithCreditorId[] }
        | { error: string };
      if (!res.ok || "error" in json) {
        throw new Error("error" in json ? json.error : "fetch_failed");
      }
      return json.data;
    },
  });

  async function invalidate() {
    await invalidateLedgerQueries(qc);
  }

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((r) => {
      const blob = [r.creditorName, r.note ?? ""].join(" ");
      if (!matchesSearch(blob, search)) return false;
      if (currencyFilter !== "ALL" && r.currency !== currencyFilter)
        return false;
      return true;
    });
  }, [data, search, currencyFilter]);

  function closeSheet() {
    if (clearEditsAfterCloseRef.current) {
      clearTimeout(clearEditsAfterCloseRef.current);
      clearEditsAfterCloseRef.current = null;
    }
    setSheet(null);
    setFormError(null);
    clearEditsAfterCloseRef.current = setTimeout(() => {
      clearEditsAfterCloseRef.current = null;
      setEditRepay(null);
    }, 320);
  }

  const maxAnimatedItems = 6;

  return (
    <PageShell>
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Lịch sử trả nợ" }]}
      />

      {error && data ? (
        <div className="flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">Không làm mới được.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1.5"
            onClick={() => refetch()}
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Thử lại
          </Button>
        </div>
      ) : null}

      {isLoading && !data ? (
        <div className="animate-pulse rounded-2xl border border-white/40 bg-white/35 p-12" />
      ) : error && !data ? (
        <EmptyState
          icon={AlertCircle}
          title="Không tải được dữ liệu"
          action={
            <Button
              type="button"
              size="sm"
              className="cursor-pointer"
              onClick={() => refetch()}
            >
              Tải lại
            </Button>
          }
        />
      ) : null}

      {data ? (
        <section className="space-y-4">
          <ListPageToolbar
            searchId="repayment-search"
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Chủ nợ, ghi chú…"
            filters={
              <div className="grid gap-1">
                <Label
                  htmlFor="repay-currency-filter"
                  className="text-xs text-muted-foreground"
                >
                  Tiền tệ
                </Label>
                <select
                  id="repay-currency-filter"
                  className={cn(selectClass, "h-9 min-w-[7rem] py-1")}
                  value={currencyFilter}
                  onChange={(e) =>
                    setCurrencyFilter(e.target.value as "ALL" | "VND" | "USD")
                  }
                >
                  <option value="ALL">Tất cả</option>
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            }
            end={
              <span className="text-xs tabular-nums text-muted-foreground">
                {filtered.length}/{data.length}
              </span>
            }
          />
          <p className="text-xs text-muted-foreground">
            Sửa / xóa cần mật khẩu.
          </p>
          {data.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="Chưa có lịch sử trả"
              description="Các khoản trả nợ đã ghi nhận sẽ hiển thị tại đây."
            />
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Không có bản ghi khớp tìm kiếm hoặc bộ lọc.
            </p>
          ) : (
            <>
              <ul className="space-y-2 md:hidden">
                {filtered.map((r, i) => {
                  const row = (
                    <div className="rounded-xl border border-white/55 bg-white/40 p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
                      <Link
                        href={`/repayments/${r.id}`}
                        className="block cursor-pointer rounded-lg transition-colors duration-200 hover:bg-white/40 dark:hover:bg-white/10"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium">{r.creditorName}</span>
                          <span className="shrink-0 tabular-nums text-sm font-semibold">
                            {formatMoney(Number(r.deltaAmount), r.currency)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(r.happenedAt).toLocaleString("vi-VN")}
                        </p>
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
                      <TableHead>Chủ nợ</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Ghi chú</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          {r.creditorId ? (
                            <Link
                              href={`/creditors/${r.creditorId}`}
                              className="cursor-pointer font-medium text-primary hover:underline"
                            >
                              {r.creditorName}
                            </Link>
                          ) : (
                            r.creditorName
                          )}
                        </TableCell>
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
        </section>
      ) : null}

      <BottomSheet
        open={sheet === "repay-edit" && !!editRepay}
        title="Sửa bản ghi trả nợ"
        onClose={closeSheet}
      >
        {editRepay ? (
          <form
            className={formGrid}
            onSubmit={async (e) => {
              e.preventDefault();
              setFormError(null);
              try {
                const fd = new FormData(e.currentTarget);
                fd.set("id", editRepay.id);
                await updateRepaymentAction(fd);
                await invalidate();
                closeSheet();
              } catch (err) {
                setFormError(mapErr(err));
              }
            }}
          >
            <input type="hidden" name="id" value={editRepay.id} />
            <div className="grid gap-1.5">
              <Label htmlFor="rl-when">Thời điểm</Label>
              <Input
                id="rl-when"
                name="happenedAt"
                type="datetime-local"
                required
                defaultValue={new Date(editRepay.happenedAt)
                  .toISOString()
                  .slice(0, 16)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rl-amt">Số tiền</Label>
              <Input
                id="rl-amt"
                name="deltaAmount"
                required
                defaultValue={editRepay.deltaAmount}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rl-note">Ghi chú</Label>
              <Input
                id="rl-note"
                name="note"
                required
                defaultValue={editRepay.note}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rl-proof">Link chứng từ</Label>
              <Input
                id="rl-proof"
                name="proofUrl"
                defaultValue={editRepay.proofUrl}
              />
            </div>
            <PasswordField id="rl-pw" className={formFull} />
            {formError ? (
              <FormAlert className={formFull}>{formError}</FormAlert>
            ) : null}
            <Button type="submit" className={cn(formFull, "cursor-pointer")}>
              Cập nhật
            </Button>
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
              Hành động này không hoàn tác. Nhập mật khẩu để xác nhận.
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
              onSubmit={async (e) => {
                e.preventDefault();
                setFormError(null);
                try {
                  const fd = new FormData(e.currentTarget);
                  fd.set("id", editRepay.id);
                  await deleteRepaymentAction(fd);
                  await invalidate();
                  closeSheet();
                } catch (err) {
                  setFormError(mapErr(err));
                }
              }}
            >
              <input type="hidden" name="id" value={editRepay.id} />
              <PasswordField id="rld-pw" className={formFull} />
              {formError ? (
                <FormAlert className={formFull}>{formError}</FormAlert>
              ) : null}
              <Button
                type="submit"
                variant="destructive"
                className={cn(formFull, "cursor-pointer")}
              >
                Xóa vĩnh viễn
              </Button>
            </form>
          </>
        ) : null}
      </BottomSheet>
    </PageShell>
  );
}
