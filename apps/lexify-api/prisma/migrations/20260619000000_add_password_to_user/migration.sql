-- Add password column to User for email/password authentication
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;
