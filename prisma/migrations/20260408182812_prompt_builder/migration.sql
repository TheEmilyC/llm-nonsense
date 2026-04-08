/*
  Warnings:

  - Added the required column `type` to the `PromptFragment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "maxTokens" INTEGER NOT NULL DEFAULT 80000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Prompt" ("createdAt", "id", "modifiedAt", "name") SELECT "createdAt", "id", "modifiedAt", "name" FROM "Prompt";
DROP TABLE "Prompt";
ALTER TABLE "new_Prompt" RENAME TO "Prompt";
CREATE TABLE "new_PromptFragment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "role" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "content" TEXT,
    "injectTag" TEXT,
    "order" INTEGER NOT NULL,
    "promptId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptFragment_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PromptFragment" ("content", "createdAt", "enabled", "id", "injectTag", "modifiedAt", "name", "order", "promptId", "role") SELECT "content", "createdAt", "enabled", "id", "injectTag", "modifiedAt", "name", "order", "promptId", "role" FROM "PromptFragment";
DROP TABLE "PromptFragment";
ALTER TABLE "new_PromptFragment" RENAME TO "PromptFragment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
