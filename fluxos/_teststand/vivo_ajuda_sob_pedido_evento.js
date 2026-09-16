// E014b AO VIVO — a rede de seguranca SOB PEDIDO no fluxo do evento publicado.
//
// O gate offline (`testa_idioma_niveis_evento.js`) so prova que a regra, com a precedencia
// UNIVERSAL, chega ao prompt. Se ela VENCE as outras regras que se declaram obrigatorias
// (IDIOMA "regra dura", AJUSTE DINAMICO, GESTO DE ASSINATURA, GANCHO...) so o modelo responde —
// este probe e o criterio real da E014b. NAO e gate: exige n8n, Postgres, LLM e o evento
// publicado, e e nao-deterministico.
//
// Roteiro, por aluno de teste novo:
//   A2, B1, B2, C1 — (1) frase em ingles  (2) "não entendi"  (3) frase normal em ingles
//     (2) tem de trazer apoio em portugues:
//         B2/C1 -> VEREDITO AUTOMATICO: portugues de verdade na resposta (o padrao do nivel e
//                  ingles integral). A continuidade do assunto fica para a leitura da transcricao.
//         A2/B1 -> SEM VEREDITO AUTOMATICO: LEITURA HUMANA OBRIGATORIA (ver `julgaAjuda`).
//     (3) tem de voltar ao ingles do nivel:
//         B2/C1 -> sem portugues e sem linha 🇧🇷;
//         A2/B1 -> corpo em ingles e a linha 🇧🇷 como ULTIMA linha (o formato normal).
//   CONTROLE B2 — "ok", "ok", "ok": nenhuma das tres respostas vira portugues. No terceiro turno
//     o AJUSTE DINAMICO chama o aluno de inseguro (short_streak=3); o probe EXIGE que isso tenha
//     acontecido de fato, senao o controle nao mediu o cenario de risco.
//
// Julga pelo `runData` (armadilha nº 3): a rota que o `Roteador Mestre` registrou tem de ser
// `conversa`, o texto e a saida do `Agente Conversa`, e o `Prompt Conversa <nivel>` executado tem de
// ter a clausula universal (se nao tiver, o fluxo no ar e o velho — nao republicaram).
// Resposta vazia NUNCA e aprovacao (armadilha nº 1). Turnos do mesmo aluno espacados em >=12 s
// (armadilha nº 7). Tudo vai para a transcricao `tr_ajuda_sob_pedido_evento*.md` (nome nunca
// sobrescreve evidencia — armadilha nº 22), gravada turno a turno.
//
// Saida:  1 = alguma falha automatica · 2 = parte automatica verde, MAS a leitura humana de A2/B1
//         esta pendente (nao e aprovacao — armadilha nº 24) · 0 = so quando nada ficou para ler.
//
// Escreve so em alunos de teste (faixa 990000000-999999999; `db/cleanup_test_users.js` apaga).
// Uso:  node fluxos/_teststand/vivo_ajuda_sob_pedido_evento.js
//       node fluxos/_teststand/vivo_ajuda_sob_pedido_evento.js --autoteste   (offline: so os detectores)

// ---------------- detectores (puros, testados em --autoteste) ----------------
const BANDEIRA = '🇧🇷';
// Palavras inequivocamente portuguesas. Fora da lista de proposito: "a", "do", "no", "me", "as",
// "so", "um", "on" — existem em ingles e inflariam a contagem numa resposta 100% inglesa.
const PT_PALAVRAS = new Set(('não nao que você voce isso isto está esta estou significa quer dizer para pra '
  + 'com uma dos das da em eu mas muito também tambem como sobre porque então entao seu sua mais '
  + 'pergunta ou ele ela gosta gosto jogos jogo entendeu entendi palavra frase exemplo tudo bem aqui '
  + 'quando onde qual quais por pelo pela ao aos nos nas meu minha ser ter fazer vamos vou tem são sao '
  + 'mesmo ainda bom legal amigos amigo seus suas assim depois antes já ja né tá eles elas foi era '
  + 'jogar joga trabalho quer queria sabe tipo coisa coisas melhor fala falar inglês ingles português portugues').split(/\s+/));
const PT_ACENTO = /[ãõçáéíóúâêôà]/i;
function palavras(t) { return String(t || '').toLowerCase().match(/[a-zà-ÿ']+/gi) || []; }
function contaPT(t) { return palavras(t).filter(w => PT_PALAVRAS.has(w) || PT_ACENTO.test(w)).length; }
function linhas(t) { return String(t || '').split('\n').map(l => l.trim()).filter(Boolean); }
function linhaBR(l) { return l.indexOf(BANDEIRA) === 0; }
function corpo(t) { return linhas(t).filter(l => !linhaBR(l)).join('\n'); }
function temBR(t) { return linhas(t).some(linhaBR); }
function ultimaBR(t) { const ls = linhas(t); return ls.length > 0 && linhaBR(ls[ls.length - 1]); }

// A2/B1 — o formato padrao desses niveis JA traz portugues (a linha 🇧🇷). Duas tentativas de
// veredito automatico reprovaram no verifier: "mais portugues" aprovava qualquer resposta mais
// longa (T1); marca de explicacao + sobreposicao de palavras ainda aprovava 3 de 14 saidas erradas
// (troca de assunto que reusa "friends") e reprovava 5 de 9 certas (T2). E a armadilha nº 29:
// reconhecer "explicou a mesma ideia" e linguagem natural, regex nao alcanca nas duas direcoes.
// Decisao (T3): em A2/B1 NAO ha veredito automatico sobre o socorro. O detector so produz SINAIS
// para orientar quem le — nunca aprova e nunca reprova, exceto resposta vazia.
const MARCA_EXPLICACAO = /quer\s+dizer|significa|eu\s+perguntei|perguntei\s+(?:se|que|qual|quais|o\s+que|sobre|como)|eu\s+disse|eu\s+falei|quis\s+dizer|ou\s+seja|em\s+outras\s+palavras|estou\s+perguntando/i;
const EN_VAZIAS = new Set(('what with your you that this have like about would there they them their when where which '
  + 'also really just some more most very much from into then than been were will sure cool nice okay great '
  + 'awesome yeah well good love kind sounds sound think know want does doing make tell asked question '
  + 'maybe other these those only even still here always usually often today weekend fun hello thanks').split(/\s+/));
function conteudoEN(t) {
  return new Set(palavras(corpo(t)).map(w => w.replace(/'s$/, '').replace(/s$/, ''))
    .filter(w => w.length >= 4 && !EN_VAZIAS.has(w) && !EN_VAZIAS.has(w + 's')));
}
const PERGUNTA_LEITURA = 'O socorro explica em portugues a MESMA ideia da resposta anterior (sem abrir pergunta nova nem trocar de assunto)?';

// { falhas: [...], sinais: [...], ler: bool }
//   falhas vazias + ler=false -> aprovado automaticamente (so B2/C1)
//   ler=true                  -> sem veredito: a transcricao decide (A2/B1)
function julgaAjuda(nivel, texto, textoBase) {
  const r = { falhas: [], sinais: [], ler: false };
  if (!String(texto || '').trim()) { r.falhas.push('resposta VAZIA (vazio nao e aprovacao)'); return r; }
  const n = contaPT(texto);
  if (nivel === 'B2' || nivel === 'C1') {
    const total = palavras(texto).length || 1;
    if (n < 4 || n / total < 0.3) r.falhas.push('sem apoio em portugues (' + n + ' palavras PT de ' + total + ')');
    return r;
  }
  r.ler = true;
  const nb = contaPT(textoBase);
  r.sinais.push('palavras PT: ' + n + ' no socorro x ' + nb + ' no turno anterior');
  r.sinais.push('marca de explicacao ("quer dizer", "eu perguntei"...): ' + (MARCA_EXPLICACAO.test(texto) ? 'sim' : 'nao'));
  const antes = conteudoEN(textoBase);
  const comuns = [...conteudoEN(texto)].filter(w => antes.has(w));
  r.sinais.push('palavras de conteudo em ingles repetidas da resposta anterior: ' + (comuns.join(', ') || 'nenhuma'));
  return r;
}
function julgaVolta(nivel, texto) {
  const p = [];
  if (!String(texto || '').trim()) return ['resposta VAZIA (vazio nao e aprovacao)'];
  const nc = contaPT(corpo(texto));
  if (nc > 2) p.push('o corpo continua em portugues (' + nc + ' palavras PT fora da linha ' + BANDEIRA + ')');
  if (nivel === 'B2' || nivel === 'C1') {
    if (temBR(texto)) p.push('linha ' + BANDEIRA + ' num nivel sem apoio padrao');
  } else if (!ultimaBR(texto)) p.push('a linha ' + BANDEIRA + ' nao e a ULTIMA (formato normal do nivel)');
  return p;
}
function julgaControle(texto) {
  const p = [];
  if (!String(texto || '').trim()) return ['resposta VAZIA (vazio nao e aprovacao)'];
  const n = contaPT(texto);
  if (n > 2) p.push('virou portugues (' + n + ' palavras PT)');
  if (temBR(texto)) p.push('ganhou linha ' + BANDEIRA + ' em B2');
  return p;
}

// bloco de LEITURA OBRIGATORIA da transcricao: o par inteiro, os sinais e a pergunta a responder
function blocoLeitura(nivel, uid, textoBase, texto, sinais) {
  const cita = (t) => String(t || '(VAZIO)').split('\n').map(l => '> ' + l).join('\n');
  return '\n### LER — ' + nivel + ' (uid ' + uid + ')\n\n'
    + '**Pergunta:** ' + PERGUNTA_LEITURA + '\n\n'
    + '**Resposta anterior do bot:**\n\n' + cita(textoBase) + '\n\n'
    + '**Aluno:** "não entendi"\n\n'
    + '**Socorro:**\n\n' + cita(texto) + '\n\n'
    + '**Sinais (nao sao veredito):**\n' + sinais.map(s => '- ' + s).join('\n') + '\n\n'
    + '**Veredito humano:** ☐ SIM · ☐ NAO\n';
}

function autoteste() {
  let f = 0;
  const t = (c, m) => { if (!c) { f++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
  const semVeredito = (r) => !!r && r.ler === true && Array.isArray(r.falhas) && r.falhas.length === 0;
  const aprovado = (r) => !!r && r.ler === false && Array.isArray(r.falhas) && r.falhas.length === 0;
  const EN_B2 = "Totally fair! Strategy games reward patience, and that's rare these days. Would you rather design a game or compete in one?";
  const PT_B2 = 'Sem problema! Eu perguntei se você prefere criar um jogo ou competir em um. É uma pergunta sobre o que você gosta mais de fazer.';
  const MISTO_B2 = 'No worries! I asked if you would rather create a game or compete. (Criar ou competir?)';
  const A2_BASE = "Cool! I like games too. What game do you play?\n🇧🇷 Legal! Eu também gosto de jogos. Que jogo você joga?";
  const A2_AJUDA = "Okay! I like games. What game do you play?\n🇧🇷 Tudo bem! Eu disse que gosto de jogos e perguntei qual jogo você joga. 'Play' quer dizer jogar.";
  const A2_IGUAL = "Sure! What game do you play?\n🇧🇷 Claro! Que jogo você joga?";
  const A2_PT_CORPO = "Tudo bem, vamos falar em português então. Qual jogo você joga?\n🇧🇷 Qual jogo você joga?";
  const A2_BR_NO_MEIO = "🇧🇷 Legal! Que jogo você joga?\nCool! What game do you play?";
  const A2_BASE_G = "Cool! What games do you play with your friends?\n🇧🇷 Legal! Que jogos você joga com seus amigos?";
  const B1_BASE_G = "That sounds fun! What kind of games do you play with your friends?\n🇧🇷 Que tipo de jogos você joga com seus amigos?";
  // saidas ERRADAS: as da T1 (pergunta nova, formato padrao) e a classe que enganou a T2 —
  // marca de explicacao + troca de assunto reusando "friends"
  const A2_ERRADA_T1 = "Nice! Do you also watch movies with your friends on the weekend?\n🇧🇷 Legal! Você também assiste filmes com seus amigos no fim de semana quando não está jogando?";
  const B1_ERRADA_T1 = "Nice! Do you also like watching movies with your friends when you are not playing?\n🇧🇷 Você também gosta de assistir filmes com seus amigos quando não está jogando?";
  const B1_ERRADA_T2 = "Sorry! I mean: do you go to the beach with your friends?\n🇧🇷 Desculpa! Quer dizer: você vai à praia com seus amigos?";
  // saidas CERTAS, inclusive com redacao que a T2 reprovava (sem marca da lista, sem palavra repetida)
  const A2_AJUDA_G = "No problem! I asked: what games do you play with your friends?\n🇧🇷 Sem problema! Eu perguntei que jogos você joga com seus amigos. 'Games' quer dizer jogos.";
  const B1_AJUDA_G = "No problem! I asked what kind of games you play with your friends.\n🇧🇷 Sem problema! Eu perguntei que tipo de jogos você joga com seus amigos — 'kind of' quer dizer 'tipo de'.";
  const B1_CERTA_SEM_MARCA = "Let me say it another way: which ones do you and your buddies enjoy most?\n🇧🇷 Vou falar de outro jeito: de quais jogos você e seus amigos mais gostam de jogar juntos?";

  // A2/B1 — NENHUMA saida recebe veredito automatico, certa ou errada (reprova as tentativas 1 e 2,
  // que devolviam lista vazia = aprovado para as certas e para parte das erradas)
  const casosA2B1 = [
    ['A2', A2_ERRADA_T1, A2_BASE_G, 'errada T1 (filmes)'], ['B1', B1_ERRADA_T1, B1_BASE_G, 'errada T1 (filmes)'],
    ['B1', B1_ERRADA_T2, B1_BASE_G, 'errada T2 (marca + praia reusando friends)'],
    ['A2', A2_IGUAL, A2_BASE, 'formato padrao'],
    ['A2', A2_AJUDA_G, A2_BASE_G, 'certa (games/friends)'], ['B1', B1_AJUDA_G, B1_BASE_G, 'certa (games/friends)'],
    ['B1', B1_CERTA_SEM_MARCA, B1_BASE_G, 'certa sem marca da lista'], ['A2', A2_AJUDA, A2_BASE, 'certa (reforco)'],
  ];
  for (const [nv, tx, base, rot] of casosA2B1) {
    const r = julgaAjuda(nv, tx, base);
    t(semVeredito(r), 'ajuda ' + nv + ' ' + rot + ': sem veredito automatico, vai para LEITURA');
    t(!aprovado(r), 'ajuda ' + nv + ' ' + rot + ': nunca aprovada automaticamente');
    t(r && Array.isArray(r.sinais) && r.sinais.length === 3, 'ajuda ' + nv + ' ' + rot + ': traz os tres sinais para quem le');
  }
  const vazioA2 = julgaAjuda('A2', '', A2_BASE_G);
  t(vazioA2.falhas.length > 0, 'ajuda A2: resposta vazia continua REPROVANDO (vazio nao vai para leitura)');
  t(!aprovado(julgaAjuda('B1', '   ', B1_BASE_G)), 'ajuda B1: so espacos nao e aprovado');
  // sinais descrevem o que viram (nao sao enfeite)
  const sE = julgaAjuda('B1', B1_ERRADA_T2, B1_BASE_G).sinais.join(' | ');
  t(/marca de explicacao[^|]*: sim/.test(sE) && /friend/.test(sE), 'sinais: marca e palavra reusada aparecem na saida enganosa da T2');
  const sC = julgaAjuda('B1', B1_CERTA_SEM_MARCA, B1_BASE_G).sinais.join(' | ');
  t(/marca de explicacao[^|]*: nao/.test(sC) && /repetidas[^|]*: nenhuma/.test(sC), 'sinais: ausencia de marca e de palavra repetida e dita, nao escondida');

  // B2/C1 — veredito automatico mantido
  t(julgaAjuda('B2', EN_B2).falhas.length > 0, 'ajuda B2: reprova resposta 100% em ingles');
  t(julgaAjuda('B2', '').falhas.length > 0, 'ajuda B2: reprova resposta vazia');
  t(julgaAjuda('C1', MISTO_B2).falhas.length > 0, 'ajuda C1: reprova ingles com um parentese de portugues');
  t(aprovado(julgaAjuda('B2', PT_B2)), 'ajuda B2: aprova resposta em portugues');
  t(aprovado(julgaAjuda('C1', PT_B2)), 'ajuda C1: aprova resposta em portugues');

  // transcricao de leitura: o par inteiro, a pergunta e os sinais
  const bl = blocoLeitura('B1', 990000001, B1_BASE_G, B1_ERRADA_T2, julgaAjuda('B1', B1_ERRADA_T2, B1_BASE_G).sinais);
  t(bl.includes('> Sorry! I mean') && bl.includes('> That sounds fun!') && bl.includes('> 🇧🇷 Desculpa!'), 'leitura: traz as duas respostas inteiras, linha 🇧🇷 inclusive');
  t(bl.includes(PERGUNTA_LEITURA) && /Veredito humano/.test(bl), 'leitura: traz a pergunta e o espaco do veredito humano');
  t(blocoLeitura('A2', 1, A2_BASE, '', []).includes('(VAZIO)'), 'leitura: vazio aparece como (VAZIO), nao como bloco em branco');

  // volta
  t(julgaVolta('B2', EN_B2).length === 0, 'volta B2: aprova ingles integral');
  t(julgaVolta('B2', PT_B2).length > 0, 'volta B2: reprova portugues permanente');
  t(julgaVolta('B2', EN_B2 + '\n🇧🇷 Você prefere criar ou competir?').length > 0, 'volta B2: reprova linha 🇧🇷');
  t(julgaVolta('C1', '').length > 0, 'volta C1: reprova vazio');
  t(julgaVolta('A2', A2_BASE).length === 0, 'volta A2: aprova o formato normal (corpo ingles + 🇧🇷 no fim)');
  t(julgaVolta('A2', A2_PT_CORPO).length > 0, 'volta A2: reprova corpo em portugues');
  t(julgaVolta('A2', A2_BR_NO_MEIO).length > 0, 'volta A2: reprova 🇧🇷 fora da ultima linha');
  // controle
  t(julgaControle(EN_B2).length === 0, 'controle B2: aprova ingles');
  t(julgaControle("No stress! Short answers are fine. Do you play solo or with friends?").length === 0, 'controle B2: aprova ingles simplificado (AJUSTE DINAMICO)');
  t(julgaControle(PT_B2).length > 0, 'controle B2: reprova portugues');
  t(julgaControle('').length > 0, 'controle B2: reprova vazio');
  // o contador nao pode inflar ingles comum
  t(contaPT("So, do you play on a team or as a solo player? Me neither, um, I'm not sure.") === 0,
    'contador PT: zero numa frase inglesa com "so", "do", "on", "as", "me", "um"');
  console.log('\n' + (f ? 'AUTOTESTE REPROVOU: ' + f : 'AUTOTESTE PASSOU: detectores nas duas direcoes, A2/B1 sem veredito automatico'));
  process.exit(f ? 1 : 0);
}
if (process.argv.includes('--autoteste')) autoteste();

// ---------------- probe ao vivo ----------------
process.env.IACHAT_TEST_PATH = 'iachat-test-evento';
const fs = require('fs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Client } = require('pg');
const { msg, digest, nodeOut, sleep } = require('./harness');
const { rotuloDe, transcricaoDe, caminhoLivre } = require('./alvo');

const ESPACO_MS = 13000;   // armadilha nº 7
const UNIVERSAL = /vence\s+TODAS\s+as\s+demais\s+regras\s+deste\s+prompt/i;
const BASE_UID = 990000000 + (Date.now() % 8000000);
const TR = caminhoLivre(transcricaoDe('tr_ajuda_sob_pedido', process.env.IACHAT_TEST_PATH), fs.existsSync, Date.now());

let fails = 0;
const leituras = [];
function tr(s) { fs.appendFileSync(TR, s + '\n'); }
function ok(cond, texto) {
  const l = (cond ? '  ✓ ' : '  ✗ ') + texto;
  if (!cond) fails++;
  console.log(l); tr('- ' + (cond ? '✓ ' : '✗ ') + texto);
}

async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}
async function semear(uid, nivel) {
  const profile = { persona: 'buddy', interests: ['🎮 Games'], inferred_interests: [], level: nivel };
  await db((c) => c.query(
    'INSERT INTO students (user_id,name,age,mode,onboarding,level,profile,msg_count,last_update_id,streak_count,last_active)'
    + " VALUES ($1,$2,$3,'chat','done',$4,$5::jsonb,3,1,1,$6)"
    + " ON CONFLICT (user_id) DO UPDATE SET name=$2,age=$3,mode='chat',level=$4,profile=$5::jsonb,updated_at=now()",
    [uid, 'Marina', 21, nivel, JSON.stringify(profile), new Date()]
  ));
}

// um turno de Conversa: devolve { texto, ctx } ou null, ja registrando as falhas de instrumento
async function turno(uid, nivel, rotulo, text) {
  const exec = await msg(uid, text);
  console.log('\n--- ' + nivel + ' · ' + rotulo + ' · aluno: ' + JSON.stringify(text));
  tr('\n#### ' + nivel + ' · ' + rotulo + ' · aluno: ' + JSON.stringify(text));
  if (!exec) { ok(false, nivel + ' ' + rotulo + ': a mensagem nao gerou execucao'); return null; }
  const d = digest(exec);
  const rd = exec.data && exec.data.resultData && exec.data.resultData.runData;
  const rot = nodeOut(rd, 'Roteador Mestre');
  const pc = nodeOut(rd, 'Prompt Conversa ' + nivel);
  const ag = nodeOut(rd, 'Agente Conversa');
  const texto = String((ag && ag.output) || '').trim();
  console.log('exec ' + d.id + ' · rota ' + (rot && rot.route) + '\n' + (texto || '(VAZIO)'));
  tr('\nexec ' + d.id + ' · rota ' + (rot && rot.route) + '\n\n' + (texto || '(VAZIO)').split('\n').map(l => '> ' + l).join('\n') + '\n');
  ok(!!rot && rot.route === 'conversa', nivel + ' ' + rotulo + ': o Roteador registrou a rota conversa (foi ' + JSON.stringify(rot && rot.route) + ')');
  ok(!!pc && UNIVERSAL.test(String(pc.systemMessage || '')),
     nivel + ' ' + rotulo + ': o Prompt Conversa ' + nivel + ' executado tem a precedencia universal (senao o fluxo no ar e o velho)');
  if (ag && ag.error) ok(false, nivel + ' ' + rotulo + ': Agente Conversa com erro no item: ' + JSON.stringify(ag.error).slice(0, 200));
  return { texto, ctx: nodeOut(rd, 'Contexto Conversa') };
}

(async () => {
  fs.writeFileSync(TR, '# Ajuda sob pedido (E014b) ao vivo — ' + rotuloDe(process.env.IACHAT_TEST_PATH)
    + ' — ' + new Date().toISOString() + '\n\n'
    + 'A2/B1 nao tem veredito automatico sobre o socorro: a secao **LEITURA OBRIGATORIA** no fim decide.\n');
  console.log('transcricao: ' + TR);
  const NIVEIS = ['A2', 'B1', 'B2', 'C1'];
  for (let i = 0; i < NIVEIS.length; i++) {
    const nivel = NIVEIS[i];
    const uid = BASE_UID + i;
    await semear(uid, nivel);
    console.log('\n===== ' + nivel + ' (uid ' + uid + ') =====');
    tr('\n## ' + nivel + ' (uid ' + uid + ')');
    const t1 = await turno(uid, nivel, 'turno 1', 'I usually play video games with my friends after work.');
    await sleep(ESPACO_MS);
    const t2 = await turno(uid, nivel, 'nao entendi', 'não entendi');
    await sleep(ESPACO_MS);
    const t3 = await turno(uid, nivel, 'turno seguinte', 'I think strategy games are the best ones.');
    if (!t1 || !t2 || !t3) { ok(false, nivel + ': roteiro incompleto — nao conta como aprovado (armadilha nº 24)'); continue; }
    const ja = julgaAjuda(nivel, t2.texto, t1.texto);
    if (ja.ler) {
      console.log('  ? ' + nivel + ': "não entendi" — SEM VEREDITO AUTOMATICO, LER A TRANSCRICAO\n    ' + ja.sinais.join('\n    '));
      tr('- ? ' + nivel + ': "não entendi" — LER A TRANSCRICAO (secao LEITURA OBRIGATORIA)');
      leituras.push(blocoLeitura(nivel, uid, t1.texto, t2.texto, ja.sinais));
    } else {
      ok(ja.falhas.length === 0, nivel + ': "não entendi" recebe apoio em portugues' + (ja.falhas.length ? ' (' + ja.falhas.join(' ; ') + ')' : ''));
    }
    const pv = julgaVolta(nivel, t3.texto);
    ok(pv.length === 0, nivel + ': o turno seguinte volta ao ingles do nivel' + (pv.length ? ' (' + pv.join(' ; ') + ')' : ''));
    if (i < NIVEIS.length - 1) await sleep(ESPACO_MS);
  }

  // CONTROLE: desinteresse nao e pedido de ajuda
  await sleep(ESPACO_MS);
  const uid = BASE_UID + NIVEIS.length;
  await semear(uid, 'B2');
  console.log('\n===== CONTROLE B2 "ok" x3 (uid ' + uid + ') =====');
  tr('\n## CONTROLE B2 "ok" x3 (uid ' + uid + ')');
  let ultimo = null;
  for (let k = 1; k <= 3; k++) {
    if (k > 1) await sleep(ESPACO_MS);
    const t = await turno(uid, 'B2', 'ok #' + k, 'ok');
    if (!t) { ok(false, 'controle: turno ok #' + k + ' sem execucao — nao conta como aprovado'); continue; }
    const pc = julgaControle(t.texto);
    ok(pc.length === 0, 'controle B2 ok #' + k + ': a resposta NAO vira portugues' + (pc.length ? ' (' + pc.join(' ; ') + ')' : ''));
    if (k === 3) ultimo = t;
  }
  ok(!!ultimo && !!ultimo.ctx && /inseguro/.test(String(ultimo.ctx.moodLine || '')),
     'controle B2 ok #3: o AJUSTE DINAMICO de aluno inseguro estava de fato no prompt (o cenario de risco foi montado)');

  if (leituras.length) tr('\n## LEITURA OBRIGATORIA\n' + leituras.join('\n'));
  let resumo, codigo;
  if (fails) { resumo = 'REPROVOU: ' + fails + ' falha(s)'; codigo = 1; }
  else if (leituras.length) {
    resumo = 'PARTE AUTOMATICA VERDE — NAO E APROVACAO: ' + leituras.length + ' socorro(s) de A2/B1 aguardam LEITURA HUMANA em ' + TR;
    codigo = 2;
  } else { resumo = 'PASSOU: ajuda sob pedido, volta ao ingles, e "ok" nao vira portugues'; codigo = 0; }
  tr('\n**Resumo:** ' + resumo);
  console.log('\n' + resumo);
  process.exit(codigo);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
