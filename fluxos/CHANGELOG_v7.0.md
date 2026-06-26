# IAChat_Telegram_v7.0 — Changelog & Auditoria

> Base: v6.3 (id `SjU0v9xnmgy7dVbf`, 100 nós). v7.0 criado como **id `zAjCM0ZcastWElOo`, inativo**.
> v6.3 segue **ativo e intacto** — a troca para v7.0 é uma decisão manual sua (ver "Como ativar").
> Auditoria e correções: 2026-06-26.

## Resumo
Auditei os 100 nós do v6.3, identifiquei bugs reais (latentes e ativos) e gargalos de UX,
e apliquei correções no v7.0. As mudanças de lógica foram **testadas localmente em Node.js
contra as questões reais do seed** (`db/migrations/005_v6_seed_exam.sql`), simulando o ambiente
dos Code nodes do n8n (start → 10 respostas → gabarito, escaping, matching).

---

## Correções aplicadas no v7.0

### 1. [ALTO] Teste de nível reprovava respostas escritas corretas
**Problema:** o `Placement Engine` (e o `Professor Engine`) comparavam respostas escritas por
igualdade exata após normalização. Um aluno que digitasse a forma natural era marcado como ERRADO:
- `i am 20 years old` ✗ vs `"I'm 20 years old"` (contração)
- `have never eaten` ✗ vs `"I have never eaten sushi"` (frase completa)
- `was built` ✗ vs `"It was built"` (pronome inicial)
- `near the park` ✗ vs `"It is near the park"`

Isso gera reprovação injusta logo no onboarding — péssima primeira impressão.
**Correção:** nova função `answersMatch()` com (a) expansão de contrações (i'm→i am, don't→do not, …),
(b) remoção de palavras-muleta iniciais (the/it/i/that…), (c) match por subsequência contígua de palavras,
(d) aceite de resposta de 1 palavra presente na frase. **MC continua exato.**
**Teste:** 33 casos reais → v6.3 acerta 25/33 (8 falsos-negativos); **v7.0 acerta 33/33** (mantém
respostas genuinamente erradas como erradas).

### 2. [ALTO/latente] `parse_mode: HTML` quebrava com `<`, `>`, `&`
**Problema:** os nós de envio usam `parse_mode: HTML`, mas o `Placement Engine` injetava o enunciado/
alternativas das questões **sem escapar**. Uma questão futura com `a < b`, `rock & roll` ou `<noun>`
faria o Telegram retornar HTTP 400 → a questão **não é enviada** → aluno **trava no meio do teste**.
(O seed atual não tem esses caracteres, por isso era latente.) O mesmo valia para a correção do
`Professor Engine` (`answer`/`explanation`).
**Correção:** `esc()` aplicado a todo conteúdo dinâmico vindo do banco (enunciado, alternativas,
resposta correta, explicação) no `Placement Engine` e `Professor Engine`.
**Teste:** SIM 4 injeta questão com `5 < 10 & 3 > 2` e `<b>bold</b>` → saída escapada (`&lt; &gt; &amp;`), sem crash.

### 3. [ALTO] Backdoor de desenvolvimento `/restart` em produção
**Problema:** o `Roteador Mestre` e a `Etapa de Cadastro` tinham um comando `/restart` (marcado
"remover depois") que **zerava todo o progresso do aluno** (placement_state, teacher_state, onboarding).
Qualquer usuário que digitasse `/restart` perderia tudo.
**Correção:** removido de ambos os nós.

### 4. [MÉDIO] Perda de dados do perfil por escrita concorrente
**Problema:** o `Processar Perfil` (extrator assíncrono) reescrevia o **objeto `profile` inteiro** a
partir de um snapshot antigo. Mensagens processadas no intervalo (que mudam `profile.conv`, `flags`,
`themes`) tinham suas alterações **sobrescritas/perdidas**.
**Correção:** passou a usar `jsonb_set` para atualizar **apenas** `interests` e `notes` no servidor,
preservando o resto do JSONB mesmo sob concorrência.

### 5. [BAIXO] UX de comandos
- Adicionado `/help` e `/ajuda` (texto de ajuda com todos os comandos + dica de áudio).
- Mensagem de "comando desconhecido" agora lista `/config` e `/interesses` (antes omitidos).

### 6. [BAIXO] Resiliência de banco
- `retryOnFail` (3 tentativas, 1,5s) nos nós Postgres de carga/escrita
  (Carregar Aluno, Atualizar Cadastro/Modo, Salvar Placement/Professor State/Sinal/Config/Interesses,
  Incrementar Contador) — sobrevive a blips transitórios do Postgres.
- `maxTries: 3` explícito nos agentes (Conversa/Professor/Dúvida).

---

## Camada de RETENÇÃO (implementada e testada no v7.0)
Ativa as colunas de gamificação que já existiam no banco (migration 001) mas estavam **ociosas**.

### 7. Sequência diária (streak) + XP + conquistas
- **Streak atômico** no `Carregar Aluno`: a query agora atualiza `streak_count`/`last_active`
  numa única instrução SQL (`CASE` por data) — incrementa no dia consecutivo, mantém no mesmo dia,
  reseta após lacuna. **Atômico → sem clobber de concorrência.** Testado em JS (6 transições de data).
- **XP**: `+5` por turno de conversa/professor (no `Incrementar Contador`, atômico).
- **Conquistas (badges)** calculadas (3/7/30 dias, 100/500 XP, nível avançado). Testado (12/12).

### 8. Comando `/progresso` (e `/perfil`)
Mostra nível, sequência, XP, temas dominados e conquistas. Ex.:
```
📊 Seu progresso
🎯 Nível: B2   🔥 Sequência: 8 dia(s)   ⭐ XP: 540
📚 Temas dominados: 2
🏅 Conquistas: 🔥 3 dias  ⭐ 7 dias  💯 100 XP  🚀 500 XP  🎓 Avançado
```

### 9. Menu com gatilho de retenção
O `/menu` agora exibe um cabeçalho dinâmico "🔥 X dias seguidos praticando!" quando a sequência ≥ 2.

### 10. Indicador de digitação (UX)
3 nós `sendChatAction: typing` (Conversa/Professor/Dúvida), conectados **em paralelo** aos nós de
contexto (sem alterar o fluxo de dados), com `onError: continueRegularOutput`. O aluno vê "digitando…"
durante a chamada do Groq — conversa mais fluida.

> **Validação:** 34/34 nós de código compilam; workflow validado (sem regressões vs. v6.3 — os mesmos
> 24 falsos-positivos; warnings caíram de 144→135). 103 nós no total.

---

## Sobre os "24 erros" do validador (n8n_validate_workflow)
São **falsos-positivos** e foram deixados como estão de propósito:
- "Invalid value for 'operation'" nos nós Telegram: eles usam a operação **default** `sendMessage`
  (sem campo `operation` explícito). O bot v6.3 roda assim em produção. Não é erro real.
- "missing onError: continueErrorOutput" em nós IF/Switch: o validador interpreta o segundo output
  (ramo **false/fallback**) como "saída de erro". Adicionar `continueErrorOutput` ali **quebraria o
  roteamento**. Por isso o autofix automático NÃO foi aplicado.

---

## Como ativar o v7.0
1. Teste o v7.0 no Telegram com uma conta de teste (idealmente outro bot/token de staging).
2. Confira: onboarding → teste de nível (responda escrito com contrações p/ ver o match novo) →
   gabarito → menu → conversa → professor → /help → /config → /interesses.
3. Quando aprovado: **desative o v6.3** e **ative o v7.0** (eles compartilham o mesmo bot/token;
   manter os dois ativos causaria respostas duplicadas).

---

## Ajuste fino da CONVERSAÇÃO (testado com o modelo real, todos os níveis)
Testei o modo Conversa conversando de verdade com o agente (Groq llama-3.3-70b) via um workflow
de teste isolado (Webhook→Agent→Respond, mesmas credenciais), jogando o papel de aluno em cada nível.
O gatilho Telegram da produção **nunca foi alterado** (harness separado). Problemas encontrados e corrigidos:

| Nível | Problema encontrado | Correção |
|---|---|---|
| Todos | Tutor **quase não corrigia** os erros do aluno (só afirmava) | Protocolo de correção gentil e consistente ("Quick tip/Small fix: …") com 1 erro por vez; e "se estiver correto, não invente correção" |
| B2/C1 | **Verbosidade** crescente (54→99 palavras) = monólogo | Limite duro de palavras por nível (A1 18 → C2 60) |
| C1 | Às vezes 2 perguntas; lecionava | "APENAS uma pergunta, no fim" reforçado + brevidade |
| A1 | Travava quando o aluno dizia "não entendi" | Regra: reformular a frase anterior de forma mais simples, sem trocar de assunto |
| Todos | Interesses **sequestravam** o tema trazido pelo aluno | Interesses agora "dão sabor", mas o tutor SEGUE o tema do aluno |
| **C2** | **Inexistente** → aluno C2 era rebaixado para A2 | **Adicionado nível C2** (novo nó Prompt Conversa C2 + saída no switch Nível Conversa + Contexto Conversa aceita C2) |

Resultado validado conversando em A1, A2, B1, B2, C1 e C2: correções presentes e gentis, respostas
curtas e naturais (sem monólogos), uma pergunta por vez, e C2 tratando o aluno como par.
> Obs.: o modo **Professor/Dúvida** ainda limita a A1–C1 (placement vai só até C1). Estender C2 ao
> Professor/Dúvida fica como follow-up.

## Roadmap proposto (v7.1) — retenção
Pensado, ainda **não** implementado (requer migração de DB e teste ao vivo):
- **Gamificação** usando colunas já existentes e ociosas (`xp`, `streak_count`, `last_active`, `badges`
  da migration 001): XP por exercício/turno, streak diário, `/progresso`, badges por marcos.
  Implementar com SQL atômico (`xp = xp + N`) p/ evitar clobber de concorrência.
- **Indicador de digitação** (`sendChatAction: typing`) antes das chamadas de IA — resposta percebida
  como mais rápida durante os segundos do Groq.
- **Repetição espaçada** no modo Professor (revisar temas "mastered" após N dias).
- **Blindagem de concorrência**: serializar processamento por usuário (advisory lock) p/ eliminar
  read-modify-write em mensagens rápidas.
