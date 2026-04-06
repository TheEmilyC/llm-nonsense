"use client";

import Link from "next/link";

import { CardTile } from "@/components/card-tile";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

interface PersonaListParams {
  personas: { id: string; imageUrl: string; name: string; }[];
}

export function PersonaList({ personas }: PersonaListParams) {
  return (
    <div>
      <Header pageTitle="Personas">
        <Button asChild size="sm">
          <Link href={"/persona/new"}>New Persona</Link>
        </Button>
      </Header>
      <Content>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => (
            <Link href={`/persona/${persona.id}`} key={persona.id}>
              <CardTile name={persona.name} src={persona.imageUrl} />
            </Link>
          ))}
        </div>
      </Content>
    </div>
  );
}
