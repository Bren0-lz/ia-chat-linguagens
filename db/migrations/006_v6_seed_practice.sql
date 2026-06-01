-- Migration 006: Seed do banco de EXERCÍCIO (practice_questions) — 30 questões-semente.
-- 6 temas × 3 níveis de dificuldade + 1 reforço extra em alguns temas (provisório).
-- Cada questão traz HINT (luta produtiva) e EXPLANATION (revelada após errar/responder).
-- Temas: os 6 erros mais comuns de brasileiros.
-- Execute: psql $DATABASE_URL -f db/migrations/006_v6_seed_practice.sql

INSERT INTO practice_questions (theme, difficulty, cefr_level, qtype, prompt, options, answer, hint, explanation) VALUES

-- ═══════════════ past_simple ═══════════════
('past_simple',1,'A2','mc','Yesterday I ___ to the park.','["go","went","gone","goes"]','went','Pense no passado de "go" — é irregular.','Passado de "go" é "went".'),
('past_simple',2,'A2','written','Complete no passado: "She ___ (study) all night."',NULL,'studied','Verbo regular: termina em -y após consoante.','study → studied (y vira i + ed).'),
('past_simple',3,'B1','written','Corrija a frase: "I didn''t went home."',NULL,'i didn''t go home','Depois de "didn''t" o verbo volta à forma base.','Com "did/didn''t" o verbo principal fica no infinitivo: didn''t go.'),

-- ═══════════════ present_perfect ═══════════════
('present_perfect',1,'A2','mc','I ___ already finished my homework.','["have","has","had","am"]','have','Com "I" qual auxiliar do present perfect?','Present perfect: I/you/we/they + have + particípio.'),
('present_perfect',2,'B1','written','Complete: "She ___ (live) here since 2010."',NULL,'has lived','3ª pessoa + auxiliar correto + particípio.','"since 2010" pede present perfect: has lived.'),
('present_perfect',3,'B1','written','Corrija: "I have seen him yesterday."',NULL,'i saw him yesterday','"yesterday" indica tempo terminado — qual tempo verbal combina?','Com tempo definido (yesterday) usa-se past simple: I saw him.'),

-- ═══════════════ prepositions ═══════════════
('prepositions',1,'A1','mc','The book is ___ the table.','["in","on","at","to"]','on','Superfície de contato pede qual preposição?','Sobre uma superfície usamos "on": on the table.'),
('prepositions',2,'A2','mc','I''ll see you ___ Monday.','["in","on","at","to"]','on','Dias da semana usam qual preposição?','Com dias da semana: on Monday.'),
('prepositions',3,'B1','written','Complete: "She''s good ___ math." (preposição)',NULL,'at','"good ___ algo" — colocação fixa.','"good at" é colocação fixa: good at math.'),

-- ═══════════════ articles ═══════════════
('articles',1,'A1','mc','I saw ___ elephant at the zoo.','["a","an","the","-"]','an','Som de vogal no início da palavra seguinte.','Antes de som de vogal usamos "an": an elephant.'),
('articles',2,'A2','written','Complete com a/an/the ou deixe vazio: "She plays ___ piano."',NULL,'the','Instrumentos musicais costumam pedir qual artigo?','Tocar instrumento: play the piano.'),
('articles',3,'B1','written','Corrija: "I love the nature."',NULL,'i love nature','Substantivos abstratos/gerais usam artigo?','Conceitos gerais (nature) vão sem artigo: I love nature.'),

-- ═══════════════ phrasal_verbs ═══════════════
('phrasal_verbs',1,'A2','mc','Please ___ your shoes before entering.','["take off","take on","take up","take in"]','take off','Qual phrasal significa "tirar/remover"?','"take off" = tirar (roupa/sapato).'),
('phrasal_verbs',2,'B1','mc','I need to ___ this word in the dictionary.','["look after","look up","look for","look out"]','look up','Qual phrasal significa "procurar uma informação"?','"look up" = procurar (informação): look up a word.'),
('phrasal_verbs',3,'B2','written','Complete: "She decided to ___ ___ smoking." (parar de — phrasal com give)',NULL,'give up','Phrasal com "give" que significa "desistir/parar".','"give up" = parar/desistir: give up smoking.'),

-- ═══════════════ third_person_s ═══════════════
('third_person_s',1,'A1','mc','He ___ soccer every weekend.','["play","plays","playing","played"]','plays','3ª pessoa do singular no presente leva o quê no fim?','He/she/it + verbo + s: plays.'),
('third_person_s',2,'A2','written','Complete: "My sister ___ (watch) TV at night."',NULL,'watches','Verbos terminados em -ch ganham -es.','watch → watches (ch + es).'),
('third_person_s',3,'B1','written','Corrija: "She don''t like coffee."',NULL,'she doesn''t like coffee','3ª pessoa do singular usa qual auxiliar negativo?','3ª pessoa: doesn''t (não "don''t"): She doesn''t like.'),

-- ═══════════════ reforço extra (variedade dentro do tema) ═══════════════
('past_simple',1,'A1','written','Passado de "eat":',NULL,'ate','Verbo irregular comum.','Passado de "eat" é "ate".'),
('past_simple',2,'A2','mc','We ___ a great movie last night.','["see","saw","seen","sees"]','saw','Passado irregular de "see".','Passado de "see" é "saw".'),
('present_perfect',1,'A2','mc','Have you ___ been to London?','["never","ever","yet","since"]','ever','Pergunta sobre experiência de vida usa qual advérbio?','"Have you ever been...?" = já alguma vez.'),
('prepositions',2,'A2','written','Complete: "The meeting is ___ 3 o''clock." (preposição de horário)',NULL,'at','Horas exatas usam qual preposição?','Com horas: at 3 o''clock.'),
('articles',1,'A1','mc','She is ___ honest person.','["a","an","the","-"]','an','"honest" — o h é mudo, começa com som de vogal.','"honest" tem h mudo (som de vogal): an honest person.'),
('phrasal_verbs',2,'B1','written','Complete: "We ran ___ of milk." (acabar — phrasal com run)',NULL,'out','Phrasal "run ___" que significa "ficar sem".','"run out of" = ficar sem: ran out of milk.'),
('third_person_s',1,'A1','written','Complete: "It ___ (rain) a lot here."',NULL,'rains','3ª pessoa (it) no presente.','it + rain + s = rains.'),
('past_simple',3,'B1','mc','When I was a child, I ___ in the countryside.','["live","lived","have lived","living"]','lived','Hábito no passado terminado.','Hábito passado terminado: past simple "lived".'),
('present_perfect',2,'B1','mc','They ___ just arrived.','["have","has","had","are"]','have','"they" + auxiliar do present perfect.','they + have + just + particípio: have just arrived.'),
('prepositions',3,'B2','written','Complete: "She''s interested ___ art." (preposição)',NULL,'in','"interested ___ algo" — colocação fixa.','"interested in" é colocação fixa.'),
('articles',2,'A2','mc','___ sun rises in the east.','["A","An","The","-"]','The','Coisas únicas no mundo usam qual artigo?','Único no mundo (the sun): The sun rises.'),
('phrasal_verbs',3,'B2','mc','The party was ___ because of the rain.','["called off","called on","called up","called in"]','called off','Qual phrasal significa "cancelar"?','"call off" = cancelar: called off the party.');
