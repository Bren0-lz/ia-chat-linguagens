# Correcao de erro FORA da lista, em nivel alto — v8

> Rodada: 2026-09-10T16:19:54.034Z · N=6 por probe e por nivel
> Ingress: iachat-test-v8
>
> Regua ESTRITA (a mesma do C1): exige reparo explicito. O bot usar a forma
> certa na propria frase nao conta — foi essa frouxidao que saturou o
> detector do controle em 9/9 no T011.

### B2 · gerundio-apos-like — 0/6

entrada: `i like play video games` — e o erro exato que a jornada pegou em C1

    [nao corrigiu] Oh, that's awesome! I love playing video games too. What kind of games do you usually play? 😊
    [nao corrigiu] Oh, that's awesome! I love that too. What kind of video games do you usually play? 😊

### B2 · artigo-com-incontavel — 0/6

entrada: `i need a advice about my english` — artigo indefinido com substantivo incontavel

    [nao corrigiu] Hey, that's awesome! I'm happy to help you with that. What kind of advice are you looking for? 😊
    [nao corrigiu] Oh, that's awesome! I'd love to help you out. What kind of advice are you looking for? 😊

### B2 · plural-irregular — 6/6

entrada: `i saw many childrens at the park` — plural irregular, nada a ver com concordancia sujeito-verbo

    [corrigiu] ✔️ 'I saw many children at the park', not 'I saw many childrens at the park' Oh, that's cool! I love seeing kids playing outside. What were they doing there? 😊
    [corrigiu] ✔️ 'I saw many children at the park', not 'I saw many childrens at the park' Oh, that's cool! I love seeing kids playing outside. What were they doing? 😊

### C1 · gerundio-apos-like — 0/6

entrada: `i like play video games` — e o erro exato que a jornada pegou em C1

    [nao corrigiu] Oh, that's awesome! Me too, I'm a huge fan of gaming. What kind of video games do you usually play? 😊
    [nao corrigiu] Oh, that's awesome! I totally get that. Gaming can be such a great way to unwind. What kind of video games do you usually play? 😊

### C1 · artigo-com-incontavel — 1/6

entrada: `i need a advice about my english` — artigo indefinido com substantivo incontavel

    [nao corrigiu] Oh, I'm happy to help with that! 😊 What kind of advice are you looking for?
    [nao corrigiu] Oh, I'd be absolutely thrilled to help with that! What kind of advice are you looking for, specifically? 😊

### C1 · plural-irregular — 6/6

entrada: `i saw many childrens at the park` — plural irregular, nada a ver com concordancia sujeito-verbo

    [corrigiu] ✔️ 'many children', not 'many childrens' Oh, that's lovely! I always enjoy seeing kids out and about, especially at a park. What were they up to? 😊
    [corrigiu] ✔️ 'many children', not 'many childrens' Oh, that's lovely! I bet it was quite a lively scene. What were they up to, anything particularly fun? 😊

## Resumo

| nivel | probe | corrigiu | vazios |
|---|---|---|---|
| B2 | gerundio-apos-like | **0/6** | 0 |
| B2 | artigo-com-incontavel | **0/6** | 0 |
| B2 | plural-irregular | **6/6** | 0 |
| C1 | gerundio-apos-like | **0/6** | 0 |
| C1 | artigo-com-incontavel | **1/6** | 0 |
| C1 | plural-irregular | **6/6** | 0 |

**Taxa geral: 13/36 (36%)**

> ⚠️ Abaixo de 50%: o bot **nao corrige de forma confiavel** erro fora da lista em
> nivel alto. Isso e defeito de produto e merece tarefa propria — o T024 so mede.
> Conversa com o §4 do handoff ("o A1 corrige mal, ponto") e o estende: talvez nao
> seja so o A1, e talvez a variavel nao seja o nivel, e sim estar ou nao na lista.
