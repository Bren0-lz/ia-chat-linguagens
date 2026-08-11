-- Migration 011: habilita o nivel C2 no teste de nivelamento (testes B2 e B7)
-- Execute: psql $DATABASE_URL -f db/migrations/011_enable_c2_placement.sql
--
-- CONTEXTO
-- O C2 ja existia em quase todo o sistema e so o NIVELAMENTO o tornava inalcancavel:
--   Conversa   -> no `Nível Conversa` tem 6 saidas e `Prompt Conversa C2` esta ligado  [ok]
--   Professor  -> TRACK["C2"] com os 10 topicos escritos                               [ok]
--   Reserva    -> 20 questoes C2 semeadas na migration 009                             [ok]
--   Placement  -> LEVELS parava em C1 e exam_questions PROIBIA C2 no CHECK          [faltava]
-- Por isso B7 aparecia como "reprovado" em vez de "fora de escopo": o aluno nunca chegava
-- a um C2 que ja estava pronto do outro lado.
--
-- Esta migration cuida do lado do banco. O lado do fluxo (LEVELS com 'C2' no no
-- `Placement Engine`) vai no IAChat_Telegram_v7.4.json — os dois precisam subir juntos:
-- sem o CHECK, o seed falha; sem o LEVELS, clampLevel nunca chega a C2.

BEGIN;

-- ── 1. CHECK: passa a aceitar C2 ─────────────────────────────────────────────
ALTER TABLE exam_questions DROP CONSTRAINT IF EXISTS exam_questions_cefr_level_check;
ALTER TABLE exam_questions
  ADD CONSTRAINT exam_questions_cefr_level_check
  CHECK (cefr_level IN ('A1','A2','B1','B2','C1','C2'));

-- ── 2. Questoes de prova C2 ──────────────────────────────────────────────────
-- 10 questoes, mesmo volume dos demais niveis (A1..C1 tem 10 cada no seed 005).
-- Sem dica: no nivelamento a questao e rigida (a `hint` so existe em practice_questions).
-- Reexecucao segura.
DELETE FROM exam_questions WHERE cefr_level = 'C2';

INSERT INTO exam_questions (cefr_level, skill, qtype, prompt, options, answer, explanation) VALUES
('C2','grammar','mc','___ he been warned, he would have acted differently.','["Have","Had","Has","Having"]','Had','Terceira condicional com inversão: "Had he been warned..." substitui "If he had been warned...".'),
('C2','grammar','mc','Not until the results were published ___ the extent of the error.','["we realised","did we realise","we did realise","realised we"]','did we realise','Expressão negativa em posição inicial força a inversão sujeito-auxiliar.'),
('C2','grammar','written','Rewrite with ellipsis: "She can play the piano and he can play the piano too."',NULL,'She can play the piano and so can he','Substituição com "so can he" evita repetir o predicado inteiro.'),
('C2','grammar','mc','Scarcely ___ the door when the alarm went off.','["I had closed","had I closed","I closed","did I close"]','had I closed','"Scarcely" inicial exige inversão com o past perfect: scarcely had I closed... when...'),
('C2','vocabulary','mc','Which word carries the most negative connotation?','["assertive","forceful","domineering","confident"]','domineering','"Domineering" é claramente pejorativo; os demais são neutros ou positivos.'),
('C2','vocabulary','mc','"To gloss over a problem" means to ___ it.','["solve","deliberately downplay","exaggerate","document"]','deliberately downplay','"Gloss over" = passar por cima, minimizar deliberadamente.'),
('C2','vocabulary','written','Complete the collocation: to ___ a compromise.',NULL,'reach','"Reach a compromise" é a colocação padrão (também "come to").'),
('C2','reading','mc','"I suppose the food was edible." The speaker is most likely being ___.','["enthusiastic","critical through understatement","literal","apologetic"]','critical through understatement','Understatement: "edible" e o hedging "I suppose" comunicam crítica sem dizê-la.'),
('C2','reading','mc','"Some of the committee approved it" most strongly implies that ___.','["all approved","not all approved","none approved","nobody voted"]','not all approved','Implicatura escalar: "some" sugere "not all".'),
('C2','reading','written','In "It was the delay, not the cost, that angered them", which element is emphasised?',NULL,'the delay','Cleft sentence: a estrutura "It was X that..." põe o foco em X.');

COMMIT;

-- ── Verificacao ──────────────────────────────────────────────────────────────
-- Esperado: 10 questoes por nivel, de A1 a C2.
-- SELECT cefr_level, count(*) FROM exam_questions GROUP BY cefr_level ORDER BY cefr_level;
--
-- ATENCAO: publicar esta migration SEM a alteracao correspondente no fluxo apenas adiciona
-- questoes que nunca serao sorteadas (pickNext percorre LEVELS). Subir os dois juntos.
