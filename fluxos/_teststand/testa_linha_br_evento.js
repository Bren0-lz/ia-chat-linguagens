// E016 — a linha traduzida chega ao aluno como "inglês / linha em branco / 🇧🇷: tradução".
//
// Pedido do Breno (16/09, conta real em A1): a traducao vinha COLADA ao ingles (mesma linha ou
// quebra simples). O formato:
//
//     mensagem em ingles...
//
//     🇧🇷: mensagem traduzida...
//
// Duas camadas, medidas separadas:
//   1. DETERMINISTICA (§5.4): o `Dividir Resposta` — ultimo no antes do Telegram na rota conversa —
//      executado sobre saidas REAIS do modelo (execs 4585, 4587 e a linha de base de 16/09) tem de
//      entregar o formato, venha o modelo como vier; resposta sem 🇧🇷 (B2+) sai intacta.
//   2. PROMPT: os exemplos "Formato EXATO" de A1/A2/B1 mostram o formato novo, com quebra REAL
//      (o A1 tinha `\\n` literal), para o modelo ja nascer certo.
// Roda offline, sem n8n. Uso: node fluxos/_teststand/testa_linha_br_evento.js [fluxo.json]
const fs = require('fs');
const path = require('path');
const FLOW = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_evento.json');
const flow = JSON.parse(fs.readFileSync(FLOW, 'utf8'));
const node = (n) => flow.nodes.find(x => x.name === n);

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); }

function dividir(output) {
  const code = node('Dividir Resposta').parameters.jsCode;
  const $input = { first: () => ({ json: { output } }) };
  const out = new Function('$input', code)($input);
  return out.map(i => i.json.messageText).join('');
}
const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const B = '🇧🇷';
console.log('1. Dividir Resposta normaliza a linha traduzida');
const CASOS = [
  ['real 4585: traducao na MESMA linha',
    "No problem! I asked if you played a game today. Did you play a game today? 🇧🇷 Sem problemas! Eu perguntei se você jogou algum jogo hoje. Você jogou algum jogo hoje?",
    "No problem! I asked if you played a game today. Did you play a game today?\n\n🇧🇷: Sem problemas! Eu perguntei se você jogou algum jogo hoje. Você jogou algum jogo hoje?"],
  ['real 4587: mesma linha, emojis antes da bandeira',
    "Nice! We say 'I play', not 'I plays'. What game did you play? 🎮🤣 🇧🇷 Legal! A gente diz 'I play', não 'I plays'. Que jogo você jogou?",
    "Nice! We say 'I play', not 'I plays'. What game did you play? 🎮🤣\n\n🇧🇷: Legal! A gente diz 'I play', não 'I plays'. Que jogo você jogou?"],
  ['linha de base 4617: quebra simples, sem dois-pontos',
    "That's awesome! What games do you like to play? 🎮🤣\n🇧🇷 Que legal! Que jogos você gosta de jogar?",
    "That's awesome! What games do you like to play? 🎮🤣\n\n🇧🇷: Que legal! Que jogos você gosta de jogar?"],
  ['ja com dois-pontos e sem linha em branco',
    "Cool!\n🇧🇷: Legal!", "Cool!\n\n🇧🇷: Legal!"],
  ['ja no formato: sai igual',
    "Cool!\n\n🇧🇷: Legal!", "Cool!\n\n🇧🇷: Legal!"],
  ['linhas em branco demais e espacos',
    "Cool!  \n\n\n\n🇧🇷  :   Legal!  ", "Cool!\n\n🇧🇷: Legal!"],
  ['ingles em varias linhas preserva as quebras internas',
    "Nice!\nWhat do you play?\n🇧🇷 Legal! O que você joga?", "Nice!\nWhat do you play?\n\n🇧🇷: Legal! O que você joga?"],
  ['sem bandeira (B2+): intacta',
    "Totally fair! Would you rather design a game or compete in one?", "Totally fair! Would you rather design a game or compete in one?"],
  ['bandeira no inicio, sem ingles: so ganha os dois-pontos',
    "🇧🇷 Sem problemas! Vamos devagar.", "🇧🇷: Sem problemas! Vamos devagar."],
];
for (const [rot, entrada, esperado] of CASOS) {
  const saida = unesc(dividir(entrada));
  ok(saida === esperado, rot + (saida === esperado ? '' : '\n      veio:     ' + JSON.stringify(saida) + '\n      esperado: ' + JSON.stringify(esperado)));
}
const html = dividir("I <3 games & you?\n🇧🇷 Eu <3 jogos & você?");
ok(html === "I &lt;3 games &amp; you?\n\n🇧🇷: Eu &lt;3 jogos &amp; você?", 'o escape de HTML continua valendo nas duas partes');
ok(dividir('') === 'Hmm, não entendi direito — pode repetir? 😊', 'resposta vazia mantem o fallback de sempre');

console.log('\n2. Os exemplos de formato de A1/A2/B1 mostram o formato novo');
for (const nv of ['A1', 'A2', 'B1']) {
  const code = node('Prompt Conversa ' + nv).parameters.jsCode;
  const linha = code.split('\n').find(l => l.includes('IDIOMA (' + nv)) || '';
  // a linha e um literal JS dentro do jsCode: avalia para obter o texto que o modelo le
  let texto = '';
  try { texto = eval(linha.trim().replace(/,$/, '')); } catch (e) { texto = ''; }
  ok(!!texto, nv + ': a clausula de IDIOMA existe e e um literal valido');
  const ex = texto.slice(texto.indexOf('Formato EXATO:'));
  ok(/\S\n\n🇧🇷: \S/.test(ex), nv + ': o exemplo tem ingles, UMA linha em branco (quebra real) e "🇧🇷: "');
  ok(!ex.includes('\\n'), nv + ': o exemplo nao tem "\\n" literal');
  ok(/linha em branco/i.test(texto) && texto.includes(B + ':'), nv + ': a instrucao descreve a linha em branco e o "' + B + ':"');
}

console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)' : 'PASSOU: a linha traduzida chega como "inglês / linha em branco / 🇧🇷: tradução"'));
process.exit(fails ? 1 : 0);
