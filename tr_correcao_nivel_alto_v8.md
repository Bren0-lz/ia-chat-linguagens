# Correcao de erro FORA da lista, em nivel alto — v8

> Rodada: 2026-09-10T14:33:18.920Z · N=6 por probe e por nivel
> Ingress: iachat-test-v8
>
> Regua ESTRITA (a mesma do C1): exige reparo explicito. O bot usar a forma
> certa na propria frase nao conta — foi essa frouxidao que saturou o
> detector do controle em 9/9 no T011.

### B2 · gerundio-apos-like — 0/6

entrada: `i like play video games` — e o erro exato que a jornada pegou em C1

    [nao corrigiu] Oh, that's awesome! I love playing video games too. What kind of games do you usually play? 😊
    [nao corrigiu] Oh, that's awesome! I love playing video games too. What kind of games do you usually play? 😊

### B2 · artigo-com-incontavel — 0/6

entrada: `i need a advice about my english` — artigo indefinido com substantivo incontavel

    [nao corrigiu] Oh, that's great you're thinking about that! I'm here to help. What kind of advice are you looking for? 😊
    [nao corrigiu] Oh, I'm happy to help! What kind of advice are you looking for? 😊

### B2 · plural-irregular — 4/6

entrada: `i saw many childrens at the park` — plural irregular, nada a ver com concordancia sujeito-verbo

    [corrigiu] ✔️ 'children' not 'childrens'  Oh, that's nice! I love seeing kids playing outdoors. What were they doing at the park? 😊
    [corrigiu] ✔️ 'I saw many children' at the park, not 'many childrens'. That's great! It sounds like a lively day. What were they doing there? 😊

### C1 · gerundio-apos-like — 0/6

entrada: `i like play video games` — e o erro exato que a jornada pegou em C1

    [nao corrigiu] Oh, that's awesome! I'm a big fan of video games too, Lucas. What kind of games do you usually gravitate towards? 😊
    [nao corrigiu] Oh, that's awesome! I'm a big fan of video games too. What kind of games do you usually enjoy playing? 😊

### C1 · artigo-com-incontavel — 2/6

entrada: `i need a advice about my english` — artigo indefinido com substantivo incontavel

    [nao corrigiu] Oh, absolutely! I'm all ears. What kind of advice are you looking for? 😊
    [nao corrigiu] Oh, I'm happy to help with that! What kind of advice are you looking for? 😊

### C1 · plural-irregular — 6/6

entrada: `i saw many childrens at the park` — plural irregular, nada a ver com concordancia sujeito-verbo

    [corrigiu] Oh, that's lovely! I can just picture it.  ✔️ 'many children', not 'many childrens'  I love seeing kids play outdoors. It always makes me think about how much fun I used to have at the park. What were
    [corrigiu] Oh, that's interesting! I love seeing kids playing outdoors.  ✔️ 'children', not 'childrens'  What kind of games were they playing? Were you tempted to join in? 😊

## Resumo

| nivel | probe | corrigiu | vazios |
|---|---|---|---|
| B2 | gerundio-apos-like | **0/6** | 0 |
| B2 | artigo-com-incontavel | **0/6** | 0 |
| B2 | plural-irregular | **4/6** | 0 |
| C1 | gerundio-apos-like | **0/6** | 0 |
| C1 | artigo-com-incontavel | **2/6** | 0 |
| C1 | plural-irregular | **6/6** | 0 |

**Taxa geral: 12/36 (33%)**

> ⚠️ Abaixo de 50%: o bot **nao corrige de forma confiavel** erro fora da lista em
> nivel alto. Isso e defeito de produto e merece tarefa propria — o T024 so mede.
> Conversa com o §4 do handoff ("o A1 corrige mal, ponto") e o estende: talvez nao
> seja so o A1, e talvez a variavel nao seja o nivel, e sim estar ou nao na lista.
