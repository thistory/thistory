-- AlterTable: change default ai_model to gpt-4.1-nano
ALTER TABLE "users" ALTER COLUMN "ai_model" SET DEFAULT 'gpt-4.1-nano';

-- Update existing OpenAI users to use the new default model
UPDATE "users" SET "ai_model" = 'gpt-4.1-nano' WHERE "ai_provider" = 'openai' AND "ai_model" IN ('gpt-4.1-mini', 'gpt-4o-mini');
