"use client";

import { GenerateLorebookUpdatesResult } from "@/app/lorebook/_lib/schema";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface LorebookUpdatesDrawerProps {
  data: GenerateLorebookUpdatesResult | undefined;
  isAccepting: boolean;
  onAccept: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const updateTypeLabel: Record<string, string> = {
  append: "Append",
  conflict: "Conflict",
  modify: "Modify",
  new_entry: "New Entry",
  no_change: "No Change",
};

const updateTypeVariant: Record<
  string,
  "default" | "destructive" | "outline" | "secondary"
> = {
  append: "default",
  conflict: "destructive",
  modify: "secondary",
  new_entry: "default",
  no_change: "outline",
};

export function LorebookUpdatesDrawer({
  data,
  isAccepting,
  onAccept,
  onOpenChange,
  open,
}: LorebookUpdatesDrawerProps) {
  const totalSuggestions = data?.reduce(
    (acc, entry) => acc + entry.suggestions.length,
    0,
  );

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Lorebook Update Suggestions</DrawerTitle>
          <DrawerDescription>
            {totalSuggestions !== undefined
              ? `${totalSuggestions} suggestion${totalSuggestions !== 1 ? "s" : ""} across ${data?.length} entr${data?.length !== 1 ? "ies" : "y"}`
              : "Review and apply these suggestions to your lorebook."}
          </DrawerDescription>
        </DrawerHeader>

        {data && (
          <div className="no-scrollbar overflow-y-auto px-4 space-y-6">
            {data.map((entry) => (
              <section key={entry.entryFilename}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 font-mono">
                  {entry.entryFilename}
                </h3>
                <div className="space-y-3">
                  {entry.suggestions.map((suggestion, i) => (
                    <div className="rounded-lg border overflow-hidden" key={i}>
                      <div className="px-3 py-2 bg-muted/50 border-b flex items-center gap-2">
                        <Badge variant={updateTypeVariant[suggestion.updateType]}>
                          {updateTypeLabel[suggestion.updateType]}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex-1">
                          {suggestion.reasoning}
                        </span>
                      </div>
                      <div className="px-3 py-2 space-y-2 text-sm">
                        {suggestion.updateType === "append" && (
                          <>
                            {suggestion.section && (
                              <p className="text-xs text-muted-foreground">
                                Section:{" "}
                                <span className="font-mono">
                                  {suggestion.section}
                                </span>
                              </p>
                            )}
                            <div className="flex items-start gap-1">
                              <p className="whitespace-pre-wrap flex-1">
                                {suggestion.proposedContent}
                              </p>
                              <CopyButton text={suggestion.proposedContent} />
                            </div>
                          </>
                        )}
                        {suggestion.updateType === "modify" && (
                          <div className="space-y-2">
                            <div className="rounded bg-destructive/10 px-2 py-1 text-xs line-through text-muted-foreground whitespace-pre-wrap">
                              {suggestion.currentContent}
                            </div>
                            <div className="flex items-start gap-1 rounded bg-green-500/10 px-2 py-1">
                              <span className="text-xs whitespace-pre-wrap flex-1">
                                {suggestion.proposedContent}
                              </span>
                              <CopyButton text={suggestion.proposedContent} />
                            </div>
                          </div>
                        )}
                        {suggestion.updateType === "new_entry" && (
                          <div className="flex items-start gap-1">
                            <p className="whitespace-pre-wrap flex-1">
                              {suggestion.proposedContent}
                            </p>
                            <CopyButton text={suggestion.proposedContent} />
                          </div>
                        )}
                        {suggestion.updateType === "conflict" && (
                          <div className="space-y-2">
                            <p className="text-xs text-destructive">
                              {suggestion.factDescription}
                            </p>
                            <div className="rounded bg-muted px-2 py-1 text-xs whitespace-pre-wrap text-muted-foreground">
                              {suggestion.existingContent}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <DrawerFooter>
          <Button disabled={isAccepting} onClick={onAccept}>
            {isAccepting ? "Clearing…" : "Accept & Clear Facts"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
