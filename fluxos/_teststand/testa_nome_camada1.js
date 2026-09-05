// Roda o jsCode da "Triagem de Nome" fora do n8n contra uma bateria de entradas.
const fs = require('fs');
const path = require('path');
const FLOW = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_v7.4.json');
const flow = JSON.parse(fs.readFileSync(FLOW, 'utf8'));
const node = flow.nodes.find(n => n.name === 'Triagem de Nome');
if (!node) { throw new Error('no Triagem de Nome nao encontrado'); }

const src = node.parameters.jsCode;
function roda(text, extra) {
  const item = Object.assign({
    onboarding: 'awaiting_name', type: 'text', isCommand: false,
    text: text, firstName: 'Breno', profile: {}, userId: 1
  }, extra || {});
  const $input = { item: { json: item } };
  const fn = new Function('$input', src);
  return fn($input).json.nameCheck;
}

// esperado: 'ok' (aceita direto), 'reject', 'ask_ai' (manda pra IA)
const casos = [
  ['oi', 'reject'], ['Oi', 'reject'], ['ola', 'reject'], ['Olá', 'reject'],
  ['hi', 'reject'], ['hello', 'reject'], ['bom dia', 'reject'], ['eae', 'reject'],
  ['else', 'reject'], ['null', 'reject'], ['undefined', 'reject'], ['teste', 'reject'],
  ['ok', 'reject'], ['sim', 'reject'], ['nao', 'reject'], ['não', 'reject'],
  ['nada', 'reject'], ['sei la', 'reject'], ['qualquer', 'reject'], ['bot', 'reject'],
  ['asdf', 'reject'], ['kkkk', 'reject'], ['aaaa', 'reject'], ['xkcd', 'reject'],
  ['abab', 'reject'], ['a', 'reject'], ['x', 'reject'],
  ['penis', 'reject'], ['pênis', 'reject'], ['p3nis', 'reject'], ['p€nis', 'ask_ai'],
  ['pau', 'reject'], ['Pau', 'reject'], ['perereca', 'reject'], ['Perereca', 'reject'],
  ['piroca', 'reject'], ['buceta', 'reject'], ['caralho', 'reject'], ['cu', 'reject'],
  ['puta', 'reject'], ['fdp', 'reject'], ['viado', 'reject'], ['corno', 'reject'],
  ['fuck', 'reject'], ['dick', 'reject'], ['bitch', 'reject'], ['n1gger', 'reject'],
  ['meu nome é pau', 'reject'], ['me chamo penis', 'reject'], ['sou o caralho', 'reject'],
  ['xoxotinha', 'reject'], ['penizinho', 'reject'],
  ['hitler', 'reject'], ['Adolf Hitler', 'reject'],
  // nomes reais precisam passar
  ['Breno', 'ok'], ['breno', 'ok'], ['Ana', 'ok'], ['João', 'ok'], ['Maria', 'ok'],
  ['Ana Paula', 'ok'], ['maria clara', 'ok'], ['meu nome é Lucas', 'ok'],
  ['me chamo Julia', 'ok'], ['sou o Pedro', 'ok'], ['Pedro, tenho 20 anos', 'ok'],
  // nomes incomuns: devem ir pra IA, nao serem barrados pela camada 1
  ['Wanderleia', 'ask_ai'], ['Kauanny', 'ask_ai'], ['Anastácia', 'ask_ai'],
  ['Nikolai', 'ask_ai'], ['Ayaan', 'ask_ai'], ['Cunha', 'ask_ai'],
  ['Assunção', 'ask_ai'], ['Passos', 'ask_ai'], ['Pinheiro', 'ask_ai'],
  ['Espinosa', 'ask_ai'], ['Cassiano', 'ask_ai'], ['Sexto', 'ask_ai'],
];

let falhas = 0;
for (const [entrada, esperado] of casos) {
  const r = roda(entrada);
  const ok = r.verdict === esperado;
  if (!ok) { falhas++; }
  console.log((ok ? '  ok  ' : 'FALHA ') + JSON.stringify(entrada).padEnd(24) +
    ' -> ' + String(r.verdict).padEnd(7) + ' (' + r.reason + ')' +
    (ok ? '' : '   esperado: ' + esperado));
}

// casos de contexto
console.log('\n-- contexto --');
const c1 = roda('oi', { isCommand: true, text: '/start' });
console.log('comando:', c1.verdict, c1.reason);
const c2 = roda('', { type: 'callback' });
console.log('nao-texto:', c2.verdict, c2.reason);
const c3 = roda('Lucas', { onboarding: 'awaiting_age' });
console.log('fora do passo do nome: active =', c3.active);
const c4 = roda('oi', { profile: { name_tries: 2 } });
console.log('tries lidos do profile:', c4.tries, '| fallback:', c4.fallback);
const c5 = roda('oi', { firstName: 'PIROCA' });
console.log('fallback com firstName sujo:', c5.fallback);
const c6 = roda('oi', { firstName: '' });
console.log('fallback sem firstName:', c6.fallback);

console.log('\n' + (falhas ? falhas + ' FALHA(S)' : 'todos os ' + casos.length + ' casos passaram'));
process.exit(falhas ? 1 : 0);
