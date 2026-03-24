"use client";
import Link from "next/link";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

interface StoriesListParams {
  stories: { id: string; name: string }[];
}

export function StoriesList({ stories }: StoriesListParams) {
  return (
    <div>
      <Header>
        <Button asChild>
          <Link href="/story/new">New Story</Link>
        </Button>
      </Header>

      <main className="mx-auto max-w-4xl p-6">
        <div className="flex flex-col gap-2">
          {stories.map((story) => (
            <Link
              key={story.id}
              href={`/story/${story.id}`}
              className="rounded-lg border px-4 py-3 hover:bg-muted transition-colors"
            >
              <p className="font-medium text-sm">{story.name}</p>
            </Link>
          ))}
          {stories.length === 0 && (
            <p className="text-sm text-muted-foreground">No stories yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}
