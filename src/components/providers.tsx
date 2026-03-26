"use client";

import QueryProvider from "@/components/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>{children} </TooltipProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
