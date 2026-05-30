-- Migration 003: Seed de questões CEFR básicas para o teste de nivelamento
-- Execute: psql $DATABASE_URL -f db/migrations/003_seed_questions.sql

INSERT INTO test_questions (cefr_level, question, options, correct_index, skill) VALUES

-- ══════════════════════════════════════════
--  A1 — Iniciante
-- ══════════════════════════════════════════
('A1', 'What is your ___?  "My name is Ana."',
 '["name","age","color","job"]', 0, 'vocabulary'),

('A1', 'Choose the correct answer: "I ___ a student."',
 '["am","is","are","be"]', 0, 'grammar'),

('A1', 'What color is the sky?',
 '["red","green","blue","yellow"]', 2, 'vocabulary'),

('A1', 'How do you say "Bom dia" in English?',
 '["Good night","Good afternoon","Hello","Good morning"]', 3, 'vocabulary'),

('A1', '"She ___ from Brazil." Choose the correct verb.',
 '["am","is","are","be"]', 1, 'grammar'),

('A1', 'Which word means the opposite of "big"?',
 '["tall","small","fast","dark"]', 1, 'vocabulary'),

('A1', 'Complete: "There ___ two cats in the room."',
 '["is","am","are","be"]', 2, 'grammar'),

('A1', 'What do we say when we leave?',
 '["Hello","Please","Goodbye","Thank you"]', 2, 'vocabulary'),

-- ══════════════════════════════════════════
--  A2 — Básico
-- ══════════════════════════════════════════
('A2', 'What did you do yesterday? "I ___ to school."',
 '["go","goes","went","gone"]', 2, 'grammar'),

('A2', 'Choose the correct question: "___  you like pizza?"',
 '["Does","Do","Is","Are"]', 1, 'grammar'),

('A2', '"She ___ TV every evening." Choose the right form.',
 '["watch","watches","watched","watching"]', 1, 'grammar'),

('A2', 'Which sentence is correct?',
 '["I have 20 years.","I am 20 years old.","I got 20 years.","My age is 20 years."]', 1, 'grammar'),

('A2', '"They ___ playing football when it started to rain."',
 '["are","were","was","be"]', 1, 'grammar'),

('A2', 'What does "hungry" mean?',
 '["Com sono","Com frio","Com fome","Com sede"]', 2, 'vocabulary'),

('A2', 'Choose the correct preposition: "I go to school ___ bus."',
 '["with","in","by","on"]', 2, 'vocabulary'),

('A2', '"How ___ does it cost?" is asking about:',
 '["size","price","color","time"]', 1, 'vocabulary'),

-- ══════════════════════════════════════════
--  B1 — Intermediário
-- ══════════════════════════════════════════
('B1', '"If I ___ more money, I would travel the world."',
 '["have","had","has","would have"]', 1, 'grammar'),

('B1', 'Which sentence uses the Present Perfect correctly?',
 '["I have seen that film yesterday.","I have seen that film.","I seen that film.","I did see that film."]', 1, 'grammar'),

('B1', 'The word "nevertheless" means:',
 '["therefore","however","because","although"]', 1, 'vocabulary'),

('B1', '"She suggested ___ a taxi." Choose the correct form.',
 '["take","to take","taking","took"]', 2, 'grammar'),

('B1', 'Which is the passive form of "They built this bridge in 1990"?',
 '["This bridge was built in 1990.","This bridge built in 1990.","This bridge is built in 1990.","This bridge had built in 1990."]', 0, 'grammar'),

('B1', '"I wish I ___ play the guitar." Choose the correct word.',
 '["can","could","would","will"]', 1, 'grammar'),

('B1', 'What does "to make up your mind" mean?',
 '["To apply makeup","To change your appearance","To decide","To recall a memory"]', 2, 'vocabulary'),

('B1', 'Complete: "Despite ___ hard, he failed the exam."',
 '["study","studied","studying","to study"]', 2, 'grammar'),

-- ══════════════════════════════════════════
--  B2 — Intermediário Avançado
-- ══════════════════════════════════════════
('B2', '"By the time she arrived, we ___ waiting for two hours."',
 '["had been","have been","were","was"]', 0, 'grammar'),

('B2', 'Which sentence correctly uses a relative clause?',
 '["The man which called you is my uncle.","The man who called you is my uncle.","The man whom called you is my uncle.","The man what called you is my uncle."]', 1, 'grammar'),

('B2', 'The word "ambiguous" is closest in meaning to:',
 '["clear","confusing","reliable","obvious"]', 1, 'vocabulary'),

('B2', '"He ___ have taken the keys — they are still here."',
 '["must","can''t","should","would"]', 1, 'grammar'),

('B2', 'Choose the most appropriate formal alternative to "get in touch":',
 '["phone","contact","ring","call"]', 1, 'vocabulary'),

('B2', '"Not only ___ she late, but she also forgot the report."',
 '["is","was","did","were"]', 1, 'grammar'),

('B2', 'What does "to pull someone''s leg" mean?',
 '["To help someone","To tease or joke with someone","To criticize someone","To ignore someone"]', 1, 'vocabulary'),

('B2', 'Identify the sentence with a dangling modifier:',
 '["Running fast, John won the race.","Running fast, the race was won.","John, running fast, won the race.","He won the race by running fast."]', 1, 'grammar'),

-- ══════════════════════════════════════════
--  C1 — Avançado
-- ══════════════════════════════════════════
('C1', '"___ he known about the risk, he would never have agreed." Choose the correct inversion.',
 '["If","Had","Should","Were"]', 1, 'grammar'),

('C1', 'The word "sycophantic" most closely means:',
 '["rebellious","flattering and servile","outspoken","indifferent"]', 1, 'vocabulary'),

('C1', 'Which sentence demonstrates correct use of a subjunctive?',
 '["It is important that he is on time.","It is important that he be on time.","It is important that he will be on time.","It is important that he was on time."]', 1, 'grammar'),

('C1', '"The results were ___ from satisfactory." Choose the right word.',
 '["far","away","much","long"]', 0, 'vocabulary'),

-- ══════════════════════════════════════════
--  C2 — Fluente / Avançado
-- ══════════════════════════════════════════
('C2', 'Which option best paraphrases "The project is at a crossroads"?',
 '["The project needs more funding.","The project must make a critical decision.","The project is geographically located at an intersection.","The project is behind schedule."]', 1, 'vocabulary'),

('C2', '"___ for the intervention of a colleague, he would have been dismissed." Which word fits best?',
 '["Except","If not","But","But not"]', 2, 'grammar'),

('C2', 'Which sentence contains a correctly used absolute phrase?',
 '["The storm having passed, we resumed our journey.","The storm had passed, we resumed our journey.","After the storm had passed, we resumed our journey.","We resumed our journey after passing the storm."]', 0, 'grammar'),

('C2', '"His prose is often described as ___, marked by convoluted sentences that obscure rather than illuminate." Choose the best word.',
 '["lucid","pellucid","turgid","limpid"]', 2, 'vocabulary');
