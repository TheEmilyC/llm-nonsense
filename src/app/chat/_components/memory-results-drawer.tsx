"use client";

import { GenerateSummariesActionResponse } from "@/app/chat/_lib/schema";
import { CopyButton } from "@/components/copy-button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Markdown } from "@/components/ui/markdown";

interface MemoryResultsDrawerProps {
  data: GenerateSummariesActionResponse | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function MemoryResultsDrawer({
  data,
  onOpenChange,
  open,
}: MemoryResultsDrawerProps) {
  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Memory Generation</DrawerTitle>
          <DrawerDescription>
            {data?.summary ? (
              <>
                {data.summary}
                <CopyButton text={data.summary ?? ""} />
              </>
            ) : (
              <>Suggested summary and lorebook update results</>
            )}
          </DrawerDescription>
        </DrawerHeader>

        {data && (
          <div className="no-scrollbar overflow-y-auto px-4 pb-6 space-y-6">
            <section>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Summary
                  <CopyButton text={data.content} />
                </h3>
              </div>
              <Markdown className="prose prose-sm dark:prose-invert max-w-none">
                {data.content}
              </Markdown>
            </section>

            {data.cast && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Cast of Characters
                    <CopyButton text={data.cast} />
                  </h3>
                </div>
                <Markdown className="prose prose-sm dark:prose-invert max-w-none">
                  {data.cast}
                </Markdown>
              </section>
            )}

          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
