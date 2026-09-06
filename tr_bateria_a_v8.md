# Bateria completa — Fase A (determinísticos) — v8

- **A1**: PASSOU — nome=Lucas idade=16 (sem loop)
- **A2**: PASSOU — rejeitou os 10 (saudação, genérica, lixo, palavrão), um aluno novo por entrada
- **A2b**: PASSOU — apos 2 recusas name=null (deve ser null); apos a 3a, name="Teen" (deve ser o first_name do Telegram, "Teen")
- **A3**: PASSOU — José-Maria=ok, D'Ávila=ok, Ana Luíza=ok
- **A4**: PASSOU — rejeitou 15/81/999/abc; "16 anos" -> idade=16
- **A6**: PASSOU — reenvio do mesmo update_id não recomeçou o cadastro (onboarding=done)
- **A8**: PASSOU — comando durante nivelamento manteve onboarding=done
- **B1**: PASSOU — errando tudo -> nível A1 (10 questões)
- **B3**: PASSOU — níveis percorridos: A1>A2 -> final A2
- **B5**: PASSOU — status pausado=paused; idx 0 -> 0
- **B6**: PASSOU — MC: texto fora de contexto não avançou a questão (idx 0 -> 0); reenviou enunciado: false
- **X1**: PASSOU — chat->teacher->chat, nome preservado (Teste)
- **X2**: PASSOU — após 7 dias: nível=B2 modo=teacher interesses preservados
- **X3**: PASSOU — entrada com & < > processada sem erro de nó
- **R2**: PASSOU — "😀😀😀"=ok, "   "=ok
- **R3**: PASSOU — foto aceita (HTTP 200) sem travar o fluxo
- **S1**: PASSOU — chamada sem header -> HTTP 403 (esperado 403)

**Resumo:** 17 passaram, 0 falharam, 0 inconclusivos

---

## Como foi medido

| | |
|---|---|
| Data | 06/09/2026 |
| Alvo | **v8** — workflow n8n `PbwEf7L9xEXhJaCg`, 106 nós, `active=true` |
| Ingress | `http://localhost:5678/webhook/iachat-test-v8` (`IACHAT_TEST_PATH=iachat-test-v8`) |
| Comando | `IACHAT_TEST_PATH=iachat-test-v8 node --require ./fluxos/_teststand/registra_urls.js fluxos/_teststand/bateria_completa_a.js` |
| **Exit code real** | **0** (a Fase A sai 1 em reprovação e 2 em inconclusivo desde o T013) |
| Faixa de user_id | 993396364+ (derivada do relógio, dentro de 990000000–999999999) |
| Execuções geradas | 93, ids **3648–3740** |

### Prova de que tudo caiu no v8, e nada no v7.4

Duas medidas independentes, porque `active=true` não prova a quem o request foi:

1. **Toda URL de `fetch` do processo foi registrada** (`fluxos/_teststand/registra_urls.js`):
   2373 chamadas, das quais 94 ao webhook — **94/94 em `/webhook/iachat-test-v8`**, zero em
   `/webhook/iachat-test`. (94 posts e 93 execuções: o S1 manda sem header e o n8n devolve 403
   antes de criar execução.)
2. **Auditoria pela API do n8n** (`fluxos/_teststand/audita_alvo_execucoes.js 3648 993396364`), que
   **pagina** por `nextCursor` — ler só a primeira página já produziu conclusão errada neste projeto
   (handoff §6 nº 16):

```
paginas lidas: 1 | execucoes vistas: 250 | na janela (id>=3648): 93
por workflow na janela:
  PbwEf7L9xEXhJaCg  v8  93
execucoes com user_id identificado: 93
execucoes de teste (uid 993396364-999999999) FORA do v8: 0
execucoes no v7.4 na janela: 0

OK — nenhuma execucao de teste caiu fora do v8
```

A paginação foi exercitada de verdade: lendo o histórico em páginas de 250 o cursor avança
(`pagina 1: menor id 3491` · `pagina 2: 3241` · `pagina 3: 2991`, `nextCursor` presente nas três).
Nesta janela a primeira página já cobre os 93 ids, e o script só para porque o menor id lido
passou do piso — não porque a página acabou.

O user_id foi lido do corpo de cada execução, uma a uma — não se tomou "a mais nova".

### O conserto do alvo, feito antes de medir

Até 06/09 a Fase A montava a URL **cravada** em três lugares (`BASE + '/webhook/iachat-test'`,
linhas 193, 370 e 379): os testes **A6, R3 e S1** iam para o **v7.4, que atende usuários reais**,
mesmo com a bateria "rodando no v8" — o R3 mandaria uma foto e o S1 uma requisição sem header para
produção, e o relatório diria v8. Armadilha nº 13 do handoff. Agora todo request sai pelo `WEBHOOK`
do harness, e a transcrição do v8 tem nome próprio para não sobrescrever a evidência do v7.4.
Guardado por `fluxos/_teststand/testa_alvo_bateria_a.js`, que reprova a versão anterior.

### Ameaças à validade

- 90 das 93 execuções terminam em `error`, **todas** no nó `Enviar *` (Telegram recusa o `chat_id`
  sintético). Nenhuma falha a montante; é o modo de operação documentado do teststand.
- Nenhum veredito da Fase A depende de o bot ter respondido texto: todos leem estado do Postgres,
  código HTTP ou erro de nó. Não há PASSOU por ausência de resposta (armadilha nº 1).

### Comparação com o v7.4 (`tr_bateria_a.md`, 04/09)

**Nenhum teste mudou de veredito.** 17 PASSOU no v7.4, 17 PASSOU no v8, com as mesmas evidências
linha a linha (variam só nomes/ids gerados). A diferença que importa é de instrumento, não de
produto: no v8 os três testes A6, R3 e S1 foram, pela primeira vez, medidos **no fluxo que o
relatório diz** — em 04/09 eles mediram o v7.4 por acidente, o que naquele caso coincidia com o
alvo pretendido.
