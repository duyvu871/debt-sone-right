"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Banknote, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { CreditorAvatar } from "@/entities/creditor/CreditorAvatar";
import { useDeleteCreditor } from "@/features/creditor/hooks/useDeleteCreditor";
import { useUpdateCreditor } from "@/features/creditor/hooks/useUpdateCreditor";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/shared/components/Breadcrumb";
import { DetailHeader } from "@/shared/components/DetailHeader";
import { EmptyState } from "@/shared/components/EmptyState";
import { FormAlert } from "@/shared/components/FormAlert";
import { InfoGrid } from "@/shared/components/InfoGrid";
import { ListPageToolbar } from "@/shared/components/ListPageToolbar";
import { MutationSubmitButton } from "@/shared/components/MutationSubmitButton";
import { PageShell } from "@/shared/components/PageShell";
import type { CreditorDTO } from "@/shared/dal/creditorDal";
import type { DebtDTO } from "@/shared/dal/debtDal";
import { crumbLabel } from "@/shared/lib/breadcrumbLabels";
import { debtStatusLabel, formatMoney, mapErr } from "@/shared/lib/format";
import { formFull, formGrid, selectClass } from "@/shared/lib/formClasses";
import { matchesSearch } from "@/shared/lib/listFilter";
import { Badge } from "@/shared/ui/badge";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
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

type DebtWithOutstanding = DebtDTO & { outstanding: number; repaid: number };

type CreditorDetailPayload = {
  creditor: CreditorDTO;
  debts: DebtWithOutstanding[];
};

export function CreditorDetailPage({ creditorId }: { creditorId: string }) {
  const router = useRouter();
  const updateCreditor = useUpdateCreditor();
  const deleteCreditor = useDeleteCreditor();
  const [sheet, setSheet] = useState<null | "creditor-edit">(null);
  const clearEditsAfterCloseRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const editPending =
    updateCreditor.isPending || deleteCreditor.isPending;
  const [debtSearch, setDebtSearch] = useState("");
  const [debtStatus, setDebtStatus] = useState<"ALL" | DebtDTO["status"]>(
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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["creditor", creditorId],
    queryFn: async () => {
      const res = await fetch(`/api/creditors/${creditorId}`);
      const json = (await res.json()) as
        | { data: CreditorDetailPayload }
        | { error: string };
      if (res.status === 404) throw new Error("not_found");
      if (!res.ok || "error" in json) {
        throw new Error("error" in json ? json.error : "fetch_failed");
      }
      return json.data;
    },
  });

  function closeSheet() {
    if (clearEditsAfterCloseRef.current) {
      clearTimeout(clearEditsAfterCloseRef.current);
      clearEditsAfterCloseRef.current = null;
    }
    updateCreditor.reset();
    deleteCreditor.reset();
    setSheet(null);
    clearEditsAfterCloseRef.current = setTimeout(() => {
      clearEditsAfterCloseRef.current = null;
    }, 320);
  }

  const creditor = data?.creditor;
  const debts = data?.debts ?? [];

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      const blob = [
        debtStatusLabel(d.status),
        d.currency,
        formatMoney(d.outstanding, d.currency),
        formatMoney(Number(d.totalAmount), d.currency),
      ].join(" ");
      if (!matchesSearch(blob, debtSearch)) return false;
      if (debtStatus !== "ALL" && d.status !== debtStatus) return false;
      return true;
    });
  }, [debts, debtSearch, debtStatus]);

  if (isLoading && !data) {
    return (
      <PageShell className="space-y-4">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Chủ nợ", href: "/creditors" },
            { label: "Đang tải…" },
          ]}
        />
        <div className="animate-pulse rounded-2xl border border-white/40 bg-white/35 p-12 dark:border-white/10" />
      </PageShell>
    );
  }

  if (error && (error as Error).message === "not_found") {
    return (
      <PageShell className="space-y-4 py-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Chủ nợ", href: "/creditors" },
            { label: "Không tìm thấy" },
          ]}
        />
        <EmptyState
          icon={AlertCircle}
          title="Không có chủ nợ này"
          description="Kiểm tra đường dẫn hoặc quay lại danh sách."
          action={
            <Button asChild className="cursor-pointer" size="sm">
              <Link href="/creditors">Danh sách chủ nợ</Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  if (error && !data) {
    return (
      <PageShell className="space-y-4 py-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Chủ nợ", href: "/creditors" },
            { label: "Lỗi tải" },
          ]}
        />
        <EmptyState
          icon={AlertCircle}
          title="Lỗi tải dữ liệu"
          description={String((error as Error).message)}
          action={
            <Button
              type="button"
              size="sm"
              className="cursor-pointer"
              onClick={() => refetch()}
            >
              Thử lại
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      {creditor ? (
        <>
          <Breadcrumb
            items={[
              { label: "Trang chủ", href: "/" },
              { label: "Chủ nợ", href: "/creditors" },
              { label: crumbLabel(creditor.name) },
            ]}
          />
          <DetailHeader
            title={
              <span className="flex items-center gap-3">
                <CreditorAvatar name={creditor.name} />
                <h1 className="text-xl font-bold tracking-tight">
                  {creditor.name}
                </h1>
              </span>
            }
            actions={
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="cursor-pointer"
                aria-label="Sửa hoặc xóa chủ nợ"
                onClick={() => {
                  updateCreditor.reset();
                  deleteCreditor.reset();
                  setSheet("creditor-edit");
                }}
              >
                <Pencil className="size-4" aria-hidden />
              </Button>
            }
          />
          <InfoGrid
            items={[
              { label: "Điện thoại", value: creditor.phone || "—" },
              { label: "Ghi chú", value: creditor.note || "—" },
            ]}
          />
        </>
      ) : null}

      {creditor ? (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">Khoản nợ</h2>
          {debts.length === 0 ? (
            <EmptyState
              icon={Banknote}
              title="Chưa có khoản nợ"
              description="Thêm khoản nợ từ trang Khoản nợ."
              action={
                <Button asChild size="sm" className="cursor-pointer">
                  <Link href="/debts">Đến khoản nợ</Link>
                </Button>
              }
            />
          ) : (
            <>
              <ListPageToolbar
                searchId="creditor-detail-debt-search"
                searchValue={debtSearch}
                onSearchChange={setDebtSearch}
                searchPlaceholder="Trạng thái, tiền tệ, số tiền…"
                filters={
                  <div className="grid gap-1">
                    <Label
                      htmlFor="cred-detail-status"
                      className="text-xs text-muted-foreground"
                    >
                      Trạng thái
                    </Label>
                    <select
                      id="cred-detail-status"
                      className={cn(selectClass, "h-9 min-w-[9rem] py-1")}
                      value={debtStatus}
                      onChange={(e) =>
                        setDebtStatus(
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
                }
                end={
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {filteredDebts.length}/{debts.length}
                  </span>
                }
              />
              {filteredDebts.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Không có khoản nợ khớp tìm kiếm hoặc bộ lọc.
                </p>
              ) : (
                <>
                  <ul className="space-y-2 md:hidden">
                    {filteredDebts.map((d) => (
                      <li key={d.id}>
                        <Link
                          href={`/debts/${d.id}`}
                          className="block cursor-pointer rounded-xl border border-white/55 bg-white/40 p-3 shadow-sm backdrop-blur-sm transition-colors duration-200 hover:bg-white/55 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                        >
                          <div className="flex items-center justify-between gap-2">
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
                            <span className="tabular-nums text-sm font-semibold">
                              {formatMoney(d.outstanding, d.currency)}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Gốc {formatMoney(Number(d.totalAmount), d.currency)}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div
                    className={cn(
                      "hidden md:block max-h-[min(70vh,36rem)] overflow-auto rounded-xl border border-white/50 dark:border-white/10",
                    )}
                  >
                    <Table flush className="w-full min-w-[36rem]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Gốc</TableHead>
                          <TableHead>Dư nợ</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className="text-right">Chi tiết</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDebts.map((d) => (
                          <TableRow key={d.id}>
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
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                              >
                                <Link href={`/debts/${d.id}`}>Mở</Link>
                              </Button>
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
      ) : null}

      <BottomSheet
        open={sheet === "creditor-edit" && !!creditor}
        title="Sửa / xóa chủ nợ"
        onClose={closeSheet}
      >
        {creditor ? (
          <>
            <form
              className={cn(formGrid, "mb-4")}
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("id", creditor.id);
                updateCreditor.mutate(fd, {
                  onSuccess: () => closeSheet(),
                });
              }}
            >
              <input type="hidden" name="id" value={creditor.id} />
              <div className={cn("grid gap-1.5", formFull)}>
                <Label htmlFor="cde-name">Tên</Label>
                <Input
                  id="cde-name"
                  name="name"
                  required
                  defaultValue={creditor.name}
                  disabled={editPending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cde-phone">Điện thoại</Label>
                <Input
                  id="cde-phone"
                  name="phone"
                  defaultValue={creditor.phone ?? ""}
                  disabled={editPending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cde-note">Ghi chú</Label>
                <Input
                  id="cde-note"
                  name="note"
                  defaultValue={creditor.note ?? ""}
                  disabled={editPending}
                />
              </div>
              {updateCreditor.error ? (
                <FormAlert className={formFull}>
                  {mapErr(updateCreditor.error)}
                </FormAlert>
              ) : null}
              <MutationSubmitButton
                pending={updateCreditor.isPending}
                pendingLabel="Đang cập nhật…"
                className={cn(formFull, "cursor-pointer")}
              >
                Cập nhật
              </MutationSubmitButton>
            </form>
            <form
              className={cn(formGrid, "border-t pt-4")}
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("id", creditor.id);
                deleteCreditor.mutate(fd, {
                  onSuccess: () => {
                    closeSheet();
                    router.push("/creditors");
                  },
                });
              }}
            >
              <input type="hidden" name="id" value={creditor.id} />
              {deleteCreditor.error ? (
                <FormAlert className={formFull}>
                  {mapErr(deleteCreditor.error)}
                </FormAlert>
              ) : null}
              <MutationSubmitButton
                pending={deleteCreditor.isPending}
                pendingLabel="Đang xóa…"
                variant="destructive"
                className={cn(formFull, "cursor-pointer")}
              >
                Xóa chủ nợ
              </MutationSubmitButton>
            </form>
          </>
        ) : null}
      </BottomSheet>
    </PageShell>
  );
}
