"use client";

import { useLorebook } from "@/app/lorebook/_lib/hooks";
import { LorebookStatusDto } from "@/app/lorebook/_lib/schema";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LorebookIcon, RefreshIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface CurrentLorebookProps {
  initialLorebook: LorebookStatusDto;
  lorebookId: string;
}

const STATUS_DOT_CLASS: Record<string, string> = {
  ERRROR: "bg-destructive",
  NONE_SELECTED: "bg-muted-foreground/40",
  READY: "bg-green-500",
  SERVER_UNAVAILABLE: "bg-destructive",
  UNAUTHORIZED: "bg-amber-500",
};

export function CurrentLorebook({
  initialLorebook,
  lorebookId,
}: CurrentLorebookProps) {
  const { isPending, lorebook, refreshLorebook } = useLorebook({
    initialLorebook,
    lorebookId,
  });

  if (!lorebook) return null;

  const refreshButton = (
    <Button
      disabled={isPending}
      onClick={() => refreshLorebook()}
      size="icon-xs"
      title="Retry connection"
      type="button"
      variant="ghost"
    >
      <RefreshIcon className={isPending ? "animate-spin" : undefined} />
    </Button>
  );

  if (lorebook.status === "READY") {
    return (
      <Drawer direction="right">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DrawerTrigger asChild>
            <button className="flex cursor-pointer items-center gap-2 transition-colors hover:text-foreground">
              <LorebookIcon className="h-4 w-4 shrink-0" />
              <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
              <span>{lorebook.name}</span>
            </button>
          </DrawerTrigger>
          {refreshButton}
        </div>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{lorebook.name}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
            <EntrySection entries={lorebook.constants} title="Constants" />
            <EntrySection entries={lorebook.entries} title="Entries" />
            <EntrySection entries={lorebook.memories} title="Memories" />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  const label =
    lorebook.status === "SERVER_UNAVAILABLE"
      ? "Unavailable"
      : lorebook.status === "UNAUTHORIZED"
        ? "Unauthorized"
        : "Error";

  const tooltipContent =
    lorebook.status === "UNAUTHORIZED"
      ? "Your API key may be wrong."
      : lorebook.status === "ERRROR"
        ? `Code: ${lorebook.error.errorCode} — ${lorebook.error.message}`
        : null;

  const indicator = (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <LorebookIcon className="h-4 w-4 shrink-0" />
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          STATUS_DOT_CLASS[lorebook.status],
        )}
      />
      <span>{label}</span>
      {refreshButton}
    </div>
  );

  if (!tooltipContent) return indicator;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{indicator}</TooltipTrigger>
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
}

function EntrySection({
  entries,
  title,
}: {
  entries: { filename: string; name: string; summary: string }[];
  title: string;
}) {
  if (entries.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.filename}>
            <p className="text-sm font-medium">{entry.name}</p>
            {entry.summary && (
              <p className="text-xs text-muted-foreground">{entry.summary}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
