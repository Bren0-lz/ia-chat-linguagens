# Bateria completa — Fase B (dependentes do LLM) — evento

> **N=3 nos qualitativos, N=1 nos deterministicos** (decisao do Breno, 06/09).
> Deterministico = o veredito sai de estado no banco e nao do texto do LLM:
> A5, PS1, C16, C17, C12, T4, T14. Todos os demais julgam a saida do modelo e
> foram medidos 3 vezes. Cada linha carrega a rodada em que foi medida;
> o agregado esta no fim. **Passar em 2 de 3 nao e PASSOU: e INSTAVEL.**

> Alvo: evento — http://localhost:5678/webhook/iachat-test-evento
> Inicio: 2026-09-14T13:34:27.617Z — faixa de user_id: 993867617+

---

## Rodada 1/3 — 2026-09-14T13:34:27.634Z


## Sem consumo de cota

- **C16** (rodada 1/1): PASSOU — inferido="skateboarding"; manuais apos abrir o menu: []
- **C17** (rodada 1/1): PASSOU — apos abrir o menu: ["🎮 Games","astronomia"] (esperado: sem "travel", com Games e astronomia)

## Modo Conversa

- **C9** (rodada 1/3): REVISAR — leitura humana — Acolhe? Ritmo lento? Nao sobrecarrega o iniciante absoluto?

```
Hey there! How are you today? 😊
🇧🇷 Olá! Como você está hoje?
```

- **C10** (rodada 1/3): REVISAR — leitura humana — Ha reciprocidade (divide algo proprio + gancho) ou virou interrogatorio?

```
You said "ok"! That's a start! 💪 Now, tell me, what are you going to do today? 🔥
```

- **C14** (rodada 1/3): REVISAR — leitura humana — Respeita a objetividade do usuario ou forca prolongar?

```
Certainly. I understand you are ready to begin.

Please tell me, Roberto, what did you do today?
```

- **C12** (rodada 1/1): PASSOU — streak=5 celebrated apos 1o turno=5, apos 2o=5 (esperado: igual ao streak e sem recomemorar)
- **C15** (rodada 1/3): FALHOU — mencionou algum interesse (games/basketball)=false

```
Hey Lucas! I am great, thanks! What about you? 😊
🇧🇷 E aí, Lucas! Eu estou ótimo, obrigado! E você?
```


## Robustez


## Modo Professor


---

## Rodada 2/3 — 2026-09-14T13:37:17.277Z


## Sem consumo de cota


## Modo Conversa

- **C9** (rodada 2/3): REVISAR — leitura humana — Acolhe? Ritmo lento? Nao sobrecarrega o iniciante absoluto?

```
Hi Cleide! How are you today? 😊
🇧🇷 Oi Cleide! Como você está hoje?
```

- **C10** (rodada 2/3): REVISAR — leitura humana — Ha reciprocidade (divide algo proprio + gancho) ou virou interrogatorio?

```
Right on! 💪 You're here, that's a start. My favorite part of the day is helping people like you. What's one small thing you want to talk about today?
```

- **C14** (rodada 2/3): REVISAR — leitura humana — Respeita a objetividade do usuario ou forca prolongar?

```
Com licença, Roberto. Observe que sua resposta foi um pouco breve.

Para que possamos continuar nossa conversa de forma mais produtiva, por favor, poderia me dizer o que você fez hoje no trabalho?
```

- **C15** (rodada 2/3): FALHOU — mencionou algum interesse (games/basketball)=false

```
Hey! I am good, thanks! How are you today? 😊
🇧🇷 Ei! Eu estou bem, obrigado! Como você está hoje?
```


## Robustez


## Modo Professor


---

## Rodada 3/3 — 2026-09-14T13:38:39.026Z


## Sem consumo de cota


## Modo Conversa

- **C9** (rodada 3/3): REVISAR — leitura humana — Acolhe? Ritmo lento? Nao sobrecarrega o iniciante absoluto?

```
Hi Cleide! How are you today? 😊
🇧🇷 Oi Cleide! Como você está hoje?
```

- **C10** (rodada 3/3): REVISAR — leitura humana — Ha reciprocidade (divide algo proprio + gancho) ou virou interrogatorio?

```
Great start, Bianca! 💪 Now, let's keep this energy going. Tell me, what's one thing you want to achieve with your English? 🔥
```

- **C14** (rodada 3/3): REVISAR — leitura humana — Respeita a objetividade do usuario ou forca prolongar?

```
Certainly. It is good to know. What do you do for work?
```

- **C15** (rodada 3/3): FALHOU — mencionou algum interesse (games/basketball)=false

```
Hey! I am good, thanks! What about you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! E você?
```


## Robustez


## Modo Professor


---

## Agregado — 7 testes

| teste | N | veredito | passou/falhou/revisar/inconcl. | media | desvio |
|---|---|---|---|---|---|
| C16 | 1 | PASSOU | 1/0/0/0 | 1.00 | 0.00 |
| C17 | 1 | PASSOU | 1/0/0/0 | 1.00 | 0.00 |
| C9 | 3 | REVISAR | 0/0/3/0 | — | — |
| C10 | 3 | REVISAR | 0/0/3/0 | — | — |
| C14 | 3 | REVISAR | 0/0/3/0 | — | — |
| C12 | 1 | PASSOU | 1/0/0/0 | 1.00 | 0.00 |
| C15 | 3 | FALHOU | 0/3/0/0 | 0.00 | 0.00 |

**Resumo:** FASE B (evento): 3 PASSOU, 1 FALHOU, 0 INSTAVEL, 3 REVISAR, 0 inconclusivos/parciais — 7 testes

**Turnos sem resposta: 0 vazios, 0 perdidos. Nenhum deles conta como aprovacao (viram INCONCLUSIVO).**
