/*
  Warnings:

  - You are about to drop the column `metadata` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `parts` on the `ChatMessage` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "MessageContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "parts" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageContent_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ChatMessage" ("chatId", "createdAt", "id", "modifiedAt", "role") SELECT "chatId", "createdAt", "id", "modifiedAt", "role" FROM "ChatMessage";
DROP TABLE "ChatMessage";
ALTER TABLE "new_ChatMessage" RENAME TO "ChatMessage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
