"use client";

import { WorldForm } from "@/app/world/_components/world-form";
import { useDeleteWorld, useUpdateWorld } from "@/app/world/_lib/hooks";
import { WorldDto, WorldFormValues } from "@/app/world/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const FORM_ID = "form-edit-world";

interface WorldEditParams {
  world: WorldDto;
}

export function WorldEdit({ world }: WorldEditParams) {
  const router = useRouter();
  const { deleteWorld, isPending: isDeletePending } = useDeleteWorld();
  const { updateWorld, isPending: isUpdatePending } = useUpdateWorld();

  const isPending = isDeletePending || isUpdatePending;

  async function deleteHandler() {
    if (!confirm(`Delete "${world?.name}"? This cannot be undone.`)) return;
    await deleteWorld({ worldId: world.id });
    router.push(`/world`);
  }

  async function onSubmitHandler(data: WorldFormValues) {
    await updateWorld({ worldId: world.id, data });
  }

  return (
    <div>
      <Header
        pageTitle={world.name}
        backLinkDestination="/world"
        backLinkLabel="Worlds"
      >
        <Button
          size="sm"
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={deleteHandler}
        >
          {isDeletePending ? "Deleting..." : "Delete"}
        </Button>
        <Button size="sm" type="submit" form={FORM_ID} disabled={isPending}>
          {isUpdatePending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        <WorldForm
          formId={FORM_ID}
          defaultValues={world}
          imageSrc={world.imageUrl}
          onSubmit={onSubmitHandler}
        />
      </Content>
    </div>
  );
}
