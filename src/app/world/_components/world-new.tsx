"use client";

import { useRouter } from "next/navigation";

import { WorldForm } from "@/app/world/_components/world-form";
import { useCreateWorld } from "@/app/world/_lib/hooks";
import { WorldFormValues } from "@/app/world/_lib/schema";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

const FORM_ID = "form-new-world";

export function WorldNew() {
  const router = useRouter();
  const { createWorld, isPending } = useCreateWorld();

  async function onSubmitHandler(data: WorldFormValues) {
    const { id } = await createWorld(data);
    router.push(`/world/${id}`);
  }

  return (
    <div>
      <Header
        backLinkDestination="/world"
        backLinkLabel="Worlds"
        pageTitle="New World"
      >
        <Button disabled={isPending} form={FORM_ID} size="sm" type="submit">
          {isPending ? "Saving..." : "Save"}
        </Button>
      </Header>
      <Content>
        <WorldForm formId={FORM_ID} onSubmit={onSubmitHandler} />
      </Content>
    </div>
  );
}
