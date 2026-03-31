// src/providers/query-provider.tsx
"use client";

import { ApiError } from "@/lib/error";
import { HttpStatus } from "@/lib/http";
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
        mutationCache: new MutationCache({
          onError(error, _variables, _onMutateResult, mutation) {
            //Check if the mutation opted out of global errors
            if (mutation.meta?.silent) return;
            if (error instanceof ApiError) {
              if (error.status === HttpStatus.NOT_FOUND) {
                router.push("/not-found");
                return;
              }
              toast.error(error.message);
              return;
            }
            toast.error("An unexpected error has occured");
            console.error("Global Mutation Error:", error);
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
