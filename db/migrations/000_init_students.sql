-- Migration 000: cria a tabela base `students`.
-- Originalmente esta tabela foi criada manualmente no SQL Editor do Supabase,
-- então as migrations seguintes (001+) só fazem ALTER. Esta migration existe
-- pra permitir inicializar um banco do zero (Postgres local, por exemplo).
-- Idempotente: pode rodar duas vezes sem quebrar.

CREATE TABLE IF NOT EXISTS students (
  user_id    BIGINT PRIMARY KEY,           -- telegram from.id
  name       TEXT,
  age        INT,
  mode       TEXT DEFAULT 'chat',          -- 'chat' | 'teacher'
  onboarding TEXT DEFAULT 'new',           -- new -> awaiting_name -> awaiting_age -> menu -> done
  profile    JSONB NOT NULL DEFAULT '{}'::jsonb,  -- memória de longo prazo do agente
  msg_count  INTEGER NOT NULL DEFAULT 0,   -- turnos desde a última atualização do perfil
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
