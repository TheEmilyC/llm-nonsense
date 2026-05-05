"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useReplaceChatFacts } from "@/app/chat/_lib/hooks";
import { LorebookFact } from "@/app/lorebook/_lib/schema";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

interface FactsDrawerProps {
  chatId: string;
  facts: LorebookFact[];
  onFactsChange: (facts: LorebookFact[]) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function FactsDrawer({
  chatId,
  facts,
  onFactsChange,
  onOpenChange,
  open,
}: FactsDrawerProps) {
  const [editableFacts, setEditableFacts] = useState<LorebookFact[]>(facts);
  const { isPending: isSaving, replaceFacts } = useReplaceChatFacts();

  function handleOpenChange(next: boolean) {
    if (next) setEditableFacts(facts);
    onOpenChange(next);
  }

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

  async function handleSave() {
    const res = await replaceFacts({ chatId, facts: editableFacts });
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    onFactsChange(editableFacts);
    toast.success("Facts saved");
  }

  return (
    <Drawer onOpenChange={handleOpenChange} open={open}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Chat Facts</DrawerTitle>
          <DrawerDescription>Facts extracted from this chat.</DrawerDescription>
        </DrawerHeader>
        <div className="no-scrollbar overflow-y-auto px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              {editableFacts.length} fact{editableFacts.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <Button onClick={addFact} size="sm" variant="outline">
                Add fact
              </Button>
              <Button disabled={isSaving} onClick={handleSave} size="sm">
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
          {editableFacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No facts yet.</p>
          ) : (
            <ul className="space-y-2">
              {editableFacts.map((fact, i) => (
                <li className="flex items-center gap-2" key={i}>
                  <Input
                    className="flex-1 text-sm"
                    onChange={(e) => updateFact(i, { claim: e.target.value })}
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
        </div>
      </DrawerContent>
    </Drawer>
  );
}
