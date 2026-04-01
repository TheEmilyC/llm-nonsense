"use client";

import { useLorebook } from "@/app/lorebook/_lib/hooks";
import { LorebookDto, LorebookStatus } from "@/app/lorebook/_lib/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw } from "lucide-react";

interface CurrentLorebookProps {
  lorebookId: string;
  initialLorebook?: LorebookDto;
}

export function CurrentLorebook({
  lorebookId,
  initialLorebook,
}: CurrentLorebookProps) {
  const { lorebook, refreshLorebook, isPending } = useLorebook({
    lorebookId,
    initialLorebook,
  });

  if (!lorebook) {
    return <></>;
  }

  return (
    <div>
      <span className="text-muted-foreground">
        Current{" "}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={isPending}
          onClick={() => refreshLorebook()}
          title="Retry connection"
        >
          <RefreshCw className={isPending ? "animate-spin" : undefined} />
        </Button>
      </span>
      <div className="mt-1">
        {lorebook.status === LorebookStatus.Ready && (
          <Badge variant="secondary">{lorebook.name}</Badge>
        )}
        {lorebook.status === LorebookStatus.ServerUnavailable && (
          <Badge variant="destructive">Server unavailable</Badge>
        )}
        {lorebook.status === LorebookStatus.Unauthorized && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="ghost">Unauthorized</Badge>
            </TooltipTrigger>
            <TooltipContent>
              Your API key may be wrong, or you have the wrong Obsidian lorebook
              running.
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
