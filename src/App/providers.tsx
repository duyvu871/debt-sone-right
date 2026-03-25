"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";

import { MutationAuthProvider } from "@/shared/MutationAuthProvider";
import { GlobalLoadingBar } from "@/shared/components/GlobalLoadingBar";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <MutationAuthProvider>
        <GlobalLoadingBar />
        {children}
      </MutationAuthProvider>
    </QueryClientProvider>
  );
}
