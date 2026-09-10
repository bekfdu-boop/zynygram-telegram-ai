ALTER TABLE "Conversation"
  ADD COLUMN IF NOT EXISTS "businessConnectionId" TEXT,
  ADD COLUMN IF NOT EXISTS "businessChatId" BIGINT;
