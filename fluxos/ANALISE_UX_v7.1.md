# IAChat v7.1 — Análise de UX por nível (teste real com o modelo)

> Metodologia: testei o **workflow ativo** (`IAChat_Telegram_v7.1`, id `zAjCM0ZcastWElOo`) de ponta a
> ponta pelo webhook `iachat-test`, dirigindo a jornada completa (onboarding → placement → menu →
> Conversa → Professor) como um **adolescente de 16 anos** em cada nível, e lendo as respostas reais do
> **Groq `llama-3.3-70b-versatile`** direto dos dados de execução. Foram testados **A1, A2, B1, B2, C1**
> (transcrições reais). **C2 não pôde ser testado ao vivo — ver §3.1.**
> Data: 2026-07-01.

---

## 1. Veredito geral

O agente está **bom** — as correções gentis ("Quick tip/Small fix/Quick fix"), a progressão da trilha
do Professor (streak 5), o matching de respostas e o formato bilíngue do A1 funcionam de verdade e com
qualidade. Os problemas de UX são **pontuais mas recorrentes** e concentrados em 3 pontos:

1. **Correção inconsistente de concordância/erros "sutis"** no modo Conversa.
2. **O próprio tutor comete pequenos erros de inglês** (grave no A1, onde o output é modelo).
3. **O agente de Dúvida pode ensinar errado** (erro factual sem verificação).

Além de 1 problema **estrutural**: **C2 é inalcançável** e o teto de auto-avaliação é B2.

---

## 2. Achados por modo (com trechos reais)

### 2.1 MODO CONVERSA

**✅ O que funciona bem**
- **Correção de erros gritantes e isolados** é ótima e no nível certo:
  - A2: `i want be a pro player` → *"Quick tip: I want to be, not I want be 👍"*
  - B2: `If I would have known...` → *"Quick fix: If I had known..."*; `Despite of the rain` → *"Quick fix: Despite the rain..."*
  - C1: `Hardly I had started...` → *"Small fix: Hardly had I started..."*
- **Não inventa correção quando a frase está certa** (B2: frase correta → engajou com a ideia, sem "corrigir").
- **Formato bilíngue A1** (inglês + linha `🇧🇷`) saiu consistente e limpo.
- **Interesses** entram com naturalidade (puxou música/gaming) sem sequestrar o tema do aluno.
- **Uma pergunta por turno** e brevidade respeitados em todos os níveis.

**⚠️ Problema 1 [ALTO] — deixa passar erro claro de concordância/countability quando a frase "tem conteúdo"**
Apesar da regra "SEMPRE corrija / NUNCA ignore erro gramatical evidente":
- B1: `i think video games **is** good` → tutor respondeu *"why do you think games **are** good..."* — **modelou** a
  forma certa mas **não sinalizou** o erro (aluno não percebe que errou).
- C1: `The **amount** of people who take esports seriously` → **ignorado** (deveria ser *number of people*; o
  próprio prompt C1 cita exatamente esse caso: "the amount of people were → number").
- A2: `we **play** video games all day` (narrativa de ontem → *played*) → **ignorado**.
Padrão: quando o erro é "sutil" **e** a frase traz um tema interessante, o modelo prioriza engajar e
esquece a correção. Nos erros gritantes e isolados, corrige muito bem.

**⚠️ Problema 2 [MÉDIO/ALTO no A1] — o tutor comete erros no próprio inglês**
- A1: `i like play video game` → tutor: *"I like play video game too."* — **repetiu o erro do aluno** em vez
  de modelar *"I like playing/ to play"*. Péssimo para um iniciante que copia o modelo.
- A1: `não entendi` → *"You play on what?"* — reformulou (regra ok) mas com inglês **agramatical**.
- B2: enquanto corrigia, escreveu *"a intense gaming session"* (deveria ser *an intense*).

### 2.2 MODO PROFESSOR

**✅ O que funciona bem**
- **Idioma da explicação por nível**: A1/A2 em português (didático), B1+ inteiramente em inglês. Coerente.
- **Questões** fazem o aluno **produzir inglês** (fill-in-the-blank curto) e são adequadas ao tópico.
- **Matching de resposta (`answersMatch`)** é robusto — aceitou até frases geradas pelo próprio modelo
  ("would have bought a house", "have you been", "has been").
- **Streak/feedback**: `✅ Correto! (n/5)` e `❌ Quase! A resposta certa era X. Sequência voltou para 0/5`
  — claro e motivador. Progressão da trilha funciona.

**⚠️ Problema 3 [ALTO] — o agente de Dúvida pode ensinar ERRADO**
- A2, dúvida "quando eu uso ed no final do verbo?": o tutor respondeu que *"você usa 'ed' quando o sujeito
  é ele, ela ou isso"* — **factualmente incorreto** (confundiu passado `-ed` com a 3ª pessoa `-s` do tópico
  atual "Presente simples"). Um aluno A2 sairia com um conceito errado. Sem nenhuma verificação.

**⚠️ Problema 4 [BAIXO] — dúvida quase sempre "fora do tópico"**
O aluno naturalmente pergunta algo fora do tópico atual (is/are durante "Cumprimentos"; passiva durante
"Present perfect continuous"). O tutor responde (bom para UX), mas o prompt de dúvida diz "não mude de
assunto" — pequena tensão de design, e às vezes a resposta perde o gancho com o tópico.

---

## 3. Achados estruturais

### 3.1 [ALTO] C2 é inalcançável — trabalho de C2 é código morto
`Placement Engine` usa `LEVELS=['A1','A2','B1','B2','C1']` (sem C2) e é o único ponto que grava
`students.level`. **Nenhum caminho do produto define `level = C2`.** Logo o **Prompt Conversa C2** e a
**trilha C2** do Professor (destaques do v7.0/v7.1) nunca são exercitados por um usuário real.
→ Decidir: **(a)** incluir C2 em `LEVELS` + regra de placement que alcance C2, ou **(b)** remover a
promessa de C2 para não manter código/prompt ocioso.

### 3.2 [MÉDIO] Teto de auto-avaliação é B2
Os botões vão só até `pl_start_B2` (não há `pl_start_C1`). Quem se considera C1/C2 começa em B2 e só
chega a C1 acertando o teste adaptativo. Considerar um botão "Avançado (C1)".

### 3.3 [ALTO — já reportado] Harness de teste aberto em produção
`TEST Ingress` (webhook `POST /iachat-test`) + `TEST Shim` injetam updates direto no fluxo, **sem a
autenticação do Telegram**, no workflow **ativo**. Remover antes do lançamento (mesma pegada do backdoor
`/restart` removido no v7.0). *(Foi exatamente o que usei para testar — muito útil, mas é uma porta aberta.)*

### 3.4 Nota operacional — o n8n caiu sob carga
Durante o teste, a rajada de execuções derrubou o n8n (precisou reiniciar). Não é bug do fluxo, mas indica
que a instância é sensível a volume — relevante se o bot crescer (considerar limitar retries dos nós de
envio, fila/serialização por usuário, e limpeza de execuções salvas).

---

## 4. Recomendações priorizadas (edições concretas)

| # | Prioridade | Onde | Mudança |
|---|---|---|---|
| 1 | ALTA | Prompts Conversa (todos) | Reforçar que concordância sujeito-verbo e countable/uncountable (games **are**, **number** of people, verbo no passado em narrativa passada) contam como "erro claro" e **exigem um reparo explícito** — hoje são silenciosamente modelados. Ex.: adicionar à regra de correção a lista "concordância, countable/uncountable, tempo verbal em contexto passado" com instrução de **sinalizar, não só modelar**. |
| 2 | ALTA | Prompt Conversa A1 (e A2) | Adicionar regra dura: **"seu próprio inglês deve ser sempre correto e simples; NUNCA repita um erro do aluno"**. No A1 o output é modelo de linguagem para o iniciante. |
| 3 | ALTA | Dúvida (dSys no Professor Engine) | Instruir explicitamente a **não confundir o tópico atual com a dúvida** e a **só afirmar regra gramatical de que tem certeza**; se a dúvida for sobre outro ponto, responder o ponto correto (ex.: `-ed` = passado, todos os sujeitos) sem amarrar ao tópico da trilha. Considerar `temperature` mais baixa na Dúvida. |
| 4 | ALTA | Placement Engine / botões | Decidir sobre C2 (§3.1): incluir em `LEVELS` + caminho de placement, ou remover Prompt Conversa C2 + trilha C2. |
| 5 | MÉDIA | Menu de auto-avaliação | Avaliar botão "Avançado (C1)" (`pl_start_C1`). |
| 6 | ALTA | Workflow | Remover `TEST Ingress` + `TEST Shim` antes do lançamento. |
| 7 | BAIXA | Conversa A1 (regra "não entendi") | Reforçar: ao reformular, manter inglês **simples e correto** e **re-explicar a mesma ideia** (hoje às vezes só troca de pergunta). |

---

## 5. O que NÃO precisa mexer (validado como bom)
- Correção gentil de erros gritantes (Quick tip/Small fix) — excelente.
- Trilha do Professor, streak 5, feedback de acerto/erro, matching de resposta — sólidos.
- Explicações do Professor (PT em A1/A2, inglês em B1+) — boas e no nível certo.
- Formato bilíngue do A1 — consistente.
- Uso de interesses e "uma pergunta por turno" — natural.

## 6. Follow-ups sugeridos
- **C2**: implementar caminho ou remover (decisão de produto).
- **Limpeza**: criei usuários de teste `user_id` na faixa `9932xxxxx–9939xxxxx` na tabela `students`
  (via placement real). Recomendo apagá-los antes de métricas de produção.
- **Dúvida**: por ser o ponto de maior risco factual, vale um conjunto de dúvidas de regressão por nível.
