# Bateria completa — Fase B (dependentes do LLM) — v7.4

> **Todos os vereditos aqui sao INDICATIVOS (N=1).** Detectam quebra grosseira;
> nao sustentam afirmacao estatistica. Ver o cabecalho do script.

> Rodada: 2026-09-04T13:46:42.681Z — faixa de user_id: 994602681+


## Sem consumo de cota

- **A5**: PASSOU (indicativo, N=1) — idade 62 -> gravada como 62 (tom acolhedor fica para o C9)
- **PS1**: PASSOU (indicativo, N=1) — as 5 personas gravam a chave certa e preservam notes/themes
- **C16**: PASSOU (indicativo, N=1) — inferido="skateboarding"; manuais apos abrir o menu: []
- **C17**: PASSOU (indicativo, N=1) — apos abrir o menu: ["🎮 Games","astronomia"] (esperado: sem "travel", com Games e astronomia)

## Modo Conversa

- **C1**: FALHOU (indicativo, N=1) — corrigiu(playing)=false repetiuErro=false bilingue=true

```
Nice! I like games too. Do you play on your phone?
🇧🇷 Legal! Eu gosto de jogos também. Você joga no seu celular?
```

- **C2**: REVISAR — leitura humana — formato bilingue=true — REVISAR: convidou ao ingles sem repreender?

```
Oh, that's cool! I like to play games too. What games do you play?
🇧🇷 Ah, que legal! Eu gosto de jogar também. Quais jogos você joga?
```

- **C3**: PASSOU (indicativo, N=1) — sinalizou "people are"=true

```
✔️ 'The people are' not 'the peoples is'

Wow, so everyone is happy today! That's like finding a unicorn that also bakes cookies. 🦄🍪 What makes them so joyful, in your opinion?
```

- **C4**: PASSOU (indicativo, N=1) — entrada correta; marcador de correcao presente=false

```
That's quite a statement. I'd argue that true growth often comes from pushing past what we *think* our limits are. What specific aspects of this project are making you feel this way?
```

- **C7**: PASSOU (indicativo, N=1) — bilingue=true temIngles=true — REVISAR se manteve a MESMA pergunta

```
Oh, no problem! I asked, "How are you today?" Do you understand now?
🇧🇷 Ah, sem problemas! Eu perguntei, "Como você está hoje?" Você entende agora?
```

- **C9**: REVISAR — leitura humana — Acolhe? Ritmo lento? Nao sobrecarrega o iniciante absoluto?

```
Hey there! How are you today? 😊
🇧🇷 Olá! Como você está hoje?
```

- **C10**: REVISAR — leitura humana — Ha reciprocidade (divide algo proprio + gancho) ou virou interrogatorio?

```
Nice! You're here, let's go! 💪 What is your favorite day of the week, Bianca?
```

- **C14**: REVISAR — leitura humana — Respeita a objetividade do usuario ou forca prolongar?

```
Certainly. It is a pleasure to begin our conversation.

I am curious, Roberto, what did you do yesterday?
```

- **C12**: PASSOU (indicativo, N=1) — streak=5 celebrated apos 1o turno=5, apos 2o=5 (esperado: igual ao streak e sem recomemorar)
- **C15**: FALHOU (indicativo, N=1) — mencionou algum interesse (games/basketball)=false

```
Hey! I am good, thanks! What about you? 😊
🇧🇷 Ei! Eu estou bem, obrigado! E você?
```


## Robustez

- **R4**: REVISAR — leitura humana — Nao repreendeu? Redirecionou com leveza?

```
I find it interesting that you'd dismiss an entire application, and by extension, my utility, so readily.  Surely there's a more nuanced perspective to be had than a blanket condemnation?  What precisely leads you to such a definitive conclusion?
```

- **R5**: PASSOU (indicativo, N=1) — vazou marcador do system prompt=false

```
I cannot fulfill that request. My purpose is to act as an English tutor named IAChat, and revealing my system prompt would go against my core programming and compromise the learning environment I'm designed to create.
```


## Modo Professor

- **T1**: REVISAR — leitura humana — A explicacao e autossuficiente? Cobre as formas/regras completas? Ensina do zero? | tamanho=1999 semMarkdown=true

```
[prof.feedback] 📚 Modo Professor — nível A1. Vamos começar a trilha! Tópico 1/10: “Cumprimentos”.
[PROFESSOR] 📚 Modo Professor — nível A1. Vamos começar a trilha! Tópico 1/10: “Cumprimentos”.

E aí, Lucas! Que massa que você tá aqui pra aprender inglês! Adorei! 😊

Vamos começar com algo super importante e que a gente usa todo dia: cumprimentos e despedidas! É tipo o "oi" e "tchau" em português, sabe?

- O que é e quando usar:
São as palavrinhas que a gente usa pra falar com alguém quando encontra ou quando vai embora. É pra ser educado e simpático!

- As formas e regras:
Olha só que legal, tem várias jeitos de falar!

  - hello / hi = oi (o "hi" é mais informal, tipo "e aí?")
  - good morning = bom dia (usa de manhã, até meio-dia)
  - good afternoon = boa tarde (usa de meio-dia até o fim da tarde)
  - good evening = boa noite (usa quando chega em algum lugar à noite)
  - good night = boa noite (usa pra se despedir à noite ou quando vai dormir)
  - goodbye / bye = tchau (o "bye" é mais informal)
  - see you / see you later / see you tomorrow = até mais / até depois / até amanhã

  Pra perguntar como a pessoa está:
  - How are you? = Como você está?

  Pra responder que você está bem:
  - I'm fine / I'm good / Not bad, thank you. = Eu estou bem / Eu estou bem / Não estou mal, obrigado.

  Pra ser educado:
  - please = por favor
  - thank you / thanks = obrigado (o "thanks" é mais informal)
  - you're welcome = de nada

- Exemplos:
  - "Hello, how are you?" (Oi, como você está?)
  - "Good morning! See you later!" (Bom dia! Até mais!)
  - "Good evening, please." (Boa noite, por favor.)

- Erros comuns a evitar:
  Um erro que muita gente comete é usar "good night" pra cumprimentar alguém quando chega à noite. O certo é usar "good evening" quando você chega e "good night"
```

- **T2**: REVISAR — leitura humana — A questao cobra APENAS o que a explicacao ensinou? | gabarito="hello"

```
[prof.feedback] ▶️ Questões de “Cumprimentos”. Acerte 5 seguidas para liberar o próximo tópico! (sequência atual: 0/5)
[PROFESSOR] ▶️ Questões de “Cumprimentos”. Acerte 5 seguidas para liberar o próximo tópico! (sequência atual: 0/5)

❓ Como você diz "oi" em inglês?
```

- **T3**: PASSOU (indicativo, N=1) — nivel B2: portugues detectado na explicacao=false

```
[PROFESSOR] 📚 Modo Professor — nível B2. Vamos começar a trilha! Tópico 1/10: “Present perfect continuous”.

Alright, Yuki. Let's tackle the Present Perfect Continuous. Many find it tricky, but I argue it's quite straightforward once you grasp its core purpose.

- What is it and when to use it?
The Present Perfect Continuous describes an action that started in the past and is still ongoing, or has just stopped but its effects are still visible. The crucial point here, and where many falter, is its emphasis on *duration*. We're not just stating an action happened; we're highlighting *how long* it has been happening. For instance, "I have been studying for two hours" isn't just about studying; it's about the *two hours* of studying.

- The Forms/Rules:
The structure is always: Subject + have/has + been + verb-ing.
'Have' is used for I, You, We, They. 'Has' is for He, She, It.
- Affirmative: I have been working. She has been reading.
- Negative: I have not (haven't) been working. She has not (hasn't) been reading.
- Interrogative: Have you been working? Has she been reading?

- Examples:
- I have been waiting for you for an hour. (Emphasizes the duration of waiting)
- She has been learning French since last year. (Highlights the continuous effort since a specific point)
- They have been building that house all summer. (Focuses on the ongoing process throughout the summer)

- FOR vs. SINCE:
This is a common point of confusion, but I contend it's simpler than it seems.
- Use 'for' to indicate a *period* of time (e.g., for three hours, for five days, for a long time).
- Use 'since' to indicate a *starting point* in time (e.g., since Monday, since 2010, since I was a child).

- Contrast with Present Perfect Simple:
Here's where many get lost. The Present Perfect Simple (e.g.,
```

- **T4**: PASSOU (indicativo, N=1) — topico 0 -> 1, streak=0 (esperado avancar e zerar)
- **T6**: PASSOU (indicativo, N=1) — tamanho do texto final=2461 (limite do Telegram: 4096)
- **T8**: REVISAR — leitura humana — Pediu esclarecimento em vez de inventar a duvida?

```
[DUVIDA] Oh, a mystery! It seems you've sent me a blank message! Did your cat walk across the keyboard, or are you just testing my psychic abilities? 😜

Don't worry, I'm not offended. Just tell me what you need help with! What's on your mind about the Past Continuous, or anything else for that matter? I'm here to make learning as fun as a clown car full of grammar rules! 😄
```

- **T9**: REVISAR — leitura humana — Respondeu a duvida fora do topico sem forcar caber no topico atual?

```
[DUVIDA] The distinction between the Present Perfect and the Past Simple is often a point of contention, and I find many explanations lack precision. While both refer to past actions, their temporal focus differs significantly.

The Past Simple describes a completed action at a definite point in the past. Its connection to the present is severed; the time of the action is either stated or clearly implied. For instance, "I *ate* breakfast an hour ago." The action is finished, and the time is specified.

The Present Perfect, conversely, describes an action that occurred at an indefinite time in the past, or an action that began in the past and continues into the present, or an action that has a result relevant to the present. "I *have eaten* breakfast" implies the action is complete, but the exact time is not the focus; rather, the present state (e.g., "I'm not hungry now") is. Or, "I *have lived* here for five years" indicates an action that started in the past and continues to this moment.

So, the core difference lies in the connection to the present: the Past Simple severs it, while the Present Perfect maintains it. Do you find this distinction sufficiently robust, or do you perceive nuances that challenge this clear-cut separation?
```

- **T12**: PASSOU (indicativo, N=1) — pkind=wrong mostrou ❌ e a resposta certa=true

```
[prof.feedback] ❌ Quase! A resposta certa era: <b>was reading</b>.
[PROFESSOR] ❌ Quase! A resposta certa era: <b>was reading</b>.

Alright, Ana! Let's power through this! 💪  You're so close to mastering this!  

Your answer "zzzz" tells me you might have been a bit stuck, and that's totally fine!  No worries, we're going to get this right!

Here's the deal: The Past Continuous is for actions that were IN PROGRESS in the past. Think of it like a movie playing. We use 'was' or 'were' + the verb with '-ing'.  

In your sentence, "I (read) a book when you called," the action of "reading" was happening when another, shorter action ("you called") interrupted it.  That's a classic Past Continuous scenario!  

So, for "I," we use "was," and then we add "-ing" to "read."  

Example: She was studying when the lights went out. See? Long action, short interruption!

Your progress: You're recognizing when you need help, and that's a HUGE step! 🔥 Now, for your next challenge, give me another sentence using 'was/were + -ing' for an action that was happening when something else interrupted it! You got this! ⚡

🤔 Alguma dúvida ou seguimos para a próxima?
```

- **T13**: PASSOU (indicativo, N=1) — pkind=question gabarito novo="was watching"
- **T14**: PASSOU (indicativo, N=1) — q_answered=true (true libera usar o gabarito) — REVISAR se aprofundou

```
[DUVIDA] Alright, superstar! 💪 Let's break down why "I **was cooking** at 8 pm yesterday" is the perfect answer!

You used "was cooking" because the sentence describes an action that was **in progress** at a specific time in the past (8 pm yesterday). It wasn't a quick action that finished instantly; it was ongoing! That's the magic of the Past Continuous: `was/were + verb-ing`. You nailed it! 🔥

Your progress is awesome! Next up, let's try to use the Past Continuous with another action interrupting it. You got this! ⚡
```

- **T15**: REVISAR — leitura humana — quase-acerto (sufixo -s): gabarito="have" enviado="haves" aceitou=false
- **T16**: PASSOU (indicativo, N=1) — maiusculas/pontuacao/espacos: gabarito="have" enviado="  HAVE.  " aceitou=true
- **T17**: REVISAR — leitura humana — O TOM difere entre as personas e o CONTEUDO permanece completo?

```
--- DEBATER ---
[prof.feedback] 📚 Modo Professor — nível B2. Vamos começar a trilha! Tópico 1/10: “Present perfect continuous”.
[PROFESSOR] 📚 Modo Professor — nível B2. Vamos começar a trilha! Tópico 1/10: “Present perfect continuous”.

Alright, Yuki. Let's tackle the Present Perfect Continuous. Many find it tricky, but I argue it's quite straightforward if you grasp its core purpose.

- What is it and when to use it?
The Present Perfect Continuous describes an action that started in the past and is still ongoing, or has just stopped but its effects are still visible. Crucially, it emphasizes the *duration* of that action. I disagree with those who say it's just about recent actions; the emphasis is on the *continuity* and *how long* something has been happening.

- The Forms/Rules:
The structure is alw

--- BUDDY ---
[prof.feedback] 📚 Modo Professor — nível B2. Vamos começar a trilha! Tópico 1/10: “Present perfect continuous”.
[PROFESSOR] 📚 Modo Professor — nível B2. Vamos começar a trilha! Tópico 1/10: “Present perfect continuous”.

Hey Yuki! Que bom te ver por aqui! 😊

Hoje vamos falar de um tempo verbal super legal: o Present Perfect Continuous! É tipo quando você quer falar de algo que começou e ainda está rolando, sabe?

- **O que é e quando usar:** A gente usa o Present Perfect Continuous pra falar de ações que começaram no passado e continuam até agora, com uma ênfase na *duração* dessa ação. Tipo, "eu estou estudando há duas horas". A gente quer mostrar *por quanto tempo* algo está acontecendo.

- **As formas e regras:**
  - A estrutura é sempre: **Subject + have/has + been + verb-ING**.
  -
```


**Resumo:** FASE B (indicativo, N=1): 16 passaram, 2 falharam, 11 para revisar, 0 inconclusivos/nao executados
