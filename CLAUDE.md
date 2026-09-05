# CLAUDE.md — IAChat

Leia `fluxos/HANDOFF.md` antes de qualquer trabalho: é o documento único do projeto (produto,
estado, plano). **Responda sempre em pt-BR.**

## O que é o código aqui

O produto é um workflow n8n. O código de produção mora dentro de um JSON —
`fluxos/IAChat_Telegram_v8.json`, ~101 nós, dos quais 28 são nós de código JavaScript.
Testar = extrair o `jsCode` do nó e executá-lo fora do n8n (é o que o `_teststand` faz).
Não há framework de teste: os testes são scripts Node com asserts caseiros que terminam em
`process.exit(fails ? 1 : 0)`. Siga esse estilo.

Fora do fluxo: `db/migrations/` (SQL), `fluxos/_teststand/` (harness), `web/` (painel,
**quebrado e fora de escopo por decisão**).

## Duas versões, uma no ar

| | |
|---|---|
| `fluxos/IAChat_Telegram_v7.4.json` | **CONGELADO.** É a versão ativa no n8n (`9MA0o1XJjD33BnKc`). Não editar |
| `fluxos/IAChat_Telegram_v8.json` | onde todo o trabalho novo acontece |

As duas dividem o mesmo `webhookId` (`telegram-iachat-webhook`): **ativar o v8 derruba o v7.4**.
Por isso publicar/ativar exige pedido explícito do Breno, sempre.

## Desenvolvimento autônomo (autodev)

### Gates — comandos de verificação

| Comando | Tempo | Cobre |
|---|---|---|
| `npm run gate` | ~7 s | os quatro abaixo, em sequência |
| `npm run gate:regressao` | 0,3 s | placement, roteador, anti-spoiler, interesses + sintaxe dos 28 nós de código |
| `npm run gate:cadastro` | <1 s | Triagem de Nome → Etapa de Cadastro |
| `npm run gate:nome` | <1 s | 77 casos da camada 1 da validação de nome |
| `npm run gate:congelado` | instantâneo | prova que o `v7.4.json` não foi tocado |

Todos rodam **offline**: sem n8n, sem Postgres, sem LLM. Uma tarefa só está concluída quando
todos retornam exit code 0.

As baterias ao vivo (`bateria_completa_a.js`, `bateria_completa_b.js`, `jornada_usuario.js`)
**não são gates**: exigem n8n ativo, Postgres e chamadas reais de LLM, e são não-determinísticas.
Rode-as à mão entre blocos de tarefas. Atenção: `bateria_completa_a.js` só sai com código ≠0 em
erro fatal — reprovação de teste sai 0.

### Regras do loop

- O estado real está em `PLAN.md` e `STATE.md`. Nunca confie na memória da conversa.
- Uma tarefa por vez. Um commit por tarefa concluída.
- Nunca marque `DONE` sem a saída real do comando de gate.
- **Escreva o teste junto com a correção, e confirme que ele reprova a versão anterior.**
  Teste que não reprova o código velho não prova nada.
- Ambiguidade não se resolve por chute: marque `BLOCKED` e pare.
- Tarefa marcada **Precisa de ambiente** só roda com o pré-requisito de pé; não tente subir
  Docker, n8n ou ngrok sozinho.
- **`PLAN.md` e `STATE.md` são do orquestrador.** O implementer não muda status de tarefa nem
  escreve no diário — quem verifica é outro agente, e marcar-se DONE contamina o ponto de
  controle.
- **Mudança no fluxo só vale ao vivo depois de republicar:** `node fluxos/_teststand/publica_v8.js`.
  É o único script autorizado a publicar, e só atinge o v8 (alvo cravado, aborta se o arquivo
  local puder roubar o bot). Sem ele, o gate ao vivo testa a versão antiga e dá falso PASSOU.
- **`gate_vivo_v8.js` só percorre o onboarding.** Se a sua tarefa mexe em outra rota, ele passa
  sem tocar no que você mudou — escreva a verificação ao vivo da rota que você alterou.

### Nunca fazer sem pedido explícito do Breno

- publicar ou ativar workflow no n8n (MCP, API ou interface)
- `git push`, tag remota, PR
- enviar mensagem real no Telegram (`mede_latencia_real.js`, `set_telegram_commands.js`)
- aplicar migration no banco (`npm run db:push`) — escrever o `.sql` é permitido
- ler, escrever ou imprimir `.env` e credenciais
- apagar evidência: `documentos/`, `MEDICOES_*.md`, `tr_*.md`, `_teststand/backup_*.json`
- editar `fluxos/IAChat_Telegram_v7.4.json` ou qualquer versão anterior

### Convenções

- Commits **com** atribuição: `Co-Authored-By: Claude Opus 5` + `Claude-Session:` (handoff §8).
- Editar o JSON do fluxo por script Node (`JSON.parse` → alterar → `JSON.stringify(f, null, 2)`),
  não à mão.
- Nó novo precisa de entrada em `connections`, senão fica órfão.
- Limpar usuários de teste ao fim: `node db/cleanup_test_users.js --apply`.
- IDs de teste na faixa `990000000–999999999`, derivados do relógio.

### Armadilhas já pagas

`fluxos/HANDOFF.md` §6 tem as 16, cada uma custou pelo menos um dia. As três que mais reaparecem:
resposta vazia não é aprovação · duração total não mede latência · o instrumento pode estar
julgando a string errada.
