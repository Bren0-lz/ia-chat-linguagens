# _teststand — harness de teste do IAChat (n8n)

Ferramentas para testar o workflow ativo dirigindo a jornada completa (onboarding → placement →
Conversa → Professor) como um "aluno" e lendo as respostas reais do modelo pelos dados de execução.
Contexto completo em `../HANDOFF.md`.

## Pré-requisitos
- Node 18+ (usa `fetch` nativo).
- n8n rodando em `http://localhost:5678` com o workflow IAChat **ativo** (o nó `TEST Ingress`/webhook
  `iachat-test` precisa estar registrado — ele só existe/registra quando o workflow está ativo).
- A **API key (JWT)** do n8n exportada no ambiente:
  ```bash
  export N8N_API_KEY="<JWT da API do n8n>"   # está em ~/.claude.json (mcpServers.n8n-mcp.env.N8N_API_KEY)
  # opcional: export N8N_URL="http://localhost:5678"
  ```

## Uso
Roda uma jornada completa por nível, **resumível** e **pausada** (importante: o n8n é sensível a carga).
Rode em blocos curtos até `phase=done` — cada invocação faz poucos passos e salva o estado:

```bash
# nível A1..C1 (C2 é inalcançável pelo produto — ver HANDOFF §3)
PACE=2500 MAXACT=6 node tick.js A1   # repita este comando várias vezes até phase=done
```

Saídas por nível:
- `state_<nível>.json` — estado do progresso (apagar para recomeçar do zero).
- `tr_<nível>.md` — **transcrição real** da conversa/professor (é o que você lê para avaliar).

Smoke test rápido (1 mensagem):
```bash
N8N_API_KEY=... node harness.js
```

## Arquivos
- `harness.js` — POST no webhook + captura da execução do **meu** user (imune a execuções órfãs) + `digest()`.
- `seed.js` — respostas do exame de placement (`db/migrations/005_v6_seed_exam.sql`) p/ dirigir o nível.
- `tick.js` — driver resumível da jornada; roteiros de conversa/dúvida por nível embutidos.

## Cuidados (ver HANDOFF §5)
- **Ritmo lento** (`PACE=2500`) e **um nível por vez** — carga alta derruba o n8n.
- O envio final ao Telegram **falha** (chatId falso) de propósito; a resposta é lida dos nós a montante.
- Não commitar `state_*.json`, `tr_*.md` nem a API key.
- Ao terminar, **apagar os usuários de teste** (`user_id` ~`9930000000`–`9939999999`) da tabela `students`.
