"use client";

import { useState } from "react";

import { GenerateMemoriesActionResponse } from "@/app/chat/_lib/schema";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Markdown } from "@/components/ui/markdown";
import { ConfirmIcon, CopyIcon } from "@/lib/icons";

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

            {data.lorebook && data.lorebook.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Lorebook Updates
                </h3>
                {data.lorebook.map((entry, i) => (
                  <div className="rounded-lg border overflow-hidden" key={i}>
                    {(entry.file || entry.summary) && (
                      <div className="px-3 py-2 bg-muted/50 border-b flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          {entry.file && (
                            <span className="font-mono text-xs text-foreground">
                              {entry.file}
                            </span>
                          )}
                          {entry.summary && (
                            <span className="text-xs text-muted-foreground">
                              {entry.summary}
                              <CopyButton text={entry.summary} />
                            </span>
                          )}
                        </div>
                        <CopyButton text={entry.content} />
                      </div>
                    )}
                    {!(entry.file || entry.summary) && (
                      <div className="flex justify-end px-2 pt-2">
                        <CopyButton text={entry.content} />
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const Icon = copied ? ConfirmIcon : CopyIcon;

  return (
    <button
      aria-label="Copy to clipboard"
      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      onClick={handleCopy}
      type="button"
    >
      <Icon className="size-3.5" />
    </button>
  );
}
