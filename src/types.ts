import { UIDataTypes, UIMessagePart, UITools } from "ai";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type ChatMessageMeta = { unused: string };
    type ChatMessageParts = UIMessagePart<UIDataTypes, UITools>[];
  }
}

export {};
