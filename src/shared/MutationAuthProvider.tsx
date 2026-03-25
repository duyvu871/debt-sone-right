"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type Pending = {
  resolve: () => void;
  reject: (e: Error) => void;
};

type MutationAuthContextValue = {
  /** Ensures a valid mutation session (cookie); opens password UI if needed. */
  requireAuth: () => Promise<void>;
  /** Clears client session state (e.g. after server reports session_expired). */
  clearAuth: () => void;
  isAuthenticated: boolean;
  expiresAt: number | null;
};

const MutationAuthContext = createContext<MutationAuthContextValue | null>(
  null,
);

export function useMutationAuth(): MutationAuthContextValue {
  const ctx = useContext(MutationAuthContext);
  if (!ctx) {
    throw new Error("useMutationAuth must be used within MutationAuthProvider");
  }
  return ctx;
}

export function MutationAuthProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pendingRef = useRef<Pending[]>([]);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  const scheduleExpiry = useCallback(
    (at: number) => {
      clearExpiryTimer();
      const ms = Math.max(0, at - Date.now());
      expiryTimerRef.current = setTimeout(() => {
        setIsAuthenticated(false);
        setExpiresAt(null);
      }, ms + 50);
    },
    [clearExpiryTimer],
  );

  const clearAuth = useCallback(() => {
    clearExpiryTimer();
    setIsAuthenticated(false);
    setExpiresAt(null);
  }, [clearExpiryTimer]);

  const syncFromServer = useCallback(
    (data: { authenticated: boolean; expiresAt?: number }) => {
      if (data.authenticated && typeof data.expiresAt === "number") {
        setIsAuthenticated(true);
        setExpiresAt(data.expiresAt);
        scheduleExpiry(data.expiresAt);
      } else {
        clearAuth();
      }
    },
    [clearAuth, scheduleExpiry],
  );

  useEffect(() => {
    void fetch("/api/auth/mutation-password", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { authenticated?: boolean; expiresAt?: number }) => {
        if (data.authenticated && typeof data.expiresAt === "number") {
          syncFromServer({
            authenticated: true,
            expiresAt: data.expiresAt,
          });
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, [syncFromServer]);

  useEffect(() => {
    return () => {
      clearExpiryTimer();
    };
  }, [clearExpiryTimer]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showDialog && mounted) {
      const t = requestAnimationFrame(() => {
        document.getElementById("mutation-auth-password")?.focus();
      });
      return () => cancelAnimationFrame(t);
    }
  }, [showDialog, mounted]);

  const flushPending = useCallback((rejectAll: boolean) => {
    const list = pendingRef.current;
    pendingRef.current = [];
    for (const p of list) {
      if (rejectAll) {
        p.reject(new Error("auth_cancelled"));
      } else {
        p.resolve();
      }
    }
  }, []);

  const requireAuth = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      void (async () => {
        try {
          const res = await fetch("/api/auth/mutation-password", {
            credentials: "include",
          });
          const data = (await res.json()) as {
            authenticated?: boolean;
            expiresAt?: number;
          };
          if (data.authenticated && typeof data.expiresAt === "number") {
            syncFromServer({
              authenticated: true,
              expiresAt: data.expiresAt,
            });
            resolve();
            return;
          }
        } catch {
          /* fall through to password dialog */
        }
        pendingRef.current.push({ resolve, reject });
        setSubmitError(null);
        setPassword("");
        setShowDialog(true);
      })();
    });
  }, [syncFromServer]);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/mutation-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const json = (await res.json()) as
        | { ok: true; expiresAt: number }
        | { error: string };

      if (!res.ok || !("ok" in json) || !json.ok) {
        const msg =
          "error" in json && json.error === "incorrect_password"
            ? "Sai mật khẩu."
            : "Không thể xác thực.";
        setSubmitError(msg);
        return;
      }

      setIsAuthenticated(true);
      setExpiresAt(json.expiresAt);
      scheduleExpiry(json.expiresAt);
      setShowDialog(false);
      setPassword("");
      flushPending(false);
    } catch {
      setSubmitError("Có lỗi xảy ra.");
    } finally {
      setSubmitting(false);
    }
  }

  function cancelDialog() {
    setShowDialog(false);
    setPassword("");
    setSubmitError(null);
    flushPending(true);
  }

  return (
    <MutationAuthContext.Provider
      value={{
        requireAuth,
        clearAuth,
        isAuthenticated,
        expiresAt,
      }}
    >
      {children}

      {showDialog && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mutation-auth-title"
            >
              <div
                className={cn(
                  "pointer-events-auto w-full max-w-md rounded-2xl border border-white/40 bg-white/90 p-6 shadow-lg backdrop-blur-md",
                  "dark:border-white/10 dark:bg-zinc-900/95",
                )}
              >
                <h2
                  id="mutation-auth-title"
                  className="text-lg font-semibold tracking-tight"
                >
                  Mật khẩu thao tác
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nhập mật khẩu một lần — phiên có hiệu lực trong 1 giờ.
                </p>
                <form className="mt-4 space-y-3" onSubmit={submitPassword}>
                  <div className="grid gap-1.5">
                    <Label htmlFor="mutation-auth-password">Mật khẩu</Label>
                    <Input
                      id="mutation-auth-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>
                  {submitError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {submitError}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="min-w-24"
                    >
                      {submitting ? "Đang xác thực…" : "Xác nhận"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={submitting}
                      onClick={cancelDialog}
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </MutationAuthContext.Provider>
  );
}
