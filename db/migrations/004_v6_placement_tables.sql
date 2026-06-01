-- Migration 004: Fundação da v6.0 — placement determinístico + professor híbrido
-- Execute: psql $DATABASE_URL -f db/migrations/004_v6_placement_tables.sql
--
-- NOTA: schemas propostos por mim (Claude) a partir do resumo no Notion.
-- A fundação "pronta e testada" descrita no plano NÃO estava versionada no repo,
-- então estes nomes de tabela/coluna são a referência canônica usada pelo workflow v6.0.

-- ── Remove as tabelas do teste web descontinuado (decisão 31/05/2026) ──────────
DROP TABLE IF EXISTS test_attempts;
DROP TABLE IF EXISTS test_questions;

-- ── Novas colunas de estado em students ───────────────────────────────────────
-- placement_state: teste de nível em andamento/pausado (JSONB, NULL = sem teste)
--   { status:'in_progress'|'paused', qids:[int], idx:int,
--     answers:[{qid,given,correct,ok,skill}], level:'A2', start_level:'A2',
--     streak_ok:int, streak_bad:int }
-- teacher_state: questão-âncora atual do modo Professor (JSONB, NULL = sem questão)
--   { qid:int, theme:'past_simple', difficulty:1, awaiting:'answer'|'doubt'|null }
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS placement_state JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS teacher_state   JSONB DEFAULT NULL;

-- Estrutura de progresso por tema vive em students.profile (JSONB):
--   profile.themes = { past_simple:{d1:bool,d2:bool,d3:bool,mastered:bool,slips:int}, ... }
--   profile.level  = 'A2'  (só muda via placement)
--   profile.interests = [], profile.notes = ''

-- ── Banco de PROVA (teste de nível) — questões rígidas, SEM dica ───────────────
CREATE TABLE IF NOT EXISTS exam_questions (
  id            SERIAL PRIMARY KEY,
  cefr_level    VARCHAR(2)  NOT NULL CHECK (cefr_level IN ('A1','A2','B1','B2','C1')),
  skill         VARCHAR(20) NOT NULL CHECK (skill IN ('grammar','vocabulary','reading')),
  qtype         VARCHAR(10) NOT NULL CHECK (qtype IN ('mc','written')),
  prompt        TEXT        NOT NULL,
  options       JSONB,                      -- mc: ["a","b","c","d"] | written: NULL
  answer        TEXT        NOT NULL,        -- gabarito canônico (texto da opção certa ou resposta escrita)
  explanation   TEXT        NOT NULL,        -- mostrado só no gabarito final
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exam_level_skill ON exam_questions (cefr_level, skill);

-- ── Banco de EXERCÍCIO (modo Professor) — COM dica + explicação + dificuldade ──
CREATE TABLE IF NOT EXISTS practice_questions (
  id            SERIAL PRIMARY KEY,
  theme         VARCHAR(40) NOT NULL,        -- past_simple|present_perfect|prepositions|articles|phrasal_verbs|third_person_s
  difficulty    SMALLINT    NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  cefr_level    VARCHAR(2),
  qtype         VARCHAR(10) NOT NULL CHECK (qtype IN ('mc','written')),
  prompt        TEXT        NOT NULL,
  options       JSONB,                       -- mc: ["a","b"] | written: NULL
  answer        TEXT        NOT NULL,
  hint          TEXT        NOT NULL,        -- luta produtiva: dica antes de revelar
  explanation   TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_practice_theme_diff ON practice_questions (theme, difficulty);

-- ── Histórico de tentativas de placement (auditoria + limite mensal) ──────────
CREATE TABLE IF NOT EXISTS placement_attempts (
  id            SERIAL PRIMARY KEY,
  user_id       BIGINT      NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  finished_at   TIMESTAMPTZ,
  level_result  VARCHAR(2),
  score         NUMERIC(5,2),
  answers       JSONB
);
CREATE INDEX IF NOT EXISTS idx_placement_attempts_user_month
  ON placement_attempts (user_id, started_at);
