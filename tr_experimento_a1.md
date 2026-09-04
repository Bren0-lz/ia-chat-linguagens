
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

