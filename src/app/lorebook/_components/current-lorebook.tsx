"use client";

import { useLorebook } from "@/app/lorebook/_lib/hooks";
import { LorebookStatusDto } from "@/app/lorebook/_lib/schema";
import { Button } from "@/components/ui/button";
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

  const label =
    lorebook.status === "READY"
      ? lorebook.name
      : lorebook.status === "SERVER_UNAVAILABLE"
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
          "h-2 w-2 rounded-full shrink-0",
          STATUS_DOT_CLASS[lorebook.status],
        )}
      />
      <span>{label}</span>
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
