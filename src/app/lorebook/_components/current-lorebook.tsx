"use client";

import {
  initializeLorebookAction,
  refreshLorebookConnectionAction,
} from "@/app/lorebook/actions";
import {
  initializeLorebookFormSchema,
  InitializeLorebookFormValues,
  Lorebook,
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
import { ActionResponse } from "@/lib/action-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw } from "lucide-react";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";

interface CurrentLorebookProps {
  initialLorebook: { status: LorebookStatus; name?: string };
  onChange?: (lorebook: { status: LorebookStatus; name?: string }) => void;
}

export function CurrentLorebook({
  initialLorebook,
  onChange,
}: CurrentLorebookProps) {
  const [lorebookState, retryLorebook, isRetrying] = useActionState(
    refreshLorebookConnectionAction,
    { success: undefined },
  );

  const [initState, initAction, isInitializing] = useActionState<
    ActionResponse<Lorebook>,
    FormData
  >(initializeLorebookAction, { success: undefined });

  const effectiveLorebook: { status: LorebookStatus; name?: string } =
    initState.success === true
      ? initState.data
      : lorebookState.success === true
        ? lorebookState.data
        : initialLorebook;

  useEffect(() => {
    if (lorebookState.success === true) onChange?.(lorebookState.data);
  }, [lorebookState, onChange]);

  useEffect(() => {
    if (initState.success === true) {
      onChange?.(initState.data);
    }
  }, [initState, onChange]);

  const form = useForm<InitializeLorebookFormValues>({
    resolver: zodResolver(initializeLorebookFormSchema),
    defaultValues: { name: "" },
  });

  function onSubmitHandler(data: InitializeLorebookFormValues) {
    const formData = new FormData();
    formData.append("name", data.name);
    startTransition(() => initAction(formData));
  }

  return (
    <div>
      <span className="text-muted-foreground">
        Current{" "}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={isRetrying}
          onClick={() => startTransition(() => retryLorebook())}
          title="Retry connection"
        >
          <RefreshCw className={isRetrying ? "animate-spin" : undefined} />
        </Button>
      </span>
      <div className="mt-1">
        {effectiveLorebook.status === LorebookStatus.Ready ? (
          <Badge variant="secondary">{effectiveLorebook.name}</Badge>
        ) : effectiveLorebook.status === LorebookStatus.ServerUnavailable ? (
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
                  <Button type="submit" disabled={isInitializing}>
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
