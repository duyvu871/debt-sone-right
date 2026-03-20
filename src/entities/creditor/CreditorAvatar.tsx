"use client";

export function CreditorAvatar({ name }: { name: string }) {
  const initial = name.trim().slice(0, 1).toUpperCase();

  return (
    <span
      className="inline-flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4a90e2] to-[#ff8a65] text-sm font-semibold text-white shadow-sm"
      title={name || "Creditor"}
    >
      {initial || "?"}
    </span>
  );
}
