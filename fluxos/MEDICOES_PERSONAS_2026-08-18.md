# Medições de persona (PS3/PS4) — 18/08/2026

Revalidação dos testes de persona sobre a **v7.4 publicada**, com o modelo que está em
produção hoje. O relatório de 13/07 (`documentos/Relatorio_Testes_IAChat.txt`) reprovou
PS3 e PS4 e deu **rubrica 0** em "fidelidade à persona"; estas medições refazem a
comparação e chegam a um resultado diferente.

Reprodução: `NIVEL=B1 RUNS=3 N8N_API_KEY=... node fluxos/_teststand/revalida_personas.js`

---

## Método

Cinco alunos **idênticos** (mesmo nível, mesma idade, mesmos interesses `games`/`music`),
variando **só** `profile.persona`, recebem a **mesma mensagem**. Os alunos são semeados
direto no Postgres — evita cinco onboardings e garante que nada além da persona difere.
A `chat_memory` é limpa antes de cada rodada, para as rodadas serem independentes.

**Métrica (PS4):** índice de Jaccard sobre palavras de conteúdo entre cada par de
respostas (10 pares). `0` = totalmente distintas, `1` = idênticas. Critério de aprovação
fixado antes de medir: **média < 0,30 e pior par < 0,45**.

**Métrica (PS3):** marcadores por resposta — nº de palavras (separando a parte em inglês
da linha traduzida do A1) e nº de emoji.

Como saída de LLM não é determinística, tudo roda com **N = 3** e reporta média e desvio,
conforme a Seção 11 do roteiro de testes exige.

---

## Resultado

| Nível | Média PS4 | Desvio | Pior par | Veredito |
|---|---|---|---|---|
| **B1** | **0,184** | 0,030 | 0,29 (buddy x comedian) | **PASSOU** |
| **A1** | **0,312** | 0,030 | 0,45 (buddy x formal) | **FALHOU** |

O desvio idêntico nos dois níveis indica que a diferença entre eles **não é ruído de
execução**: as personas se diferenciam bem em B1 e colapsam em A1.

### PS3 — marcadores (média de 3 rodadas)

| Persona | B1: palavras | B1: emoji | A1: palavras | A1: emoji |
|---|---|---|---|---|
| buddy | 34 | 2,0 | 33 | 1,7 |
| coach | 39 | 2,7 | 38 | 1,7 |
| comedian | 37 | 2,7 | 36 | 0,7 |
| debater | 32 | 2,0 | 32 | 0,3 |
| formal | 38 | **1,0** | 33 | **0,0** |

O `formal` usar metade (B1) ou zero (A1) dos emoji dos demais é comportamento prescrito
pelo pacote de personas — e é um marcador que **não custa palavra nenhuma**.

---

## Evidência qualitativa — B1 (rodada 1)

Mensagem: *"i think video games is good for learning english, what do you think?"*

- **buddy** — "Ah, I totally agree! Playing games can be super immersive and boost vocab.
  I love learning new words while questing. 🎮"
- **coach** — "Great point, Marina! You've expressed your opinion confidently. 🎮💪
  **Mini-challenge:** name one game and a phrase you learned."
- **comedian** — "I agree, they're like **language gyms for the brain** 😄."
- **debater** — "**I disagree**; they're immersive but can distract from real conversation. 🤔"
- **formal** — "**Certainly**, I believe video games improve English through immersive
  dialogue. **For instance**, role-playing quests require reading and speaking."

O sinal mais forte é o `debater` **discordando** enquanto os outros quatro concordam: a
persona altera a *posição argumentativa*, não só o verniz estilístico.

## Evidência qualitativa — A1 (rodada 1)

Mensagem: *"eu acho que video game ajuda a aprender ingles, o que voce acha?"*

- **buddy** — "Ah, that's cool! Games help English. I play games. **Do you play on phone or console?** 😊"
- **coach** — "We say 'video games help'... I think they help English. **Do you play games?** 💪"
- **comedian** — "like a snail on a treadmill! 😄 **Do you play games?**"
- **debater** — "I think video games help English, but reading also helps 🤔. **Do you read or play?**"
- **formal** — "I also play video games to practice English. **Do you play games on your phone or computer?**"

Todas convergem para a mesma estrutura e quase a mesma pergunta final. O `comedian`
consegue uma piada, mas o resto da resposta é indistinguível das outras.

---

> **Atualização de 19/08:** a investigação da causa continuou e está consolidada em
> `INVESTIGACAO_PERSONA_A1_2026-08-19.md`. Resumo: além do teto, também foram **refutadas** as
> hipóteses de pergunta fechada e de formato bilíngue; a de vocabulário restrito ficou
> **inconclusiva** (n=4, três coletas interrompidas por cota da Groq). A medição do A2 foi
> acrescentada como âncora intermediária: **0,217 ± 0,009**, entre o B1 (0,184) e o A1 (0,312).

## Experimento: o teto de palavras é a causa? **Não.**

Hipótese testada: o A1 colapsa porque o teto de ~18 palavras não deixa espaço para voz
própria. Teto elevado para 30 no `Prompt Conversa A1`, mesma mensagem, mesmo método.

| Teto | Média PS4 | Observação |
|---|---|---|
| 18 (baseline, N=3) | **0,312** ± 0,030 | — |
| 30 (rodadas 1–2) | **0,373** | rodada 1 chegou a 0,73 num par |
| 18 (rodada 3, pós-reversão) | 0,272 | controle acidental: voltou ao baseline |

**Subir o teto piorou a diferenciação.** A mudança foi revertida; produção permanece em 18.

Efeito colateral medido, que tornaria a troca ruim mesmo se tivesse funcionado: com teto
de 30 as respostas foram de ~35 para **46–60 palavras na tela** (o formato A1 é bilíngue,
então cada palavra conta duas vezes).

### Achado lateral: o teto é obedecido de fato

Com o teto em 30, a parte em inglês ficou em **26,1 palavras de média, máximo 31**. O
modelo calibra o comprimento pela instrução — é confirmação independente do **C8** do
relatório ("respeita o teto de ~18 palavras"), e não leniência do parser.

---

## Conclusões

1. **PS3 e PS4 passam em B1** e devem ser reclassificados no relatório, que os reprovou
   com rubrica 0. A evidência é média, desvio e transcrição de 3 rodadas.
2. **PS3/PS4 continuam falhando em A1**, mas por causa localizada — não é "as personas não
   funcionam", é "as personas não sobrevivem à restrição de formato do A1".
3. **A causa não é o teto de palavras**, o que foi testado e refutado. As candidatas
   restantes são o formato bilíngue obrigatório (tudo dito duas vezes) e o vocabulário A1
   em si — "só presente simples e as palavras mais básicas", com expressões e phrasal
   verbs proibidos, que é justamente o material de que uma voz é feita.
4. Se a causa for o vocabulário, **persona forte e A1 puro são objetivos em tensão** e o
   design deveria assumir isso. O caminho barato são marcadores não-lexicais — emoji,
   comprimento de frase, reagir antes de perguntar — que cabem em qualquer teto, como o
   `formal` já demonstra.

## Limitações

- **Não é possível separar duas causas da melhora** em relação à rubrica 0 do relatório:
  o pacote de personas foi introduzido na v7.4 (a avaliação foi na v7.2) **e** o modelo
  mudou. O `llama-3.3-70b-versatile` usado na avaliação original foi removido da conta
  Groq e não é mais executável, então o experimento que isolaria as causas não existe mais.
- Modelo avaliado: `openai/gpt-oss-120b` (migração forçada em 18/08, quando todos os
  modelos Llama saíram da conta e o bot ficou sem responder).
- Uma única mensagem-estímulo por nível. Estímulos diferentes (frustração, resposta
  monossilábica, provocação) podem separar as personas de outra forma.
- Jaccard mede **sobreposição lexical**, não percepção humana de personalidade. É um proxy
  útil e reproduzível, mas um avaliador humano pode discordar de um par com índice baixo.
