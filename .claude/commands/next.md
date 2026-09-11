---
description: Executa a próxima tarefa do PLAN.md, verifica, commita e atualiza o estado.
---

Execute **UMA** iteração do loop de desenvolvimento. Responda em pt-BR.

1. Leia `STATE.md` e `PLAN.md`. Identifique a próxima tarefa `TODO` cujas dependências estão `DONE`.
2. Se não houver nenhuma, ou houver bloqueio aberto: **PARE** e diga o motivo.
   Não invente tarefa nova, não "adiante" outra coisa.
3. Se a tarefa tiver **Precisa de ambiente:** declarado, cheque o pré-requisito antes de delegar
   (ex.: Postgres em `127.0.0.1:5433`, n8n ativo). Se não estiver disponível: marque a tarefa
   `BLOCKED: ambiente`, registre em `STATE.md`, **PARE** e me chame. Não tente subir Docker,
   n8n ou túnel sozinho.
4. Delegue ao agente `implementer` (via Agent, subagent_type `implementer`) passando:
   ID, escopo, gate e as descobertas do diário que sejam relevantes.
5. Se voltar `BLOCKED`: registre em `STATE.md`, **PARE** e me chame.
6. Delegue ao agente `verifier` passando apenas o ID e o escopo — nada do raciocínio do implementer.
7. Se `FAIL`: incremente as tentativas em `STATE.md` e volte ao passo 4 informando o motivo da falha.
   Na **3ª** falha: marque a tarefa `BLOCKED`, **PARE** e me chame.
8. Se `PASS`:
   - `git add -A && git commit` com mensagem `<ID>: <título da tarefa>` e os trailers de
     atribuição (`Co-Authored-By` + `Claude-Session`) — convenção §8 do handoff.
     **Com medição em voo, commite arquivo por arquivo:** `git add -A` captura trabalho pela
     metade e mistura duas tarefas num commit
   - marque a tarefa `DONE` no `PLAN.md`
   - atualize `STATE.md`: última concluída + hash do commit, tentativas = 0, uma linha no diário
9. Reporte em 3 linhas: o que foi feito · gate que passou · qual é a próxima.

**Nunca faça mais de uma tarefa por invocação.** O valor do loop está no ponto de controle
entre iterações, não na velocidade.

**Nunca publique nem ative nada** — n8n, Telegram, `git push`, `db:push`. Se uma tarefa
parecer exigir isso, ela está mal escrita: pare e me chame.

## No modo auto-ritmado (`/loop /next`)

O loop encadeia iterações sem ninguém olhando. Por isso, além do acima:

- **Só tarefas offline andam sozinhas.** Tarefa marcada **Precisa de ambiente** ou que dependa de
  chamada real de LLM (baterias, experimentos com N≥6) **para e chama o Breno** — são caras,
  não-determinísticas e não se interpretam sozinhas.
- **Nada de publicar.** Se a tarefa só fecha ao vivo, o implementer entrega o offline verde e
  reporta `PRECISA PUBLICAR`: registre em `STATE.md`, **PARE** e me chame. `publica_v8.js` e
  o envio real no Telegram estão negados nas permissões — por desenho.
- **Uma rodada ao vivo por bloco deixa lixo:** ao parar o loop, rode
  `node db/cleanup_test_users.js --apply` e confira que as 2 contas reais foram preservadas.
- **Gate vermelho em árvore limpa = pare.** Não é tarefa para o loop consertar às cegas: é sinal
  de ambiente (Postgres caído, n8n fora) ou de regressão herdada.
- **Três iterações seguidas sem produzir commit** (BLOCKED, FAIL ou parada) encerram o loop.
