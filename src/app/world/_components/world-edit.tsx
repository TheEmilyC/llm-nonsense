"use client";

import { useRouter } from "next/navigation";

import { WorldForm } from "@/app/world/_components/world-form";
import { useDeleteWorld, useUpdateWorld } from "@/app/world/_lib/hooks";
import { WorldDto, WorldFormValues } from "@/app/world/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-edit-world";

interface WorldEditParams {
  world: WorldDto;
}

export function WorldEdit({ world }: WorldEditParams) {
  const router = useRouter();
  const { deleteWorld, isPending: isDeletePending } = useDeleteWorld();
  const { isPending: isUpdatePending, updateWorld } = useUpdateWorld();

  const isPending = isDeletePending || isUpdatePending;

  async function deleteHandler() {
    if (!confirm(`Delete "${world?.name}"? This cannot be undone.`)) return;
    await deleteWorld({ worldId: world.id });
    router.push(`/world`);
  }

  async function onSubmitHandler(data: WorldFormValues) {
    await updateWorld({ data, worldId: world.id });
  }

  return (
    <div>
      <Header
        backLinkDestination="/world"
        backLinkLabel="Worlds"
        pageTitle={world.name}
      >
        <Button
          disabled={isPending}
          onClick={deleteHandler}
          size="sm"
          type="button"
          variant="destructive"
        >
          {isDeletePending ? "Deleting..." : "Delete"}
        </Button>
        <Button disabled={isPending} form={FORM_ID} size="sm" type="submit">
          {isUpdatePending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        <WorldForm
          defaultValues={world}
          formId={FORM_ID}
          imageSrc={world.imageUrl}
          onSubmit={onSubmitHandler}
        />
      </Content>
    </div>
  );
}
