"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ExternalLink, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { deleteRepaymentAction } from "@/features/repayment/actions/deleteRepaymentAction";
import { updateRepaymentAction } from "@/features/repayment/actions/updateRepaymentAction";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/shared/components/Breadcrumb";
import { DetailHeader } from "@/shared/components/DetailHeader";
import { EmptyState } from "@/shared/components/EmptyState";
import { FormAlert } from "@/shared/components/FormAlert";
import { InfoGrid, type InfoItem } from "@/shared/components/InfoGrid";
import { PageShell } from "@/shared/components/PageShell";
import { PasswordField } from "@/shared/components/PasswordField";
import type { DebtDTO } from "@/shared/dal/debtDal";
import type { RepaymentListItemDTO } from "@/shared/dal/repaymentDal";
import { crumbLabel } from "@/shared/lib/breadcrumbLabels";
import { formatMoney, mapErr } from "@/shared/lib/format";
import { formFull, formGrid } from "@/shared/lib/formClasses";
import { invalidateLedgerQueries } from "@/shared/lib/invalidateLedgerQueries";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type RepaymentDetailPayload = {
  repayment: RepaymentListItemDTO;
  debt: DebtDTO | null;
  creditorId: string | null;
};

export function RepaymentDetailPage({ repaymentId }: { repaymentId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [sheet, setSheet] = useState<null | "repay-edit" | "repay-delete">(
    null,
  );
  const clearEditsAfterCloseRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (clearEditsAfterCloseRef.current) {
        clearTimeout(clearEditsAfterCloseRef.current);
        clearEditsAfterCloseRef.current = null;
      }
    };
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["repayment", repaymentId],
    queryFn: async () => {
      const res = await fetch(`/api/repayments/${repaymentId}`);
      const json = (await res.json()) as
        | { data: RepaymentDetailPayload }
        | { error: string };
      if (res.status === 404) throw new Error("not_found");
      if (!res.ok || "error" in json) {
        throw new Error("error" in json ? json.error : "fetch_failed");
      }
      return json.data;
    },
  });

  async function invalidate() {
    await invalidateLedgerQueries(qc);
  }

  function closeSheet() {
    if (clearEditsAfterCloseRef.current) {
      clearTimeout(clearEditsAfterCloseRef.current);
      clearEditsAfterCloseRef.current = null;
    }
    setSheet(null);
    setFormError(null);
  }

  const repayment = data?.repayment;
  const debt = data?.debt;
  const creditorId = data?.creditorId;

  if (isLoading && !data) {
    return (
      <PageShell className="space-y-4">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Lịch sử trả nợ", href: "/repayments" },
            { label: "Đang tải…" },
          ]}
        />
        <div className="animate-pulse rounded-2xl border border-white/40 bg-white/35 p-12" />
      </PageShell>
    );
  }

  if (error && (error as Error).message === "not_found") {
    return (
      <PageShell className="space-y-4 py-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Lịch sử trả nợ", href: "/repayments" },
            { label: "Không tìm thấy" },
          ]}
        />
        <EmptyState
          icon={AlertCircle}
          title="Không có bản ghi này"
          action={
            <Button asChild size="sm" className="cursor-pointer">
              <Link href="/repayments">Danh sách</Link>
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
            { label: "Lịch sử trả nợ", href: "/repayments" },
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
              onClick={() => refetch()}
            >
              Thử lại
            </Button>
          }
        />
      </PageShell>
    );
  }

  if (!repayment) return null;

  const creditorHrefId = creditorId ?? debt?.creditorId;
  const repaymentCrumbs = debt
    ? [
        { label: "Trang chủ", href: "/" },
        { label: "Chủ nợ", href: "/creditors" },
        {
          label: crumbLabel(repayment.creditorName),
          ...(creditorHrefId
            ? { href: `/creditors/${creditorHrefId}` as const }
            : {}),
        },
        {
          label: `Khoản ${formatMoney(Number(debt.totalAmount), debt.currency)}`,
          href: `/debts/${debt.id}`,
        },
        {
          label: `Trả ${formatMoney(Number(repayment.deltaAmount), repayment.currency)}`,
        },
      ]
    : [
        { label: "Trang chủ", href: "/" },
        { label: "Lịch sử trả nợ", href: "/repayments" },
        {
          label: `Trả ${formatMoney(Number(repayment.deltaAmount), repayment.currency)} · ${crumbLabel(repayment.creditorName, 28)}`,
        },
      ];

  const proof = repayment.proofUrl?.trim();

  const infoItems: InfoItem[] = [
    { label: "Chủ nợ", value: repayment.creditorName },
    ...(debt
      ? [
          {
            label: "Khoản nợ",
            value: (
              <Link
                href={`/debts/${debt.id}`}
                className="cursor-pointer text-primary underline-offset-4 transition-colors duration-200 hover:underline"
              >
                {formatMoney(Number(debt.totalAmount), debt.currency)} ·{" "}
                {debt.currency}
              </Link>
            ),
          },
        ]
      : []),
    { label: "Ghi chú", value: repayment.note || "—" },
    {
      label: "Chứng từ",
      value: proof ? (
        <a
          href={proof}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex cursor-pointer items-center gap-1 text-primary underline-offset-4 transition-colors duration-200 hover:underline"
        >
          Mở liên kết
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : (
        "—"
      ),
    },
  ];

  return (
    <PageShell>
      <Breadcrumb items={repaymentCrumbs} />

      <DetailHeader
        title={
          <h1 className="text-2xl font-bold tabular-nums tracking-tight md:text-3xl">
            {formatMoney(Number(repayment.deltaAmount), repayment.currency)}
          </h1>
        }
        subtitle={new Date(repayment.happenedAt).toLocaleString("vi-VN")}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="cursor-pointer transition-colors duration-200"
              aria-label="Sửa bản ghi trả nợ"
              onClick={() => setSheet("repay-edit")}
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="cursor-pointer border-destructive/40 text-destructive transition-colors duration-200 hover:bg-destructive/10"
              aria-label="Xóa bản ghi trả nợ"
              onClick={() => setSheet("repay-delete")}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </>
        }
      />

      <InfoGrid items={infoItems} />

      <BottomSheet
        open={sheet === "repay-edit"}
        title="Sửa bản ghi trả nợ"
        onClose={closeSheet}
      >
        <form
          className={formGrid}
          onSubmit={async (e) => {
            e.preventDefault();
            setFormError(null);
            try {
              const fd = new FormData(e.currentTarget);
              fd.set("id", repayment.id);
              await updateRepaymentAction(fd);
              await invalidate();
              closeSheet();
              void refetch();
            } catch (err) {
              setFormError(mapErr(err));
            }
          }}
        >
          <input type="hidden" name="id" value={repayment.id} />
          <div className="grid gap-1.5">
            <Label htmlFor="rd-when">Thời điểm</Label>
            <Input
              id="rd-when"
              name="happenedAt"
              type="datetime-local"
              required
              defaultValue={new Date(repayment.happenedAt)
                .toISOString()
                .slice(0, 16)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rd-amt">Số tiền</Label>
            <Input
              id="rd-amt"
              name="deltaAmount"
              required
              defaultValue={repayment.deltaAmount}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rd-note">Ghi chú</Label>
            <Input
              id="rd-note"
              name="note"
              required
              defaultValue={repayment.note}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rd-proof">Link chứng từ</Label>
            <Input
              id="rd-proof"
              name="proofUrl"
              defaultValue={repayment.proofUrl}
            />
          </div>
          <PasswordField id="rd-pw" className={formFull} />
          {formError ? (
            <FormAlert className={formFull}>{formError}</FormAlert>
          ) : null}
          <Button type="submit" className={cn(formFull, "cursor-pointer")}>
            Cập nhật
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet
        open={sheet === "repay-delete"}
        title="Xóa bản ghi trả nợ"
        onClose={closeSheet}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Hành động này không hoàn tác. Nhập mật khẩu để xác nhận.
          </p>
          <div className="rounded-xl border border-white/60 bg-white/45 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="font-medium">{repayment.creditorName}</div>
            <div className="mt-0.5 tabular-nums text-muted-foreground">
              {formatMoney(Number(repayment.deltaAmount), repayment.currency)} ·{" "}
              {new Date(repayment.happenedAt).toLocaleString("vi-VN")}
            </div>
          </div>
          <form
            className={formGrid}
            onSubmit={async (e) => {
              e.preventDefault();
              setFormError(null);
              try {
                const fd = new FormData(e.currentTarget);
                fd.set("id", repayment.id);
                await deleteRepaymentAction(fd);
                await invalidate();
                closeSheet();
                router.push("/repayments");
              } catch (err) {
                setFormError(mapErr(err));
              }
            }}
          >
            <input type="hidden" name="id" value={repayment.id} />
            <PasswordField id="rdd-pw" className={formFull} />
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
        </div>
      </BottomSheet>
    </PageShell>
  );
}
