-- Migration 001: Adiciona colunas de gamificação e campos Telegram à tabela students
-- Execute: psql $DATABASE_URL -f db/migrations/001_add_gamification_columns.sql

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS level              VARCHAR(2)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS xp                INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_count      INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active       DATE         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS badges            JSONB        DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS telegram_photo_url TEXT        DEFAULT NULL;
