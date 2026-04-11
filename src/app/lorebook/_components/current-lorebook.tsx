"use client";

import { RefreshCw } from "lucide-react";

import { useLorebook } from "@/app/lorebook/_lib/hooks";
import { LorebookStatus, LorebookStatusDto } from "@/app/lorebook/_lib/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CurrentLorebookProps {
  initialLorebook?: LorebookStatusDto;
  lorebookId: string;
}

export function CurrentLorebook({
  initialLorebook,
  lorebookId,
}: CurrentLorebookProps) {
  const { isPending, lorebook, refreshLorebook } = useLorebook({
    initialLorebook,
    lorebookId,
  });

  if (!lorebook) {
    return <></>;
  }

  return (
    <div>
      <span className="text-muted-foreground">
        Current{" "}
        <Button
          disabled={isPending}
          onClick={() => refreshLorebook()}
          size="icon-xs"
          title="Retry connection"
          type="button"
          variant="ghost"
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
