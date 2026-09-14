# Bateria completa — Fase B (dependentes do LLM) — evento

> **N=3 nos qualitativos, N=1 nos deterministicos** (decisao do Breno, 06/09).
> Deterministico = o veredito sai de estado no banco e nao do texto do LLM:
> A5, PS1, C16, C17, C12, T4, T14. Todos os demais julgam a saida do modelo e
> foram medidos 3 vezes. Cada linha carrega a rodada em que foi medida;
> o agregado esta no fim. **Passar em 2 de 3 nao e PASSOU: e INSTAVEL.**

> Alvo: evento — http://localhost:5678/webhook/iachat-test-evento
> Inicio: 2026-09-14T13:41:30.140Z — faixa de user_id: 994290139+

---

## Rodada 1/3 — 2026-09-14T13:41:30.158Z


## Sem consumo de cota


## Modo Conversa


## Robustez


## Modo Professor

- **T1** (rodada 1/3): REVISAR — leitura humana — A explicacao e autossuficiente? Cobre as formas/regras completas? Ensina do zero? | tamanho=2447 semMarkdown=true

```
[prof.feedback] 📚 Modo Professor — nível A1. Vamos começar a trilha!
[PROFESSOR] 📚 Modo Professor — nível A1. Vamos começar a trilha!

<b>O QUE É E QUANDO USAR</b>
Cumprimentos e despedidas são as palavras que usamos para começar e terminar uma conversa em inglês. São a base da educação e da comunicação, usadas todos os dias ao encontrar ou deixar pessoas, seja em situações formais ou informais.

<b>AS FORMAS</b>
<i>Para cumprimentar (dizer "oi"):</i>
- <b>Hello</b> (Olá)
- <b>Hi</b> (Oi - <i>um pouco mais informal</i>)
- <b>Good morning</b> (Bom dia - <i>usado de manhã até o meio-dia</i>)
- <b>Good afternoon</b> (Boa tarde - <i>usado do meio-dia até o fim da tarde</i>)
- <b>Good evening</b> (Boa noite - <i>usado para cumprimentar ao chegar em um lugar à noite</i>)

<i>Para perguntar como a pessoa está:</i>
- <b>How are you?</b> (Como você está?)

<i>Para responder como você está:</i>
- <b>I'm fine, thank you.</b> (Eu estou bem, obrigado/a.)
- <b>I'm good.</b> (Eu estou bem.)
- <b>Not bad.</b> (Nada mal / Tudo bem.)

<i>Para se despedir (dizer "tchau"):</i>
- <b>Goodbye</b> (Tchau)
- <b>Bye</b> (Tchau - <i>mais informal</i>)
- <b>Good night</b> (Boa noite - <i>usado para se despedir à noite ou antes de dormir</i>)
- <b>See you</b> (Até mais)
- <b>See you later</b> (Até mais tarde)
- <b>See you tomorrow</b> (Até amanhã)

<i>Palavras de cortesia:</i>
- <b>Please</b> (Por favor)
- <b>Thank you</b> ou <b>Thanks</b> (Obrigado/a)
- <b>You're welcome</b> (De nada)

<b>EXEMPLOS</b>
- <b>Hi</b>, John! <b>How are you?</b>
  (Oi, John! Como você está?)

- <b>Good afternoon.</b> A coffee, <b>please.</b>
  (Boa tarde. Um café, por favor.)

- I'm going home now. <b>See you tomorrow!</b>
  (Estou indo para casa agora. Até amanhã!)

- Thank you for your help. <b>Good night!</b>
  (Ob
```

- **T2** (rodada 1/3): REVISAR — leitura humana — A questao cobra APENAS o que a explicacao ensinou? | gabarito="hello"

```
[prof.feedback] ▶️ Questões de “Cumprimentos”. Acerte 5 seguidas para liberar o próximo tópico! (sequência atual: 0/5)
[PROFESSOR] ▶️ Questões de “Cumprimentos”. Acerte 5 seguidas para liberar o próximo tópico! (sequência atual: 0/5)

❓ Como se diz "oi" em inglês?
```

- **T3** (rodada 1/3): PASSOU — nivel B2 | explicacao esperada em PT: portugues detectado=true -> ok | enunciado esperado em EN: portugues detectado=false -> ok

```
--- explicacao ---
[PROFESSOR] 📚 Modo Professor — nível B2. Vamos começar a trilha!

<b>O QUE É E QUANDO USAR</b>
Usamos o <i>Present Perfect Continuous</i> para falar de uma ação que começou no passado e continua até o presente. O foco principal é na <b>duração</b> da ação, no tempo que ela vem acontecendo, e não se ela já terminou ou não.

<b>AS FORMAS</b>
A estrutura é sempre <i>sujeito + have/has + been + verbo-ING</i>.

- <b>Afirmativa:</b>
<i>I/You/We/They have been working</i>
<i>He/She/It has been working</i>

- <b>Negativa:</b>
<i>I/You/We/They have not (haven't) been working</i>
<i>He/She/It has not (hasn't) been working</i>

- <b>Interrogativa:</b>
<i>Have you been working?</i>
<i>Has she been working?</i>

- <b>Palavras-chave (duração):</b>
<i>for</i> + período de tempo: <i>for two hours, for ten years, for a long time.</i>
<i>since</i> + ponto de início no tempo: <i>since 2020, since last week, since I arrived.</i>

<b>EXEMPLOS</b>
- <i>I have been studying English for three years.</i>
(Eu estudo inglês há três anos.)

- <i>She has been working at this company since January.</i>
(Ela está trabalhando nesta empresa desde janeiro.)

- <i>They are tired because they have been playing soccer all afternoon.</i>
(Eles estão cansados porque estiveram jogando futebol a tarde toda.)

- <i>How long have you been waiting for me?</i>
(Há quanto tempo você está me esperando?)

<b>ERROS COMUNS</b>
O erro mais comum é esquecer a palavra <i>been</i>. A estrutura precisa de todos os seus componentes.
errado: <i>I have studying for hours.</i>
o certo é: <i>I have <b>been</b> studying for hours.</i>

Outro ponto é a diferença para o <i>Present Perfect Simple</i>. O foco muda:
- <i>Present Perfect Continuous</i> (foco na <b>duração</b>): <i>I have been reading this book.</i>
```

- **T4** (rodada 1/1): PASSOU — topico 0 -> 1, streak=0 (esperado avancar e zerar)
- **T6** (rodada 1/3): PASSOU — tamanho do texto final=2711 (limite do Telegram: 4096)
- **T8** (rodada 1/3): REVISAR — leitura humana — Pediu esclarecimento em vez de inventar a duvida?

```
[DUVIDA] Eita, Marina! Parece que a sua pergunta foi mais misteriosa que o sumiço da meia depois da máquina de lavar! 🤣 Para eu te ajudar a desvendar os segredos do inglês, preciso que você me conte qual é a sua dúvida. Pode ser sobre o Past Continuous, sobre como fazer um sanduíche de queijo na lua, ou qualquer outra coisa! Manda brasa! 😜
```

- **T9** (rodada 1/3): REVISAR — leitura humana — Respondeu a duvida fora do topico sem forcar caber no topico atual?

```
[DUVIDA] Ah, uma questão clássica que muitos parecem confundir, mas que, na verdade, possui distinções bem claras. Discordo da ideia de que são intercambiáveis.

O Past Simple refere-se a ações concluídas em um tempo específico no passado. Pense em eventos isolados, com um começo e um fim definidos, mesmo que o tempo não seja explicitamente mencionado, ele é implícito. Por exemplo: "I visited Paris last year." A ação de visitar Paris terminou no ano passado.

Por outro lado, o Present Perfect conecta o passado ao presente. Ele descreve ações que começaram no passado e continuam até agora, ou ações passadas cujos resultados ainda são relevantes no presente. Não há um tempo específico de conclusão. Considere: "I have visited Paris many times." Isso implica que a experiência de visitar Paris se estende até o presente, e talvez eu ainda possa visitá-la novamente.

A diferença crucial reside na relevância temporal e na conclusão da ação. Prove seu ponto se achar que há alguma sobreposição que justifique a confusão.
```


---

## Rodada 2/3 — 2026-09-14T13:50:20.484Z


## Sem consumo de cota


## Modo Conversa


## Robustez


## Modo Professor

- **T1** (rodada 2/3): REVISAR — leitura humana — A explicacao e autossuficiente? Cobre as formas/regras completas? Ensina do zero? | tamanho=2447 semMarkdown=true

```
[prof.feedback] 📚 Modo Professor — nível A1. Vamos começar a trilha!
[PROFESSOR] 📚 Modo Professor — nível A1. Vamos começar a trilha!

<b>O QUE É E QUANDO USAR</b>
Cumprimentos e despedidas são as palavras que usamos para começar e terminar uma conversa em inglês. São a base da educação e da comunicação, usadas todos os dias ao encontrar ou deixar pessoas, seja em situações formais ou informais.

<b>AS FORMAS</b>
<i>Para cumprimentar (dizer "oi"):</i>
- <b>Hello</b> (Olá)
- <b>Hi</b> (Oi - <i>um pouco mais informal</i>)
- <b>Good morning</b> (Bom dia - <i>usado de manhã até o meio-dia</i>)
- <b>Good afternoon</b> (Boa tarde - <i>usado do meio-dia até o fim da tarde</i>)
- <b>Good evening</b> (Boa noite - <i>usado para cumprimentar ao chegar em um lugar à noite</i>)

<i>Para perguntar como a pessoa está:</i>
- <b>How are you?</b> (Como você está?)

<i>Para responder como você está:</i>
- <b>I'm fine, thank you.</b> (Eu estou bem, obrigado/a.)
- <b>I'm good.</b> (Eu estou bem.)
- <b>Not bad.</b> (Nada mal / Tudo bem.)

<i>Para se despedir (dizer "tchau"):</i>
- <b>Goodbye</b> (Tchau)
- <b>Bye</b> (Tchau - <i>mais informal</i>)
- <b>Good night</b> (Boa noite - <i>usado para se despedir à noite ou antes de dormir</i>)
- <b>See you</b> (Até mais)
- <b>See you later</b> (Até mais tarde)
- <b>See you tomorrow</b> (Até amanhã)

<i>Palavras de cortesia:</i>
- <b>Please</b> (Por favor)
- <b>Thank you</b> ou <b>Thanks</b> (Obrigado/a)
- <b>You're welcome</b> (De nada)

<b>EXEMPLOS</b>
- <b>Hi</b>, John! <b>How are you?</b>
  (Oi, John! Como você está?)

- <b>Good afternoon.</b> A coffee, <b>please.</b>
  (Boa tarde. Um café, por favor.)

- I'm going home now. <b>See you tomorrow!</b>
  (Estou indo para casa agora. Até amanhã!)

- Thank you for your help. <b>Good night!</b>
  (Ob
```

- **T2** (rodada 2/3): REVISAR — leitura humana — A questao cobra APENAS o que a explicacao ensinou? | gabarito="hello"

```
[prof.feedback] ▶️ Questões de “Cumprimentos”. Acerte 5 seguidas para liberar o próximo tópico! (sequência atual: 0/5)
[PROFESSOR] ▶️ Questões de “Cumprimentos”. Acerte 5 seguidas para liberar o próximo tópico! (sequência atual: 0/5)

❓ Como você diz "oi" em inglês?
```

- **T3** (rodada 2/3): PASSOU — nivel B2 | explicacao esperada em PT: portugues detectado=true -> ok | enunciado esperado em EN: portugues detectado=false -> ok

```
--- explicacao ---
[PROFESSOR] 📚 Modo Professor — nível B2. Vamos começar a trilha!

<b>O QUE É E QUANDO USAR</b>
Usamos o <i>Present Perfect Continuous</i> para falar de uma ação que começou no passado e continua até o presente. O foco principal é na <b>duração</b> da ação, no tempo que ela vem acontecendo, e não se ela já terminou ou não.

<b>AS FORMAS</b>
A estrutura é sempre <i>sujeito + have/has + been + verbo-ING</i>.

- <b>Afirmativa:</b>
<i>I/You/We/They have been working</i>
<i>He/She/It has been working</i>

- <b>Negativa:</b>
<i>I/You/We/They have not (haven't) been working</i>
<i>He/She/It has not (hasn't) been working</i>

- <b>Interrogativa:</b>
<i>Have you been working?</i>
<i>Has she been working?</i>

- <b>Palavras-chave (duração):</b>
<i>for</i> + período de tempo: <i>for two hours, for ten years, for a long time.</i>
<i>since</i> + ponto de início no tempo: <i>since 2020, since last week, since I arrived.</i>

<b>EXEMPLOS</b>
- <i>I have been studying English for three years.</i>
(Eu estudo inglês há três anos.)

- <i>She has been working at this company since January.</i>
(Ela está trabalhando nesta empresa desde janeiro.)

- <i>They are tired because they have been playing soccer all afternoon.</i>
(Eles estão cansados porque estiveram jogando futebol a tarde toda.)

- <i>How long have you been waiting for me?</i>
(Há quanto tempo você está me esperando?)

<b>ERROS COMUNS</b>
O erro mais comum é esquecer a palavra <i>been</i>. A estrutura precisa de todos os seus componentes.
errado: <i>I have studying for hours.</i>
o certo é: <i>I have <b>been</b> studying for hours.</i>

Outro ponto é a diferença para o <i>Present Perfect Simple</i>. O foco muda:
- <i>Present Perfect Continuous</i> (foco na <b>duração</b>): <i>I have been reading this book.</i>
```

- **T6** (rodada 2/3): PASSOU — tamanho do texto final=2711 (limite do Telegram: 4096)
- **T8** (rodada 2/3): REVISAR — leitura humana — Pediu esclarecimento em vez de inventar a duvida?

```
[DUVIDA] E aí, Marina! Parece que o seu teclado tirou férias, né? 🤣 Mandou só a interrogação, mas eu sou tipo um detetive de gramática, vou tentar adivinhar o que você quer saber!

Se a sua dúvida é sobre o Past Continuous, que é o nosso "estava fazendo" do inglês, pensa assim: ele é tipo aquela novela que você está assistindo quando, de repente, o controle remoto cai no chão e a cena congela! 😜 A ação estava rolando (I was watching TV), e aí algo PÁ! Aconteceu (the remote fell).

Ele é formado com WAS ou WERE (dependendo do sujeito, tipo "eu era" ou "nós éramos") e um verbo com -ING no final. Por exemplo: "I was cooking" (eu estava cozinhando) ou "They were dancing" (eles estavam dançando). É para falar de uma ação que estava em andamento no passado, tipo quando você estava sonhando que ganhava na loteria e o despertador tocou! 😅

Me conta se eu acertei o alvo, ou se eu viajei mais que turista em excursão! 😉
```

- **T9** (rodada 2/3): REVISAR — leitura humana — Respondeu a duvida fora do topico sem forcar caber no topico atual?

```
[DUVIDA] Ah, a eterna questão que assombra tantos aprendizes! Muitos se contentam em dizer que o Present Perfect conecta o passado ao presente, enquanto o Past Simple fala de algo concluído. Mas discordo que essa seja uma explicação completa.

Considere o seguinte: o Past Simple, como em "I ate breakfast", refere-se a uma ação que começou e terminou num ponto específico do passado, sem qualquer ligação ou relevância para o agora. É um evento isolado no tempo.

Por outro lado, o Present Perfect, como em "I have eaten breakfast", indica uma ação que ocorreu no passado, mas cujos efeitos ou relevância ainda se fazem sentir no presente. A ação em si pode ter terminado, mas o seu impacto não. Pense em "I have lost my keys" – as chaves foram perdidas no passado, mas o fato de estarem perdidas ainda é um problema agora.

E se eu lhe dissesse que a diferença primordial reside na perspectiva do falante? No Past Simple, você olha para trás para um evento como se ele estivesse numa fotografia antiga. No Present Perfect, você olha para trás, mas com um olho no presente, como se o evento ainda estivesse a influenciar a cena atual. Prove-me o contrário.
```


---

## Rodada 3/3 — 2026-09-14T13:54:33.185Z


## Sem consumo de cota


## Modo Conversa


## Robustez


## Modo Professor

- **T1** (rodada 3/3): REVISAR — leitura humana — A explicacao e autossuficiente? Cobre as formas/regras completas? Ensina do zero? | tamanho=2447 semMarkdown=true

```
[prof.feedback] 📚 Modo Professor — nível A1. Vamos começar a trilha!
[PROFESSOR] 📚 Modo Professor — nível A1. Vamos começar a trilha!

<b>O QUE É E QUANDO USAR</b>
Cumprimentos e despedidas são as palavras que usamos para começar e terminar uma conversa em inglês. São a base da educação e da comunicação, usadas todos os dias ao encontrar ou deixar pessoas, seja em situações formais ou informais.

<b>AS FORMAS</b>
<i>Para cumprimentar (dizer "oi"):</i>
- <b>Hello</b> (Olá)
- <b>Hi</b> (Oi - <i>um pouco mais informal</i>)
- <b>Good morning</b> (Bom dia - <i>usado de manhã até o meio-dia</i>)
- <b>Good afternoon</b> (Boa tarde - <i>usado do meio-dia até o fim da tarde</i>)
- <b>Good evening</b> (Boa noite - <i>usado para cumprimentar ao chegar em um lugar à noite</i>)

<i>Para perguntar como a pessoa está:</i>
- <b>How are you?</b> (Como você está?)

<i>Para responder como você está:</i>
- <b>I'm fine, thank you.</b> (Eu estou bem, obrigado/a.)
- <b>I'm good.</b> (Eu estou bem.)
- <b>Not bad.</b> (Nada mal / Tudo bem.)

<i>Para se despedir (dizer "tchau"):</i>
- <b>Goodbye</b> (Tchau)
- <b>Bye</b> (Tchau - <i>mais informal</i>)
- <b>Good night</b> (Boa noite - <i>usado para se despedir à noite ou antes de dormir</i>)
- <b>See you</b> (Até mais)
- <b>See you later</b> (Até mais tarde)
- <b>See you tomorrow</b> (Até amanhã)

<i>Palavras de cortesia:</i>
- <b>Please</b> (Por favor)
- <b>Thank you</b> ou <b>Thanks</b> (Obrigado/a)
- <b>You're welcome</b> (De nada)

<b>EXEMPLOS</b>
- <b>Hi</b>, John! <b>How are you?</b>
  (Oi, John! Como você está?)

- <b>Good afternoon.</b> A coffee, <b>please.</b>
  (Boa tarde. Um café, por favor.)

- I'm going home now. <b>See you tomorrow!</b>
  (Estou indo para casa agora. Até amanhã!)

- Thank you for your help. <b>Good night!</b>
  (Ob
```

- **T2** (rodada 3/3): REVISAR — leitura humana — A questao cobra APENAS o que a explicacao ensinou? | gabarito="hi"

```
[prof.feedback] ▶️ Questões de “Cumprimentos”. Acerte 5 seguidas para liberar o próximo tópico! (sequência atual: 0/5)
[PROFESSOR] ▶️ Questões de “Cumprimentos”. Acerte 5 seguidas para liberar o próximo tópico! (sequência atual: 0/5)

❓ Como você diz "oi" em inglês?
```

- **T3** (rodada 3/3): PASSOU — nivel B2 | explicacao esperada em PT: portugues detectado=true -> ok | enunciado esperado em EN: portugues detectado=false -> ok

```
--- explicacao ---
[PROFESSOR] 📚 Modo Professor — nível B2. Vamos começar a trilha!

<b>O QUE É E QUANDO USAR</b>
Usamos o <i>Present Perfect Continuous</i> para falar de uma ação que começou no passado e continua até o presente. O foco principal é na <b>duração</b> da ação, no tempo que ela vem acontecendo, e não se ela já terminou ou não.

<b>AS FORMAS</b>
A estrutura é sempre <i>sujeito + have/has + been + verbo-ING</i>.

- <b>Afirmativa:</b>
<i>I/You/We/They have been working</i>
<i>He/She/It has been working</i>

- <b>Negativa:</b>
<i>I/You/We/They have not (haven't) been working</i>
<i>He/She/It has not (hasn't) been working</i>

- <b>Interrogativa:</b>
<i>Have you been working?</i>
<i>Has she been working?</i>

- <b>Palavras-chave (duração):</b>
<i>for</i> + período de tempo: <i>for two hours, for ten years, for a long time.</i>
<i>since</i> + ponto de início no tempo: <i>since 2020, since last week, since I arrived.</i>

<b>EXEMPLOS</b>
- <i>I have been studying English for three years.</i>
(Eu estudo inglês há três anos.)

- <i>She has been working at this company since January.</i>
(Ela está trabalhando nesta empresa desde janeiro.)

- <i>They are tired because they have been playing soccer all afternoon.</i>
(Eles estão cansados porque estiveram jogando futebol a tarde toda.)

- <i>How long have you been waiting for me?</i>
(Há quanto tempo você está me esperando?)

<b>ERROS COMUNS</b>
O erro mais comum é esquecer a palavra <i>been</i>. A estrutura precisa de todos os seus componentes.
errado: <i>I have studying for hours.</i>
o certo é: <i>I have <b>been</b> studying for hours.</i>

Outro ponto é a diferença para o <i>Present Perfect Simple</i>. O foco muda:
- <i>Present Perfect Continuous</i> (foco na <b>duração</b>): <i>I have been reading this book.</i>
```

- **T6** (rodada 3/3): PASSOU — tamanho do texto final=2711 (limite do Telegram: 4096)
- **T8** (rodada 3/3): REVISAR — leitura humana — Pediu esclarecimento em vez de inventar a duvida?

```
[DUVIDA] Marina, minha querida, parece que o seu teclado tirou férias e deixou um ponto de interrogação no lugar da sua dúvida! 😜 É como tentar adivinhar o sabor do sorvete só olhando para o pote vazio!

Para eu poder te ajudar a desvendar os mistérios do Past Continuous (ou de qualquer outro bicho-papão da gramática), preciso que você me conte qual é a sua pergunta. Não seja tímida, solte a dúvida! Estou aqui para te ajudar a desvendar o inglês, um mistério de cada vez! 😄
```

- **T9** (rodada 3/3): REVISAR — leitura humana — Respondeu a duvida fora do topico sem forcar caber no topico atual?

```
[DUVIDA] Discordo da premissa de que a diferença seja sempre sutil. O Past Simple refere-se a ações concluídas em um tempo definido no passado, mesmo que esse tempo não seja explicitamente mencionado, como em "I ate breakfast". O Present Perfect, por outro lado, conecta o passado ao presente, seja porque a ação tem relevância atual, como em "I have eaten breakfast (so I'm not hungry now)", ou porque a ação ocorreu em um período de tempo que ainda não terminou, como em "I have visited Paris three times this year". Prove seu ponto: e se a relevância no presente for ambígua?
```


---

## Agregado — 7 testes

| teste | N | veredito | passou/falhou/revisar/inconcl. | media | desvio |
|---|---|---|---|---|---|
| T1 | 3 | REVISAR | 0/0/3/0 | — | — |
| T2 | 3 | REVISAR | 0/0/3/0 | — | — |
| T3 | 3 | PASSOU | 3/0/0/0 | 1.00 | 0.00 |
| T4 | 1 | PASSOU | 1/0/0/0 | 1.00 | 0.00 |
| T6 | 3 | PASSOU | 3/0/0/0 | 1.00 | 0.00 |
| T8 | 3 | REVISAR | 0/0/3/0 | — | — |
| T9 | 3 | REVISAR | 0/0/3/0 | — | — |

**Resumo:** FASE B (evento): 3 PASSOU, 0 FALHOU, 0 INSTAVEL, 4 REVISAR, 0 inconclusivos/parciais — 7 testes

**Turnos sem resposta: 0 vazios, 0 perdidos. Nenhum deles conta como aprovacao (viram INCONCLUSIVO).**
