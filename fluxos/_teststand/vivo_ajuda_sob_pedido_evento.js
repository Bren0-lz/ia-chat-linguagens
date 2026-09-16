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
//         B2/C1 -> portugues de verdade na resposta (o padrao do nivel e ingles integral);
//         A2/B1 -> MAIS portugues que no turno (1), que ja tem a linha 🇧🇷 por padrao, E uma marca
//                  de EXPLICACAO ("quer dizer", "eu perguntei"...) E continuidade do assunto da
//                  resposta anterior (heuristicas declaradas junto de `julgaAjuda`).
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
// (armadilha nº 7). Imprime todas as respostas: abra a transcricao antes de reportar (nº 9).
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

// A2/B1 — o formato padrao desses niveis JA traz portugues (a linha 🇧🇷), entao "mais portugues"
// sozinho aprova qualquer resposta mais longa (tentativa 1, reprovada pelo verifier). O socorro
// tem de mostrar duas coisas que o formato normal NAO produz — HEURISTICA declarada, nao
// reconhecimento de toda parafrase (o erro que bloqueou a E014); a transcricao e lida por humano:
//   (a) MARCA DE EXPLICACAO: uma lista curta e fechada de expressoes de quem explica o que disse,
//       e nao so traduz ("quer dizer", "significa", "eu perguntei", "eu disse", "quis dizer",
//       "ou seja", "em outras palavras", "estou perguntando"). Explicacao com outra redacao
//       reprova aqui — falso vermelho possivel, e a transcricao decide.
//   (b) CONTINUIDADE: a regra manda repetir a MESMA ideia do turno anterior, sem trocar de assunto.
//       Mede-se por palavras de conteudo (>=4 letras, fora da lista de palavras vazias, plural
//       reduzido) do corpo em INGLES da resposta anterior do bot que reaparecem no corpo em INGLES
//       do socorro: exige ao menos UMA. Fraca por construcao (pergunta nova que reusa "friends"
//       passa) — por isso vem junto com (a), e nao sozinha.
// B2/C1 — (a) NAO se aplica: repetir a mesma ideia em portugues claro, sem "quer dizer", e socorro
// valido pela regra. (b) NAO cabe sem criterio fragil: a resposta anterior esta em ingles e o
// socorro em portugues, e casar assunto entre idiomas exigiria dicionario. Declarado: em B2/C1 a
// continuidade fica para a leitura humana da transcricao.
const MARCA_EXPLICACAO = /quer\s+dizer|significa|eu\s+perguntei|perguntei\s+(?:se|que|qual|quais|o\s+que|sobre|como)|eu\s+disse|eu\s+falei|quis\s+dizer|ou\s+seja|em\s+outras\s+palavras|estou\s+perguntando/i;
const EN_VAZIAS = new Set(('what with your you that this have like about would there they them their when where which '
  + 'also really just some more most very much from into then than been were will sure cool nice okay great '
  + 'awesome yeah well good love kind sounds sound think know want does doing make tell asked question '
  + 'maybe other these those only even still here always usually often today weekend fun hello thanks').split(/\s+/));
function conteudoEN(t) {
  return new Set(palavras(corpo(t)).map(w => w.replace(/'s$/, '').replace(/s$/, ''))
    .filter(w => w.length >= 4 && !EN_VAZIAS.has(w) && !EN_VAZIAS.has(w + 's')));
}

// devolve a lista do que falhou; vazio = aprovado
function julgaAjuda(nivel, texto, textoBase) {
  const p = [];
  if (!String(texto || '').trim()) return ['resposta VAZIA (vazio nao e aprovacao)'];
  const n = contaPT(texto);
  if (nivel === 'B2' || nivel === 'C1') {
    const total = palavras(texto).length || 1;
    if (n < 4 || n / total < 0.3) p.push('sem apoio em portugues (' + n + ' palavras PT de ' + total + ')');
  } else {
    if (n < 4) p.push('sem apoio em portugues (' + n + ' palavras PT)');
    const nb = contaPT(textoBase);
    if (!(n > nb)) p.push('nao ha MAIS portugues que no turno padrao (' + n + ' <= ' + nb + ')');
    if (!MARCA_EXPLICACAO.test(texto)) p.push('sem marca de EXPLICACAO ("quer dizer", "eu perguntei"...): parece so o formato padrao');
    const antes = conteudoEN(textoBase), agora = conteudoEN(texto);
    const comuns = [...agora].filter(w => antes.has(w));
    if (comuns.length < 1) p.push('trocou de assunto: nenhuma palavra de conteudo da resposta anterior (' + [...antes].join(',') + ') reaparece no ingles do socorro');
  }
  return p;
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

function autoteste() {
  let f = 0;
  const t = (c, m) => { if (!c) { f++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
  const EN_B2 = "Totally fair! Strategy games reward patience, and that's rare these days. Would you rather design a game or compete in one?";
  const PT_B2 = 'Sem problema! Eu perguntei se você prefere criar um jogo ou competir em um. É uma pergunta sobre o que você gosta mais de fazer.';
  const MISTO_B2 = 'No worries! I asked if you would rather create a game or compete. (Criar ou competir?)';
  const A2_BASE = "Cool! I like games too. What game do you play?\n🇧🇷 Legal! Eu também gosto de jogos. Que jogo você joga?";
  const A2_AJUDA = "Okay! I like games. What game do you play?\n🇧🇷 Tudo bem! Eu disse que gosto de jogos e perguntei qual jogo você joga. 'Play' quer dizer jogar.";
  const A2_IGUAL = "Sure! What game do you play?\n🇧🇷 Claro! Que jogo você joga?";
  const A2_PT_CORPO = "Tudo bem, vamos falar em português então. Qual jogo você joga?\n🇧🇷 Qual jogo você joga?";
  const A2_BR_NO_MEIO = "🇧🇷 Legal! Que jogo você joga?\nCool! What game do you play?";
  // ajuda — direcao que tem de REPROVAR
  t(julgaAjuda('B2', EN_B2).length > 0, 'ajuda B2: reprova resposta 100% em ingles');
  t(julgaAjuda('B2', '').length > 0, 'ajuda B2: reprova resposta vazia');
  t(julgaAjuda('C1', MISTO_B2).length > 0, 'ajuda C1: reprova ingles com um parentese de portugues');
  t(julgaAjuda('A2', A2_IGUAL, A2_BASE).length > 0, 'ajuda A2: reprova o formato padrao (nao mais portugues que o turno 1)');
  t(julgaAjuda('A2', '', A2_BASE).length > 0, 'ajuda A2: reprova resposta vazia');
  // As duas saidas erradas que o verifier achou (tentativa 1): ignoram o "nao entendi", abrem pergunta
  // nova e so estao no formato padrao um pouco mais longo. O detector v1 aprovava as duas.
  const A2_BASE_G = "Cool! What games do you play with your friends?\n🇧🇷 Legal! Que jogos você joga com seus amigos?";
  const A2_ERRADA_VERIFIER = "Nice! Do you also watch movies with your friends on the weekend?\n🇧🇷 Legal! Você também assiste filmes com seus amigos no fim de semana quando não está jogando?";
  const B1_BASE_G = "That sounds fun! What kind of games do you play with your friends?\n🇧🇷 Que tipo de jogos você joga com seus amigos?";
  const B1_ERRADA_VERIFIER = "Nice! Do you also like watching movies with your friends when you are not playing?\n🇧🇷 Você também gosta de assistir filmes com seus amigos quando não está jogando?";
  const B1_MARCA_MAS_TROCOU = "Sorry! I asked about movies. Do you watch movies at home?\n🇧🇷 Desculpa! Eu perguntei sobre filmes: você assiste filmes em casa? Quer dizer, você vê filmes em casa com seus amigos?";
  const A2_AJUDA_G = "No problem! I asked: what games do you play with your friends?\n🇧🇷 Sem problema! Eu perguntei que jogos você joga com seus amigos. 'Games' quer dizer jogos.";
  const B1_AJUDA_G = "No problem! I asked what kind of games you play with your friends.\n🇧🇷 Sem problema! Eu perguntei que tipo de jogos você joga com seus amigos — 'kind of' quer dizer 'tipo de'.";
  t(julgaAjuda('A2', A2_ERRADA_VERIFIER, A2_BASE_G).length > 0, 'ajuda A2: reprova a saida errada do verifier (ignora o pedido, pergunta nova sobre filmes)');
  t(julgaAjuda('B1', B1_ERRADA_VERIFIER, B1_BASE_G).length > 0, 'ajuda B1: reprova a saida errada do verifier (pergunta nova, traducao normal)');
  t(julgaAjuda('B1', B1_MARCA_MAS_TROCOU, B1_BASE_G).length > 0, 'ajuda B1: reprova marca de explicacao com TROCA de assunto (a continuidade tem dente proprio)');
  // ajuda — direcao que tem de APROVAR
  t(julgaAjuda('A2', A2_AJUDA_G, A2_BASE_G).length === 0, 'ajuda A2: aprova socorro certo (explica e retoma games/friends)');
  t(julgaAjuda('B1', B1_AJUDA_G, B1_BASE_G).length === 0, 'ajuda B1: aprova socorro certo (explica e retoma games/friends)');
  t(julgaAjuda('B2', PT_B2).length === 0, 'ajuda B2: aprova resposta em portugues');
  t(julgaAjuda('A2', A2_AJUDA, A2_BASE).length === 0, 'ajuda A2: aprova reforco em portugues maior que o padrao');
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
  console.log('\n' + (f ? 'AUTOTESTE REPROVOU: ' + f : 'AUTOTESTE PASSOU: detectores nas duas direcoes'));
  process.exit(f ? 1 : 0);
}
if (process.argv.includes('--autoteste')) autoteste();

// ---------------- probe ao vivo ----------------
process.env.IACHAT_TEST_PATH = 'iachat-test-evento';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Client } = require('pg');
const { msg, digest, nodeOut, sleep } = require('./harness');

const ESPACO_MS = 13000;   // armadilha nº 7
const UNIVERSAL = /vence\s+TODAS\s+as\s+demais\s+regras\s+deste\s+prompt/i;
const BASE_UID = 990000000 + (Date.now() % 8000000);

let fails = 0;
function ok(cond, texto) { if (!cond) { fails++; console.log('  ✗ ' + texto); } else console.log('  ✓ ' + texto); }

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
  if (!exec) { ok(false, nivel + ' ' + rotulo + ': a mensagem nao gerou execucao'); return null; }
  const d = digest(exec);
  const rd = exec.data && exec.data.resultData && exec.data.resultData.runData;
  const rot = nodeOut(rd, 'Roteador Mestre');
  const pc = nodeOut(rd, 'Prompt Conversa ' + nivel);
  const ag = nodeOut(rd, 'Agente Conversa');
  const texto = String((ag && ag.output) || '').trim();
  console.log('exec ' + d.id + ' · rota ' + (rot && rot.route) + '\n' + (texto || '(VAZIO)'));
  ok(!!rot && rot.route === 'conversa', nivel + ' ' + rotulo + ': o Roteador registrou a rota conversa (foi ' + JSON.stringify(rot && rot.route) + ')');
  ok(!!pc && UNIVERSAL.test(String(pc.systemMessage || '')),
     nivel + ' ' + rotulo + ': o Prompt Conversa ' + nivel + ' executado tem a precedencia universal (senao o fluxo no ar e o velho)');
  if (ag && ag.error) ok(false, nivel + ' ' + rotulo + ': Agente Conversa com erro no item: ' + JSON.stringify(ag.error).slice(0, 200));
  return { texto, ctx: nodeOut(rd, 'Contexto Conversa') };
}

(async () => {
  const NIVEIS = ['A2', 'B1', 'B2', 'C1'];
  for (let i = 0; i < NIVEIS.length; i++) {
    const nivel = NIVEIS[i];
    const uid = BASE_UID + i;
    await semear(uid, nivel);
    console.log('\n===== ' + nivel + ' (uid ' + uid + ') =====');
    const t1 = await turno(uid, nivel, 'turno 1', 'I usually play video games with my friends after work.');
    await sleep(ESPACO_MS);
    const t2 = await turno(uid, nivel, 'nao entendi', 'não entendi');
    await sleep(ESPACO_MS);
    const t3 = await turno(uid, nivel, 'turno seguinte', 'I think strategy games are the best ones.');
    if (!t1 || !t2 || !t3) { ok(false, nivel + ': roteiro incompleto — nao conta como aprovado (armadilha nº 24)'); continue; }
    const pa = julgaAjuda(nivel, t2.texto, t1.texto);
    ok(pa.length === 0, nivel + ': "não entendi" recebe apoio em portugues' + (pa.length ? ' (' + pa.join(' ; ') + ')' : ''));
    const pv = julgaVolta(nivel, t3.texto);
    ok(pv.length === 0, nivel + ': o turno seguinte volta ao ingles do nivel' + (pv.length ? ' (' + pv.join(' ; ') + ')' : ''));
    if (i < NIVEIS.length - 1) await sleep(ESPACO_MS);
  }

  // CONTROLE: desinteresse nao e pedido de ajuda
  await sleep(ESPACO_MS);
  const uid = BASE_UID + NIVEIS.length;
  await semear(uid, 'B2');
  console.log('\n===== CONTROLE B2 "ok" x3 (uid ' + uid + ') =====');
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

  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)'
                            : 'PASSOU: ajuda sob pedido em A2/B1/B2/C1, volta ao ingles, e "ok" nao vira portugues'));
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
