# Correcao de erro FORA da lista, em nivel alto — evento

> Rodada: 2026-09-23T02:00:58.507Z · N=6 por probe e por nivel · niveis: B1
> Ingress: iachat-test-evento
>
> Regua ESTRITA (a mesma do C1): exige reparo explicito. O bot usar a forma
> certa na propria frase nao conta — foi essa frouxidao que saturou o
> detector do controle em 9/9 no T011.

### B1 · gerundio-apos-like — 0/6

entrada: `i like play video games` — e o erro exato que a jornada pegou em C1

    [nao corrigiu] Oh, that's awesome! I love games too! What kind of video games do you like to play?  🇧🇷: Que tipo de videogame você gosta de jogar?
    [nao corrigiu] Oh, that's awesome! I love playing video games too. What kind of games do you usually play? 😊  🇧🇷: Que tipo de jogos você costuma jogar?

### B1 · artigo-com-incontavel — 0/6

entrada: `i need a advice about my english` — artigo indefinido com substantivo incontavel

    [nao corrigiu] Hey Lucas! That's awesome you're looking for advice. I'm happy to help! What kind of advice do you need? 😊  🇧🇷: Que tipo de conselho você precisa?
    [nao corrigiu] Oh, that's a great idea! I'm happy to help with that. What kind of advice are you looking for? 😊  🇧🇷: Que tipo de conselho você está procurando?

### B1 · plural-irregular — 5/6

entrada: `i saw many childrens at the park` — plural irregular, nada a ver com concordancia sujeito-verbo

    [corrigiu] Oh, that's nice! I hope they were having fun. We say 'many children', not 'many childrens'. What kind of games do you think they were playing?  🇧🇷: Que tipo de jogos você acha que eles estavam jogan
    [nao corrigiu] Oh, that's cool! I love seeing kids playing outside. What were they doing at the park? 😊  🇧🇷: O que eles estavam fazendo no parque?

## Resumo

| nivel | probe | corrigiu | vazios |
|---|---|---|---|
| B1 | gerundio-apos-like | **0/6** | 0 |
| B1 | artigo-com-incontavel | **0/6** | 0 |
| B1 | plural-irregular | **5/6** | 0 |

**Taxa geral: 5/18 (28%)**

> ⚠️ Abaixo de 50%: o bot **nao corrige de forma confiavel** erro fora da lista em
> nivel alto. Isso e defeito de produto e merece tarefa propria — o T024 so mede.
> Conversa com o §4 do handoff ("o A1 corrige mal, ponto") e o estende: talvez nao
> seja so o A1, e talvez a variavel nao seja o nivel, e sim estar ou nao na lista.
