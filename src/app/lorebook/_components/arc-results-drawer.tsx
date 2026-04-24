"use client";

import { GenerateMemoryArcResult } from "@/app/lorebook/_lib/service";
import { CopyButton } from "@/components/copy-button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Markdown } from "@/components/ui/markdown";

interface ArcResultsDrawerProps {
  data: GenerateMemoryArcResult | undefined;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function ArcResultsDrawer({
  data,
  onOpenChange,
  open,
}: ArcResultsDrawerProps) {
  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Memory Arc</DrawerTitle>
          <DrawerDescription>
            Generated story arcs from selected memories
          </DrawerDescription>
        </DrawerHeader>

        {data && (
          <div className="no-scrollbar overflow-y-auto px-4 pb-6 space-y-6">
            {data.arcs.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Arcs
                </h3>
                {data.arcs.map((arc, i) => (
                  <div className="rounded-lg border overflow-hidden" key={i}>
                    <div className="px-3 py-2 bg-muted/50 border-b flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {arc.synopsis}
                      </span>
                      <CopyButton text={arc.content} />
                    </div>
                    <Markdown className="prose prose-sm dark:prose-invert max-w-none">
                      {arc.content}
                    </Markdown>
                  </div>
                ))}
              </section>
            )}

            {data.unassignedMemories && (
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Unassigned Memories
                </h3>
                <div className="rounded-lg border overflow-hidden">
                  <div className="px-3 py-2 bg-muted/50 border-b flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-foreground">
                      {data.unassignedMemories.title}
                    </span>
                    <CopyButton text={data.unassignedMemories.reason} />
                  </div>
                  <p className="text-sm text-muted-foreground px-3 py-2">
                    {data.unassignedMemories.reason}
                  </p>
                </div>
              </section>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
