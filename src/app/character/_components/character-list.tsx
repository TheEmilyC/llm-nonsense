"use client";
import { importCharacterFromPNG } from "@/app/character/actions";
import {
  ImportFromPngForm,
  importFromPngFormSchema,
} from "@/app/character/validators";
import { CardTile } from "@/components/card-tile";
import { Content } from "@/components/content";
import { FieldImageUploadField } from "@/components/form-fields/field-image-upload";
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
import { ActionResponse } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState } from "react";
import { useForm } from "react-hook-form";

interface CharacterListParams {
  characters: { id: string; name: string; pngHash: string }[];
}

const initialState: ActionResponse<{ id: string }> = {
  success: undefined,
};

export function CharacterList({ characters }: CharacterListParams) {
  const [state, formAction, pending] = useActionState(
    importCharacterFromPNG,
    initialState,
  );

  const form = useForm<ImportFromPngForm>({
    resolver: zodResolver(importFromPngFormSchema),
  });

  console.log("errors", form.formState.errors);

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
            <form action={formAction}>
              <DialogHeader>
                <DialogTitle>Import from PNG</DialogTitle>
                <DialogDescription>
                  Import a character png with character card V2 or V3 data
                  embedded
                </DialogDescription>
              </DialogHeader>
              <FieldImageUploadField
                control={form.control}
                name="png"
                label=""
                acceptedFormats="png"
              />
              {state?.success === false && (
                <p className="text-sm text-destructive">{state.message}</p>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={pending}>
                  {pending ? "Importing..." : "Import"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Button size="sm" asChild>
          <Link href="/character/new">New Character</Link>
        </Button>
      </Header>
      <Content>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => (
            <Link
              key={character.id}
              href={`/character/${character.id}`}
              className="group relative rounded-lg overflow-hidden aspect-3/4 bg-muted hover:ring-2 hover:ring-foreground/30 transition-all"
            >
              <CardTile
                src={buildCharacterImageUrl({
                  id: character.id,
                  pngHash: character.pngHash,
                })}
                name={character.name}
              />
            </Link>
          ))}
        </div>
      </Content>
    </div>
  );
}
