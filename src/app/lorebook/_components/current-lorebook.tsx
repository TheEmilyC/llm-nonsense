"use client";

import {
  useInitializeLorebook,
  useLorebook,
  useRefreshLorebookConnection,
} from "@/app/lorebook/hooks";
import {
  initializeLorebookFormSchema,
  InitializeLorebookFormValues,
  LorebookDto,
  LorebookStatus,
} from "@/app/lorebook/schema";
import { FieldInput } from "@/components/form-fields/field-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";

interface CurrentLorebookProps {
  initialLorebook: LorebookDto;
}

export function CurrentLorebook({ initialLorebook }: CurrentLorebookProps) {
  const { lorebook, isLoading } = useLorebook({ initialLorebook });
  const {
    refreshLorebook,
    isPending: refreshIsPending,
    error: refreshError,
  } = useRefreshLorebookConnection();
  const {
    initializeLorebook,
    isPending: intializeIsPending,
    error: initializeError,
  } = useInitializeLorebook();

  const isPending = refreshIsPending || intializeIsPending || isLoading;
  const error = refreshError || initializeError;

  const form = useForm<InitializeLorebookFormValues>({
    resolver: zodResolver(initializeLorebookFormSchema),
    defaultValues: { name: "" },
  });

  function onSubmitHandler(data: InitializeLorebookFormValues) {
    initializeLorebook(data);
  }

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
          <RefreshCw
            className={refreshIsPending ? "animate-spin" : undefined}
          />
        </Button>
      </span>
      <div className="mt-1">
        {error && <p className="text-destructive">{error}</p>}
        {lorebook.status === LorebookStatus.Ready ? (
          <Badge variant="secondary">{lorebook.name}</Badge>
        ) : lorebook.status === LorebookStatus.ServerUnavailable ? (
          <Badge variant="destructive">Server unavailable</Badge>
        ) : (
          <Dialog>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground italic">
                Not initialized
              </span>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="xs">
                  Initialize
                </Button>
              </DialogTrigger>
            </div>
            <DialogContent aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>Initialize Lorebook</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmitHandler)}>
                <FieldInput
                  control={form.control}
                  name="name"
                  label="Name"
                  placeholder="My Lorebook"
                />
                <DialogFooter showCloseButton className="mt-4">
                  <Button type="submit" disabled={isPending}>
                    Initialize
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
