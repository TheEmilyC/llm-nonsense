-- Insert GENERATED_FACTS inject fragment for every existing Prompt
INSERT INTO "PromptFragment" ("id", "name", "type", "role", "enabled", "content", "injectTag", "order", "promptId", "createdAt", "modifiedAt")
SELECT
 'c' || lower(hex(randomblob(12))),
 'Generated Facts',
 'INJECT',
 'system',
 1,
 NULL,
 'GENERATED_FACTS',
 (SELECT COALESCE(MAX("order"), -1) + 1 FROM "PromptFragment" WHERE "promptId" = p.id),
 p.id,
 CURRENT_TIMESTAMP,
 CURRENT_TIMESTAMP
FROM "Prompt" p;
