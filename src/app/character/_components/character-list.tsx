"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { useImportCharacterFromPNG } from "@/app/character/_lib/hooks";
import {
  ImportFromPngForm,
  importFromPngFormSchema,
} from "@/app/character/_lib/schema";
import { CardTile } from "@/components/card-tile";
import { Content } from "@/components/content";
import { FieldImageUpload } from "@/components/form-fields/field-image-upload";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { buildCharacterImageUrl } from "@/lib/image";

interface CharacterListParams {
  characters: { id: string; name: string; pngHash: string }[];
}

export function CharacterList({ characters }: CharacterListParams) {
  const { importCharacter, isPending } = useImportCharacterFromPNG();

  const form = useForm<ImportFromPngForm>({
    resolver: zodResolver(importFromPngFormSchema),
  });

  async function onSubmitHandler(data: ImportFromPngForm) {
    await importCharacter(data);
  }

  return (
    <div>
      <Header pageTitle="Characters">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              Import from PNG
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <form onSubmit={form.handleSubmit(onSubmitHandler)}>
              <DialogHeader>
                <DialogTitle>Import from PNG</DialogTitle>
                <DialogDescription>
                  Import a character png with character card V2 or V3 data
                  embedded
                </DialogDescription>
              </DialogHeader>
              <FieldImageUpload
                acceptedFormats="png"
                control={form.control}
                label=""
                name="png"
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  disabled={isPending || !form.formState.isValid}
                  type="submit"
                >
                  {isPending ? "Importing..." : "Import"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Button asChild size="sm">
          <Link href="/character/new">New Character</Link>
        </Button>
      </Header>
      <Content>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => (
            <Link
              className="group relative rounded-lg overflow-hidden aspect-3/4 bg-muted hover:ring-2 hover:ring-foreground/30 transition-all"
              href={`/character/${character.id}`}
              key={character.id}
            >
              <CardTile
                name={character.name}
                src={buildCharacterImageUrl({
                  id: character.id,
                  pngHash: character.pngHash,
                })}
              />
            </Link>
          ))}
        </div>
      </Content>
    </div>
  );
}
