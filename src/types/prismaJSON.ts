import { UIDataTypes, UIMessagePart, UITools } from "ai";

import { LorebookFact, MessageMetadata } from "@/app/chat/_lib/schema";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type ChatFacts = LorebookFact[];
    type ChatMessageMetadata = MessageMetadata;
    type ChatMessageParts = UIMessagePart<UIDataTypes, UITools>[];
  }
}

export {};
