"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { CreditorAvatar } from "@/entities/creditor/CreditorAvatar";
import { createCreditorAction } from "@/features/creditor/actions/createCreditorAction";
import { deleteCreditorAction } from "@/features/creditor/actions/deleteCreditorAction";
import { updateCreditorAction } from "@/features/creditor/actions/updateCreditorAction";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/shared/components/Breadcrumb";
import { EmptyState } from "@/shared/components/EmptyState";
import { FormAlert } from "@/shared/components/FormAlert";
import { ListPageToolbar } from "@/shared/components/ListPageToolbar";
import { PageShell } from "@/shared/components/PageShell";
import { PasswordField } from "@/shared/components/PasswordField";
import type {
  CreditorDTO,
  CreditorWithDebtCount,
} from "@/shared/dal/creditorDal";
import { mapErr } from "@/shared/lib/format";
import { formFull, formGrid, selectClass } from "@/shared/lib/formClasses";
import { invalidateLedgerQueries } from "@/shared/lib/invalidateLedgerQueries";
import { matchesSearch } from "@/shared/lib/listFilter";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import FadeContent from "@/shared/ui/fade-content";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function CreditorListPage() {
  const qc = useQueryClient();
  const [sheet, setSheet] = useState<
    null | "creditor-create" | "creditor-edit"
  >(null);
  const [editCreditor, setEditCreditor] = useState<CreditorDTO | null>(null);
  const clearEditsAfterCloseRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debtFilter, setDebtFilter] = useState<"all" | "has" | "none">("all");

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
    clearEditsAfterCloseRef.current = setTimeout(() => {
      clearEditsAfterCloseRef.current = null;
      setEditCreditor(null);
    }, 320);
  }

  const maxAnimatedItems = 6;

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((c) => {
      const blob = [c.name, c.phone ?? "", c.note ?? ""].join(" ");
      if (!matchesSearch(blob, search)) return false;
      if (debtFilter === "has" && c.debtCount === 0) return false;
      if (debtFilter === "none" && c.debtCount > 0) return false;
      return true;
    });
  }, [data, search, debtFilter]);

  return (
    <PageShell>
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Chủ nợ" }]}
      />

      {error && data ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/65 px-4 py-3 text-sm shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/10"
        >
          <span className="text-muted-foreground">
            Không làm mới được — đang hiển thị bản đã tải.
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer shrink-0 gap-1.5"
            onClick={() => refetch()}
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Thử lại
          </Button>
        </div>
      ) : null}

      {isLoading && !data ? (
        <div className="animate-pulse rounded-2xl border border-white/40 bg-white/35 p-12 dark:border-white/10 dark:bg-white/10" />
      ) : error && !data ? (
        <EmptyState
          icon={AlertCircle}
          title="Không tải được dữ liệu"
          description="Thử tải lại."
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
            searchId="creditor-search"
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Tên, SĐT, ghi chú…"
            filters={
              <div className="grid gap-1">
                <Label
                  htmlFor="creditor-debt-filter"
                  className="text-xs text-muted-foreground"
                >
                  Khoản nợ
                </Label>
                <select
                  id="creditor-debt-filter"
                  className={cn(selectClass, "h-9 min-w-[9.5rem] py-1")}
                  value={debtFilter}
                  onChange={(e) =>
                    setDebtFilter(e.target.value as "all" | "has" | "none")
                  }
                >
                  <option value="all">Tất cả</option>
                  <option value="has">Có khoản nợ</option>
                  <option value="none">Chưa có khoản</option>
                </select>
              </div>
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
                  onClick={() => setSheet("creditor-create")}
                >
                  Thêm chủ nợ
                </Button>
              </>
            }
          />
          <p className="text-xs text-muted-foreground">
            Thêm / sửa / xóa cần mật khẩu.
          </p>
          {data.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Chưa có chủ nợ"
              description="Thêm chủ nợ để bắt đầu ghi các khoản vay."
              action={
                <Button
                  type="button"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setSheet("creditor-create")}
                >
                  Thêm chủ nợ
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Không có chủ nợ khớp tìm kiếm hoặc bộ lọc.
            </p>
          ) : (
            <ul className="divide-y divide-border/60 rounded-xl border border-white/50 dark:border-white/10">
              {filtered.map((c, i) => {
                const row = (
                  <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                    <Link
                      href={`/creditors/${c.id}`}
                      className={cn(
                        "flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg transition-colors duration-200 hover:bg-white/50 dark:hover:bg-white/10",
                      )}
                    >
                      <CreditorAvatar name={c.name} />
                      <div className="min-w-0 text-left">
                        <div className="truncate font-medium">{c.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {(() => {
                            const meta = [c.phone, c.note]
                              .filter(Boolean)
                              .join(" · ");
                            return meta
                              ? `${meta} · ${c.debtCount} khoản nợ`
                              : `${c.debtCount} khoản nợ`;
                          })()}
                        </div>
                      </div>
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer shrink-0"
                      onClick={(e) => {
                        e.preventDefault();
                        setEditCreditor(c);
                        setSheet("creditor-edit");
                      }}
                    >
                      Sửa
                    </Button>
                  </div>
                );
                if (i >= maxAnimatedItems) {
                  return <li key={c.id}>{row}</li>;
                }
                return (
                  <li key={c.id}>
                    <FadeContent
                      trigger="mount"
                      duration={400}
                      ease="power2.out"
                      delay={i * 0.042}
                    >
                      {row}
                    </FadeContent>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      <BottomSheet
        open={sheet === "creditor-create"}
        title="Thêm chủ nợ"
        onClose={closeSheet}
      >
        <form
          className={formGrid}
          onSubmit={async (e) => {
            e.preventDefault();
            setFormError(null);
            try {
              await createCreditorAction(new FormData(e.currentTarget));
              await invalidate();
              closeSheet();
            } catch (err) {
              setFormError(mapErr(err));
            }
          }}
        >
          <div className={cn("grid gap-1.5", formFull)}>
            <Label htmlFor="c-name">Tên</Label>
            <Input id="c-name" name="name" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-phone">Điện thoại</Label>
            <Input id="c-phone" name="phone" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-note">Ghi chú</Label>
            <Input id="c-note" name="note" />
          </div>
          <PasswordField id="c-pw" className={formFull} />
          {formError ? (
            <FormAlert className={formFull}>{formError}</FormAlert>
          ) : null}
          <Button type="submit" className={cn(formFull, "cursor-pointer")}>
            Lưu
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet
        open={sheet === "creditor-edit" && !!editCreditor}
        title="Sửa / xóa chủ nợ"
        onClose={closeSheet}
      >
        {editCreditor ? (
          <>
            <form
              className={cn(formGrid, "mb-4")}
              onSubmit={async (e) => {
                e.preventDefault();
                setFormError(null);
                try {
                  const fd = new FormData(e.currentTarget);
                  fd.set("id", editCreditor.id);
                  await updateCreditorAction(fd);
                  await invalidate();
                  closeSheet();
                } catch (err) {
                  setFormError(mapErr(err));
                }
              }}
            >
              <input type="hidden" name="id" value={editCreditor.id} />
              <div className={cn("grid gap-1.5", formFull)}>
                <Label htmlFor="ce-name">Tên</Label>
                <Input
                  id="ce-name"
                  name="name"
                  required
                  defaultValue={editCreditor.name}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ce-phone">Điện thoại</Label>
                <Input
                  id="ce-phone"
                  name="phone"
                  defaultValue={editCreditor.phone ?? ""}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ce-note">Ghi chú</Label>
                <Input
                  id="ce-note"
                  name="note"
                  defaultValue={editCreditor.note ?? ""}
                />
              </div>
              <PasswordField id="ce-pw" className={formFull} />
              {formError ? (
                <FormAlert className={formFull}>{formError}</FormAlert>
              ) : null}
              <Button type="submit" className={cn(formFull, "cursor-pointer")}>
                Cập nhật
              </Button>
            </form>
            <form
              className={cn(formGrid, "border-t pt-4")}
              onSubmit={async (e) => {
                e.preventDefault();
                setFormError(null);
                try {
                  const fd = new FormData(e.currentTarget);
                  fd.set("id", editCreditor.id);
                  await deleteCreditorAction(fd);
                  await invalidate();
                  closeSheet();
                } catch (err) {
                  setFormError(mapErr(err));
                }
              }}
            >
              <input type="hidden" name="id" value={editCreditor.id} />
              <PasswordField id="cd-pw" className={formFull} />
              <Button
                type="submit"
                variant="destructive"
                className={cn(formFull, "cursor-pointer")}
              >
                Xóa chủ nợ
              </Button>
            </form>
          </>
        ) : null}
      </BottomSheet>
    </PageShell>
  );
}
