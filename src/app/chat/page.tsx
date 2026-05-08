import { BasicChatList } from "@/app/chat/_components/basic-chat-list";
import { getChatListDto } from "@/app/chat/_lib/data";

export default async function ChatListPage() {
  const chats = await getChatListDto();
  return <BasicChatList chats={chats} />;
}
