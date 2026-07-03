# IAChat — Mudanças v7.3

> Estas mudanças estão **no arquivo `IAChat_Telegram_v7.3.json`** (promovido a partir do v7.2.json),
> mas **NÃO foram publicadas** no workflow ativo (id `H0Xfipr424xkejcd`) — o deploy via API foi
> bloqueado pelo guardrail de produção. **No ar continua a v7.2 base** até o deploy/validação ao vivo.
> Validação: toda a **lógica determinística** foi testada offline (rodando o próprio jsCode dos nós).
> O **comportamento do modelo** (qualidade dos prompts) NÃO foi validado ao vivo (exige o Groq + deploy).
> Data: 2026-07-01 (arquivo promovido a v7.3 em 2026-07-02).

## 1. Onboarding — validação de nome e idade
- **Nome**: exige ≥ 2 letras (mantém acentos, hífen, apóstrofo); rejeita numérico/símbolo/1 caractere.
  Quando inválido, `saveName=null` → **não grava mais `name=''`** no banco (bug latente corrigido).
- **Idade**: faixa **16–80** (decisão de produto). `\d{1,2}`→`\d{1,3}` para capturar "999" e rejeitá-lo
  (antes truncava para 99). Fora da faixa → pede de novo.
- Nó: `Etapa de Cadastro`.

## 2. Interesses — separar escolhidos x inferidos
- **Bug**: o `Processar Perfil` (Extrator de Perfil) concatenava interesses inferidos pela IA no mesmo
  `profile.interests` que o menu exibe como "✅ Selecionados" → apareciam itens nunca escolhidos.
- **Correção**:
  - `profile.interests` = só escolhas manuais do menu (o único mostrado no menu).
  - `profile.inferred_interests` = inferidos pela IA (nunca no menu).
  - A Conversa (`Contexto Conversa`) usa a **união** dos dois (mantém "USE-OS ATIVAMENTE").
- Nós: `Processar Perfil`, `Contexto Conversa`.
- ⚠️ Dado legado: usuários antigos têm `profile.interests` poluído; não há migração retroativa (ver §6).

## 3. Incentivo ao inglês (inclusive A1)
- `ptLine` (dispara com `pt_streak>=2`) reforçado: convida a tentar em inglês **aceitando mistura PT+EN**
  e comemora a tentativa.
- Linha fixa nova no `Prompt Conversa A1`: se o aluno escrever em português, convida com leveza a tentar
  em inglês (pode misturar), dá exemplo curto, comemora qualquer tentativa e **nunca repreende**.

## 4. Engajamento (modo Conversa) — prender no turno
Centralizado no `Contexto Conversa` e injetado nos 6 prompts (A1–C2) num ponto comum:
- **Reciprocidade**: o bot divide algo seu (opinião/mini-fato) antes de perguntar, em vez de só interrogar,
  e devolve com um gancho. No A1, respeita o teto de palavras e o formato bilíngue.
- **Variedade de formato** (`spiceLine`): a cada 3 turnos (contador `profile.conv.turns`), sugere um formato
  diferente — nível-aware (A1: escolha simples / mini-desafio / mini-história; B1+: hot-take / prefere X ou Y /
  historinha / pergunta hipotética).

## 5. Retenção (modo Conversa) — fazer voltar
- **Streak visível com comemoração** (`streakLine`): quando `streak_count>=3` e ainda não comemorado nessa
  marca, o bot comemora a sequência em 1 frase; grava `profile.conv.celebrated` para **não repetir** no mesmo dia.
- (Maior alavanca de retenção — **nudge proativo** — está só projetada; ver `RETENCAO_nudge_proativo_DESIGN.md`.)

## 6. Modo Professor — aprofundamento da matéria
**Problema:** a explicação inicial de cada tópico era rasa (`expSys` pedia "no máximo ~6 linhas, 1 ou 2
exemplos"), insuficiente para quem nunca viu o assunto responder as questões.
**Correções (nó `Professor Engine` + `Parse Professor`):**
- **`TRACK` enriquecido**: os 60 tópicos (6 níveis × 10) deixaram de ser uma frase curta e viraram uma
  **especificação completa da matéria** (formas/conjugações inteiras, regras, exemplos, erros comuns).
  É a fonte única usada tanto pela explicação quanto pelas questões.
- **`expSys` reescrito**: assume que o aluno **nunca teve contato** com o tópico; ensina do zero; objetivo
  explícito de deixá-lo apto a **acertar TODAS as questões**; estrutura pedagógica (o que é/quando usar →
  formas completas → ≥3 exemplos → erros comuns → resumo); alvo ~2500 caracteres.
- **`qSys` contido**: as questões só podem cobrar o que **foi ensinado neste tópico** (fecha o laço
  explicação ⊇ questões).
- **Truncamento defensivo** em `Parse Professor`: explicação > 4096 chars é cortada (evita falha de envio
  no Telegram, que não faz split nesse caminho).
- **Validação:** lógica determinística testada offline (TRACK 10/nível, expSys/qSys/dSys, streak, avanço de
  tópico, truncamento). A **aderência do modelo** ao prompt aprofundado ainda precisa de passada ao vivo.

## 7. Sistema de personalidade (persona)
**Verificação:** a "encanação" da persona foi **testada e está CORRETA** — escolher no menu salva a chave
certa (`profile.persona` ∈ buddy/coach/comedian/debater/formal), o onboarding avança, os demais campos do
profile são preservados, cada persona gera uma `personaLine` distinta, valores inválidos caem em `buddy`, e
a persona sobrevive ao save da conversa. (Suíte offline `persona_test`.)
**Dois motivos reais de "não funcionar" — corrigidos:**
- **Professor ignorava a persona por completo** (`expSys`/`qSys`/`dSys` não a referenciavam). Agora um **TOM**
  de persona é injetado na **explicação** e na **dúvida** (não nas questões, que ficam neutras), com a regra
  de **nunca comprometer completude/clareza/correção** da matéria.
- **Na Conversa a persona era 1 linha descritiva perdida** entre ~20 regras fortes. Virou **diretiva imperativa**
  ("INCORPORE ESTA PERSONALIDADE em CADA resposta…").
- **Validação:** plumbing e injeção testados offline (`persona_test`, `persona_test2`). A manifestação real
  no texto do modelo depende de passada ao vivo.

## 8. Modo Professor — dúvida sem alucinação + explicação do erro (2026-07-02)
**8.1. Dúvida deixava de alucinar.** O handler de dúvida (`dSys`/`Agente Dúvida`) não recebia o
enunciado da questão — só a resposta certa era salva (`teacher_state.answer`). Sem saber a questão,
o modelo inventava uma pergunta e às vezes entregava/inventava o gabarito de algo ainda não respondido.
- `Parse Professor` agora salva também `teacher_state.question` e `q_answered` (merge `||
  jsonb_build_object(...)`) junto com a `answer`.
- `Professor Engine` (ramo `doubt_msg`) injeta no prompt: (a) responda SÓ à dúvida real do aluno, não
  invente pergunta, peça esclarecimento se vago; (b) o enunciado atual. Se `q_answered=false` (questão
  pendente), PROÍBE revelar o gabarito — ajuda a raciocinar com exemplo diferente. Se já respondido,
  libera usar a resposta na explicação.
- Limpeza de `question`/`q_answered` ao trocar de tópico (`advance`), iniciar quiz e voltar à `intro`.

**8.2. Resposta errada agora traz explicação.** Antes o erro só mostrava `❌ resposta certa era X` e já
disparava a próxima questão. Agora:
- Novo ramo `wrong` (LLM `wrongSys` via `Agente Professor`) gera explicação LEVE e didática do porquê do
  erro (aponta o que o aluno confundiu, mostra a regra/forma certa, 1 exemplo, encoraja sem repreender).
- Reaproveitado o nó órfão **`Enviar Correção`** (antes sem entrada): recebe `Pos Professor` saída[2],
  mostra `❌ resposta certa` + explicação + gancho “🤔 Alguma dúvida ou seguimos para a próxima?” com
  **dois botões**: `t_doubt` (Tirar dúvida) e `t_next` (Próximo exercício).
- `t_next` agora é roteado (`Roteador Mestre` → subroute `next_q`); texto na fase `correction` vira dúvida.
- Switches ajustados: `Envio Professor` (grupo `llm` inclui `wrong`) e `Pos Professor` (nova saída `wrong`).
- **Validação:** sintaxe dos 3 nós Code + simulação offline dos ramos (wrong, doubt pendente/respondida,
  next_q, roteamento t_next/correction) — OK. Aderência do modelo aos prompts (`wrongSys`, contexto da
  dúvida) ainda precisa de passada ao vivo com o Groq. Backup: `_teststand/backup_v7.3_2026-07-02T13-58-02.json`.

## 7b. Pendências / dependências
- **Deploy + validação ao vivo**: publicar no n8n e rodar o harness (`_teststand`) devagar (1 nível) para
  conferir a QUALIDADE dos prompts com o Groq real — principalmente que o **formato bilíngue do A1** e o
  **teto de 18 palavras** não quebraram com as novas linhas.
- **Migração de dados legados** dos interesses (mover itens não-catalogados de `interests` para
  `inferred_interests`) — precisa de acesso de escrita ao banco.
- **Nudge proativo (retenção)** — desenhado, não construído; precisa de dry-run controlado (risco de carga).
