// Roda "Etapa de Cadastro" e "Veredito IA" fora do n8n.
const fs = require('fs');
const FLOW = 'C:/Users/breno/OneDrive/Documents/GitHub/ia-chat-linguagens/fluxos/IAChat_Telegram_v7.4.json';
const flow = JSON.parse(fs.readFileSync(FLOW, 'utf8'));
const code = n => flow.nodes.find(x => x.name === n).parameters.jsCode;

// --- sintaxe ---
for (const nome of ['Triagem de Nome', 'Consultar IA?', 'Validar Nome (IA)', 'Veredito IA', 'Etapa de Cadastro']) {
  const n = flow.nodes.find(x => x.name === nome);
  if (!n) { console.log('FALTA no:', nome); process.exit(1); }
  if (n.parameters.jsCode) { new Function('$input', '$', n.parameters.jsCode); }
}
console.log('sintaxe ok nos 3 nos de codigo');

// --- Etapa de Cadastro ---
const cad = new Function('$input', code('Etapa de Cadastro'));
function cadastro(item) { return cad({ item: { json: item } }).json; }

const base = { userId: 42, firstName: 'Breno', command: '', text: '', profile: {} };

console.log('\n-- aceito --');
let r = cadastro({ ...base, onboarding: 'awaiting_name', text: 'Lucas',
  nameCheck: { active: true, verdict: 'ok', name: 'Lucas', tries: 0, fallback: 'Breno' } });
console.log(r.next, '|', r.saveName, '|', r.reply);
console.log(r.sql);

console.log('\n-- recusado (1a, 2a e 3a tentativa) --');
for (const [tries, reason] of [[0, 'saudacao'], [1, 'ofensivo'], [2, 'nao_e_nome']]) {
  r = cadastro({ ...base, onboarding: 'awaiting_name', text: 'oi', profile: { name_tries: tries },
    nameCheck: { active: true, verdict: 'reject', reason, name: '', tries, fallback: 'Breno' } });
  console.log('tries=' + tries, '->', r.next, '| saveName=' + r.saveName, '|', r.reply.replace(/\n/g, ' / '));
  console.log('   ', r.sql);
}

console.log('\n-- 3a tentativa sem firstName utilizavel --');
r = cadastro({ ...base, onboarding: 'awaiting_name', profile: { name_tries: 2 },
  nameCheck: { active: true, verdict: 'reject', reason: 'ofensivo', tries: 2, fallback: 'Estudante' } });
console.log(r.next, '|', r.saveName, '|', r.sql);

console.log('\n-- passos que nao mexem no nome --');
r = cadastro({ ...base, onboarding: 'awaiting_age', text: '25', nameCheck: { active: false } });
console.log('idade ok:', r.next, '|', r.sql);
r = cadastro({ ...base, onboarding: 'new', nameCheck: { active: false } });
console.log('novo:', r.next, '|', r.sql);
r = cadastro({ ...base, onboarding: 'done', command: '/resetfull', nameCheck: { active: false } });
console.log('/resetfull:', r.next, '| profile duplicado?', (r.sql.match(/profile/g) || []).length);

// --- Veredito IA ---
console.log('\n-- Veredito IA --');
const verSrc = code('Veredito IA');
function veredito(resp, nc) {
  const tri = { json: { nameCheck: nc } };
  const $ = () => ({ item: tri });
  const fn = new Function('$input', '$', verSrc);
  return fn({ item: { json: resp } }, $).json.nameCheck;
}
const nc = { active: true, verdict: 'ask_ai', candidate: 'Wanderleia', tries: 0, fallback: 'Breno' };
const mk = c => ({ choices: [{ message: { content: c } }] });
console.log('valido:      ', veredito(mk('{"valido":true,"nome":"Wanderleia","motivo":"ok"}'), nc));
console.log('invalido:    ', veredito(mk('{"valido":false,"nome":"","motivo":"ofensivo"}'), nc));
console.log('json sujo:   ', veredito(mk('Claro! {"valido":true,"nome":"Wanderleia"} pronto'), nc));
console.log('lixo:        ', veredito(mk('sei la'), nc));
console.log('erro http:   ', veredito({ error: 'timeout' }, nc));
console.log('injecao:     ', veredito(mk('{"valido":true,"nome":"<b>hax</b> 123"}'), nc));
console.log('nome vazio:  ', veredito(mk('{"valido":true,"nome":"!"}'), nc));
