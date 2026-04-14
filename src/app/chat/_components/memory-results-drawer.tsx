"use client";

import { useTheme } from "next-themes";

import { GenerateMemoriesActionResponse } from "@/app/chat/_lib/schema";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Markdown } from "@/components/ui/markdown";

interface MemoryResultsDrawerProps {
  data: GenerateMemoriesActionResponse | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function MemoryResultsDrawer({
  data,
  onOpenChange,
  open,
}: MemoryResultsDrawerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Memory Generation</DrawerTitle>
          <DrawerDescription>
            {data?.summary ?? "Suggested summary and lorebook update results"}
          </DrawerDescription>
        </DrawerHeader>

        {data && (
          <div className="no-scrollbar overflow-y-auto px-4 pb-6 space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Summary
              </h3>
              <Markdown className="prose prose-sm dark:prose-invert max-w-none">
                {data.content}
              </Markdown>
            </section>

            {data.lorebook && data.lorebook.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Lorebook Updates
                </h3>
                {data.lorebook.map((entry, i) => (
                  <div className="rounded-lg border overflow-hidden" key={i}>
                    {(entry.file || entry.summary) && (
                      <div className="px-3 py-2 bg-muted/50 border-b flex flex-col gap-0.5">
                        {entry.file && (
                          <span className="font-mono text-xs text-foreground">
                            {entry.file}
                          </span>
                        )}
                        {entry.summary && (
                          <span className="text-xs text-muted-foreground">
                            {entry.summary}
                          </span>
                        )}
                      </div>
                    )}
                    <Markdown className="prose prose-sm dark:prose-invert max-w-none">
                      {entry.content}
                    </Markdown>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
