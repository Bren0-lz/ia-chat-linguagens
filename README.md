# IAChat — Tutor de inglês com IA no Telegram

![n8n](https://img.shields.io/badge/n8n-workflow-EA4B71?logo=n8n&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%20migrations-4169E1?logo=postgresql&logoColor=white)
![Gemini](https://img.shields.io/badge/Vertex%20AI-Gemini%202.5-4285F4?logo=googlecloud&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-bot-26A5E4?logo=telegram&logoColor=white)
![Testes](https://img.shields.io/badge/testes-offline%20%2B%20ao%20vivo-success)
![Licença](https://img.shields.io/badge/Licen%C3%A7a-Todos%20os%20direitos%20reservados-red)

Um **tutor de inglês pessoal que vive dentro do Telegram**. O aluno conversa por texto ou áudio e
o bot:

1. **descobre o nível dele** com um teste adaptativo de 10 questões (A1 a C2);
2. **conversa de verdade** sobre os interesses dele, corrigindo erros no caminho, com uma
   personalidade que ele escolhe;
3. **ensina de forma estruturada** no modo Professor — trilha de 10 tópicos por nível, com
   explicação, exercícios e tira-dúvidas.

Não é um chatbot com um prompt. O estado do aluno (nível, personalidade, interesses, progresso,
sequência de dias) vive no PostgreSQL, e as decisões pedagógicas — subir de nível, avançar tópico,
aceitar uma resposta — são **código determinístico**. O LLM escreve o texto; não decide o
currículo.

---

## Comprovação de experiência

| | |
|---|---|
| **Autor** | Breno Luiz Silva do Carmo — único autor de todos os commits deste repositório |
| **Tipo** | Item de portfólio de autoria própria — produto em pré-lançamento, com usuários reais |
| **Período registrado** | Repositório: 18/08/2026 a 05/09/2026 (50 commits). O histórico de versões do fluxo, de `v2` a `v8`, está versionado em [`fluxos/`](fluxos/), com changelogs a partir da v7.0 (26/06/2026) |
| **Verificação** | `npm run gate` — bateria offline (sem n8n, sem banco, sem LLM) que roda a regressão, os testes de cadastro e de validação de nome e a validação do conteúdo pedagógico |

### Competências técnicas evidenciadas

| Competência | Onde verificar neste repositório |
|---|---|
| **Banco de dados** | [`db/migrations/`](db/migrations/) — 14 migrations SQL versionadas (alunos, gamificação, testes de nivelamento, banco de questões, explicações por tópico), com runner próprio em [`db/migrate.js`](db/migrate.js) |
| **Testes automatizados** | [`fluxos/_teststand/`](fluxos/_teststand/) — harness que extrai o JavaScript dos nós do n8n e o executa fora da plataforma: regressão, 77 casos de validação de nome, cadastro, concorrência, entrada gigante; baterias ao vivo e jornada ponta a ponta do aluno |
| **Validação de conteúdo** | [`conteudo/`](conteudo/) — validadores da trilha e das explicações, e simulação de vazamento de gabarito ([`simula_vazamento.js`](conteudo/simula_vazamento.js)) com medição de falso positivo |
| **Inteligência artificial aplicada** | 4 agentes LLM (Gemini 2.5 Flash / Flash-Lite no Vertex AI) com memória em Postgres; transcrição de áudio com Whisper (Groq) |
| **Automação e integração** | [`fluxos/IAChat_Telegram_v8.json`](fluxos/IAChat_Telegram_v8.json) — workflow n8n com 103 nós, 29 deles de código JavaScript, integrando Telegram, PostgreSQL e Vertex AI |
| **TypeScript / React** | [`web/`](web/) — painel administrativo em React 19 + TypeScript + Vite com API serverless (`pg`, JWT) — em desenvolvimento |
| **Engenharia de qualidade** | Medições de latência (n=80, média 4,83 s) e de qualidade por nível e persona, documentadas em `fluxos/MEDICOES_*.md` |
| **Documentação técnica** | [`fluxos/HANDOFF.md`](fluxos/HANDOFF.md) (estado, decisões e plano), changelogs por versão, roteiro de testes diagnósticos |
| **GitHub / versionamento** | Commits atômicos por tarefa; versão em produção congelada e protegida por gate que falha se o arquivo for alterado |

---

## Arquitetura

```
Telegram ──► n8n (workflow IAChat v8)
              ├─ Roteador determinístico (JavaScript)   comandos, onboarding, modos
              ├─ Teste de nivelamento adaptativo         A1 → C2, 10 questões
              ├─ Modo Conversa   ── Agente Gemini + memória Postgres
              ├─ Modo Professor  ── trilha de tópicos + explicações revisadas + exercícios
              ├─ Tira-dúvidas    ── Agente Gemini
              └─ Áudio           ── Whisper (Groq)
                     │
                     ▼
              PostgreSQL  (estado do aluno, questões, progresso, explicações)
```

A separação **código decide / LLM escreve** é a espinha dorsal do projeto: as transições de
estado, a correção de respostas e a progressão na trilha são testáveis offline, de forma
determinística.

## Estrutura

```
fluxos/
  IAChat_Telegram_v8.json   workflow em desenvolvimento
  IAChat_Telegram_v7.4.json versão em produção (congelada)
  CHANGELOG_v*.md           histórico de mudanças por versão
  HANDOFF.md                documento único do projeto
  _teststand/               harness de testes e scripts de medição
db/
  migrations/               schema e seeds em SQL
  migrate.js                aplica as migrations
conteudo/
  track.json, questoes.json trilha pedagógica e banco de questões
  explicacoes/              explicações por nível (A1–C2) e tópico
  valida_*.js               validadores de conteúdo
web/                        painel administrativo (React + TypeScript)
```

## Como verificar

Pré-requisito: Node.js 18+.

```bash
npm install
npm run gate
```

Gates individuais: `gate:regressao`, `gate:cadastro`, `gate:nome`, `gate:abrealas`,
`gate:track`, `gate:conteudo`, `gate:congelado`. O `gate:congelado` compara com a tag
local `v7.4-congelado`, que não é publicada no GitHub — num clone novo ele falha por falta da tag,
não por alteração no arquivo.

As baterias ao vivo (`fluxos/_teststand/bateria_completa_*.js`, `jornada_usuario.js`) exigem n8n,
PostgreSQL e credenciais de LLM, e não fazem parte do gate offline.

## Autor

**Breno Luiz Silva do Carmo**
[LinkedIn](https://www.linkedin.com/in/breno-luiz-silva-do-carmo-19451a243/) ·
[GitHub](https://github.com/Bren0-lz)

## Licença

Copyright (c) 2026 Breno Luiz Silva do Carmo. Todos os direitos reservados.
Nenhuma parte deste código pode ser utilizada, reproduzida, distribuída ou modificada sem
autorização prévia por escrito do autor. Veja [LICENSE](LICENSE).
