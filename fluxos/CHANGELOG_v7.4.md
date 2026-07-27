# v7.4 — correções dirigidas pela bateria de testes diagnósticos

Base: `IAChat_Telegram_v7.3.json` (94 nós) → `IAChat_Telegram_v7.4.json` (93 nós).
Alvo: fazer o bot passar nos testes reprovados no *Relatório de Execução da Bateria de Testes Diagnósticos* (13/07/2026).

> **Contexto importante:** o relatório avaliou a **v7.2**, que era o que estava ativo no n8n. O arquivo **v7.3 nunca foi publicado** —
> por isso T13 (botão "Próximo exercício"), T14 e o gate `q_answered` apareceram como ausentes/falhos no relatório apesar de existirem no arquivo.
> Publicar a v7.4 já resolve esses três por si só.

Regressão offline (sem n8n, sem banco, sem LLM): `node fluxos/_teststand/regressao_v7.4.js` — 40 checks, todos verdes.

---

## 1. Modo Professor — estabilidade (T5, T7, T10, T11, R6)

**"(Questão indisponível)" — o defeito de maior prioridade do relatório.**
Causa: `Parse Professor` só aceitava o formato exato `P:` / `R:`. Qualquer desvio do LLM virava o literal `(questão indisponível)` **e gravava `answer=''` no banco** — a partir daí toda resposta do aluno era considerada errada, o que explica as mensagens em branco e o comportamento inconsistente ao reiniciar.
- Parser tolerante: aceita `P:`, `Q:`, `Pergunta:`, `Question:`, `R:`, `A:`, `Resposta:`, `Answer:`, com markdown, numeração, travessão, aspas e preâmbulo.
- Se ainda assim não der para extrair pergunta **e** gabarito válidos, cai no banco local `practice_questions` do nível do aluno.
- Sem banco disponível: mensagem amigável com o caminho de volta. **Nunca** grava gabarito vazio, nunca envia mensagem em branco.
- Explicação vazia também deixou de virar mensagem em branco.

**Memória compartilhada entre agentes.** `Memória Postgres` usava a mesma `sessionKey` para Conversa, Professor e Dúvida (janela 20): o histórico de conversa puxava o gerador de questões para fora do formato e **vazava gabaritos antigos** para a dúvida.
- `Agente Professor` passou a rodar **sem memória** (é 100% dirigido pelo system prompt — também corta latência, ver L1).
- `Agente Dúvida` ganhou memória própria (`<user_id>:doubt`, janela 12).
- Conversa passou a usar `<user_id>:conv`. *Efeito colateral esperado:* o histórico de conversa dos usuários atuais recomeça — desejável, já que estava contaminado com conteúdo do Professor.

**T11 — o quiz reiniciava ao voltar da dúvida.** O botão "▶️ Começar questões" da tela de dúvida mandava `t_start`, que zerava `streak` e apagava a questão.
- Novo callback `t_resume` + subrota `resume_q`: reenvia a **mesma** questão pendente, sem chamar o LLM, preservando a sequência.
- O botão é dinâmico: vira "↩️ Voltar à questão" quando há questão aberta e continua "▶️ Começar questões" quando não há.
- `start_quiz` deixou de zerar a sequência.

**R6 / T7 — o bot entregava o gabarito.** Em `phase='quiz'`, *qualquer* texto era tratado como resposta; perguntar "qual a resposta?" caía no ramo de erro, que **imprime o gabarito**.
- Classificador de intenção: pedido de ajuda/gabarito/"não sei"/pergunta é roteado para a dúvida, sem contar tentativa e sem alterar a sequência.
- Com questão aberta, o prompt da dúvida **não recebe mais o gabarito** (antes recebia com um "não revele", que era contornável): o modelo é instruído a não conhecê-lo e a dar uma pista conceitual com exemplo em outra frase.

**T10 —** o ramo de acerto não marcava `q_answered=true`; só o de erro. Corrigido: depois de responder (certo ou errado) a dúvida pode usar a resposta livremente.

**T5 —** a trilha volta a ser concluível: some a fonte do travamento e `next_q` limpa o estado da questão anterior.

**Anti-repetição —** `teacher_state.recent_q` guarda as últimas 5 questões do tópico e o prompt proíbe repeti-las.

## 2. Persona (PS2, PS3, PS4, T17 — rubrica 0/2)

A diretiva de persona era uma linha genérica no meio do prompt. Foi substituída por um **pacote de personalidade** (o mesmo na Conversa e no Professor) com: essência, voz, léxico típico, política de emoji, **gesto de assinatura obrigatório em toda resposta** e lista de proibições. O prompt termina com uma checagem final explícita de aderência (persona + idioma + correção).
- No Professor o pacote entra em `expSys`, `dSys` e `wrongSys`, com a ressalva de que o tom muda **como** se diz, nunca **o que** se ensina.
- PS2: sanitização única (`cleanPersona`) na leitura; o menu de configuração deixou de exibir valor inválido cru e **normaliza o valor no banco** ao abrir.
- `debater` em nível baixo/inseguro mantém a voz da persona em vez de virar um tutor genérico.

## 3. Nível e idioma na Conversa (C5, C6, C2)

**C5 (grave) — C1 respondia em português.** Causa exata: `MOOD.low` mandava *"use um pouco mais de português de apoio"* e `ptLine` disparava com `pt_streak>=2`. Um C1 que mistura PT+EN caía em mood *low* e recebia ordem de escrever em português, sobrepondo a regra do nível.
- `MOOD.low` agora é *nível-aware*: em B1+ "baixar a régua" significa **inglês mais simples**, nunca trocar de idioma.
- `ptLine` em B1+ convida a voltar ao inglês **em inglês**.
- A regra de IDIOMA de B1..C2 virou regra dura explícita ("mesmo que o aluno peça").

**C6 — correção inconsistente entre níveis.** Cada prompt tinha sua própria política. Agora existe **um contrato único de correção** (`correctionLine`), igual em todos os níveis: quando não corrigir, quantos erros por turno, formato do reparo, nunca repetir a forma errada, nunca repreender. Só a intensidade e a renderização mudam por nível (A1/A2: reparo dentro do bloco bilíngue; B1+: linha `✔️`). A lista de "erros que contam" é a mesma para todos.

**C2 (ressalva de poluição visual)** — diretiva de economia de tela e **no máximo um extra por turno**: streak > incentivo ao inglês > variação de formato, nunca os três juntos.

## 4. Nivelamento (B3, B6)

- **B3:** as 10 questões eram sorteadas **no início**, pelo nível inicial — a dificuldade não acompanhava a oscilação. Agora a próxima questão é escolhida **a cada turno pelo nível corrente** (`pickNext`), com vizinhança de nível como fallback e sem repetir questão.
- **B6:** texto que claramente não é tentativa de resposta (pedido de ajuda, pergunta, mensagem longa, ou opção inexistente numa questão de múltipla escolha) não conta mais como erro: o bot avisa e **reenvia a questão**.
- C2 (nível) segue fora de escopo por decisão de produto: teto continua em C1 (B7 permanece documentado como limitação).

## 5. Retenção (C12, C13, C10)

- **C12:** a comemoração de streak dependia do nó `Contexto Conversa`, ou seja, só existia no modo Conversa. `Carregar Aluno` agora devolve o `last_active` **anterior**, o `Roteador Mestre` calcula `first_today` e a comemoração sai na primeira interação do dia **em qualquer modo** (uma vez só por sequência).
- **C13:** implementado em workflow separado — `IAChat_Nudge_Retencao_v1.json` (Schedule 18h → seleção com `LIMIT 1` para dry-run → envio serializado com espera de 3s → marca `profile.last_nudge`). Nasce **inativo**; suba o `LIMIT` só depois do dry-run. Dependência prevista no design entregue junto: comandos **`/parar`** e **`/voltar`** (opt-out) no fluxo principal.
- **C10:** reciprocidade específica para aluno monossilábico (divide algo concreto + escolha fácil ligada a um interesse).

## 6. Infra e segurança (A6, L1, S1, S2)

- **A6:** `Carregar Aluno` passou a devolver o `last_update_id` anterior (via CTE) e o `Roteador Mestre` **descarta a re-entrega do mesmo `update_id`**. O descarte é só na igualdade — mensagens fora de ordem seguem normalmente, para não perder mensagem legítima em rajada.
- **L1:** `Agente Professor` sem memória (uma chamada de histórico a menos por turno) e prompts de conversa mais enxutos.
- **S1:** `TEST Ingress` e `TEST Shim` (webhook sem autenticação) **removidos**; `/reset` e `/resetfull` atrás de `DEV_COMMANDS = false` — para desenvolver, basta pôr `true` no topo do `Roteador Mestre`.
- **S2:** `db/cleanup_test_users.sql` remove usuários de teste, tentativas de nivelamento e memória de chat associada.
- **L2 e S3** continuam fora de alcance do fluxo (plano do Groq e hospedagem).

---

## Como publicar e revalidar

1. `node fluxos/_teststand/regressao_v7.4.js` (deve dar tudo verde).
2. Importar `IAChat_Telegram_v7.4.json` no n8n, conferir as credenciais dos dois nós de memória, ativar.
3. `psql $DATABASE_URL -f db/cleanup_test_users.sql` antes de qualquer coleta de métrica.
4. Reexecutar a bateria priorizando: T5/T7/T10/T11/R6 → PS2–PS4/T17 → C5/C6 → B3/B6 → C12.
5. Nudge: importar `IAChat_Nudge_Retencao_v1.json`, rodar manualmente com `LIMIT 1` apontando para você, e só então ativar.

## O que continua reprovado por decisão ou dependência externa

| Teste | Motivo |
| --- | --- |
| B7 (C2 alcançável) | Decisão de produto: teto em C1 |
| L2 (carga) | Assinatura gratuita do Groq |
| S3 (credenciais n8n) | Depende da hospedagem |
| S1/S2 | Corrigidos no código; a verificação final só vale no ambiente hospedado |
