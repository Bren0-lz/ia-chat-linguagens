-- Migration 009: banco de questoes de reserva para B2, C1 e C2 + alinhamento com a trilha
-- Execute: psql $DATABASE_URL -f db/migrations/009_seed_practice_b2_c1_c2.sql
--
-- CONTEXTO
-- O no `Parse Professor` (v7.4) resolve o bug "(Questao indisponivel)" caindo no banco local
-- quando o LLM devolve a questao fora do formato. Mas o no `Professor Engine` monta esse banco
-- com filtro ESTRITO por nivel:
--     _bank = rows.filter(b => b.cefr_level === lvl && b.prompt && b.answer && b.answer.length <= 60)
-- e o seed 006 so tinha:  A1=6  A2=11  B1=10  B2=3  C1=0  C2=0
-- Ou seja: para aluno C1 ou C2 o fallback nao tinha para onde cair e a rede de seguranca nao
-- existia justamente nos niveis em que o LLM mais desvia do formato. Esta migration fecha o buraco
-- com 2 questoes por topico da TRACK em B2, C1 e C2 (60 questoes).
--
-- RESTRICOES respeitadas (o filtro do Engine descarta o que nao obedecer):
--   - answer com no maximo 60 caracteres
--   - prompt e answer nunca vazios
--   - difficulty entre 1 e 3 (CHECK da tabela)

BEGIN;

-- ── track_topic: liga a questao ao topico exato da TRACK do `Professor Engine` ──
-- Hoje o Engine escolhe qualquer questao do nivel. Com esta coluna ele passa a poder
-- preferir a questao do topico corrente e so entao ampliar para o nivel inteiro.
ALTER TABLE practice_questions
  ADD COLUMN IF NOT EXISTS track_topic TEXT;

CREATE INDEX IF NOT EXISTS idx_practice_level_topic
  ON practice_questions (cefr_level, track_topic);

-- ── Backfill dos temas ja existentes (seed 006) para topicos da TRACK ──────────
UPDATE practice_questions SET track_topic = 'Passado simples (to be e regulares)' WHERE theme='past_simple'      AND track_topic IS NULL;
UPDATE practice_questions SET track_topic = 'Present perfect'                     WHERE theme='present_perfect'  AND track_topic IS NULL;
UPDATE practice_questions SET track_topic = 'Preposições de lugar e tempo'        WHERE theme='prepositions'     AND track_topic IS NULL;
UPDATE practice_questions SET track_topic = 'Plural dos substantivos'             WHERE theme='articles'         AND track_topic IS NULL;
UPDATE practice_questions SET track_topic = 'Conectores e phrasal verbs comuns'   WHERE theme='phrasal_verbs'    AND track_topic IS NULL;
UPDATE practice_questions SET track_topic = 'Presente simples'                    WHERE theme='third_person_s'   AND track_topic IS NULL;

-- Reexecucao segura: limpa o que esta migration semeia antes de inserir de novo.
DELETE FROM practice_questions WHERE cefr_level IN ('B2','C1','C2');

INSERT INTO practice_questions (theme, difficulty, cefr_level, qtype, prompt, options, answer, hint, explanation, track_topic) VALUES

-- ═══════════════════════════ B2 ═══════════════════════════
('present_perfect_cont',1,'B2','mc','She ___ for three hours and she is still working.','["has worked","has been working","is working","worked"]','has been working','Ação que começou no passado e CONTINUA agora, com ênfase na duração.','Present perfect continuous (has been + -ing) enfatiza a duração de algo ainda em curso.','Present perfect continuous'),
('present_perfect_cont',2,'B2','written','Complete: I ___ (learn) English since 2020.',NULL,'have been learning','"Since" pede present perfect; a ênfase na continuidade pede a forma contínua.','Com "since" + ação contínua até agora: have been learning.','Present perfect continuous'),

('past_perfect',1,'B2','mc','When we arrived, the film ___ already ___.','["has / started","had / started","was / starting","did / start"]','had / started','Um passado ANTES de outro passado.','Past perfect (had + particípio) marca o evento anterior a outro no passado.','Past perfect'),
('past_perfect',2,'B2','written','Complete: She told me she ___ (never/see) snow before.',NULL,'had never seen','Discurso indireto no passado + experiência anterior.','Past perfect: had never seen.','Past perfect'),

('second_conditional',1,'B2','mc','If I ___ rich, I would travel the world.','["am","was being","were","will be"]','were','Situação hipotética, irreal no presente.','Segunda condicional: If + past simple, would + verbo. Com "be" usa-se "were" para todas as pessoas.','Segunda condicional'),
('second_conditional',2,'B2','written','Complete: If he studied more, he ___ (pass) the exam.',NULL,'would pass','A consequência hipotética usa "would".','Segunda condicional: If + past simple → would + infinitivo.','Segunda condicional'),

('passive_voice',1,'B2','mc','The bridge ___ in 1995.','["built","was built","has built","is building"]','was built','Quem fez a ação não importa; o foco é a ponte.','Passiva no passado: was/were + particípio.','Voz passiva'),
('passive_voice',2,'B2','written','Rewrite in the passive: "They clean the office every day."',NULL,'The office is cleaned every day','Presente simples na passiva: is/are + particípio.','The office is cleaned every day.','Voz passiva'),

('reported_speech',1,'B2','mc','She said: "I am tired." → She said she ___ tired.','["is","was","has been","will be"]','was','No discurso indireto o tempo verbal recua um passo.','Present simple vira past simple: "I am" → "she was".','Discurso indireto'),
('reported_speech',2,'B2','written','Report it: He said, "I will call you tomorrow."',NULL,'He said he would call me the next day','"Will" recua para "would" e o tempo muda de referência.','He said he would call me the next day.','Discurso indireto'),

('relative_clauses',1,'B2','mc','The woman ___ lives next door is a doctor.','["which","who","whose","where"]','who','O antecedente é uma pessoa e é o sujeito da oração.','"Who" para pessoas em função de sujeito.','Orações relativas'),
('relative_clauses',2,'B2','written','Join: "That is the man. His car was stolen."',NULL,'That is the man whose car was stolen','Relação de posse entre o homem e o carro.','"Whose" marca posse: the man whose car was stolen.','Orações relativas'),

('gerund_infinitive',1,'B2','mc','I enjoy ___ to music.','["listen","to listen","listening","listened"]','listening','Depois de "enjoy" vem sempre a mesma forma.','"Enjoy" é seguido de gerúndio (-ing).','Gerúndio vs infinitivo'),
('gerund_infinitive',2,'B2','written','Complete: She decided ___ (leave) early.',NULL,'to leave','"Decide" pede infinitivo com "to".','decided to leave.','Gerúndio vs infinitivo'),

('modals_deduction',1,'B2','mc','The light is on, so she ___ be at home.','["must","cant","might not","should not"]','must','Você tem uma evidência forte a favor.','"Must" expressa dedução quase certa a partir de evidência.','Modais de dedução'),
('modals_deduction',2,'B2','written','Complete with a modal: He never eats meat, so this ___ be his dish.',NULL,'cannot','A evidência aponta fortemente CONTRA a hipótese.','Dedução negativa forte usa "cannot" / "can''t".','Modais de dedução'),

('used_to_would',1,'B2','mc','When I was a child, I ___ live in Brazil.','["use to","used to","would have","am used to"]','used to','Estado habitual no passado que não é mais verdade.','"Used to" para hábitos e estados passados. "Would" só serve para ações repetidas, não para estados.','Used to / would'),
('used_to_would',2,'B2','written','True or false: "I would live in Paris" correctly means a past habit of living there.',NULL,'false','"Would" não funciona com verbos de estado.','Falso: para estados usa-se "used to live", não "would live".','Used to / would'),

('phrasal_collocations',1,'B2','mc','I need to ___ my report before Friday.','["hand in","hand out","hand over to","hand down"]','hand in','Entregar um trabalho a quem vai avaliar.','"Hand in" = entregar (um trabalho, um relatório).','Phrasal verbs e collocations avançadas'),
('phrasal_collocations',2,'B2','written','Complete the collocation: to ___ a decision.',NULL,'make','Em inglês não se "toma" uma decisão.','Colocação fixa: make a decision (não "take a decision" no inglês padrão).','Phrasal verbs e collocations avançadas'),

-- ═══════════════════════════ C1 ═══════════════════════════
('third_mixed_conditionals',1,'C1','mc','If she ___ harder, she would have passed.','["studied","had studied","has studied","would study"]','had studied','Condição irreal no PASSADO.','Terceira condicional: If + past perfect, would have + particípio.','Terceira e mistas condicionais'),
('third_mixed_conditionals',3,'C1','written','Mixed: If I had taken that job, I ___ (be) in Tokyo now.',NULL,'would be','Condição no passado, consequência no PRESENTE.','Condicional mista: had + particípio → would + infinitivo (efeito presente).','Terceira e mistas condicionais'),

('inversion',2,'C1','mc','___ had I arrived when the phone rang.','["No sooner","Hardly ever","Not only","Little"]','No sooner','A estrutura pede o par "no sooner ... than".','"No sooner had I arrived than..." — inversão após expressão negativa inicial.','Inversão'),
('inversion',3,'C1','written','Invert: "I have never seen such chaos."',NULL,'Never have I seen such chaos','O advérbio negativo vai para o início e puxa o auxiliar.','Never have I seen such chaos.','Inversão'),

('cleft_sentences',2,'C1','mc','___ I need is a holiday.','["That what","What","Which","It that"]','What','Estrutura de ênfase iniciada por "what".','Wh-cleft: "What I need is a holiday" enfatiza o complemento.','Cleft sentences'),
('cleft_sentences',3,'C1','written','Make it a cleft emphasising "Maria": "Maria broke the window."',NULL,'It was Maria who broke the window','Use a estrutura "It was ... who ...".','It was Maria who broke the window.','Cleft sentences'),

('advanced_passive',2,'C1','mc','It ___ that the company will merge next year.','["is expecting","is expected","expects","has expected"]','is expected','Passiva impessoal para relatar uma expectativa geral.','"It is expected that..." — passiva impessoal, comum em registro formal.','Voz passiva avançada'),
('advanced_passive',3,'C1','written','Rewrite: "People believe he is innocent." (start with "He")',NULL,'He is believed to be innocent','Passiva com infinitivo.','He is believed to be innocent.','Voz passiva avançada'),

('modals_probability',2,'C1','mc','She ___ have missed the train — she left two hours ago.','["cant","must not","may well","shouldnt"]','cant','Você considera a hipótese praticamente impossível.','"Can''t have + particípio" nega uma hipótese sobre o passado com forte convicção.','Modais e probabilidade (nuance)'),
('modals_probability',3,'C1','written','Which is more certain: "He may have left" or "He must have left"?',NULL,'must','Um dos dois expressa dedução, o outro só possibilidade.','"Must have left" é dedução quase certa; "may have left" é mera possibilidade.','Modais e probabilidade (nuance)'),

('discourse_markers',1,'C1','mc','The plan is expensive. ___, it is the only option we have.','["Therefore","Nevertheless","Moreover","Namely"]','Nevertheless','A segunda frase CONTRARIA a expectativa da primeira.','"Nevertheless" marca contraste concessivo.','Marcadores de discurso'),
('discourse_markers',2,'C1','written','Give a formal marker that introduces a consequence.',NULL,'therefore','Sinônimo formal de "so".','"Therefore" (ou "consequently") introduz consequência em registro formal.','Marcadores de discurso'),

('dependent_prepositions',1,'C1','mc','She is entirely dependent ___ her parents.','["of","from","on","to"]','on','A preposição é fixa e não segue a lógica do português.','"Dependent on" — colocação fixa (em português seria "de").','Collocations e preposições dependentes'),
('dependent_prepositions',2,'C1','written','Complete: The results are consistent ___ our hypothesis.',NULL,'with','Preposição fixa de "consistent".','consistent with — colocação obrigatória.','Collocations e preposições dependentes'),

('figurative_language',2,'C1','mc','"The negotiations hit a brick wall" means they ___.','["succeeded","reached a deadlock","started well","were cancelled"]','reached a deadlock','Bater numa parede sugere impedimento total.','"Hit a brick wall" = travar completamente, chegar a um impasse.','Linguagem idiomática e figurada'),
('figurative_language',3,'C1','written','What does "to bite the bullet" mean in one word?',NULL,'endure','Enfrentar algo desagradável sem escapatória.','"Bite the bullet" = encarar/aguentar algo difícil (endure).','Linguagem idiomática e figurada'),

('hedging_register',2,'C1','mc','Choose the most hedged form: "This ___ suggest a correlation."','["does","may","must","will"]','may','Hedging = afirmar com cautela, sem se comprometer.','"May suggest" atenua a afirmação — típico de registro acadêmico.','Hedging e registro'),
('hedging_register',3,'C1','written','Rewrite with hedging: "This proves the theory."',NULL,'This appears to support the theory','Troque a certeza por cautela.','This appears to support the theory (hedging com "appears to").','Hedging e registro'),

('nominalisation',2,'C1','mc','Nominalise "They decided quickly": "Their ___ was quick."','["decide","deciding","decision","decisive"]','decision','Transforme o verbo em substantivo.','Nominalização: decide → decision, típica do estilo acadêmico.','Nominalização e estilo acadêmico'),
('nominalisation',3,'C1','written','Nominalise the verb "analyse".',NULL,'analysis','Substantivo correspondente ao verbo.','analyse (verbo) → analysis (substantivo).','Nominalização e estilo acadêmico'),

-- ═══════════════════════════ C2 ═══════════════════════════
('connotation_register',2,'C2','mc','Which word has the most negative connotation?','["thrifty","frugal","economical","stingy"]','stingy','Três elogiam a economia; um critica.','"Stingy" é pejorativo; thrifty/frugal/economical são neutros ou positivos.','Registro e conotação sutis'),
('connotation_register',3,'C2','written','Which is more formal: "buy" or "purchase"?',NULL,'purchase','Um deles aparece em contratos.','"Purchase" pertence ao registro formal; "buy" é neutro.','Registro e conotação sutis'),

('advanced_idioms',2,'C2','mc','"A pyrrhic victory" is a victory that ___.','["comes easily","costs too much","was expected","is shared"]','costs too much','A referência histórica sugere um custo devastador.','Vitória de Pirro: ganha-se, mas a um custo que anula o ganho.','Idioms avançados e metáfora'),
('advanced_idioms',3,'C2','written','Complete: to throw the baby out with the ___.',NULL,'bathwater','Descartar o essencial junto com o descartável.','"Throw the baby out with the bathwater" = perder o que importa ao descartar o resto.','Idioms avançados e metáfora'),

('ellipsis_substitution',2,'C2','mc','"Are you coming?" "I might ___."','["come to","be","do","-"]','be','Evita-se repetir o verbo já dito.','Elipse: "I might be" (coming) — o particípio fica subentendido.','Elipse e substituição'),
('ellipsis_substitution',3,'C2','written','Substitute to avoid repetition: "I like jazz and she likes jazz too."',NULL,'I like jazz and so does she','Use substituição com "so".','I like jazz and so does she.','Elipse e substituição'),

('fronting_emphasis',2,'C2','mc','Which sentence uses fronting?','["I have never seen it","Never have I seen it","It I have never seen","I never saw it"]','Never have I seen it','Um elemento saiu da posição normal para o início.','Fronting do advérbio negativo obriga a inversão sujeito-auxiliar.','Fronting e ênfase'),
('fronting_emphasis',3,'C2','written','Front the complement: "I will never forget that day."',NULL,'That day I will never forget','Leve o complemento para o início.','That day I will never forget — fronting do objeto para dar ênfase.','Fronting e ênfase'),

('advanced_cohesion',2,'C2','mc','___ the evidence, the conclusion seems premature.','["Despite","Although","However","In spite"]','Despite','Precisa de uma preposição seguida de substantivo.','"Despite + substantivo". "Although" pede oração; "in spite" exige "of".','Coesão e discurso avançado'),
('advanced_cohesion',3,'C2','written','Give a formal connector meaning "in other words".',NULL,'namely','Introduz uma especificação exata.','"Namely" (ou "that is to say") especifica o que foi dito.','Coesão e discurso avançado'),

('irony_understatement',2,'C2','mc','After a disaster, "That went well" is an example of ___.','["hyperbole","irony","euphemism","simile"]','irony','Diz-se o oposto do que se quer comunicar.','Ironia: o sentido pretendido é o contrário do literal.','Ironia, humor e understatement'),
('irony_understatement',3,'C2','written','"It is a bit chilly" during a snowstorm is an example of what?',NULL,'understatement','A descrição é fraca demais para o fato.','Understatement: minimizar deliberadamente algo extremo.','Ironia, humor e understatement'),

('academic_style',2,'C2','mc','Which is most appropriate in an academic paper?','["We got some data","Data were collected","We grabbed data","Data was gotten"]','Data were collected','Registro impessoal e passiva.','Estilo acadêmico prefere a passiva impessoal e trata "data" como plural.','Estilo acadêmico e formal'),
('academic_style',3,'C2','written','Rewrite formally: "The results were pretty good."',NULL,'The results were satisfactory','Elimine o intensificador coloquial.','The results were satisfactory — sem "pretty", que é informal.','Estilo acadêmico e formal'),

('rare_phrasal_verbs',2,'C2','mc','To "pore over" a document means to ___ it.','["ignore","examine closely","spill on","summarise"]','examine closely','Não confunda com o verbo base parecido.','"Pore over" = examinar minuciosamente (nada a ver com "pour").','Phrasal e prepositional verbs raros'),
('rare_phrasal_verbs',3,'C2','written','What does "the effect wore off" mean about the effect?',NULL,'it gradually disappeared','O efeito não durou.','"Wear off" = perder o efeito gradualmente.','Phrasal e prepositional verbs raros'),

('pragmatics_implicature',2,'C2','mc','"It is cold in here" said to a host usually functions as ___.','["a complaint about weather","an indirect request","a greeting","an apology"]','an indirect request','O falante quer que algo seja feito.','Implicatura: pedido indireto para fechar a janela ou ligar o aquecedor.','Pragmática e implicatura'),
('pragmatics_implicature',3,'C2','written','"Some students passed" implies what about the others?',NULL,'they did not pass','"Some" carrega uma implicatura escalar.','Implicatura escalar: "some" sugere "not all" — os demais não passaram.','Pragmática e implicatura'),

('precision_paraphrase',2,'C2','mc','Which collocation is correct?','["quick food","fast food","rapid food","swift food"]','fast food','Só uma combinação é fixa no inglês real.','"Fast food" é colocação fixa; os quase-sinônimos não funcionam aqui.','Precisão e paráfrase'),
('precision_paraphrase',3,'C2','written','Remove the redundancy: "each and every student".',NULL,'every student','A expressão repete a mesma ideia duas vezes.','"Each and every" é redundante; basta "every student".','Precisão e paráfrase');

COMMIT;

-- ── Verificacao: nenhum nivel da trilha pode ficar sem rede de seguranca ──────
-- Esperado apos a migration: A1=6  A2=11  B1=10  B2=20  C1=20  C2=20
-- SELECT cefr_level, count(*), count(DISTINCT track_topic) AS topicos
-- FROM practice_questions GROUP BY cefr_level ORDER BY cefr_level;
--
-- Nenhuma resposta pode passar de 60 caracteres (o Engine descarta silenciosamente):
-- SELECT id, cefr_level, length(answer) FROM practice_questions WHERE length(answer) > 60;
