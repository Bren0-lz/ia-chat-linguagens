// T021 — prova que a explicacao servida do banco volta a ter voz de persona,
// SEM que o corpo revisado mude.
//
// O DEFEITO QUE ISTO IMPEDE (T17, medido na bateria de 06/09): depois do T008, as
// personas DEBATER e BUDDY produziam a explicacao byte a byte IDENTICA. O corpo vem
// pronto do banco e o `Agente Professor` nem roda, entao nao havia onde a
// personalidade aparecer. No v7.4 elas diferiam claramente.
//
// As duas asercoes tem de valer JUNTAS:
//   1. personas diferentes -> molduras diferentes  (senao o T17 continua falhando)
//   2. personas diferentes -> MESMO corpo          (senao a aula revisada foi adulterada)
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

// Executa o jsCode do no com refs falsas, do jeito que o n8n o chamaria.
function roda(persona, tnum, nome) {
  const eng = {
    persona, topicNum: tnum, topicTot: 10, name: nome || 'Yuki',
    topicTitle: 'Present perfect continuous', feedback: '',
  };
  const $ = (n) => ({ first: () => ({ json: n === 'Professor Engine' ? eng : {} }) });
  const $input = { first: () => ({ json: { body: CORPO } }) };
  const fn = new Function('$', '$input', no.parameters.jsCode);
  const r = fn($, $input);
  return r && r[0] ? r[0].json : null;
}

console.log('\n== moldura de persona na explicacao do banco ==');
console.log('fluxo: ' + path.basename(FLUXO) + '\n');

// 1) roda para as 5 personas no mesmo topico
const saidas = {};
for (const p of PERSONAS) {
  let s = null;
  try { s = roda(p, 1); } catch (e) { ok(false, 'persona ' + p + ' executa', e.message.slice(0, 80)); continue; }
  saidas[p] = s;
  ok(!!(s && s.finalText), 'persona ' + p + ' produz finalText');
}

// 2) O TESTE DO T17: DEBATER e BUDDY nao podem mais sair identicos
const b = saidas.buddy, d = saidas.debater;
if (b && d) {
  ok(b.finalText !== d.finalText,
     'BUDDY e DEBATER produzem textos DIFERENTES',
     b.finalText === d.finalText ? 'IDENTICOS — e exatamente o defeito do T17' : 'diferentes');
  ok(b.moldura_abertura !== d.moldura_abertura, 'as aberturas diferem');
}

// 3) e o corpo revisado tem de sair intacto em TODAS as personas
for (const p of PERSONAS) {
  const s = saidas[p];
  if (!s) continue;
  ok(s.finalText.includes(CORPO),
     'persona ' + p + ': o corpo do banco sai INTACTO',
     s.finalText.includes(CORPO) ? 'preservado' : 'ADULTERADO — a aula revisada mudou');
}

// 4) todas as 5 personas se distinguem entre si (nao basta 2 diferirem)
const molduras = PERSONAS.map(p => saidas[p] && saidas[p].moldura_abertura).filter(Boolean);
ok(new Set(molduras).size === molduras.length,
   'as 5 personas tem aberturas distintas entre si',
   new Set(molduras).size + ' distintas de ' + molduras.length);

// 5) variedade ao longo da trilha: o aluno nao pode ver a mesma abertura todo topico
if (saidas.coach) {
  const aoLongo = [];
  for (let t = 1; t <= 10; t++) { const s = roda('coach', t); if (s) aoLongo.push(s.moldura_abertura); }
  const distintas = new Set(aoLongo).size;
  ok(distintas >= 4,
     'a abertura varia ao longo dos 10 topicos da trilha',
     distintas + ' distintas em 10 topicos');
}

// 6) persona ausente ou desconhecida nao pode quebrar o turno
for (const caso of [undefined, null, '', 'inexistente']) {
  let s = null;
  try { s = roda(caso, 1); } catch (e) { /* cai no ok abaixo */ }
  ok(!!(s && s.finalText && s.finalText.includes(CORPO)),
     'persona ' + JSON.stringify(caso) + ' cai no padrao sem quebrar');
}

// 7) o nome do aluno entra na moldura quando a persona o usa
const comNome = roda('coach', 1, 'Mariana');
ok(!!comNome && /Mariana/.test(comNome.moldura_abertura), 'o nome do aluno entra na moldura');
const semNome = roda('coach', 1, '');
ok(!!(semNome && semNome.finalText), 'nome vazio nao quebra a moldura');

// 8) o teto do Telegram continua respeitado com a moldura somada
const grande = (() => {
  const eng = { persona: 'debater', topicNum: 3, topicTot: 10, name: 'Yuki', feedback: '' };
  const $ = (n) => ({ first: () => ({ json: n === 'Professor Engine' ? eng : {} }) });
  const $input = { first: () => ({ json: { body: 'x'.repeat(4200) } }) };
  return new Function('$', '$input', no.parameters.jsCode)($, $input)[0].json;
})();
ok(grande.finalText.length <= 4096,
   'corpo no limite + moldura continua abaixo do teto do Telegram',
   grande.finalText.length + ' chars');

console.log('');
if (fails) { console.log('REPROVOU: ' + fails + ' assercao(oes)\n'); process.exit(1); }
console.log('PASSOU: a persona voltou a moldura, e o corpo revisado segue intacto\n');
process.exit(0);
