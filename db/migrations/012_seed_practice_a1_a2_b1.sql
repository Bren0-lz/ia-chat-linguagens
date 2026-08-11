-- Migration 012: completa o banco de reserva de A1, A2 e B1 por topico da trilha
-- Execute: psql $DATABASE_URL -f db/migrations/012_seed_practice_a1_a2_b1.sql
--
-- CONTEXTO
-- A migration 009 alinhou B2, C1 e C2 com a TRACK (10 topicos x 2 questoes). Os niveis
-- baixos ficaram para tras porque o seed 006 foi organizado por TEMA GRAMATICAL, nao pela
-- trilha, e o backfill por tema atravessou niveis. Cobertura medida no banco depois da 009,
-- contando so os topicos da propria trilha de cada nivel:
--     A1 = 0/10     A2 = 4/10     B1 = 2/10
-- A1 e o nivel com mais usuarios e era o unico com ZERO reserva alinhada ao topico.
--
-- Esta migration semeia 2 questoes por topico faltante: A1 (10 topicos), A2 (7) e B1 (8).
-- As questoes do 006 continuam no banco: elas seguem valendo como reserva do NIVEL, apenas
-- nao casam por topico. Nada e removido.
--
-- Convencao de `theme`: prefixo do nivel (a1_, a2_, b1_) para tornar o DELETE de reexecucao
-- preciso, sem tocar nas linhas herdadas do 006.
--
-- RESTRICOES (o filtro do `Professor Engine` descarta o que nao obedecer):
--   answer <= 60 chars | prompt e answer nao vazios | difficulty entre 1 e 3
--   qtype 'written' exige options NULL (a coluna e JSONB: '' nao e JSON valido)

BEGIN;

-- Reexecucao segura: remove apenas o que esta migration semeia.
DELETE FROM practice_questions WHERE theme ~ '^(a1|a2|b1)_';

INSERT INTO practice_questions (theme, difficulty, cefr_level, qtype, prompt, options, answer, hint, explanation, track_topic) VALUES

-- ═══════════════════════════ A1 ═══════════════════════════
('a1_cumprimentos',1,'A1','mc','Como se diz "bom dia" em inglês?','["good night","good morning","good evening","goodbye"]','good morning','"Morning" é a parte do dia até o meio-dia.','good morning = bom dia; good afternoon = boa tarde; good night = boa noite.','Cumprimentos'),
('a1_cumprimentos',1,'A1','written','Complete o cumprimento: "___ morning!" (bom dia)',NULL,'good','Falta a palavra que significa "bom".','"Good morning!" é o cumprimento da manhã.','Cumprimentos'),

('a1_alfabeto',1,'A1','mc','Which letter comes after "M"?','["L","N","O","P"]','N','Siga a ordem: L, M, ...','Depois de M vem N.','Alfabeto'),
('a1_alfabeto',1,'A1','written','Escreva a última letra do alfabeto inglês.',NULL,'z','É a mesma letra final do alfabeto em português.','A última letra é "z" (lê-se "zed" ou "zee").','Alfabeto'),

('a1_numeros',1,'A1','mc','How do you write "15" in English?','["fifty","fifteen","five","fourteen"]','fifteen','Cuidado para não confundir 15 com 50.','15 = fifteen; 50 = fifty; 5 = five.','Números'),
('a1_numeros',1,'A1','written','Escreva em inglês o número 3.',NULL,'three','Começa com "th".','3 = three.','Números'),

('a1_cores_animais',1,'A1','mc','What colour is the sky on a clear day?','["green","blue","brown","black"]','blue','Céu limpo, sem nuvens.','O céu é "blue" (azul).','Cores e animais'),
('a1_cores_animais',1,'A1','written','Traduza para o inglês: "gato".',NULL,'cat','Três letras.','gato = cat.','Cores e animais'),

('a1_pronomes',1,'A1','mc','___ is my sister.','["He","She","It","They"]','She','Irmã é pessoa do sexo feminino.','"She" é o pronome para ela.','Pronomes pessoais'),
('a1_pronomes',1,'A1','written','Complete: "___ am a student." (eu)',NULL,'I','Em inglês esse pronome é sempre maiúsculo.','"I am a student." — "I" se escreve sempre com maiúscula.','Pronomes pessoais'),

('a1_verbo_to_be',1,'A1','mc','They ___ my friends.','["is","am","are","be"]','are','"They" é plural.','Com they/we/you usa-se "are".','Verbo to be'),
('a1_verbo_to_be',1,'A1','written','Complete: "She ___ happy."',NULL,'is','Terceira pessoa do singular.','Com he/she/it usa-se "is".','Verbo to be'),

('a1_negativa',1,'A1','mc','Qual é a forma negativa de "I am tired"?','["I not am tired","I am not tired","I no am tired","I am tired not"]','I am not tired','O "not" vem logo depois do verbo to be.','Com o verbo to be, a negativa é: verbo + not.','Negativa'),
('a1_negativa',1,'A1','written','Complete a negativa: "He ___ not my brother."',NULL,'is','Verbo to be na terceira pessoa.','"He is not my brother."','Negativa'),

('a1_interrogativa',1,'A1','mc','Qual é a pergunta correta?','["You are ready?","Are you ready?","Ready you are?","Do you are ready?"]','Are you ready?','Com o verbo to be, o verbo vem antes do sujeito.','Pergunta com to be: inverte-se verbo e sujeito — "Are you ready?".','Interrogativa'),
('a1_interrogativa',2,'A1','written','Transforme em pergunta: "She is a doctor."',NULL,'Is she a doctor?','Inverta a ordem das duas primeiras palavras.','"Is she a doctor?" — o verbo to be vai para o início.','Interrogativa'),

('a1_nacionalidade_clima',1,'A1','mc','People from Brazil are ___.','["Brazil","Brazilian","Brazilish","Brazilic"]','Brazilian','O país é Brazil; a nacionalidade muda a terminação.','Brazil (país) → Brazilian (nacionalidade).','Nacionalidade e clima'),
('a1_nacionalidade_clima',1,'A1','written','Complete: "It is ___ today." (ensolarado)',NULL,'sunny','Vem de "sun" (sol).','sun → sunny (ensolarado).','Nacionalidade e clima'),

('a1_wh',1,'A1','mc','___ is your name?','["Who","What","Where","When"]','What','Pergunta-se pela coisa, não pela pessoa.','"What is your name?" é a forma fixa em inglês.','Perguntas com WH'),
('a1_wh',1,'A1','written','Complete: "___ do you live?" (onde)',NULL,'Where','Palavra WH de lugar.','Where = onde.','Perguntas com WH'),

-- ═══════════════════════════ A2 ═══════════════════════════
('a2_presente_simples',1,'A2','written','Complete: "He ___ (work) in a bank."',NULL,'works','Terceira pessoa do singular no presente simples.','Com he/she/it o verbo recebe -s: works.','Presente simples'),

('a2_presente_simples_neg',2,'A2','mc','Qual é a negativa de "She likes coffee"?','["She not like coffee","She doesn''t like coffee","She don''t likes coffee","She doesn''t likes coffee"]','She doesn''t like coffee','Depois do auxiliar, o verbo volta à forma base.','"She doesn''t like coffee" — com "doesn''t" o verbo perde o -s.','Presente simples: negativa e perguntas'),
('a2_presente_simples_neg',2,'A2','written','Complete a pergunta: "___ she live here?"',NULL,'Does','Auxiliar do presente simples na terceira pessoa.','"Does she live here?" — com he/she/it o auxiliar é "does".','Presente simples: negativa e perguntas'),

('a2_there_is_are',1,'A2','mc','___ two books on the table.','["There is","There are","There have","It has"]','There are','"Two books" é plural.','There is (singular) / There are (plural).','There is / There are'),
('a2_there_is_are',1,'A2','written','Complete: "___ ___ a cat in the garden." (existe um)',NULL,'There is','Singular.','"There is a cat in the garden."','There is / There are'),

('a2_possessivos',1,'A2','mc','This is ___ car. (de nós)','["our","ours","us","we"]','our','Antes do substantivo usa-se o adjetivo possessivo.','"our car" — "ours" seria usado sem o substantivo.','Possessivos'),
('a2_possessivos',2,'A2','written','Complete: "That book is ___." (dela)',NULL,'hers','Sem substantivo depois, use o pronome possessivo.','"That book is hers." — "her book" x "is hers".','Possessivos'),

('a2_can',1,'A2','mc','She ___ swim very well.','["can to","cans","can","is can"]','can','Modal não muda de forma nem pede "to".','Modais como "can" vêm direto com o verbo base: can swim.','Can / cant'),
('a2_can',1,'A2','written','Complete a negativa: "I ___ speak Japanese." (não consigo)',NULL,'cannot','Uma palavra só, ou a contração.','"I cannot speak Japanese" (ou "can''t").','Can / cant'),

('a2_presente_continuo',1,'A2','mc','Look! It ___ .','["rain","rains","is raining","raining"]','is raining','Acontecendo agora, neste momento.','Presente contínuo: to be + verbo-ing.','Presente contínuo'),
('a2_presente_continuo',2,'A2','written','Complete: "They ___ (study) now."',NULL,'are studying','"They" + ação em curso.','"They are studying now."','Presente contínuo'),

('a2_passado_irregular',1,'A2','mc','Yesterday she ___ to school.','["goed","went","gone","goes"]','went','"Go" é irregular no passado.','go → went (passado); gone é o particípio.','Passado simples (irregulares) e tempo'),
('a2_passado_irregular',2,'A2','written','Escreva o passado de "buy".',NULL,'bought','Irregular, termina em -ought.','buy → bought.','Passado simples (irregulares) e tempo'),

-- ═══════════════════════════ B1 ═══════════════════════════
('b1_past_continuous',1,'B1','mc','While I ___ , the phone rang.','["cook","cooked","was cooking","have cooked"]','was cooking','Ação em andamento interrompida por outra.','Past continuous (was/were + -ing) para a ação em curso no passado.','Past continuous'),
('b1_past_continuous',2,'B1','written','Complete: "They ___ (watch) TV when I arrived."',NULL,'were watching','"They" + ação em curso no passado.','"They were watching TV when I arrived."','Past continuous'),

('b1_pp_vs_ps',2,'B1','mc','I ___ him yesterday.','["have seen","saw","have saw","seen"]','saw','Tempo passado terminado e especificado.','Com "yesterday" usa-se past simple, nunca present perfect.','Present perfect vs past simple'),
('b1_pp_vs_ps',2,'B1','written','Complete: "She ___ (live) here since 2015."',NULL,'has lived','"Since" liga o passado ao presente.','"She has lived here since 2015." — present perfect.','Present perfect vs past simple'),

('b1_comparativos',1,'B1','mc','This is ___ film I have ever seen.','["the better","the best","best","more good"]','the best','Superlativo irregular de "good".','good → better → the best.','Comparativos e superlativos'),
('b1_comparativos',1,'B1','written','Complete com o comparativo: "A is ___ than B." (big)',NULL,'bigger','Adjetivo curto: dobra a consoante + -er.','big → bigger than.','Comparativos e superlativos'),

('b1_futuro',2,'B1','mc','Look at those clouds! It ___ rain.','["will","is going to","goes to","would"]','is going to','Há evidência presente do que vai acontecer.','"Going to" para previsão com evidência; "will" para decisão do momento.','Futuro: will vs going to'),
('b1_futuro',2,'B1','written','Decisão tomada na hora: "I ___ help you!"',NULL,'will','Decisão espontânea, sem plano prévio.','"I will help you!" — decisão imediata usa "will".','Futuro: will vs going to'),

('b1_quantificadores',1,'B1','mc','How ___ money do you have?','["many","much","few","several"]','much','"Money" é incontável.','"Much" com incontáveis; "many" com contáveis.','Contáveis/incontáveis e quantificadores'),
('b1_quantificadores',1,'B1','written','Qual quantificador usar com "apples": "many" ou "much"?',NULL,'many','"Apples" pode ser contado.','"Many apples" — contáveis pedem "many".','Contáveis/incontáveis e quantificadores'),

('b1_modais',1,'B1','mc','You ___ wear a helmet. It is the law.','["can","must","might","could"]','must','Obrigação forte, imposta por lei.','"Must" expressa obrigação; "might/could" são possibilidade.','Verbos modais'),
('b1_modais',2,'B1','written','Complete com conselho: "You ___ see a doctor." (deveria)',NULL,'should','Conselho, não obrigação.','"You should see a doctor." — "should" dá conselho.','Verbos modais'),

('b1_primeira_condicional',1,'B1','mc','If it rains, we ___ at home.','["stay","stayed","will stay","would stay"]','will stay','Condição real e possível no futuro.','Primeira condicional: If + presente, will + verbo.','Primeira condicional'),
('b1_primeira_condicional',2,'B1','written','Complete: "If you ___ (study), you will pass."',NULL,'study','Depois de "if" vem o presente simples, não o futuro.','"If you study, you will pass." — nunca "if you will study".','Primeira condicional'),

('b1_adverbios',2,'B1','mc','She ___ late for class.','["is never","never is","is not never","never"]','is never','Advérbio de frequência vem depois do verbo to be.','Com to be: "She is never late". Com outros verbos, vem antes.','Advérbios de frequência e modo'),
('b1_adverbios',1,'B1','written','Escreva o advérbio de modo derivado de "careful".',NULL,'carefully','Acrescente o sufixo -ly.','careful → carefully.','Advérbios de frequência e modo');

COMMIT;

-- ── Verificacao ──────────────────────────────────────────────────────────────
-- Esperado: todo topico da TRACK de A1, A2 e B1 com pelo menos 2 questoes.
-- SELECT cefr_level, count(*) AS questoes, count(DISTINCT track_topic) AS topicos
-- FROM practice_questions GROUP BY 1 ORDER BY 1;
