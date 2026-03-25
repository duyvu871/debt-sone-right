import type { DebtDTO } from "@/shared/dal/debtDal";

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("vi-VN")} ${currency}`;
  }
}

export function debtStatusLabel(status: DebtDTO["status"]) {
  switch (status) {
    case "OPEN":
      return "Đang mở";
    case "OVERDUE":
      return "Quá hạn";
    case "COMPLETED":
      return "Hoàn thành";
    default:
      return status;
  }
}

export function mapErr(e: unknown): string {
  if (e instanceof Error) {
    if (e.message === "incorrect_password") return "Sai mật khẩu.";
    if (e.message === "session_expired") {
      return "Phiên thao tác đã hết hạn. Nhập lại mật khẩu khi được nhắc.";
    }
    if (e.message === "auth_cancelled") {
      return "Đã hủy nhập mật khẩu.";
    }
    if (e.message === "missing_id") {
      return "Thiếu định danh bản ghi.";
    }
    if (e.message.includes("Foreign key constraint")) {
      return "Không thể xóa: còn khoản nợ hoặc bản ghi liên quan.";
    }
    return e.message;
  }
  return "Có lỗi xảy ra.";
}
