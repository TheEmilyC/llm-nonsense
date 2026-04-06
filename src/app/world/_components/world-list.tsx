"use client";

import Link from "next/link";

import { CardTile } from "@/components/card-tile";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

interface WorldListParams {
  worlds: { id: string; imageUrl: string; name: string; }[];
}

export function WorldList({ worlds }: WorldListParams) {
  return (
    <div>
      <Header pageTitle="Worlds">
        <Button asChild size="sm">
          <Link href={"/world/new"}>New World</Link>
        </Button>
      </Header>
      <Content>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {worlds.map((world) => (
            <Link href={`/world/${world.id}`} key={world.id}>
              <CardTile name={world.name} src={world.imageUrl} />
            </Link>
          ))}
        </div>
      </Content>
    </div>
  );
}
