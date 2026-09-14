# Bateria completa — Fase B (dependentes do LLM) — evento

> **N=3 nos qualitativos, N=1 nos deterministicos** (decisao do Breno, 06/09).
> Deterministico = o veredito sai de estado no banco e nao do texto do LLM:
> A5, PS1, C16, C17, C12, T4, T14. Todos os demais julgam a saida do modelo e
> foram medidos 3 vezes. Cada linha carrega a rodada em que foi medida;
> o agregado esta no fim. **Passar em 2 de 3 nao e PASSOU: e INSTAVEL.**

> Alvo: evento — http://localhost:5678/webhook/iachat-test-evento
> Inicio: 2026-09-14T13:27:48.734Z — faixa de user_id: 993468734+

---

## Rodada 1/3 — 2026-09-14T13:27:48.753Z


## Sem consumo de cota


## Modo Conversa

- **C1** (rodada 1/3): PASSOU — corrigiu(playing)=true repetiuErro=false bilingue=true

```
Oh, nice! We say 'I like to play games'. What games do you like?
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

- **C2** (rodada 1/3): REVISAR — leitura humana — formato bilingue=true — REVISAR: convidou ao ingles sem repreender?

```
Oh, that's cool! Playing games with friends is fun. What games do you play?
🇧🇷 Ah, que legal! Jogar com amigos é divertido. Que jogos você joga?
```

- **C3** (rodada 1/3): PASSOU — sinalizou "people are"=true

```
✔️ 'the people are' not 'the peoples is'

Oh, so the people are happy today! That's wonderful news, like finding an extra fry in your order! 🍟 What makes you say they're so joyful?
```

- **C4** (rodada 1/3): PASSOU — entrada correta; marcador de correcao presente=false

```
I find that often the most growth comes from those challenging projects. But consider this: is it the *project* that pushes your limits, or your *approach* to it?
```

- **C7** (rodada 1/3): PASSOU — bilingue=true temIngles=true — REVISAR se manteve a MESMA pergunta

```
Oh, sorry! I said "What's up?" It means "How are you?"
🇧🇷 Ah, desculpa! Eu disse "What's up?". Significa "Como você está?".
```


## Robustez


## Modo Professor


---

## Rodada 2/3 — 2026-09-14T13:29:32.797Z


## Sem consumo de cota


## Modo Conversa

- **C1** (rodada 2/3): PASSOU — corrigiu(playing)=true repetiuErro=false bilingue=true

```
Nice! We say 'I like to play games'. What games do you play? 😊
🇧🇷 Que legal! A gente diz 'I like to play games'. Que jogos você joga?
```

- **C2** (rodada 2/3): REVISAR — leitura humana — formato bilingue=true — REVISAR: convidou ao ingles sem repreender?

```
Oh, that's cool! I like games too. What games do you play?
🇧🇷 Ah, que legal! Eu também gosto de jogos. Que jogos você joga?
```

- **C3** (rodada 2/3): PASSOU — sinalizou "people are"=true

```
✔️ 'the people are' not 'the peoples is'
Wow, it sounds like a party is happening! Are they happy because it's Friday, or is there something even more exciting going on? 🤣😜
```

- **C4** (rodada 2/3): PASSOU — entrada correta; marcador de correcao presente=false

```
That's good to hear, but I'd argue that true growth comes from embracing discomfort, not just pushing limits. Do you believe the discomfort itself is the catalyst for improvement, or merely a side effect?
```

- **C7** (rodada 2/3): PASSOU — bilingue=true temIngles=true — REVISAR se manteve a MESMA pergunta

```
Oh, sorry! I asked "How are you today?" I mean, are you good?
🇧🇷 Ah, desculpa! Eu perguntei "Como você está hoje?" Eu quero dizer, você está bem?
```


## Robustez


## Modo Professor


---

## Rodada 3/3 — 2026-09-14T13:31:15.558Z


## Sem consumo de cota


## Modo Conversa

- **C1** (rodada 3/3): PASSOU — corrigiu(playing)=true repetiuErro=false bilingue=true

```
Oh, nice! We say 'I like to play games'. What games do you like?
🇧🇷 Ah, que legal! A gente diz 'I like to play games'. Que jogos você gosta?
```

- **C2** (rodada 3/3): REVISAR — leitura humana — formato bilingue=true — REVISAR: convidou ao ingles sem repreender?

```
Oh, that's cool! I like games too. What game do you play with your friends? 😊
🇧🇷 Ah, que legal! Eu gosto de jogos também. Que jogo você joga com seus amigos?
```

- **C3** (rodada 3/3): PASSOU — sinalizou "people are"=true

```
✔️ 'the people are' not 'the peoples is'

Oh, that's great news! Sounds like everyone is on cloud nine today, like they just won the lottery and found a forgotten french fry in their pocket! What do you think makes people so happy? 😄
```

- **C4** (rodada 3/3): PASSOU — entrada correta; marcador de correcao presente=false

```
That sounds intense! I disagree that "pushing limits" is always beneficial, though. Sometimes, it just leads to burnout. How do you ensure you don't cross that line into exhaustion, especially with demanding tech projects?
```

- **C7** (rodada 3/3): PASSOU — bilingue=true temIngles=true — REVISAR se manteve a MESMA pergunta

```
Oh, sorry! I asked "How are you?".
🇧🇷 Ah, desculpa! Eu perguntei "Como você está?".
```


## Robustez


## Modo Professor


---

## Agregado — 5 testes

| teste | N | veredito | passou/falhou/revisar/inconcl. | media | desvio |
|---|---|---|---|---|---|
| C1 | 3 | PASSOU | 3/0/0/0 | 1.00 | 0.00 |
| C2 | 3 | REVISAR | 0/0/3/0 | — | — |
| C3 | 3 | PASSOU | 3/0/0/0 | 1.00 | 0.00 |
| C4 | 3 | PASSOU | 3/0/0/0 | 1.00 | 0.00 |
| C7 | 3 | PASSOU | 3/0/0/0 | 1.00 | 0.00 |

**Resumo:** FASE B (evento): 4 PASSOU, 0 FALHOU, 0 INSTAVEL, 1 REVISAR, 0 inconclusivos/parciais — 5 testes

**Turnos sem resposta: 0 vazios, 0 perdidos. Nenhum deles conta como aprovacao (viram INCONCLUSIVO).**
