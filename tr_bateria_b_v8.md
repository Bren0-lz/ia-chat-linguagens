# Bateria completa — Fase B (dependentes do LLM) — v8

> **N=3 nos qualitativos, N=1 nos deterministicos** (decisao do Breno, 06/09).
> Deterministico = o veredito sai de estado no banco e nao do texto do LLM:
> A5, PS1, C16, C17, C12, T4, T14. Todos os demais julgam a saida do modelo e
> foram medidos 3 vezes. Cada linha carrega a rodada em que foi medida;
> o agregado esta no fim. **Passar em 2 de 3 nao e PASSOU: e INSTAVEL.**

> Alvo: v8 — http://localhost:5678/webhook/iachat-test-v8
> Inicio: 2026-09-10T17:29:04.063Z — faixa de user_id: 995344063+

---

## Rodada 1/3 — 2026-09-10T17:29:04.073Z


## Sem consumo de cota


## Modo Conversa


## Robustez


## Modo Professor

- **T14** (rodada 1/1): PASSOU — q_answered=true (true libera usar o gabarito) — REVISAR se aprofundou

```
[DUVIDA] Bora lá, Ana! 💪 Foca aqui: a resposta "was watching" está certíssima porque você estava no meio de uma ação (watching TV) quando outra ação mais curta aconteceu (my friend called). É exatamente para isso que usamos o Past Continuous! ⚡

Você mandou bem em identificar a ação contínua no passado. Agora, para o próximo nível: me diz, qual seria a resposta se a frase fosse "I (watch) TV every day last week."? Manda ver! 🔥
```

- **T15** (rodada 1/3): REVISAR — leitura humana — quase-acerto (sufixo -s): gabarito="studying" enviado="studyings" aceitou=false
- **T16** (rodada 1/3): PASSOU — maiusculas/pontuacao/espacos: gabarito="for" enviado="  FOR.  " aceitou=true

---

## Rodada 2/3 — 2026-09-10T17:33:49.208Z


## Sem consumo de cota


## Modo Conversa


## Robustez


## Modo Professor

- **T15** (rodada 2/3): REVISAR — leitura humana — quase-acerto (sufixo -s): gabarito="been" enviado="beens" aceitou=false
- **T16** (rodada 2/3): PASSOU — maiusculas/pontuacao/espacos: gabarito="for" enviado="  FOR.  " aceitou=true

---

## Rodada 3/3 — 2026-09-10T17:35:04.541Z


## Sem consumo de cota


## Modo Conversa


## Robustez


## Modo Professor

- **T15** (rodada 3/3): REVISAR — leitura humana — quase-acerto (sufixo -s): gabarito="for" enviado="fors" aceitou=false
- **T16** (rodada 3/3): PASSOU — maiusculas/pontuacao/espacos: gabarito="studying" enviado="  STUDYING.  " aceitou=true

---

## Agregado — 3 testes

| teste | N | veredito | passou/falhou/revisar/inconcl. | media | desvio |
|---|---|---|---|---|---|
| T14 | 1 | PASSOU | 1/0/0/0 | 1.00 | 0.00 |
| T15 | 3 | REVISAR | 0/0/3/0 | — | — |
| T16 | 3 | PASSOU | 3/0/0/0 | 1.00 | 0.00 |

**Resumo:** FASE B (v8): 2 PASSOU, 0 FALHOU, 0 INSTAVEL, 1 REVISAR, 0 inconclusivos/parciais — 3 testes

**Turnos sem resposta: 0 vazios, 0 perdidos. Nenhum deles conta como aprovacao (viram INCONCLUSIVO).**
