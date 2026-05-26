import { connection } from "next/server";
import { Suspense } from "react";

import { BasicChatList } from "@/app/chat/_components/basic-chat-list";
import { getChatListDto } from "@/app/chat/_lib/data";

export default function ChatListPage() {
  return (
    <Suspense>
      <ChatListPageContent />
    </Suspense>
  );
}

async function ChatListPageContent() {
  await connection();
  const chats = await getChatListDto();
  return <BasicChatList chats={chats} />;
}
