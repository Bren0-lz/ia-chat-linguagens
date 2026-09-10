// A EXPLICACAO DA TRILHA E IGUAL PARA TODOS — e isso e o comportamento DESEJADO.
//
// DECISAO DE PRODUTO (Breno, 10/09): o modo Professor NAO tem persona. Persona forte e
// do modo CONVERSA. A explicacao vem do banco, e o texto revisado, e nao deve variar por
// aluno.
//
// ESTE TESTE JA MEDIU O CONTRARIO. Entre 07/09 e 10/09 ele exigia que DEBATER e BUDDY
// produzissem textos DIFERENTES, porque o T17 da bateria tratava "a persona sumiu da
// explicacao" como defeito (achado da rodada do v8). Com a decisao acima, aquilo deixou
// de ser defeito: servir a explicacao do banco foi ganho de 88% de latencia SEM
// contrapartida, e a moldura de persona (T021) foi revertida.
//
// O que este arquivo protege agora e o risco REAL: alguem reintroduzir variacao por
// persona e adulterar, aluno a aluno, o corpo que passou por revisao.
//
//   node fluxos/_teststand/testa_moldura_persona.js [caminho-do-fluxo]

const fs = require('fs');
const path = require('path');

const FLUXO = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_v8.json');
const NO = 'Explicação do Banco';
const PERSONAS = ['buddy', 'coach', 'comedian', 'debater', 'formal'];

let fails = 0;
function ok(cond, nome, detalhe) {
  if (cond) console.log('  . ' + nome + (detalhe ? '  — ' + detalhe : ''));
  else { console.log('  X ' + nome + (detalhe ? '  — ' + detalhe : '')); fails++; }
}

const f = JSON.parse(fs.readFileSync(FLUXO, 'utf8'));
const no = f.nodes.find(n => n.name === NO);
if (!no) { console.error('no "' + NO + '" nao encontrado'); process.exit(1); }

const CORPO = '<b>O QUE E E QUANDO USAR</b>\nCorpo revisado, identico para todos os alunos.';

function roda(persona, tnum, nome) {
  const eng = {
    persona, topicNum: tnum || 1, topicTot: 10, name: nome || 'Yuki',
    topicTitle: 'Present perfect continuous', feedback: '',
  };
  const $ = (n) => ({ first: () => ({ json: n === 'Professor Engine' ? eng : {} }) });
  const $input = { first: () => ({ json: { body: CORPO } }) };
  const r = new Function('$', '$input', no.parameters.jsCode)($, $input);
  return r && r[0] ? r[0].json : null;
}

console.log('\n== a explicacao da trilha nao varia por persona (por desenho) ==');
console.log('fluxo: ' + path.basename(FLUXO) + '\n');

const saidas = {};
for (const p of PERSONAS) {
  let s = null;
  try { s = roda(p, 1); } catch (e) { ok(false, 'persona ' + p + ' executa', e.message.slice(0, 80)); continue; }
  saidas[p] = s;
  ok(!!(s && s.finalText), 'persona ' + p + ' produz finalText');
}

// 1) O CORACAO: todas as personas produzem o MESMO texto.
const textos = PERSONAS.map(p => saidas[p] && saidas[p].finalText).filter(Boolean);
const distintos = new Set(textos).size;
ok(distintos === 1,
   'as 5 personas produzem a MESMA explicacao',
   distintos === 1 ? 'identicas' : distintos + ' versoes diferentes — a aula revisada esta variando por aluno');

// 2) e o corpo do banco sai intacto, sem envelope
for (const p of PERSONAS) {
  const s = saidas[p];
  if (!s) continue;
  ok(s.finalText.includes(CORPO), 'persona ' + p + ': corpo do banco INTACTO');
  ok(s.finalText.trim() === CORPO.trim(),
     'persona ' + p + ': nada foi acrescentado ao corpo',
     s.finalText.trim() === CORPO.trim() ? 'so o corpo' : 'ha texto extra em volta');
}

// 3) o topico tambem nao pode mudar o texto (a moldura variava por topicNum)
const t1 = roda('coach', 1), t7 = roda('coach', 7);
ok(t1 && t7 && t1.finalText === t7.finalText,
   'o mesmo corpo nao muda entre topicos diferentes');

// 4) persona ausente/desconhecida continua sem quebrar o turno
for (const caso of [undefined, null, '', 'inexistente']) {
  let s = null;
  try { s = roda(caso, 1); } catch (e) { /* cai no ok abaixo */ }
  ok(!!(s && s.finalText && s.finalText.includes(CORPO)),
     'persona ' + JSON.stringify(caso) + ' nao quebra o turno');
}

// 5) o feedback do engine (UI) continua sendo prefixado — nao e persona, e interface
const comFeedback = (() => {
  const eng = { persona: 'buddy', topicNum: 1, topicTot: 10, name: 'Yuki', feedback: '📚 Topico 1/10' };
  const $ = (n) => ({ first: () => ({ json: n === 'Professor Engine' ? eng : {} }) });
  const $input = { first: () => ({ json: { body: CORPO } }) };
  return new Function('$', '$input', no.parameters.jsCode)($, $input)[0].json;
})();
ok(comFeedback.finalText.startsWith('📚 Topico 1/10'),
   'o feedback do engine continua vindo antes do corpo');

// 6) teto do Telegram
const grande = (() => {
  const eng = { persona: 'debater', topicNum: 3, topicTot: 10, name: 'Yuki', feedback: '' };
  const $ = (n) => ({ first: () => ({ json: n === 'Professor Engine' ? eng : {} }) });
  const $input = { first: () => ({ json: { body: 'x'.repeat(4200) } }) };
  return new Function('$', '$input', no.parameters.jsCode)($, $input)[0].json;
})();
ok(grande.finalText.length <= 4096, 'corpo no limite respeita o teto do Telegram',
   grande.finalText.length + ' chars');

console.log('');
if (fails) { console.log('REPROVOU: ' + fails + ' assercao(oes)\n'); process.exit(1); }
console.log('PASSOU: a explicacao e a mesma para todas as personas, como o produto quer\n');
process.exit(0);
