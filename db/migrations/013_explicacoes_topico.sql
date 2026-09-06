-- 013 — explicacoes pre-geradas por topico da trilha (plano v8, item 2b)
--
-- Sai de "gerar a explicacao no ar a cada aluno" para "gerar uma vez, revisar, servir do banco".
-- Sao 6 niveis x 10 topicos = 60 linhas, populadas por `conteudo/seed_explicacoes.js` a partir
-- dos .md revisados em `conteudo/explicacoes/`.
--
-- CHAVE = (cefr_level, topic_order). E o que o fluxo tem na mao: no no `Professor Engine` o
-- estado do aluno da `lvl` e `ts.idx`, e o topico do turno e `track[ts.idx]` — a consulta do
-- T008 vira `WHERE cefr_level = $1 AND topic_order = $2`, sem casar string nenhuma.
-- NAO se chaveia por titulo: as questoes se ligam ao topico por `practice_questions.track_topic`
-- (o titulo), e ha 10 pares (cefr_level, track_topic) em que o nivel da questao contradiz o
-- nivel que o TRACK da ao topico — "Presente simples" aparece como A1, A2 e B1, quando o TRACK
-- o poe em A2/1. Aqui o TRACK e a unica autoridade sobre (nivel, ordem); `title` e `slug` sao
-- carga, nunca chave, e nao ha FK para `practice_questions` — a inconsistencia de la nao entra.
--
-- ADITIVA: cria uma tabela nova e nada mais. Sem ALTER, sem DROP, sem tocar em `students`,
-- `practice_questions`, `exam_questions`, `chat_memory` ou `placement_attempts`.

CREATE TABLE IF NOT EXISTS topic_explanations (
  id          SERIAL PRIMARY KEY,
  cefr_level  TEXT        NOT NULL,
  topic_order INTEGER     NOT NULL,
  slug        TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  model       TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT topic_explanations_nivel_ordem_key UNIQUE (cefr_level, topic_order),
  CONSTRAINT topic_explanations_nivel_ck  CHECK (cefr_level IN ('A1','A2','B1','B2','C1','C2')),
  CONSTRAINT topic_explanations_ordem_ck  CHECK (topic_order >= 1),
  CONSTRAINT topic_explanations_corpo_ck  CHECK (length(btrim(body)) > 0)
);

-- A unica UNIQUE ja e o indice da consulta do T008 (prefixo cefr_level + topic_order).
COMMENT ON TABLE topic_explanations IS
  'Explicacoes pre-geradas da trilha do modo Professor. Fonte versionada: conteudo/explicacoes/*.md; carga por conteudo/seed_explicacoes.js; conferencia por conteudo/confere_explicacoes_db.js.';
