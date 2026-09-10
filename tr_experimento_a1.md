
## baseline — 2026-09-03T19:43:36.784Z (N=3)

- **correcao** (C1: "i like play games" -> corrige?): **0/3** | palavras em ingles (media): 13.0 | respostas vazias: 0
- **interesses** (C15: cita games/basketball?): **1/3** | palavras em ingles (media): 9.7 | respostas vazias: 0

<details><summary>saidas cruas</summary>


correcao 1 (ok=false, 12 palavras):
```
Oh, that's cool! I like games too. What games do you play?
🇧🇷 Ah, que legal! Eu gosto de jogos também. Que jogos você joga?
```

correcao 2 (ok=false, 15 palavras):
```
Ah, that's cool! I play games too. Do you play on your phone or computer?
🇧🇷 Ah, que legal! Eu jogo também. Você joga no celular ou computador?
```

correcao 3 (ok=false, 12 palavras):
```
Ah, you like games! Me too. What games do you play? 😊
🇧🇷 Ah, você gosta de jogos! Eu também. Que jogos você joga?
```

interesses 1 (ok=false, 9 palavras):
```
Hey! I am good, thanks! What about you? 😊
🇧🇷 Ei! Eu estou bem, obrigada! E você?
```

interesses 2 (ok=true, 11 palavras):
```
Hi! I am good, thank you! 😊 Do you like games?
🇧🇷 Oi! Eu estou bem, obrigado! 😊 Você gosta de jogos?
```

interesses 3 (ok=false, 9 palavras):
```
Hey! I am good, thanks! How are you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! Como você está?
```

</details>


## excecao-para-correcao-e-interesse — 2026-09-03T19:46:01.084Z (N=3)

- **correcao** (C1: "i like play games" -> corrige?): **0/3** | palavras em ingles (media): 14.3 | respostas vazias: 0
- **interesses** (C15: cita games/basketball?): **0/3** | palavras em ingles (media): 10.0 | respostas vazias: 0

<details><summary>saidas cruas</summary>


correcao 1 (ok=false, 16 palavras):
```
Nice! We say 'I play', not 'I like play'. Do you play on your phone? 😊
🇧🇷 Que legal! A gente diz 'I play', não 'I like play'. Você joga no seu celular?
```

correcao 2 (ok=false, 15 palavras):
```
Nice! We say 'I play', not 'I like play'. Do you play on your computer?
🇧🇷 Legal! Nós dizemos 'I play', não 'I like play'. Você joga no seu computador?
```

correcao 3 (ok=false, 12 palavras):
```
Oh, nice! We say 'I play'. What games do you play? 😊
🇧🇷 Ah, legal! Nós dizemos 'I play'. Que jogos você joga?
```

interesses 1 (ok=false, 11 palavras):
```
Hey! I am good, thank you! 😊 How are you today?
🇧🇷 Ei! Eu estou bem, obrigada! 😊 Como você está hoje?
```

interesses 2 (ok=false, 10 palavras):
```
Hey Lucas! I am good, thanks! 😊 What about you?
🇧🇷 Oi Lucas! Eu estou bem, obrigado! E você?
```

interesses 3 (ok=false, 9 palavras):
```
Hey! I am good, thanks! What about you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! E você?
```

</details>


## baseline-revertido-mais-controle — 2026-09-03T19:49:12.803Z (N=3)

- **correcao** (C1: "i like play games" -> corrige?): **0/3** | palavras em ingles (media): 13.0 | respostas vazias: 0
- **interesses** (C15: cita games/basketball?): **0/3** | palavras em ingles (media): 9.3 | respostas vazias: 0

<details><summary>saidas cruas</summary>


correcao 1 (ok=false, 12 palavras):
```
Nice! I like games too. Do you play on your phone? 😊
🇧🇷 Legal! Eu gosto de jogos também. Você joga no seu celular?
```

correcao 2 (ok=false, 12 palavras):
```
Nice! I like games too. Do you play on your phone? 😊
🇧🇷 Legal! Eu gosto de jogos também. Você joga no seu celular?
```

correcao 3 (ok=false, 15 palavras):
```
Ah, que legal! I like games too. Do you play on your phone or computer?
🇧🇷 Ah, que legal! Eu também gosto de jogos. Você joga no seu celular ou computador?
```

interesses 1 (ok=false, 10 palavras):
```
Hey Lucas! I am great, thanks! 😊 What about you?
🇧🇷 Oi Lucas! Eu estou ótima, obrigado! 😊 E você?
```

interesses 2 (ok=false, 9 palavras):
```
Hey! I am good, thanks! How are you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! Como você está?
```

interesses 3 (ok=false, 9 palavras):
```
Hey! I am good, thanks! How are you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! Como você está?
```

</details>


## controle-erro-da-lista — 2026-09-03T19:53:41.695Z (N=3)

- **correcao** (C1: "i like play games" -> corrige?): **0/3** | palavras em ingles (media): 12.7 | respostas vazias: 0
- **interesses** (C15: cita games/basketball?): **0/3** | palavras em ingles (media): 9.0 | respostas vazias: 0
- **controle: erro DA lista** ("video games is fun" -> corrige?): **2/3** | palavras em ingles (media): 13.7 | respostas vazias: 0

<details><summary>saidas cruas</summary>


correcao 1 (ok=false, 13 palavras):
```
Nice! I like games too! Do you play on your phone or computer?
🇧🇷 Que legal! Eu gosto de jogos também! Você joga no seu celular ou computador?
```

correcao 2 (ok=false, 13 palavras):
```
Ah, that's nice! I like games too. Do you play on your computer?
🇧🇷 Ah, que legal! Eu gosto de jogos também. Você joga no seu computador?
```

correcao 3 (ok=false, 12 palavras):
```
Ah, que legal! I like games too. Do you play video games?
🇧🇷 Ah, que legal! Eu gosto de jogos também. Você joga videogames?
```

controle-lista 1 (ok=true, 12 palavras):
```
Ah, yes! Video games are fun! Do you play games every day?
🇧🇷 Ah, sim! 'Video games ARE' divertidos! Você joga todo dia?
```

controle-lista 2 (ok=true, 13 palavras):
```
Oh, nice! Video games are fun. Do you play on your phone? 😊
🇧🇷 Ah, legal! Video games são divertidos. Você joga no celular?
```

controle-lista 3 (ok=false, 16 palavras):
```
Ah, that's nice! I like video games too. Do you play on your phone or computer?
🇧🇷 Ah, que legal! Eu também gosto de videogames. Você joga no seu celular ou computador?
```

interesses 1 (ok=false, 9 palavras):
```
Hey! I am good, thanks! How are you? 😊
🇧🇷 Ei! Eu estou bem, obrigada! Como você está?
```

interesses 2 (ok=false, 9 palavras):
```
Hey! I am good, thanks! How are you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! Como você está?
```

interesses 3 (ok=false, 9 palavras):
```
Hey! I am good, thanks! How are you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! Como você está?
```

</details>


## baseline-04-09 — 2026-09-04T18:34:17.793Z (N=3)

- **correcao** (C1: "i like play games" -> corrige?): **0/3** | palavras em ingles (media): 11.3 | respostas vazias: 0
- **interesses** (C15: cita games/basketball?): **0/3** | palavras em ingles (media): 9.0 | respostas vazias: 0
- **controle: erro DA lista** ("video games is fun" -> corrige?): **2/3** | palavras em ingles (media): 13.3 | respostas vazias: 0

<details><summary>saidas cruas</summary>


correcao 1 (ok=false, 11 palavras):
```
Oh, nice! I like games too. What games do you play?
🇧🇷 Ah, legal! Eu gosto de jogos também. Quais jogos você joga?
```

correcao 2 (ok=false, 11 palavras):
```
Oh, cool! I like games too. What games do you play?
🇧🇷 Ah, que legal! Eu gosto de jogos também. Quais jogos você joga?
```

correcao 3 (ok=false, 12 palavras):
```
Oh, nice! I like games too. Do you play on your phone?
🇧🇷 Ah, que legal! Eu gosto de jogos também. Você joga no seu celular?
```

controle-lista 1 (ok=true, 16 palavras):
```
Oh, nice! 'Video games are fun.' I like video games too. What game do you play?
🇧🇷 Ah, legal! 'Video games are fun.' Eu gosto de videogame também. Que jogo você joga?
```

controle-lista 2 (ok=false, 12 palavras):
```
Oh, I love video games too! Do you play on your phone?
🇧🇷 Ah, eu também adoro videogames! Você joga no seu celular?
```

controle-lista 3 (ok=true, 12 palavras):
```
Oh, that's cool! Video games are fun. Do you play many games?
🇧🇷 Ah, que legal! Jogos de vídeo são divertidos. Você joga muitos jogos?
```

interesses 1 (ok=false, 10 palavras):
```
Hey! I am good, thank you! How are you? 😊
🇧🇷 Ei! Eu estou bem, obrigada! Como você está?
```

interesses 2 (ok=false, 9 palavras):
```
Hey! I am good, thanks! What about you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! E você?
```

interesses 3 (ok=false, 8 palavras):
```
Hey Lucas! I am great! What about you?
🇧🇷 Oi Lucas! Eu estou ótima! E você?
```

</details>


## regra-com-exemplos — 2026-09-04T18:37:20.379Z (N=3)

- **correcao** (C1: "i like play games" -> corrige?): **0/3** | palavras em ingles (media): 12.3 | respostas vazias: 0
- **interesses** (C15: cita games/basketball?): **0/3** | palavras em ingles (media): 9.3 | respostas vazias: 0
- **controle: erro DA lista** ("video games is fun" -> corrige?): **1/3** | palavras em ingles (media): 12.0 | respostas vazias: 0

<details><summary>saidas cruas</summary>


correcao 1 (ok=false, 15 palavras):
```
Oh, that's great! We say 'I like TO play games'. Do you play video games?
🇧🇷 Ah, que legal! Nós dizemos 'I like TO play games'. Você joga videogame?
```

correcao 2 (ok=false, 11 palavras):
```
Oh, nice! I like games too. What games do you play?
🇧🇷 Ah, legal! Eu gosto de jogos também. Quais jogos você joga?
```

correcao 3 (ok=false, 11 palavras):
```
Oh, nice! I like games too. What games do you play?
🇧🇷 Ah, legal! Eu gosto de jogos também. Que jogos você joga?
```

controle-lista 1 (ok=true, 11 palavras):
```
Oh, nice! 'Video games are fun.' Do you like new games?
🇧🇷 Ah, legal! 'Video games are fun.' Você gosta de jogos novos?
```

controle-lista 2 (ok=false, 11 palavras):
```
Oh, I like video games too! Do you play every day?
🇧🇷 Ah, eu gosto de video games também! Você joga todo dia?
```

controle-lista 3 (ok=false, 14 palavras):
```
Oh, that's great! I like video games too. Do you play on your computer?
🇧🇷 Ah, que legal! Eu também gosto de videogame. Você joga no seu computador?
```

interesses 1 (ok=false, 10 palavras):
```
Hey Lucas! I am good, thanks! How are you? 😊
🇧🇷 Ei Lucas! Eu estou bem, obrigado! Como você está?
```

interesses 2 (ok=false, 9 palavras):
```
Hey! I am good, thanks! What about you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! E você?
```

interesses 3 (ok=false, 9 palavras):
```
Hey! I am good, thanks! How are you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! Como você está?
```

</details>


## regra-com-exemplos-N6 — 2026-09-04T18:40:36.966Z (N=6)

- **correcao** (C1: "i like play games" -> corrige?): **1/6** | palavras em ingles (media): 11.8 | respostas vazias: 0
- **interesses** (C15: cita games/basketball?): **0/6** | palavras em ingles (media): 9.3 | respostas vazias: 0
- **controle: erro DA lista** ("video games is fun" -> corrige?): **3/6** | palavras em ingles (media): 12.5 | respostas vazias: 0

<details><summary>saidas cruas</summary>


correcao 1 (ok=false, 11 palavras):
```
Oh, nice! I like games too. What games do you play?
🇧🇷 Ah, legal! Eu gosto de jogos também. Quais jogos você joga?
```

correcao 2 (ok=true, 16 palavras):
```
Oh, that's cool! We say 'I like to play games.' Do you play games every day?
🇧🇷 Ah, que legal! Nós dizemos 'I like to play games.' Você joga todo dia?
```

correcao 3 (ok=false, 12 palavras):
```
Oh, nice! You like 'to play' games. What games do you like?
🇧🇷 Ah, legal! Você gosta de jogar. Que jogos você gosta?
```

correcao 4 (ok=false, 11 palavras):
```
Oh, cool! I like games too. What games do you play?
🇧🇷 Ah, legal! Eu gosto de jogos também. Quais jogos você joga?
```

correcao 5 (ok=false, 11 palavras):
```
Oh, nice! I like games too. What games do you play?
🇧🇷 Ah, que legal! Eu gosto de jogos também. Quais jogos você joga?
```

correcao 6 (ok=false, 10 palavras):
```
Nice! I like games too. What games do you like?
🇧🇷 Legal! Eu gosto de jogos também. De quais jogos você gosta?
```

controle-lista 1 (ok=true, 11 palavras):
```
Oh, nice! 'Video games are fun'. What games do you like?
🇧🇷 Ah, legal! 'Video games are fun'. Quais jogos você gosta?
```

controle-lista 2 (ok=true, 15 palavras):
```
Oh, I like that! We say 'video games ARE fun'. What game do you play?
🇧🇷 Ah, adorei! Nós dizemos 'video games ARE fun'. Que jogo você joga?
```

controle-lista 3 (ok=false, 13 palavras):
```
Oh, that's cool! Video games 'are' fun, yes! Do you play a lot?
🇧🇷 Ah, que legal! Video games 'são' divertidos, sim! Você joga muito?
```

controle-lista 4 (ok=true, 11 palavras):
```
Oh, nice! Video games are fun. What games do you like?
🇧🇷 Ah, legal! Video games são divertidos. Quais jogos você gosta?
```

controle-lista 5 (ok=false, 13 palavras):
```
Oh, that's great! I like video games too. What game do you play?
🇧🇷 Ah, que legal! Eu também gosto de videogame. Qual jogo você joga?
```

controle-lista 6 (ok=false, 12 palavras):
```
Oh, that's cool! Video games 'are' fun. What games do you like?
🇧🇷 Ah, que legal! Video games são divertidos. Quais jogos você gosta?
```

interesses 1 (ok=false, 9 palavras):
```
Hey! I am good, thanks! What about you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! E você?
```

interesses 2 (ok=false, 9 palavras):
```
Hey! I am good, thanks! What about you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! E você?
```

interesses 3 (ok=false, 10 palavras):
```
Hey there! I am good, thanks! What about you? 😊
🇧🇷 Olá! Eu estou bem, obrigado! E você?
```

interesses 4 (ok=false, 9 palavras):
```
Hey! I am good, thanks! What about you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! E você?
```

interesses 5 (ok=false, 9 palavras):
```
Hey! I am good, thanks! What about you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! E você?
```

interesses 6 (ok=false, 10 palavras):
```
Hey there! I am good, thanks! What about you? 😊
🇧🇷 Olá! Eu estou bem, obrigado! E você?
```

</details>


## prioridade-explicita-N6 — 2026-09-04T18:45:51.318Z (N=6)

- **correcao** (C1: "i like play games" -> corrige?): **0/6** | palavras em ingles (media): 12.5 | respostas vazias: 0
- **interesses** (C15: cita games/basketball?): **0/6** | palavras em ingles (media): 11.5 | respostas vazias: 0
- **controle: erro DA lista** ("video games is fun" -> corrige?): **3/6** | palavras em ingles (media): 13.8 | respostas vazias: 0

<details><summary>saidas cruas</summary>


correcao 1 (ok=false, 11 palavras):
```
Oh, nice! I like games too. What games do you play?
🇧🇷 Ah, que legal! Eu gosto de jogos também. Quais jogos você joga?
```

correcao 2 (ok=false, 12 palavras):
```
Oh, nice! I like games too. What games do you play? 😊
🇧🇷 Ah, que legal! Eu gosto de jogos também. Que jogos você joga?
```

correcao 3 (ok=false, 12 palavras):
```
Oh, nice! I like games too. What games do you play? 🤔
🇧🇷 Ah, legal! Eu gosto de jogos também. Que jogos você joga?
```

correcao 4 (ok=false, 15 palavras):
```
Oh, cool! I like games too. Do you play on your phone or computer? 😊
🇧🇷 Ah, legal! Eu gosto de jogos também. Você joga no seu celular ou computador?
```

correcao 5 (ok=false, 12 palavras):
```
Oh, nice! I like games too. What games do you play? 😊
🇧🇷 Ah, que legal! Eu gosto de jogos também. Que jogos você joga?
```

correcao 6 (ok=false, 13 palavras):
```
Oh, that's cool! I like games too. What games do you play? 😊
🇧🇷 Ah, que legal! Eu gosto de jogos também. Quais jogos você joga?
```

controle-lista 1 (ok=true, 12 palavras):
```
Oh, I agree! Video games are fun. What games do you play?
🇧🇷 Ah, eu concordo! Jogos de vídeo são divertidos. Quais jogos você joga?
```

controle-lista 2 (ok=false, 12 palavras):
```
Oh, nice! I like video games too. What game do you play?
🇧🇷 Ah, que legal! Eu também gosto de videogame. Qual jogo você joga?
```

controle-lista 3 (ok=true, 19 palavras):
```
Oh, that's great! We say 'video games ARE fun', not 'video games IS fun'. What games do you like?
🇧🇷 Ah, que legal! Nós dizemos 'video games ARE fun', não 'video games IS fun'. Quais jogos você gosta?
```

controle-lista 4 (ok=true, 15 palavras):
```
Nice! We say 'video games ARE fun'. Do you play video games every day? 😊
🇧🇷 Que legal! A gente diz 'video games ARE fun'. Você joga videogame todo dia?
```

controle-lista 5 (ok=false, 12 palavras):
```
Oh, nice! I like video games too. What game do you play?
🇧🇷 Ah, que legal! Eu também gosto de videogame. Qual jogo você joga?
```

controle-lista 6 (ok=false, 13 palavras):
```
Oh, that's cool! I like video games too. What game do you play?
🇧🇷 Ah, que legal! Eu também gosto de videogame. Que jogo você joga?
```

interesses 1 (ok=false, 10 palavras):
```
Hi Lucas! I am great, thanks! How are you? 😊
🇧🇷 Oi Lucas! Eu estou ótima, obrigada! Como você está?
```

interesses 2 (ok=false, 17 palavras):
```
I am good, Lucas! I am happy you are here. What do you like to do? 😊
🇧🇷 Eu estou bem, Lucas! Fico feliz que você esteja aqui. O que você gosta de fazer?
```

interesses 3 (ok=false, 12 palavras):
```
Hello Lucas! I am good, thank you! 😊 How are you today?
🇧🇷 Olá Lucas! Eu estou bem, obrigado! Como você está hoje?
```

interesses 4 (ok=false, 12 palavras):
```
Hey Lucas! I am great, thank you! 😊 How are you today?
🇧🇷 Oi Lucas! Eu estou ótima, obrigada! 😊 Como você está hoje?
```

interesses 5 (ok=false, 9 palavras):
```
Hey! I am good, thanks! What about you? 😊
🇧🇷 Ei! Estou bem, obrigado! E você?
```

interesses 6 (ok=false, 9 palavras):
```
Hey Lucas! I am great! 😊 What about you?
🇧🇷 Oi Lucas! Eu estou ótima! E você?
```

</details>


## baseline-v8-T011 — 2026-09-06T21:54:07.427Z (N=3)

- **correcao** (C1: "i like play games" -> corrige?): **0/3** | palavras em ingles (media): 12.7 | respostas vazias: 0
- **interesses** (C15: cita games/basketball?): **0/3** | palavras em ingles (media): 9.0 | respostas vazias: 0
- **controle: erro DA lista** ("video games is fun" -> corrige?): **3/3** | palavras em ingles (media): 14.0 | respostas vazias: 0

<details><summary>saidas cruas</summary>


correcao 1 (ok=false, 12 palavras):
```
Oh, that's cool! I like games too. What games do you play?
🇧🇷 Ah, que legal! Eu gosto de jogos também. Que jogos você joga?
```

correcao 2 (ok=false, 12 palavras):
```
Oh, nice! I like games too. Do you play on your phone?
🇧🇷 Ah, que legal! Eu gosto de jogos também. Você joga no seu celular?
```

correcao 3 (ok=false, 14 palavras):
```
Oh, nice! I like games too. Do you play on your phone or computer?
🇧🇷 Ah, legal! Eu gosto de jogos também. Você joga no seu celular ou computador?
```

controle-lista 1 (ok=true, 12 palavras):
```
Oh, I agree! Video games are fun. What games do you like?
🇧🇷 Ah, eu concordo! Jogos de vídeo são divertidos. Quais jogos você gosta?
```

controle-lista 2 (ok=true, 17 palavras):
```
Oh, nice! 'Video games' is plural. We say 'video games ARE fun'. Do you play many games?
🇧🇷 Ah, legal! 'Video games' é plural. Nós dizemos 'video games SÃO divertidos'. Você joga muitos jogos?
```

controle-lista 3 (ok=true, 13 palavras):
```
Oh, I like that! Video games are fun. Do you play every day?
🇧🇷 Ah, eu gosto disso! Video games são divertidos. Você joga todo dia?
```

interesses 1 (ok=false, 9 palavras):
```
Hey! I am good, thank you! How are you?
🇧🇷 Oi! Eu estou bem, obrigada! Como você está?
```

interesses 2 (ok=false, 9 palavras):
```
Hey! I am good, thanks! What about you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! E você?
```

interesses 3 (ok=false, 9 palavras):
```
Hey! I am good, thank you! How are you?
🇧🇷 Oi! Eu estou bem, obrigada! Como você está?
```

</details>


## baseline-v8-T011-r2 — 2026-09-06T21:57:48.881Z (N=3)

- **correcao** (C1: "i like play games" -> corrige?): **0/3** | palavras em ingles (media): 11.0 | respostas vazias: 0
- **interesses** (C15: cita games/basketball?): **0/3** | palavras em ingles (media): 8.7 | respostas vazias: 0
- **controle: erro DA lista** ("video games is fun" -> corrige?): **3/3** | palavras em ingles (media): 14.3 | respostas vazias: 0

<details><summary>saidas cruas</summary>


correcao 1 (ok=false, 11 palavras):
```
Oh, nice! I like games too. What games do you play?
🇧🇷 Ah, legal! Eu gosto de jogos também. Quais jogos você joga?
```

correcao 2 (ok=false, 11 palavras):
```
Oh, cool! I like games too. What games do you play?
🇧🇷 Ah, legal! Eu gosto de jogos também. Quais jogos você joga?
```

correcao 3 (ok=false, 11 palavras):
```
Nice! I like games too. Do you play on your phone?
🇧🇷 Legal! Eu gosto de jogos também. Você joga no seu celular?
```

controle-lista 1 (ok=true, 12 palavras):
```
Oh, that's cool! Video games are fun. Do you like many games?
🇧🇷 Ah, que legal! Video games são divertidos. Você gosta de muitos jogos?
```

controle-lista 2 (ok=true, 12 palavras):
```
Oh, I agree! Video games are fun. Do you like many games?
🇧🇷 Ah, eu concordo! Jogos de vídeo são divertidos. Você gosta de muitos jogos?
```

controle-lista 3 (ok=true, 19 palavras):
```
Oh, nice! 'Video games' is plural, so we say 'video games are fun'. Do you play video games often?
🇧🇷 Ah, legal! 'Video games' é plural, então nós dizemos 'video games are fun'. Você joga videogame com frequência?
```

interesses 1 (ok=false, 8 palavras):
```
Hey Lucas! I am great! What about you?
🇧🇷 Oi Lucas! Estou ótima! E você?
```

interesses 2 (ok=false, 9 palavras):
```
Hey! I am good, thanks! How are you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! Como você está?
```

interesses 3 (ok=false, 9 palavras):
```
Hey! I am good, thank you! How are you?
🇧🇷 Oi! Eu estou bem, obrigada! Como você está?
```

</details>


## baseline-v8-T011-r3 — 2026-09-06T22:00:56.178Z (N=3)

- **correcao** (C1: "i like play games" -> corrige?): **0/3** | palavras em ingles (media): 10.0 | respostas vazias: 0
- **interesses** (C15: cita games/basketball?): **0/3** | palavras em ingles (media): 9.0 | respostas vazias: 0
- **controle: erro DA lista** ("video games is fun" -> corrige?): **3/3** | palavras em ingles (media): 12.7 | respostas vazias: 0

<details><summary>saidas cruas</summary>


correcao 1 (ok=false, 8 palavras):
```
Oh, that's cool! What games do you like?
🇧🇷 Ah, que legal! Quais jogos você gosta?
```

correcao 2 (ok=false, 11 palavras):
```
Oh, nice! I like games too. What games do you play?
🇧🇷 Ah, que legal! Eu gosto de jogos também. Quais jogos você joga?
```

correcao 3 (ok=false, 11 palavras):
```
Oh, nice! I like games too. What games do you play?
🇧🇷 Ah, legal! Eu gosto de jogos também. Que jogos você joga?
```

controle-lista 1 (ok=true, 14 palavras):
```
Oh, I agree! Video games are fun. Do you play video games every day?
🇧🇷 Ah, eu concordo! Videogames são divertidos. Você joga videogame todo dia?
```

controle-lista 2 (ok=true, 12 palavras):
```
Oh, I agree! Video games are fun. What games do you like?
🇧🇷 Ah, eu concordo! Jogos de vídeo são divertidos. Quais jogos você gosta?
```

controle-lista 3 (ok=true, 12 palavras):
```
Oh, I agree! Video games are fun. Do you play many games?
🇧🇷 Ah, eu concordo! Jogos de vídeo são divertidos. Você joga muitos jogos?
```

interesses 1 (ok=false, 9 palavras):
```
Hey! I am good, thanks! How are you? 😊
🇧🇷 Ei! Eu estou bem, obrigada! Como você está?
```

interesses 2 (ok=false, 9 palavras):
```
Hey! I am good, thanks! What about you? 😊
🇧🇷 Ei! Eu estou bem, obrigada! E você?
```

interesses 3 (ok=false, 9 palavras):
```
Hey! I am good, thanks! How are you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! Como você está?
```

</details>


## T011 — agregado das 3 rodadas de N=3 no **v8** — 2026-09-06

Ingress usado: `iachat-test-v8` (env `IACHAT_TEST_PATH=iachat-test-v8`). Conferido pela API:
as 12 execuções mais recentes (3608–3619) são todas do workflow `PbwEf7L9xEXhJaCg` (v8),
nenhuma do `9MA0o1XJjD33BnKc` (v7.4). Fluxo **não alterado**; tarefa puramente de medição.

Rodadas: `baseline-v8-T011`, `baseline-v8-T011-r2`, `baseline-v8-T011-r3` (N=3 cada, 9 por probe).

| probe | v8 (T011) | baseline v7.4 (04/09) | bate? |
|---|---|---|---|
| correção C1 (`i like play games`) | **0/9** | 0/9 | sim |
| interesses C15 | **0/9** | 0/9 | sim |
| controle, erro DA lista (detector do script) | **9/9** | ~2/3 | **não** |
| controle, mesma régua estrita do C1 (exige reparo explícito) | **2/9** | — | — |

Turnos vazios ou perdidos: **0 de 27**.

**Ressalva de instrumento.** O detector do controle é `/games are|are fun|✔️|.../`, isto é, aceita
o bot **usando** a forma certa na própria frase (`Oh, I agree! Video games are fun.`) sem apontar
o erro do aluno. É exatamente o falso positivo que foi corrigido no detector do C1 em 04/09, e
que aqui continua em pé. Aplicando ao controle a mesma exigência de **reparo explícito**, só 2
das 9 respostas corrigem de fato:

```
Oh, nice! 'Video games' is plural. We say 'video games ARE fun'. Do you play many games?
Oh, nice! 'Video games' is plural, so we say 'video games are fun'. Do you play video games often?
```

As outras 7 são do tipo `Oh, I agree! Video games are fun. Do you play many games?` — concordância
com o conteúdo, não correção. Com essa régua o controle no v8 (2/9 ≈ 0,22) fica **abaixo** do ~2/3
registrado no v7.4, mas os dois números não se comparam: o 2/3 foi medido com o detector frouxo.
O comparável é o frouxo: v8 9/9 contra v7.4 ~2/3.

**Conclusão para o T012:** o v8 reproduz o baseline nos dois probes que importam — correção 0/9 e
interesses 0/9. O T012 pode usar este agregado como baseline. O que mudou de figura é o controle:
no v8 ele não é mais um discriminante útil pelo detector atual, porque satura em 9/9 por
concordância; se o T012 for usar controle, tem de usar a régua estrita.

## variante-exemplo-com-correcao-e-interesse — 2026-09-06T22:17:05.789Z (N=9)

- **correcao** (C1: "i like play games" -> corrige?): **9/9** | palavras em ingles (media): 15.1 | respostas vazias: 0
- **interesses** (C15: cita games/basketball?): **0/9** | palavras em ingles (media): 9.9 | respostas vazias: 0
- **controle: erro DA lista** ("video games is fun" -> corrige?): **8/9** | palavras em ingles (media): 15.2 | respostas vazias: 0

<details><summary>saidas cruas</summary>


correcao 1 (ok=true, 14 palavras):
```
Cool! We say 'I like to play games'. What games do you like? 😊
🇧🇷 Que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

correcao 2 (ok=true, 15 palavras):
```
Oh, nice! We say 'I like to play games'. What games do you like? 😊
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

correcao 3 (ok=true, 17 palavras):
```
Oh, nice! We say 'I like to play games'. What kind of games do you like? 😊
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que tipo de jogos você gosta?
```

correcao 4 (ok=true, 15 palavras):
```
Oh, nice! We say 'I like to play games'. What games do you like? 😊
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

correcao 5 (ok=true, 15 palavras):
```
Oh, nice! We say 'I like to play games'. What games do you like? 😊
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

correcao 6 (ok=true, 15 palavras):
```
Oh, nice! We say 'I like to play games'. What games do you like? 😊
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

correcao 7 (ok=true, 15 palavras):
```
Oh, nice! We say 'I like to play games'. What games do you like? 😊
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

correcao 8 (ok=true, 15 palavras):
```
Oh, nice! We say 'I like to play games'. What games do you like? 😊
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

correcao 9 (ok=true, 15 palavras):
```
Oh, cool! We say 'I like to play games'. What games do you like? 😊
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

controle-lista 1 (ok=true, 15 palavras):
```
Oh, nice! We say 'video games are fun'. What is your favorite video game? 😊
🇧🇷 Ah, legal! A gente diz 'video games are fun'. Qual é o seu videogame favorito?
```

controle-lista 2 (ok=true, 14 palavras):
```
Oh, cool! We say 'video games are fun'. What games do you like? 😊
🇧🇷 Ah, legal! A gente diz 'video games are fun'. Quais jogos você gosta?
```

controle-lista 3 (ok=true, 24 palavras):
```
Oh, I agree! Video games are fun. We say 'video games are fun', not 'video games is fun'. What games do you like? 😊
🇧🇷 Ah, eu concordo! Jogos de vídeo são divertidos. A gente diz 'video games are fun', não 'video games is fun'. Que jogos você gosta?
```

controle-lista 4 (ok=true, 14 palavras):
```
Oh, really? We say 'video games are fun'. What games do you like? 😊
🇧🇷 Ah, é mesmo? A gente diz 'video games are fun'. Que jogos você gosta?
```

controle-lista 5 (ok=true, 14 palavras):
```
Oh, nice! We say 'video games ARE fun'. What game do you play? 🙂
🇧🇷 Ah, que legal! A gente diz 'video games ARE fun'. Que jogo você joga?
```

controle-lista 6 (ok=true, 16 palavras):
```
Oh, I like that! We say 'video games are fun'. What games do you play? 😊
🇧🇷 Ah, eu gostei disso! A gente diz 'video games are fun'. Que jogos você joga?
```

controle-lista 7 (ok=true, 14 palavras):
```
Oh, cool! We say 'video games are fun'. What games do you play? 😊
🇧🇷 Ah, que legal! A gente diz 'video games are fun'. Quais jogos você joga?
```

controle-lista 8 (ok=false, 12 palavras):
```
Oh, I agree! Video games 'are' fun. What game do you play?
🇧🇷 Ah, eu concordo! Videogames 'são' divertidos. Que jogo você joga?
```

controle-lista 9 (ok=true, 14 palavras):
```
Oh, nice! We say 'video games are fun'. What games do you like? 😊
🇧🇷 Ah, que legal! A gente diz 'video games are fun'. Quais jogos você gosta?
```

interesses 1 (ok=false, 10 palavras):
```
Hey! I am good, thanks! How are you today? 😊
🇧🇷 Ei! Eu estou bem, obrigado! Como você está hoje?
```

interesses 2 (ok=false, 10 palavras):
```
Hey! I am good, thanks! How are you today? 🙂
🇧🇷 Oi! Eu estou bem, obrigada! Como você está hoje?
```

interesses 3 (ok=false, 10 palavras):
```
Hey! I am good, thanks! How are you today? 😊
🇧🇷 Ei! Eu estou bem, obrigado! Como você está hoje?
```

interesses 4 (ok=false, 10 palavras):
```
Hey! I am good, thank you! How are you? 😊
🇧🇷 Ei! Eu estou bem, obrigada! Como você está?
```

interesses 5 (ok=false, 10 palavras):
```
Hey Lucas! I am great, thanks! 😊 What about you?
🇧🇷 Oi Lucas! Eu estou ótima, obrigada! E você?
```

interesses 6 (ok=false, 10 palavras):
```
Hey! I am good, thanks! How are you today? 😊
🇧🇷 Ei! Eu estou bem, obrigado! Como você está hoje?
```

interesses 7 (ok=false, 10 palavras):
```
Hey! I am good, thanks. How are you today? 😊
🇧🇷 Ei! Eu estou bem, obrigada. Como você está hoje?
```

interesses 8 (ok=false, 9 palavras):
```
Hey! I am good, thanks! How are you? 😊
🇧🇷 Ei! Estou bem, obrigada! Como você está?
```

interesses 9 (ok=false, 10 palavras):
```
Hey! I am good, thanks! How are you today? 😊
🇧🇷 Ei! Estou bem, obrigado! Como você está hoje?
```

</details>


## T012 — decisão: a hipótese do exemplo de formato SE CONFIRMA — 2026-09-06

Uma variável só: o exemplo dentro de `IDIOMA (A1, formato OBRIGATÓRIO)` do nó `Prompt Conversa A1`
(v8). Antes: `Nice! Do you play on your phone?` — sem correção e sem interesse. Depois: um exemplo
que faz o reparo no formato do contrato (`We say 'I like music', not 'I likes music'`) e puxa um
interesse. Nada mais foi tocado: `correctionLine`, `interestsLine`, ERROS QUE CONTAM e os demais
níveis ficaram idênticos.

| probe | régua | baseline v8 (T011, N=9) | variante (N=9) |
|---|---|---|---|
| correção (C1, `i like play games`) | detector do C1 (reparo explícito) | **0/9** | **9/9** |
| interesses (C15) | detector do C15 | **0/9** | **0/9** |
| controle (erro DA lista) | **estrita** (reparo explícito) | 2/9 | **8/9** |
| controle (erro DA lista) | frouxa (a que saturou no T011) | 9/9 | 8/9 |

> Correcao do verificador: a coluna da variante nesta linha saiu 9/9 na primeira redacao e o
> numero certo e **8/9** — a saida que reprova (`Video games 'are' fun`, sem reparo) falha nas
> DUAS reguas. Nao e a linha que sustenta a conclusao, mas evidencia com numero errado envenena
> quem ler depois.

Turnos vazios: **0 em 27** (mesmo do baseline). A régua estrita foi recomputada sobre as saídas
cruas do baseline com o mesmo código, e reproduz os 2/9 publicados no T011 — os números comparam.

**Decisão: MANTIDA.** O few-shot estava vencendo a instrução: o modelo imitava a forma do exemplo
(simpático, curto, sem reparo) em vez de seguir o contrato de correção. Trocado o exemplo, o A1
passa a corrigir.

**C15 continua morto** (0/9, sem qualquer movimento). Interesses no A1 são um problema separado do
exemplo de formato — o exemplo novo cita um interesse e ainda assim não induz uso. Fica aberto.

## baseline-T023-v8 — 2026-09-10T13:38:28.401Z (N=6)

- **correcao** (C1: "i like play games" -> corrige?): **6/6** | palavras em ingles (media): 16.8 | respostas vazias: 0
- **interesses** (C15: cita games/basketball?): **0/6** | palavras em ingles (media): 10.5 | respostas vazias: 0
- **controle: erro DA lista** ("video games is fun" -> corrige? regua estrita: reparo explicito, nao basta usar a forma certa): **1/6** | palavras em ingles (media): 13.2 | respostas vazias: 0

<details><summary>saidas cruas</summary>


correcao 1 (ok=true, 15 palavras):
```
Oh, cool! We say 'I like to play games'. What games do you like? 🙂
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

correcao 2 (ok=true, 20 palavras):
```
Oh, nice! We say 'I like to play games' or 'I like playing games'. What games do you like? 😊
🇧🇷 Ah, que legal! A gente diz 'I like to play games' ou 'I like playing games'. Que jogos você gosta?
```

correcao 3 (ok=true, 15 palavras):
```
Oh, cool! We say 'I like to play games'. What games do you like? 🙂
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

correcao 4 (ok=true, 15 palavras):
```
Oh, cool! We say 'I like to play games'. What games do you like? 🙂
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

correcao 5 (ok=true, 20 palavras):
```
Oh, nice! We say 'I like to play games' or 'I like playing games'. What games do you like? 😊
🇧🇷 Ah, legal! A gente diz 'I like to play games' ou 'I like playing games'. Que jogos você gosta?
```

correcao 6 (ok=true, 16 palavras):
```
Oh, that's cool! We say 'I like to play games'. What games do you like? 😊
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Quais jogos você gosta?
```

controle-lista 1 (ok=true, 14 palavras):
```
Oh, that's cool! We say 'video games are fun'. What games do you play?
🇧🇷 Ah, que legal! A gente diz 'video games are fun'. Que jogos você joga?
```

controle-lista 2 (ok=false, 15 palavras):
```
Oh, that's so true! Video games are really fun. What games do you like? 😊
🇧🇷 Ah, isso é muito verdade! Videogames são muito divertidos. Quais jogos você gosta?
```

controle-lista 3 (ok=false, 12 palavras):
```
Oh, I agree! Video games are fun. What game do you play?
🇧🇷 Ah, eu concordo! Jogos de vídeo são divertidos. Que jogo você joga?
```

controle-lista 4 (ok=false, 12 palavras):
```
Oh, nice! Video games are really fun. What game do you play?
🇧🇷 Ah, legal! Video games são muito divertidos. Qual jogo você joga?
```

controle-lista 5 (ok=false, 13 palavras):
```
Oh, I totally agree! Video games are fun. What game do you like?
🇧🇷 Ah, eu concordo totalmente! Videogames são divertidos. Qual jogo você gosta?
```

controle-lista 6 (ok=false, 13 palavras):
```
Oh, that's cool! Video games 'are' fun. What games do you like? 😊
🇧🇷 Ah, que legal! Video games 'are' fun. Quais jogos você gosta?
```

interesses 1 (ok=false, 11 palavras):
```
Hey there! I am good, thanks! How are you today? 😊
🇧🇷 E aí! Eu estou bem, obrigado! Como você está hoje?
```

interesses 2 (ok=false, 11 palavras):
```
Hey Lucas! I am great, thanks! How are you today? 😊
🇧🇷 Ei Lucas! Estou ótima, obrigado! Como você está hoje?
```

interesses 3 (ok=false, 10 palavras):
```
Hey there! I am good, thanks! How are you? 😊
🇧🇷 E aí! Eu estou bem, obrigado! Como você está?
```

interesses 4 (ok=false, 10 palavras):
```
Hey Lucas! I am great, thanks! How about you? 😊
🇧🇷 E aí, Lucas! Eu estou ótima, obrigado! E você?
```

interesses 5 (ok=false, 11 palavras):
```
Hey Lucas! I am great, thanks! How are you today? 😊
🇧🇷 Ei Lucas! Eu estou ótima, obrigada! Como você está hoje?
```

interesses 6 (ok=false, 10 palavras):
```
Hey Lucas! I am great, thanks! 😊 What about you?
🇧🇷 Oi Lucas! Eu estou ótima, obrigada! 😊 E você?
```

</details>


## variante-gancho-T023 — 2026-09-10T13:46:37.956Z (N=6)

- **correcao** (C1: "i like play games" -> corrige?): **6/6** | palavras em ingles (media): 14.8 | respostas vazias: 0
- **interesses** (C15: cita games/basketball?): **0/6** | palavras em ingles (media): 10.0 | respostas vazias: 0
- **controle: erro DA lista** ("video games is fun" -> corrige? regua estrita: reparo explicito, nao basta usar a forma certa): **4/6** | palavras em ingles (media): 14.7 | respostas vazias: 0

<details><summary>saidas cruas</summary>


correcao 1 (ok=true, 16 palavras):
```
Nice! We say 'I like to play games'. Do you like big games or small games?
🇧🇷 Que legal! A gente diz 'I like to play games'. Você gosta de jogos grandes ou jogos pequenos?
```

correcao 2 (ok=true, 14 palavras):
```
That's cool! We say 'I like to play games'. What games do you play?
🇧🇷 Que legal! A gente diz 'I like to play games'. Quais jogos você joga?
```

correcao 3 (ok=true, 15 palavras):
```
Oh, cool! We say 'I like to play games'. What games do you like? 🙂
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

correcao 4 (ok=true, 15 palavras):
```
Oh, nice! We say 'I like to play games'. What games do you like? 🙂
🇧🇷 Ah, legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

correcao 5 (ok=true, 14 palavras):
```
Oh, nice! We say 'I like to play games'. What games do you like?
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

correcao 6 (ok=true, 15 palavras):
```
Oh, cool! We say 'I like to play games'. What games do you like? 🙂
🇧🇷 Ah, legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

controle-lista 1 (ok=true, 22 palavras):
```
Ah, nice! Video games are fun. We say 'video games are fun', not 'video games is fun'. What games do you play?
🇧🇷 Ah, que legal! Video games são divertidos. A gente diz 'video games are fun', não 'video games is fun'. Que jogos você joga?
```

controle-lista 2 (ok=true, 14 palavras):
```
Oh, nice! We say 'video games ARE fun'. What game do you play? 🙂
🇧🇷 Ah, que legal! A gente diz 'video games ARE fun'. Que jogo você joga?
```

controle-lista 3 (ok=false, 12 palavras):
```
Oh, I agree! Video games 'are' fun. What game do you like?
🇧🇷 Ah, eu concordo! Videogames 'são' divertidos. Que jogo você gosta?
```

controle-lista 4 (ok=false, 12 palavras):
```
Oh, I agree! Video games 'are' fun. What game do you like?
🇧🇷 Ah, eu concordo! Video games 'são' divertidos. Que jogo você gosta?
```

controle-lista 5 (ok=true, 14 palavras):
```
Oh, nice! We say 'video games ARE fun'. What game do you play? 🙂
🇧🇷 Ah, legal! A gente diz 'video games ARE fun'. Qual jogo você joga?
```

controle-lista 6 (ok=true, 14 palavras):
```
Oh, I understand! We say 'video games ARE fun'. What game do you play?
🇧🇷 Ah, eu entendo! A gente diz 'video games ARE fun'. Que jogo você joga?
```

interesses 1 (ok=false, 11 palavras):
```
Hi Lucas! I am good, thanks! How are you today? 🙂
🇧🇷 Oi Lucas! Eu estou bem, obrigado! Como você está hoje?
```

interesses 2 (ok=false, 9 palavras):
```
Hey! I am good, thanks! How are you? 😊
🇧🇷 Ei! Estou bem, obrigado! Como você está?
```

interesses 3 (ok=false, 12 palavras):
```
I am very good, Lucas! Thanks for asking. What about you? 😊
🇧🇷 Eu estou muito bem, Lucas! Obrigado por perguntar. E você?
```

interesses 4 (ok=false, 10 palavras):
```
Hey! I am good, thanks! How are you today? 😊
🇧🇷 Ei! Eu estou bem, obrigada! Como você está hoje?
```

interesses 5 (ok=false, 9 palavras):
```
Hey! I am good, thanks! How are you? 😊
🇧🇷 Ei! Estou bem, obrigado! Como você está?
```

interesses 6 (ok=false, 9 palavras):
```
Hey! I am good, thanks! How are you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! Como você está?
```

</details>

