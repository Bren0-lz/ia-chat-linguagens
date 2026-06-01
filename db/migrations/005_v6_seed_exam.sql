-- Migration 005: Seed do banco de PROVA (exam_questions) — 50 questões, 10 por nível.
-- Números provisórios (fase de teste), conforme nota no plano 6.0.
-- qtype 'mc' usa options+answer (texto exato da opção); 'written' usa answer canônico.
-- Execute: psql $DATABASE_URL -f db/migrations/005_v6_seed_exam.sql

INSERT INTO exam_questions (cefr_level, skill, qtype, prompt, options, answer, explanation) VALUES

-- ═══════════════ A1 ═══════════════
('A1','grammar','mc','I ___ a student.','["am","is","are","be"]','am','Com "I" usamos "am" (verbo to be).'),
('A1','grammar','mc','She ___ from Brazil.','["am","is","are","be"]','is','3ª pessoa do singular (she/he/it) usa "is".'),
('A1','grammar','mc','There ___ two cats in the room.','["is","am","are","be"]','are','Plural ("two cats") pede "are".'),
('A1','grammar','written','Complete: "They ___ my friends." (verbo to be)',NULL,'are','Com "they" (plural) usamos "are".'),
('A1','grammar','written','Escreva o plural de "child".',NULL,'children','"child" tem plural irregular: children.'),
('A1','vocabulary','mc','What color is the sky?','["red","green","blue","yellow"]','blue','O céu é azul = blue.'),
('A1','vocabulary','mc','How do you say "Bom dia"?','["Good night","Good afternoon","Hello","Good morning"]','Good morning','"Bom dia" = Good morning.'),
('A1','vocabulary','written','Traduza para inglês: "obrigado".',NULL,'thank you','"obrigado" = thank you.'),
('A1','reading','mc','"My name is Ana. I am 8." How old is Ana?','["7","8","9","10"]','8','O texto diz "I am 8".'),
('A1','reading','written','"I have a red car." What color is the car?',NULL,'red','O texto diz "a red car".'),

-- ═══════════════ A2 ═══════════════
('A2','grammar','mc','Yesterday I ___ to school.','["go","goes","went","gone"]','went','Passado de "go" é "went".'),
('A2','grammar','mc','___ you like pizza?','["Does","Do","Is","Are"]','Do','Pergunta no presente com "you" usa "Do".'),
('A2','grammar','mc','She ___ TV every evening.','["watch","watches","watched","watching"]','watches','3ª pessoa do singular no presente: watch + es.'),
('A2','grammar','written','Passe para o passado: "I play football." → "I ___ football."',NULL,'played','Passado regular: play + ed.'),
('A2','grammar','written','Corrija: "I have 20 years." (idade)',NULL,'i am 20 years old','Idade em inglês usa "to be": I am 20 years old.'),
('A2','vocabulary','mc','What does "hungry" mean?','["com sono","com frio","com fome","com sede"]','com fome','"hungry" = com fome.'),
('A2','vocabulary','mc','I go to school ___ bus.','["with","in","by","on"]','by','Meio de transporte: by bus.'),
('A2','vocabulary','written','Traduza: "ontem".',NULL,'yesterday','"ontem" = yesterday.'),
('A2','reading','mc','"Tom gets up at 7 and has breakfast." What does Tom do first?','["breakfast","get up","go to work","sleep"]','get up','Ele acorda (gets up) antes do café.'),
('A2','reading','written','"She lives in a small house near the park." Where is the house?',NULL,'near the park','O texto diz "near the park".'),

-- ═══════════════ B1 ═══════════════
('B1','grammar','mc','If I ___ more money, I would travel.','["have","had","has","would have"]','had','Segundo condicional: if + passado.'),
('B1','grammar','mc','Which uses Present Perfect correctly?','["I have seen it yesterday.","I have seen it.","I seen it.","I has seen it."]','I have seen it.','Present perfect: have + particípio, sem tempo definido.'),
('B1','grammar','mc','She suggested ___ a taxi.','["take","to take","taking","took"]','taking','"suggest" pede gerúndio (-ing).'),
('B1','grammar','written','Complete no present perfect: "I ___ never ___ sushi." (eat)',NULL,'have never eaten','have + never + particípio (eaten).'),
('B1','grammar','written','Passive: reescreva "They built this bridge." → "This bridge ___ ___."',NULL,'was built','Passiva no passado: was + particípio.'),
('B1','vocabulary','mc','"nevertheless" means:','["therefore","however","because","although"]','however','"nevertheless" ≈ however (contudo).'),
('B1','vocabulary','mc','"to make up your mind" means:','["apply makeup","decide","recall","relax"]','decide','"make up your mind" = decidir.'),
('B1','vocabulary','written','Dê um sinônimo de "big".',NULL,'large','"big" ≈ large.'),
('B1','reading','mc','"Although it rained, they enjoyed the trip." Did they enjoy it?','["yes","no","maybe","unknown"]','yes','"Although it rained" mas "they enjoyed" = sim.'),
('B1','reading','written','"The meeting was postponed to Friday." When is the meeting now?',NULL,'friday','"postponed to Friday" = adiada para sexta.'),

-- ═══════════════ B2 ═══════════════
('B2','grammar','mc','By the time she arrived, we ___ for two hours.','["had been waiting","have been waiting","were waiting","was waiting"]','had been waiting','Past perfect continuous para ação anterior a outra no passado.'),
('B2','grammar','mc','The man ___ called you is my uncle.','["which","who","whom","what"]','who','Pessoa como sujeito da oração relativa: who.'),
('B2','grammar','mc','He ___ have taken the keys — they are still here.','["must","can''t","should","would"]','can''t','Dedução de impossibilidade: can''t have + particípio.'),
('B2','grammar','written','Inversão: reescreva começando com "Not only": "She was late and she forgot the report." → "Not only ___ she late..."',NULL,'was','Após "Not only" há inversão: Not only was she late.'),
('B2','grammar','written','Reported speech: "I am tired," he said. → He said he ___ tired.',NULL,'was','No discurso indireto, "am" vira "was".'),
('B2','vocabulary','mc','"ambiguous" is closest to:','["clear","confusing","reliable","obvious"]','confusing','"ambiguous" = ambíguo/confuso.'),
('B2','vocabulary','mc','Formal alternative to "get in touch":','["phone","contact","ring","call"]','contact','"contact" é o mais formal.'),
('B2','vocabulary','written','"to pull someone''s leg" significa (uma palavra em português):',NULL,'brincar','"pull someone''s leg" = brincar/zoar.'),
('B2','reading','mc','"The proposal was met with skepticism by the board." How did the board react?','["enthusiasm","skepticism","indifference","approval"]','skepticism','O texto diz "met with skepticism".'),
('B2','reading','written','"Sales plummeted in Q3." Did sales go up or down?',NULL,'down','"plummeted" = despencaram (down).'),

-- ═══════════════ C1 ═══════════════
('C1','grammar','mc','___ he known the risk, he would never have agreed.','["If","Had","Should","Were"]','Had','Inversão do 3º condicional: Had he known...'),
('C1','grammar','mc','It is important that he ___ on time.','["is","be","will be","was"]','be','Subjuntivo após "important that": he be.'),
('C1','grammar','mc','The results were ___ from satisfactory.','["far","away","much","long"]','far','Expressão "far from satisfactory".'),
('C1','grammar','written','Inversão: reescreva começando com "Seldom": "I have seldom seen such talent." → "Seldom ___ I seen such talent."',NULL,'have','Após advérbio negativo no início, inverte: Seldom have I seen.'),
('C1','grammar','written','Cleft sentence: enfatize "John" em "John broke the window." → "It ___ John who broke the window."',NULL,'was','Cleft: It was John who...'),
('C1','vocabulary','mc','"sycophantic" most closely means:','["rebellious","flattering and servile","outspoken","indifferent"]','flattering and servile','"sycophantic" = bajulador/servil.'),
('C1','vocabulary','mc','"meticulous" means:','["careless","very careful","fast","rude"]','very careful','"meticulous" = meticuloso, muito cuidadoso.'),
('C1','vocabulary','written','Dê um sinônimo formal de "begin".',NULL,'commence','"begin" ≈ commence (formal).'),
('C1','reading','mc','"Her argument, though cogent, failed to sway the committee." Was the argument convincing?','["yes, but it didn''t persuade","no, it was weak","it was ignored","it was illegal"]','yes, but it didn''t persuade','"cogent" = convincente, mas "failed to sway".'),
('C1','reading','written','"The policy was ostensibly about safety." Does "ostensibly" suggest the real reason might differ? (yes/no)',NULL,'yes','"ostensibly" = aparentemente; sugere razão real possivelmente diferente.');
