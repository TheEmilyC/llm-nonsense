-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "maxTokens" INTEGER NOT NULL DEFAULT 80000,
    "maxOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "maxSteps" INTEGER NOT NULL DEFAULT 20,
    "temperature" REAL NOT NULL DEFAULT 0.9,
    "topK" INTEGER NOT NULL DEFAULT 64,
    "topP" REAL NOT NULL DEFAULT 0.95,
    "prefetch" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Prompt" ("createdAt", "id", "maxOutputTokens", "maxSteps", "maxTokens", "modifiedAt", "name", "temperature", "topK", "topP") SELECT "createdAt", "id", "maxOutputTokens", "maxSteps", "maxTokens", "modifiedAt", "name", "temperature", "topK", "topP" FROM "Prompt";
DROP TABLE "Prompt";
ALTER TABLE "new_Prompt" RENAME TO "Prompt";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
