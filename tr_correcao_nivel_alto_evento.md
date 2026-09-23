# Correcao de erro FORA da lista, em nivel alto — evento

> Rodada: 2026-09-23T01:44:29.541Z · N=6 por probe e por nivel · niveis: A1, A2, B1
> Ingress: iachat-test-evento
>
> Regua ESTRITA (a mesma do C1): exige reparo explicito. O bot usar a forma
> certa na propria frase nao conta — foi essa frouxidao que saturou o
> detector do controle em 9/9 no T011.

### A1 · gerundio-apos-like — 4/6

entrada: `i like play video games` — e o erro exato que a jornada pegou em C1

    [corrigiu] Oh, that is cool! We say 'I like to play', not 'I like play'. What game do you play?  🇧🇷: Ah, que legal! A gente diz 'I like to play', não 'I like play'. Qual jogo você joga?
    [corrigiu] Oh, nice! We say 'I like to play' or 'I like playing' video games. What is your favorite video game?  🇧🇷: Ah, legal! A gente diz 'I like to play' ou 'I like playing' video games. Qual é o seu videog

### A1 · artigo-com-incontavel — 0/6

entrada: `i need a advice about my english` — artigo indefinido com substantivo incontavel

    [nao corrigiu] Oh, I understand! You need some advice about your English. I am here to help you. What do you want to know?  🇧🇷: Ah, eu entendo! Você precisa de um conselho sobre seu inglês. Eu estou aqui para te a
    [nao corrigiu] Oh, that's great! I can help you with that. What kind of advice do you need?  🇧🇷: Ah, que legal! Eu posso te ajudar com isso. Que tipo de conselho você precisa?

### A1 · plural-irregular — 6/6

entrada: `i saw many childrens at the park` — plural irregular, nada a ver com concordancia sujeito-verbo

    [corrigiu] Oh, nice! We say 'children', not 'childrens'. Do you like parks?  🇧🇷: Ah, que legal! A gente diz 'children', não 'childrens'. Você gosta de parques?
    [corrigiu] Oh, nice! We say 'children', not 'childrens'. Do you like to play at the park?  🇧🇷: Ah, que legal! A gente diz 'children', não 'childrens'. Você gosta de brincar no parque?

### A2 · gerundio-apos-like — 0/6

entrada: `i like play video games` — e o erro exato que a jornada pegou em C1

    [nao corrigiu] Oh, that's cool! I like 'to play' video games too. What kind of games do you like? 😊  🇧🇷: Ah, que legal! Eu também gosto de jogar videogame. Que tipo de jogos você gosta?
    [nao corrigiu] Oh, that's awesome! I like to play video games too. What kind of games do you like to play? 😊  🇧🇷: Ah, que legal! Eu gosto de jogar videogame também. Que tipo de jogos você gosta de jogar?

### A2 · artigo-com-incontavel — 0/6

entrada: `i need a advice about my english` — artigo indefinido com substantivo incontavel

    [nao corrigiu] Oh, that's great! I'm happy to help you. What kind of advice do you need? 😊  🇧🇷: Ah, que ótimo! Fico feliz em te ajudar. Que tipo de conselho você precisa?
    [nao corrigiu] Oh, that's cool! I can help you with that. What kind of advice do you need? 😊  🇧🇷: Ah, que legal! Eu posso te ajudar com isso. Que tipo de conselho você precisa?

### A2 · plural-irregular — 5/6

entrada: `i saw many childrens at the park` — plural irregular, nada a ver com concordancia sujeito-verbo

    [corrigiu] Oh, that's nice! I love seeing kids playing outside. We say 'many children', not 'many childrens'. What games did they play?  🇧🇷: Ah, que legal! Adoro ver crianças brincando lá fora. Nós dizemos 'ma
    [corrigiu] Oh, that's nice! I love seeing kids playing.  We say 'children', not 'childrens'. 'Children' is already plural. Did you see them playing games? 🇧🇷: Ah, que legal! Adoro ver crianças brincando.  Nós 

### B1 · gerundio-apos-like — 0/6

entrada: `i like play video games` — e o erro exato que a jornada pegou em C1

    [nao corrigiu] Oh, that's awesome! I love playing video games too. What kind of games do you usually play?  🇧🇷: Que tipo de jogos você costuma jogar?
    [nao corrigiu] Oh, that's awesome! I love playing video games too. What kind of games do you usually play? 😊  🇧🇷: Que tipo de jogos você costuma jogar?

### B1 · artigo-com-incontavel — 0/6

entrada: `i need a advice about my english` — artigo indefinido com substantivo incontavel

    [nao corrigiu] Oh, that's interesting! I'd love to help with that. What kind of advice are you looking for, Lucas? 😊  🇧🇷: Que tipo de conselho você está procurando, Lucas?
    [nao corrigiu] Oh, that's great you're asking! I'm happy to help. What kind of advice are you looking for, specifically about your English? 😊  🇧🇷: Que tipo de conselho você está procurando, especificamente sobre 

### B1 · plural-irregular — 0/6

entrada: `i saw many childrens at the park` — plural irregular, nada a ver com concordancia sujeito-verbo

    [nao corrigiu] Oh, that's nice! I love seeing kids playing outside. What were they doing?  🇧🇷: O que eles estavam fazendo?
    [nao corrigiu] Oh, that's cool! I love seeing kids playing outside. What were they doing at the park? 😊  🇧🇷: O que eles estavam fazendo no parque?

## Resumo

| nivel | probe | corrigiu | vazios |
|---|---|---|---|
| A1 | gerundio-apos-like | **4/6** | 0 |
| A1 | artigo-com-incontavel | **0/6** | 0 |
| A1 | plural-irregular | **6/6** | 0 |
| A2 | gerundio-apos-like | **0/6** | 0 |
| A2 | artigo-com-incontavel | **0/6** | 0 |
| A2 | plural-irregular | **5/6** | 0 |
| B1 | gerundio-apos-like | **0/6** | 0 |
| B1 | artigo-com-incontavel | **0/6** | 0 |
| B1 | plural-irregular | **0/6** | 0 |

**Taxa geral: 15/54 (28%)**

> ⚠️ Abaixo de 50%: o bot **nao corrige de forma confiavel** erro fora da lista em
> nivel alto. Isso e defeito de produto e merece tarefa propria — o T024 so mede.
> Conversa com o §4 do handoff ("o A1 corrige mal, ponto") e o estende: talvez nao
> seja so o A1, e talvez a variavel nao seja o nivel, e sim estar ou nao na lista.
