"use client";

import Link from "next/link";

import { PromptListItemDto } from "@/app/prompt/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

interface PromptListProps {
  prompts: PromptListItemDto[];
}

export function PromptList({ prompts }: PromptListProps) {
  return (
    <div>
      <Header pageTitle="Prompts">
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
