-- Add on-chain balance snapshot columns to User table
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "balanceCUSD" NUMERIC(18, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "balanceUSDC" NUMERIC(18, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "balanceCELO" NUMERIC(18, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "balanceUpdatedAt" TIMESTAMP;

-- Add unique index on txHash in Transaction table (for upsert deduplication)
-- Only add if not already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'Transaction' AND indexname = 'Transaction_txHash_userId_idx'
  ) THEN
    CREATE UNIQUE INDEX "Transaction_txHash_userId_idx"
      ON "Transaction" ("txHash", "userId")
      WHERE "txHash" IS NOT NULL;
  END IF;
END$$;
