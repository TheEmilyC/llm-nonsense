"use client";

import Link from "next/link";
import { useRef } from "react";
import { toast } from "sonner";

import { useCreatePrompt } from "@/app/prompt/_lib/hooks";
import { PromptListItemDto } from "@/app/prompt/_lib/schema";
import { parseSillyTavernPreset } from "@/app/prompt/_lib/sillytavern-import";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

interface PromptListProps {
  prompts: PromptListItemDto[];
}

export function PromptList({ prompts }: PromptListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createPrompt, isPending } = useCreatePrompt((error) =>
    toast.error(error.message),
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text) as unknown;
      const formValues = parseSillyTavernPreset(json);
      formValues.name = file.name.replace(/\.json$/i, "");
      await createPrompt(formValues);
    } catch (err) {
      toast.error(
        `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <Header pageTitle="Prompts">
        <input
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />
        <Button
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
          size="sm"
          variant="outline"
        >
          {isPending ? "Importing..." : "Import"}
        </Button>
        <Button asChild size="sm">
          <Link href="/prompt/new">New Prompt</Link>
        </Button>
      </Header>
      <Content>
        <div className="flex flex-col gap-2">
          {prompts.length === 0 && (
            <p className="text-sm text-muted-foreground">No prompts yet.</p>
          )}
          {prompts.map((prompt) => (
            <Link
              className="flex items-center justify-between rounded-md border bg-card px-4 py-3 hover:bg-accent transition-colors"
              href={`/prompt/${prompt.id}`}
              key={prompt.id}
            >
              <span className="font-medium">{prompt.name}</span>
              <span className="text-xs text-muted-foreground">
                {prompt.createdAt.toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      </Content>
    </div>
  );
}
