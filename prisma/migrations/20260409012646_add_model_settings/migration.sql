-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "maxTokens" INTEGER NOT NULL DEFAULT 80000,
    "maxOutputTokens" INTEGER NOT NULL DEFAULT 9000,
    "maxSteps" INTEGER NOT NULL DEFAULT 20,
    "temperature" REAL NOT NULL DEFAULT 0.9,
    "topK" INTEGER NOT NULL DEFAULT 64,
    "topP" REAL NOT NULL DEFAULT 0.95,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Prompt" ("createdAt", "id", "maxTokens", "modifiedAt", "name") SELECT "createdAt", "id", "maxTokens", "modifiedAt", "name" FROM "Prompt";
DROP TABLE "Prompt";
ALTER TABLE "new_Prompt" RENAME TO "Prompt";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
