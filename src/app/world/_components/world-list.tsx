"use client";

import { CardTile } from "@/components/card-tile";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface WorldListParams {
  worlds: { id: string; name: string; imageUrl: string }[];
}

export function WorldList({ worlds }: WorldListParams) {
  return (
    <div>
      <Header pageTitle="Worlds">
        <Button size="sm" asChild>
          <Link href={"/world/new"}>New World</Link>
        </Button>
      </Header>
      <Content>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {worlds.map((world) => (
            <Link key={world.id} href={`/world/${world.id}`}>
              <CardTile src={world.imageUrl} name={world.name} />
            </Link>
          ))}
        </div>
      </Content>
    </div>
  );
}
