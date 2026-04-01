/*
  Warnings:

  - You are about to drop the column `lorebook` on the `Story` table. All the data in the column will be lost.
  - Made the column `port` on table `Lorebook` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lorebook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Lorebook" ("apiKey", "createdAt", "id", "modifiedAt", "name", "port") SELECT "apiKey", "createdAt", "id", "modifiedAt", "name", "port" FROM "Lorebook";
DROP TABLE "Lorebook";
ALTER TABLE "new_Lorebook" RENAME TO "Lorebook";
CREATE TABLE "new_Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "worldId" TEXT,
    "lorebookId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Story_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Story_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Story_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Story_lorebookId_fkey" FOREIGN KEY ("lorebookId") REFERENCES "Lorebook" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Story" ("characterId", "createdAt", "id", "modifiedAt", "name", "personaId", "worldId") SELECT "characterId", "createdAt", "id", "modifiedAt", "name", "personaId", "worldId" FROM "Story";
DROP TABLE "Story";
ALTER TABLE "new_Story" RENAME TO "Story";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
