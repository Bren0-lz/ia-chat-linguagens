// T15: o comparador de resposta do Professor aceita quase-acerto.
// Roda answersMatch (o atual, extraido do no) e o proposto contra a mesma
// bateria de casos. Offline: nao consome cota, nao toca no fluxo.
const fs = require('fs');
const FLOW = 'C:/Users/breno/OneDrive/Documents/GitHub/ia-chat-linguagens/fluxos/IAChat_Telegram_v7.4.json';
const src = JSON.parse(fs.readFileSync(FLOW, 'utf8')).nodes.find(n => n.name === 'Professor Engine').parameters.jsCode;

// --- o comparador que esta em producao ---
const mNorm = src.match(/function norm\(s\)\{[\s\S]*?\}\n/);
const mMatch = src.match(/function answersMatch\(g,a\)\{[\s\S]*?\n/);
if (!mNorm || !mMatch) throw new Error('nao localizei norm/answersMatch no no');
const atual = new Function(mNorm[0] + mMatch[0] + 'return answersMatch;')();

// --- o proposto: mesma tolerancia, com fronteira de palavra ---
const PROPOSTO = `
function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9\\s]/g,' ').replace(/\\s+/g,' ').trim(); }
function _contem(seq,sub){ if(!sub.length||sub.length>seq.length) return false; for(var i=0;i+sub.length<=seq.length;i++){ var h=true; for(var j=0;j<sub.length;j++){ if(seq[i+j]!==sub[j]){h=false;break;} } if(h) return true; } return false; }
function answersMatch(g,a){
  g=norm(g); a=norm(a); if(!a) return false;
  if(g===a) return true;
  // o gabarito INTEIRO dentro da frase do aluno, em palavras completas:
  // "I have a dog" vale para "have"; "haves" nao vale.
  if(_contem(a.split(' '), g.split(' '))) return true;
  // mesmo conteudo, espacamento diferente: "have been" <-> "havebeen"
  if(g.replace(/\\s+/g,'')===a.replace(/\\s+/g,'')) return true;
  return false;
}
return answersMatch;`;
const proposto = new Function(PROPOSTO)();

// [gabarito, resposta, esperado, por que]
const CASOS = [
  ['have', 'have', true, 'exato'],
  ['have', '  HAVE.  ', true, 'T16: maiuscula, ponto e espacos'],
  ['have', 'I have a dog', true, 'gabarito dentro da frase do aluno'],
  ['have', 'haves', false, 'T15: sufixo errado — e o erro que a questao mede'],
  ['have', 'having', false, 'outra flexao errada'],
  ['have', 'hav', false, 'truncado'],
  ['was watching', 'was watching', true, 'exato, duas palavras'],
  ['was watching', 'he was watching tv', true, 'gabarito dentro da frase'],
  ['was watching', 'was watch', false, 'flexao errada no meio'],
  ['was watching', 'watching', false, 'resposta incompleta'],
  ['have been', 'havebeen', true, 'sem espaco'],
  ['go', 'goes', false, 'sufixo errado, palavra curta'],
  ['go', 'I go to school', true, 'gabarito dentro da frase'],
  ['go', 'going', false, 'gerundio quando pede base'],
  ['the people are', 'the people are', true, 'exato, tres palavras'],
  ['have', '', false, 'vazio nunca acerta'],
];

let falhasAtual = 0, falhasProposto = 0;
console.log('gabarito         | resposta            | esperado | atual | proposto');
console.log('-'.repeat(78));
for (const [g, a, esp, por] of CASOS) {
  const rA = atual(g, a), rP = proposto(g, a);
  if (rA !== esp) falhasAtual++;
  if (rP !== esp) falhasProposto++;
  console.log(
    g.padEnd(16) + ' | ' + JSON.stringify(a).padEnd(20) + ' | ' + String(esp).padEnd(8) + ' | '
    + (rA === esp ? ' ok  ' : 'ERRO ') + ' | ' + (rP === esp ? ' ok' : 'ERRO') + '   ' + (rA !== rP ? '<-- muda: ' + por : '')
  );
}
console.log('\natual: ' + falhasAtual + ' erro(s) em ' + CASOS.length + ' casos');
console.log('proposto: ' + falhasProposto + ' erro(s) em ' + CASOS.length + ' casos');
