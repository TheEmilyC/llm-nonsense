"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useSaveChatFacts, useSaveMemoryToLorebook } from "@/app/chat/_lib/hooks";
import { GenerateSummariesActionResponse } from "@/app/chat/_lib/schema";
import { LorebookFact } from "@/app/lorebook/_lib/schema";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";

interface MemoryResultsDrawerProps {
  chatId: string;
  data: GenerateSummariesActionResponse | undefined;
  lorebookId?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function MemoryResultsDrawer({
  chatId,
  data,
  lorebookId,
  onOpenChange,
  open,
}: MemoryResultsDrawerProps) {
  const [editableFacts, setEditableFacts] = useState<LorebookFact[]>([]);
  const { isPending: isSaving, saveFacts } = useSaveChatFacts();
  const { isPending: isSavingMemory, saveMemory } = useSaveMemoryToLorebook();

  useEffect(() => {
    setEditableFacts(data?.facts ?? []);
  }, [data?.facts]);

  function updateFact(index: number, patch: Partial<LorebookFact>) {
    setEditableFacts((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  }

  function removeFact(index: number) {
    setEditableFacts((prev) => prev.filter((_, i) => i !== index));
  }

  function addFact() {
    setEditableFacts((prev) => [
      ...prev,
      { claim: "", confidence: "explicit" },
    ]);
  }

  async function handleSaveMemory() {
    if (!lorebookId || !data) return;
    const res = await saveMemory({
      content: data.content,
      lorebookId,
      summary: data.summary,
    });
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Memory saved to lorebook");
  }

  async function handleSaveFacts() {
    const res = await saveFacts({ chatId, facts: editableFacts });
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Facts saved");
  }

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
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Summary
                </h3>
                <div className="flex items-center gap-2">
                  <CopyButton text={data.content} />
                  {lorebookId && (
                    <Button
                      disabled={isSavingMemory}
                      onClick={handleSaveMemory}
                      size="sm"
                      variant="outline"
                    >
                      {isSavingMemory ? "Saving…" : "Save to Lorebook"}
                    </Button>
                  )}
                </div>
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

            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Facts
                </h3>
                <div className="flex items-center gap-2">
                  <Button onClick={addFact} size="sm" variant="outline">
                    Add fact
                  </Button>
                  <Button
                    disabled={isSaving}
                    onClick={handleSaveFacts}
                    size="sm"
                  >
                    {isSaving ? "Saving…" : "Save to chat"}
                  </Button>
                </div>
              </div>
              {editableFacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No facts extracted.
                </p>
              ) : (
                <ul className="space-y-2">
                  {editableFacts.map((fact, i) => (
                    <li className="flex items-center gap-2" key={i}>
                      <Input
                        className="flex-1 text-sm"
                        onChange={(e) =>
                          updateFact(i, { claim: e.target.value })
                        }
                        value={fact.claim}
                      />
                      <button
                        className="shrink-0 rounded px-2 py-1 text-xs font-medium border transition-colors"
                        onClick={() =>
                          updateFact(i, {
                            confidence:
                              fact.confidence === "explicit"
                                ? "implied"
                                : "explicit",
                          })
                        }
                        type="button"
                      >
                        {fact.confidence}
                      </button>
                      <button
                        aria-label="Remove fact"
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => removeFact(i)}
                        type="button"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
