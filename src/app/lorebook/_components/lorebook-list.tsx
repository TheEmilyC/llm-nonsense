import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface LorebookListParams {
  lorebooks: { id: string; name: string }[];
}

export function LorebookList({ lorebooks }: LorebookListParams) {
  return (
    <div>
      <Header pageTitle="Lorebooks">
        <Button size="sm" asChild>
          <Link href={"/lorebook/new"}>New Lorebook</Link>
        </Button>
      </Header>
      <Content>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lorebooks.map((lorebook) => (
            <Link
              key={lorebook.id}
              href={`/lorebook/${lorebook.id}`}
              className="rounded-lg border px-4 py-3 hover:bg-muted transition-colors"
            >
              <p className="font-medium text-sm">{lorebook.name}</p>
            </Link>
          ))}
        </div>
      </Content>
    </div>
  );
}
