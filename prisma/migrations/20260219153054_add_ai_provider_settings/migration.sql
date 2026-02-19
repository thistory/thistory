-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ai_model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
ADD COLUMN     "ai_provider" TEXT NOT NULL DEFAULT 'openai',
ADD COLUMN     "ollama_url" TEXT NOT NULL DEFAULT 'http://localhost:11434';
