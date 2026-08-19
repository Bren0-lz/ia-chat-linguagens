# ⚠️ Antes de usar os documentos desta pasta

**Os arquivos desta pasta descrevem o estado do IAChat em 13/07/2026, sobre a versão v7.2.**
Eles **não** descrevem o sistema atual. Entre 18 e 19/08/2026 o fluxo, o modelo de LLM e vários
vereditos mudaram.

| Arquivo | O que é | Vale hoje? |
|---|---|---|
| `Relatorio_Testes_IAChat.txt` / `.pdf` | execução consolidada da bateria, v7.2 | **desatualizado** — ver abaixo |
| `Resultado dos testes.txt` / `.pdf` | notas cruas do avaliador, v7.2 | histórico; é a fonte original, não atualizar |
| `TESTES_DIAGNOSTICOS.txt` / `.pdf` | roteiro, versão de julho | **substituído** por `fluxos/TESTES_DIAGNOSTICOS.md` |
| `transcricoes/` | evidência bruta das medições de 18–19/08 | atual |

## Onde está o estado atual

- **Roteiro e matriz de problemas:** `fluxos/TESTES_DIAGNOSTICOS.md` (mantido; tem coluna
  "medido em" indicando a versão de cada veredito)
- **Persona (PS3/PS4):** `fluxos/MEDICOES_PERSONAS_2026-08-18.md` e
  `fluxos/INVESTIGACAO_PERSONA_A1_2026-08-19.md`
- **Idioma e níveis (C5/C6):** `fluxos/MEDICOES_NIVEIS_2026-08-19.md`
- **Latência (L1):** `fluxos/MEDICOES_LATENCIA_2026-08-19.md`

## O que mudou desde o relatório

**A mudança mais importante não está em nenhum teste:** em 18/08 descobriu-se que **todos os
modelos Llama foram removidos da conta Groq**. Todas as chamadas de IA retornavam 404 e o bot
respondia vazio em todos os modos. Migrado para `openai/gpt-oss-120b` e `openai/gpt-oss-20b`.

Isso significa que **todo veredito qualitativo do relatório foi medido num modelo que não é mais
executável**. Não é possível reproduzir aquelas medições, nem separar "a v7.4 corrigiu" de "o
modelo novo é melhor".

### Vereditos que mudaram (medidos ao vivo na v7.4)

| Teste | No relatório (v7.2) | Hoje (v7.4) |
|---|---|---|
| T5 — "(Questão indisponível)" | NÃO CONCLUÍDO | **passou** (6/6 questões válidas) |
| T7 — dúvida com questão aberta | REPROVADO | **passou** |
| T10 — dúvida após responder | REPROVADO | **passou** |
| T11 — voltar à questão | REPROVADO | **passou** |
| R6 — pedir gabarito direto | REPROVADO | **passou** |
| C5 — registro C1 (idioma) | REPROVADO | **passou** (0% de português, N=3) |
| C6 — coerência entre níveis | REPROVADO | **passou** (correção em 100% dos níveis) |
| PS3/PS4 — persona | REPROVADO (rubrica 0) | **passou em B1** (0,184 ± 0,030); **falha em A1** (0,312) |
| B2/B7 — teto C2 | REPROVADO | **corrigido** (C2 alcançável) |
| L1 — latência | REPROVADO (">8s") | **mediana 2,2s**; a cauda é entrega, não processamento |
| **X4 — comandos de sistema** | **APROVADO** | **estava quebrado** e foi corrigido — regressão entre v7.2 e v7.4 |

### Testes que o relatório excluiu e que, ao serem executados, acharam defeito

- **X5** (concorrência) — 50% de perda de escrita no menu de interesses. Corrigido.
- **R1** (entrada gigante) — nada truncava; prompt podia chegar a ~80 KB. Corrigido.

Ambos tinham sido descartados por dificuldade de execução, não por irrelevância.

## A ressalva mais importante

**Só ~18 dos 63 testes foram revalidados na v7.4.** Os outros ~45 continuam com veredito de julho,
medido no modelo antigo. Como *todos* os testes revalidados mudaram de resultado — inclusive um que
passou a falhar — não há base para supor que os demais estejam estáveis.

A cobertura real é menor do que a sensação de cobertura.

---

*Nota sobre os PDFs: os `.pdf` desta pasta não foram alterados e continuam com o conteúdo de julho.
Este aviso vale para eles também.*
