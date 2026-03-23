"use client";

import Link from "next/link";

import { CardTile } from "@/components/card-tile";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

interface PersonaListParams {
  personas: { id: string; name: string; imageUrl: string }[];
}

export function PersonaList({ personas }: PersonaListParams) {
  return (
    <div>
      <Header pageTitle="Personas">
        <Button size="sm" asChild>
          <Link href={"/persona/new"}>New Persona</Link>
        </Button>
      </Header>
      <Content>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => (
            <Link key={persona.id} href={`/persona/${persona.id}`}>
              <CardTile src={persona.imageUrl} name={persona.name} />
            </Link>
          ))}
        </div>
      </Content>
    </div>
  );
}
