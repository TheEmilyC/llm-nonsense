"use client";

import Link from "next/link";
import { useTransition } from "react";

import { createBasicChatAction, deleteChatAction } from "@/app/chat/_lib/actions";
import { ChatListDto } from "@/app/chat/_lib/schema";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Content } from "@/components/content";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { DeleteIcon } from "@/lib/icons";

interface BasicChatListParams {
  chats: ChatListDto[];
}

export function BasicChatList({ chats }: BasicChatListParams) {
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      await createBasicChatAction();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteChatAction(id);
    });
  }

  return (
    <div>
      <Header pageTitle="Chats">
        <Button disabled={isPending} onClick={handleCreate} size="sm">
          New Chat
        </Button>
      </Header>
      <Content>
        {chats.length === 0 && (
          <p className="text-sm text-muted-foreground">No chats yet.</p>
        )}
        <div className="flex flex-col gap-2">
          {chats.map((chat) => (
            <div className="flex items-center gap-2" key={chat.id}>
              <Link
                className="flex-1 rounded-lg border px-4 py-3 hover:bg-muted transition-colors"
                href={`/chat/${chat.id}`}
              >
                <p className="text-sm font-medium">{chat.name}</p>
              </Link>
              <ConfirmDialog
                description={`Delete "${chat.name}"? This cannot be undone.`}
                onConfirm={() => handleDelete(chat.id)}
                title="Delete Chat?"
                type="delete"
              >
                <Button size="sm" variant="ghost">
                  <DeleteIcon className="h-4 w-4" />
                </Button>
              </ConfirmDialog>
            </div>
          ))}
        </div>
      </Content>
    </div>
  );
}
