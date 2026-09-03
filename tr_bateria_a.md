# Bateria completa — Fase A (determinísticos) — v7.4

- **A1**: PASSOU — nome=Lucas idade=16 (sem loop)
- **A2**: PASSOU — rejeitou ["A","123","@#"]; name gravado: null
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

**Resumo:** 16 passaram, 0 falharam, 0 inconclusivos
