# Medições de idioma e coerência por nível (C5/C6) — 19/08/2026

Revalidação de **C5** e **C6**, ambos reprovados no relatório de 13/07 sobre a v7.2:

- **C5** — *"em nível C1 o bot iniciou conversando em português — erro grave, visto que nesse
  nível ele deve usar muito inglês e só usar português quando estritamente necessário"*
- **C6** — *"Falhou. Houve inconsistência na forma de corrigir entre os níveis"*

Aquela medição usou `llama-3.3-70b-versatile`, removido da conta Groq. Estas usam o modelo em
produção hoje (`openai/gpt-oss-120b`), com **N = 3** e desvio reportado.

Reprodução: `N8N_API_KEY=... RUNS=3 node fluxos/_teststand/revalida_niveis.js`

---

## Método

Um aluno por nível (A1..C1), **tudo idêntico menos o `level`**, semeado direto no banco, com
`chat_memory` limpa a cada rodada. Todos recebem a mesma frase com um erro plantado:

> *"i think video games is good for learning english"*

Para o C5, o aluno C1 recebe adicionalmente a mistura sofisticada da persona P7 (Théo):

> *"honestamente eu acho que esports é subestimado, but i cannot articulate why exactly"*

**Detector de português:** conta só palavras funcionais exclusivas (`que`, `você`, `porque`,
`então`…), que não existem em inglês — cognatos como "example/exemplo" não geram falso positivo.

### O contrato de idioma (fonte dos critérios)

Vem de cada `Prompt Conversa <nível>` — **não** do `LANG` do Professor, que é outro contrato.
Confundir os dois faz o teste reprovar comportamento correto:

| Nível | Regra no prompt |
|---|---|
| A1 | bilíngue: inglês + uma linha 🇧🇷 traduzindo a mensagem inteira |
| A2 | "inglês simples; traduza entre parênteses **no máximo uma** expressão difícil por mensagem" |
| B1 | "responda **INTEIRAMENTE em inglês**… NUNCA comece, comente ou explique em português" |
| C1 | "**NUNCA escreva uma palavra em português**, mesmo que o aluno misture os dois idiomas" |

---

## Resultado

| Nível | português | corrigiu o erro | palavras/frase | riqueza lexical |
|---|---|---|---|---|
| A1 | 13% ± 3 | 100% | 4,6 | 0,78 |
| A2 | 5% ± 4 | 100% | 7,0 | 0,70 |
| B1 | **0% ± 0** | 100% | 8,9 | 0,91 |
| B2 | **0% ± 0** | 100% | 11,1 | 0,86 |
| C1 | **0% ± 0** | 100% | 11,7 | 0,89 |

**C6 — PASSOU.** O português decresce exatamente na ordem do contrato (13% → 5% → 0 → 0 → 0), a
complexidade cresce monotonicamente (4,6 → 11,7 palavras por frase) e a correção do erro plantado
foi aplicada em **100% das rodadas em todos os cinco níveis** — que era justamente a inconsistência
que o C6 reprovava.

**C5 — PASSOU.** Com a mistura PT+EN sofisticada, o C1 respondeu com **0,0% ± 0,0** de português
nas três rodadas. A falha do relatório não se reproduziu.

### Exemplos reais

**A1** (bilíngue, teto de 18 palavras, corrige na forma curta):
> Cool! 😊 We say 'are', not 'is'. I love games. Do you play on console or phone?
> 🇧🇷 Legal! 😊 Nós dizemos 'are', não 'is'. Eu adoro jogos. Você joga no console ou no telefone?

**C1** (recebe PT+EN, responde só em inglês) — ver `documentos/transcricoes/`.

---

## Ressalva importante sobre o instrumento

A primeira versão do detector de correção só reconhecia a forma longa (`"video games are"`) e deu
**falso negativo no A1**, fazendo a taxa parecer 67% quando era 100%. O motivo é estrutural: o teto
de 18 palavras do A1 força a forma curta (`"We say 'are', not 'is'"`), que é justamente a que o
detector não cobria.

Foi o **terceiro erro de instrumentação do mesmo tipo** em dois dias — agregado que parece
conclusivo e só se desfaz ao abrir a transcrição. O detector agora cobre as duas formas e tem teste
unitário (5 casos). Ver a seção "Armadilhas de medição já pagas" em `TESTES_DIAGNOSTICOS.md`.

## Limitações

- **Modelo diferente do avaliado no relatório.** O `llama-3.3-70b-versatile` foi removido da conta
  Groq e não é executável, então não é possível separar "o prompt foi reforçado na v7.4" de "o
  modelo novo obedece melhor". Vale notar que o prompt C1 hoje contém uma regra explícita contra
  exatamente o caso do C5 ("mesmo que o aluno misture os dois idiomas"), o que sugere que parte do
  crédito é do fluxo — mas isso é inferência, não medição.
- **Um único estímulo por teste.** Uma frase com erro de concordância e uma mistura PT+EN. Outros
  gatilhos (aluno pedindo explicação em português, frustração, gíria) podem se comportar diferente.
- **Riqueza lexical não é monotônica** (A2 = 0,70, menor que A1 = 0,78). Como o A1 é bilíngue, ele
  repete o conteúdo em dois idiomas, o que infla artificialmente a contagem de tipos. A métrica
  confiável de complexidade aqui é palavras/frase.
