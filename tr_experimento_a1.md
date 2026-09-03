
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

