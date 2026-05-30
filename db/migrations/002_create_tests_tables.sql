-- Migration 002: Cria tabelas de questões e tentativas de teste CEFR
-- Execute: psql $DATABASE_URL -f db/migrations/002_create_tests_tables.sql

CREATE TABLE IF NOT EXISTS test_questions (
  id             SERIAL PRIMARY KEY,
  cefr_level     VARCHAR(2)   NOT NULL CHECK (cefr_level IN ('A1','A2','B1','B2','C1','C2')),
  question       TEXT         NOT NULL,
  options        JSONB        NOT NULL,    -- ["opção A", "opção B", "opção C", "opção D"]
  correct_index  INTEGER      NOT NULL,    -- índice 0-based da opção correta
  skill          VARCHAR(50),              -- grammar, vocabulary, reading, listening
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id             SERIAL PRIMARY KEY,
  user_id        BIGINT       NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  started_at     TIMESTAMPTZ  DEFAULT NOW(),
  finished_at    TIMESTAMPTZ,
  score          NUMERIC(5,2),
  level_result   VARCHAR(2)   CHECK (level_result IN ('A1','A2','B1','B2','C1','C2')),
  answers        JSONB                     -- { "questionId": selectedIndex, ... }
);

CREATE INDEX IF NOT EXISTS idx_test_attempts_user_month
  ON test_attempts (user_id, started_at);
