"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUp, Square } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useCheckPrompt } from "@/app/prompt/_lib/hooks";
import {
  promptInspectorFormSchema,
  PromptInspectorFormValues,
} from "@/app/prompt/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";

const FORM_ID = "form-inspect-prompt";

export function PromptInspector() {
  const [prompt, setPrompt] = useState<null | string>(null);
  const [lorebookEntries, setLorebookEntries] = useState<
    null | { path: string; title?: string }[]
  >(null);
  const { checkPrompt, isPending } = useCheckPrompt();
  const form = useForm<PromptInspectorFormValues>({
    defaultValues: {
      message: "",
    },
    mode: "onSubmit",
    resolver: zodResolver(promptInspectorFormSchema),
  });

  async function onSubmitHandler(data: PromptInspectorFormValues) {
    const { lorebookEntries: newLorebook, prompt: newPrompt } =
      await checkPrompt(data);
    setPrompt(newPrompt);
    if (newLorebook) {
      setLorebookEntries(newLorebook);
    } else {
      setLorebookEntries(null);
    }
  }

  return (
    <div>
      <Header pageTitle="Prompt Inspector"></Header>
      <Content>
        <div className="flex flex-col gap-4">
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmitHandler)}>
            <FieldGroup>
              <Controller
                control={form.control}
                name={"message"}
                render={({ field }) => (
                  <PromptInput
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <PromptInputTextarea placeholder="Send a message…" />
                    <PromptInputActions className="justify-end">
                      <PromptInputAction tooltip={isPending ? "Stop" : "Send"}>
                        <Button
                          className="h-8 w-8 rounded-full"
                          disabled={!field.value.trim() && !isPending}
                          size="sm"
                        >
                          {isPending ? (
                            <Square className="h-4 w-4" />
                          ) : (
                            <ArrowUp className="h-4 w-4" />
                          )}
                        </Button>
                      </PromptInputAction>
                    </PromptInputActions>
                  </PromptInput>
                )}
              />
            </FieldGroup>
          </form>
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-h-96 rounded-md border bg-muted/30 p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Prompt
              </p>
              <div className="text-sm text-muted-foreground/50 italic whitespace-pre-wrap">
                {prompt || "Prompt will appear here…"}
              </div>
            </div>
            <div className="w-64 min-h-96 rounded-md border bg-muted/30 p-4 shrink-0">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Active Lorebook Items
              </p>
              <div className="text-sm text-muted-foreground/50 italic">
                <ul>
                  {lorebookEntries?.map((lb) => (
                    <li key={lb.path}>{lb.title || lb.path}</li>
                  )) || "No active entries"}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Content>
    </div>
  );
}
