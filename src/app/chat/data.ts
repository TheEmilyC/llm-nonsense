import { prisma } from "@/lib/prisma";

export interface FindChatByIdWithMessagesParams {
  id: string;
  take?: number;
  skip?: number;
}

export async function getMessagesForChat({
  id,
  take = 50,
  skip = 0,
}: FindChatByIdWithMessagesParams) {
  const chat = await prisma.chat.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take,
        skip,
      },
      story: {
        include: {
          character: true,
          persona: true,
        },
      },
    },
  });

  if (chat) chat.messages.reverse();

  return chat;
}
