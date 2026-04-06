import Link from "next/link";

import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

interface LorebookListParams {
  lorebooks: { id: string; name: string }[];
}

export function LorebookList({ lorebooks }: LorebookListParams) {
  return (
    <div>
      <Header pageTitle="Lorebooks">
        <Button asChild size="sm">
          <Link href={"/lorebook/new"}>New Lorebook</Link>
        </Button>
      </Header>
      <Content>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lorebooks.map((lorebook) => (
            <Link
              className="rounded-lg border px-4 py-3 hover:bg-muted transition-colors"
              href={`/lorebook/${lorebook.id}`}
              key={lorebook.id}
            >
              <p className="font-medium text-sm">{lorebook.name}</p>
            </Link>
          ))}
        </div>
      </Content>
    </div>
  );
}
