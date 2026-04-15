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
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Prompt" ("createdAt", "id", "maxOutputTokens", "maxSteps", "maxTokens", "modifiedAt", "name", "temperature", "topK", "topP") SELECT "createdAt", "id", coalesce("maxOutputTokens", 0) AS "maxOutputTokens", "maxSteps", "maxTokens", "modifiedAt", "name", "temperature", "topK", "topP" FROM "Prompt";
DROP TABLE "Prompt";
ALTER TABLE "new_Prompt" RENAME TO "Prompt";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Migrate PromptFragment.injectTag from camelCase to SCREAMING_SNAKE_CASE values
UPDATE "PromptFragment" SET "injectTag" = 'LAST_MESSAGE' WHERE "injectTag" = 'lastMessage';
UPDATE "PromptFragment" SET "injectTag" = 'CHARACTER_DESCRIPTION' WHERE "injectTag" = 'characterDescription';
UPDATE "PromptFragment" SET "injectTag" = 'CHARACTER_PERSONALITY' WHERE "injectTag" = 'characterPersonality';
UPDATE "PromptFragment" SET "injectTag" = 'CHARACTER_SCENARIO' WHERE "injectTag" = 'characterScenario';
UPDATE "PromptFragment" SET "injectTag" = 'PERSONA_DESCRIPTION' WHERE "injectTag" = 'personaDescription';
UPDATE "PromptFragment" SET "injectTag" = 'WORLD_DESCRIPTION' WHERE "injectTag" = 'worldDescription';
UPDATE "PromptFragment" SET "injectTag" = 'LOREBOOK_ENTRIES' WHERE "injectTag" = 'lorebook';
-- chatHistory has no equivalent in the new enum
UPDATE "PromptFragment" SET "injectTag" = NULL WHERE "injectTag" = 'chatHistory';

-- Migrate PromptFragment.type from camelCase to SCREAMING_SNAKE_CASE values
UPDATE "PromptFragment" SET "type" = 'CHAT_HISTORY' WHERE "type" = 'chatHistory';
UPDATE "PromptFragment" SET "type" = 'CONTENT' WHERE "type" = 'content';
UPDATE "PromptFragment" SET "type" = 'INJECT' WHERE "type" = 'inject';

-- Insert new INJECT fragments for every existing Prompt
INSERT INTO "PromptFragment" ("id", "name", "type", "role", "enabled", "content", "injectTag", "order", "promptId", "createdAt", "modifiedAt")
SELECT
 'c' || lower(hex(randomblob(12))),
 'Lorebook Memories',
 'INJECT',
 'system',
 1,
 NULL,
 'LOREBOOK_MEMORIES',
 (SELECT COALESCE(MAX("order"), -1) + 1 FROM "PromptFragment" WHERE "promptId" = p.id),
 p.id,
 CURRENT_TIMESTAMP,
 CURRENT_TIMESTAMP
FROM "Prompt" p;

INSERT INTO "PromptFragment" ("id", "name", "type", "role", "enabled", "content", "injectTag", "order", "promptId", "createdAt", "modifiedAt")
SELECT
 'c' || lower(hex(randomblob(12))),
 'Lorebook Context',
 'INJECT',
 'system',
 1,
 NULL,
 'LOREBOOK_CONTEXT',
 (SELECT COALESCE(MAX("order"), -1) + 1 FROM "PromptFragment" WHERE "promptId" = p.id),
 p.id,
 CURRENT_TIMESTAMP,
 CURRENT_TIMESTAMP
FROM "Prompt" p;

INSERT INTO "PromptFragment" ("id", "name", "type", "role", "enabled", "content", "injectTag", "order", "promptId", "createdAt", "modifiedAt")
SELECT
 'c' || lower(hex(randomblob(12))),
 'Lorebook Constant',
 'INJECT',
 'system',
 1,
 NULL,
 'LOREBOOK_CONSTANT',
 (SELECT COALESCE(MAX("order"), -1) + 1 FROM "PromptFragment" WHERE "promptId" = p.id),
 p.id,
 CURRENT_TIMESTAMP,
 CURRENT_TIMESTAMP
FROM "Prompt" p;