// A2 com entradas REAIS — o teste que faltava.
//
// Ate 04/09 o A2 da Fase A testava so "A", "123", "@#". Nenhuma saudacao, nenhuma
// palavra comum, nenhum palavrao. Por isso "oi", "bom dia", "teste", "kkkk",
// "admin" e palavroes entravam como nome do aluno e ficavam gravados pra sempre.
//
// Roda offline: encadeia `Triagem de Nome` -> `Etapa de Cadastro` com a logica real
// dos nos, sem n8n, sem banco e sem LLM. O ramo que consulta a IA e simulado nos
// dois desfechos (aceita / recusa), porque `ask_ai` nunca chega ao cadastro no
// fluxo real -- quem decide e o `Veredito IA`.
//
//   node fluxos/_teststand/testa_cadastro_nome.js [caminho/do/fluxo.json]

const fs = require('fs');
const path = require('path');
const FLOW = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_v7.4.json');
const flow = JSON.parse(fs.readFileSync(FLOW, 'utf8'));
const code = {};
for (const n of flow.nodes) if (n.parameters && n.parameters.jsCode) code[n.name] = n.parameters.jsCode;

function run(nodeName, item) {
  if (!code[nodeName]) throw new Error('no ausente no fluxo: ' + nodeName);
  const $input = { item: { json: item }, all: () => [{ json: item }] };
  const $ = () => ({ first: () => ({ json: item }) });
  return new Function('$', '$input', '$json', code[nodeName] + '\n')($, $input, item).json;
}

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };

// Encadeia os dois nos como o fluxo faz. `iaAceita` simula o Veredito IA para o
// caso em que a camada 1 nao decidiu sozinha.
function cadastro(texto, extra, iaAceita) {
  const base = Object.assign({
    userId: 77, onboarding: 'awaiting_name', type: 'text', isCommand: false,
    text: texto, firstName: 'Ana', profile: {}, command: '',
  }, extra || {});
  let it = run('Triagem de Nome', base);
  if (it.nameCheck && it.nameCheck.verdict === 'ask_ai') {
    it = Object.assign({}, it, {
      nameCheck: Object.assign({}, it.nameCheck, iaAceita
        ? { verdict: 'ok', reason: 'ia_ok', name: it.nameCheck.candidate }
        : { verdict: 'reject', reason: 'nao_e_nome' }),
    });
  }
  return run('Etapa de Cadastro', it);
}

const aceitou = (r) => r.saveName !== null && r.next === 'awaiting_age';

console.log('\n== A2: nomes legitimos entram ==');
for (const [txt, esperado] of [
  ['Lucas', 'Lucas'], ['Ana Paula', 'Ana Paula'], ['José-Maria', 'José-Maria'],
  ["D'Ávila", "D'Ávila"], ['meu nome é Sofia', 'Sofia'], ['me chamo Rafael', 'Rafael'],
]) {
  const r = cadastro(txt, null, true);
  ok(aceitou(r) && r.saveName === esperado,
    JSON.stringify(txt) + ' -> ' + JSON.stringify(r.saveName) + (r.saveName === esperado ? '' : '  (esperava ' + esperado + ')'));
}

console.log('\n== A2: o que NAO pode virar nome ==');
const LIXO = {
  saudacao: ['oi', 'ola', 'bom dia', 'hi', 'hey', 'eae', 'blz', 'tchau'],
  nao_e_nome: ['sim', 'nao', 'ok', 'teste', 'sei la', 'kkkk', 'asdf', 'bot', 'admin', 'null', 'undefined'],
  ofensivo: ['cu', 'puta', 'merda', 'p3nis', 'xereca'],
};
for (const [motivoEsperado, lista] of Object.entries(LIXO)) {
  for (const txt of lista) {
    const r = cadastro(txt, null, true);   // ia generosa: nem assim pode passar
    ok(!aceitou(r), JSON.stringify(txt) + ' recusado (motivo=' + (r.nameCheck && r.nameCheck.reason) + ', esperado ~' + motivoEsperado + ')');
  }
}

console.log('\n== Mensagem de recusa e especifica ==');
const rSaud = cadastro('bom dia', null, true);
const rOfen = cadastro('merda', null, true);
const rGen = cadastro('asdf', null, true);
ok(/Oi pra você também/.test(rSaud.reply), 'saudacao recebe resposta de saudacao, nao "não entendi"');
ok(/clima leve/.test(rOfen.reply), 'palavrao recebe recado proprio');
ok(rSaud.reply !== rGen.reply && rOfen.reply !== rGen.reply, 'os tres motivos dao mensagens diferentes');

console.log('\n== Nao-texto e comando ==');
ok(!aceitou(cadastro('', { type: 'non_text' }, true)), 'foto/audio nao vira nome');
ok(!aceitou(cadastro('/start', { isCommand: true, command: '/start' }, true)), 'comando nao vira nome');

console.log('\n== Escape do loop (3a recusa aceita o nome do Telegram) ==');
const t1 = cadastro('asdf', { profile: { name_tries: 0 } }, false);
ok(!aceitou(t1) && /name_tries/.test(t1.sql), '1a recusa: nao aceita e grava o contador');
const t2 = cadastro('asdf', { profile: { name_tries: 1 } }, false);
ok(!aceitou(t2), '2a recusa: ainda nao aceita');
const t3 = cadastro('asdf', { profile: { name_tries: 2 } }, false);
ok(aceitou(t3) && t3.saveName === 'Ana', '3a recusa: aceita o firstName do Telegram ("' + t3.saveName + '") em vez de travar');
ok(/Vou te chamar de/.test(t3.reply || ''), 'e avisa que escolheu o nome por ele');

console.log('\n== O contador nao pode gerar SQL invalido ==');
ok(!/\d+::jsonb/.test(t1.sql), 'name_tries nao usa <numero>::jsonb (Postgres nao converte int para jsonb)');
ok(/to_jsonb\(\s*\d+\s*::int\)/.test(t1.sql), 'name_tries gravado com to_jsonb');
ok((t1.sql.match(/(^|,\s*)profile=/g) || []).length <= 1, 'uma unica atribuicao a coluna profile no UPDATE');

console.log('\n== Sem nameCheck, o cadastro nao fica sem caminho ==');
const semNc = run('Etapa de Cadastro', {
  userId: 77, onboarding: 'awaiting_name', type: 'text', isCommand: false,
  text: 'Mariana', firstName: 'Ana', profile: {}, command: '',
});
ok(aceitou(semNc) && semNc.saveName === 'Mariana', 'fallback antigo continua funcionando');

console.log('\n' + (fails ? '❌ ' + fails + ' falha(s)' : '✅ todos os checks passaram'));
process.exit(fails ? 1 : 0);
