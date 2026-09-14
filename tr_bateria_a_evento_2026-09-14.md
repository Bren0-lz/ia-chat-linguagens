# Bateria completa — Fase A (determinísticos) — evento

- **A1**: PASSOU — nome=Lucas idade=16 (sem loop)
- **A2**: PASSOU — rejeitou os 10 (saudação, genérica, lixo, palavrão), um aluno novo por entrada
- **A2b**: PASSOU — apos 2 recusas name=null (deve ser null); apos a 3a, name="Teen" (deve ser o first_name do Telegram, "Teen")
- **A3**: PASSOU — José-Maria=ok, D'Ávila=ok, Ana Luíza=ok
- **A4**: PASSOU — rejeitou 15/81/999/abc; "16 anos" -> idade=16
- **A6**: PASSOU — reenvio do mesmo update_id não recomeçou o cadastro (onboarding=done)
- **A8**: PASSOU — comando durante nivelamento manteve onboarding=pick_persona
- **B1**: FALHOU — errando tudo -> nível null (12 questões)
- **B3**: FALHOU — níveis percorridos:  -> final null
- **B5**: INCONCLUSIVO — status pausado=null; idx null -> null
- **B6**: PASSOU — MC: texto fora de contexto não avançou a questão (idx null -> null); reenviou enunciado: false
- **X1**: PASSOU — chat->teacher->chat, nome preservado (Teste)
- **X2**: PASSOU — após 7 dias: nível=B2 modo=teacher interesses preservados
- **X3**: PASSOU — entrada com & < > processada sem erro de nó
- **R2**: PASSOU — "😀😀😀"=ok, "   "=ok
- **R3**: PASSOU — foto aceita (HTTP 200) sem travar o fluxo
- **S1**: PASSOU — chamada sem header -> HTTP 403 (esperado 403)

**Resumo:** 14 passaram, 2 falharam, 1 inconclusivos
