// Regressao offline do detector do CONTROLE do experimento do A1 (T013).
//
// O controle manda "video games is fun" (concordancia sujeito-verbo, primeiro item da lista
// "ERROS QUE CONTAM") e pergunta se o A1 corrige. A regua antiga,
// `/games are|are fun|✔️|not\s+.video games is/i`, saturava: aprovava o bot que apenas USA a
// forma certa sem corrigir o aluno. Deu 9/9 num baseline que nao corrige nada.
//
// Duas provas aqui:
//   (a) fixtures — rejeita "Oh, I agree! Video games are fun." e aceita "We say 'video games
//       ARE fun'"; a regua antiga aprova as duas (por isso o teste reprova a versao anterior);
//   (b) corpus real — as saidas cruas ja gravadas em `tr_experimento_a1.md` (T011 e T012), onde
//       a regua estrita tem de dar 2/9 no baseline e 8/9 na variante, que sao os numeros
//       recomputados a mao naquelas duas tarefas.
//
//   node fluxos/_teststand/testa_detector_controle.js

const fs = require('fs');
const path = require('path');
const { corrigiuVideoGamesAre, corrigiuLikePlay } = require('./experimento_a1.js');

const TR = path.join(__dirname, '..', '..', 'tr_experimento_a1.md');

// A regua de ate 06/09, ao pe da letra.
const frouxa = (t) => /games are|are fun|✔️|not\s+.video games is/i.test(String(t || ''));

let fails = 0;
function ok(nome, cond, detalhe) {
  console.log((cond ? '  . ' : '  X ') + nome + (detalhe ? '  — ' + detalhe : ''));
  if (!cond) fails++;
}

const USA_SEM_CORRIGIR = 'Oh, I agree! Video games are fun. What games do you like?';
const CORRIGE = "We say 'video games ARE fun'.";

console.log('DETECTOR DO CONTROLE (experimento do A1)');

console.log('\n1) fixtures do gate');
ok('rejeita o bot que so USA a forma certa', corrigiuVideoGamesAre(USA_SEM_CORRIGIR) === false,
  JSON.stringify(USA_SEM_CORRIGIR));
ok('aceita o reparo explicito', corrigiuVideoGamesAre(CORRIGE) === true, JSON.stringify(CORRIGE));
ok('rejeita resposta vazia', corrigiuVideoGamesAre('') === false);
ok('rejeita resposta sem a forma certa nem reparo',
  corrigiuVideoGamesAre('Nice! Do you play on your phone?') === false);

console.log('\n2) a regua ANTIGA erra nas mesmas fixtures');
ok('a antiga aprovava o bot que so USA a forma certa (saturacao)', frouxa(USA_SEM_CORRIGIR) === true);
ok('a antiga tambem aprovava o reparo — nao distinguia os dois', frouxa(CORRIGE) === true);

console.log('\n3) o detector do C1 NAO foi tocado (a comparacao publicada depende dele)');
ok("C1: aceita \"We say 'I like TO play games'\"",
  corrigiuLikePlay("We say 'I like TO play games'.") === true);
ok('C1: rejeita "I like playing games too!" (usa a forma certa, nao corrige)',
  corrigiuLikePlay('Cool! I like playing games too!') === false);

console.log('\n4) corpus real gravado em tr_experimento_a1.md');
const txt = fs.readFileSync(TR, 'utf8');
const secoes = txt.split(/^## /m).slice(1);
function blocosControle(s) {
  const out = [];
  const re = /\ncontrole-lista \d+ \([^)]*\):\n```\n([\s\S]*?)\n```/g;
  let m;
  while ((m = re.exec(s))) out.push(m[1]);
  return out;
}
let baseline = [], variante = [];
for (const s of secoes) {
  const titulo = s.split('\n')[0];
  if (/^baseline-v8-T011/.test(titulo)) baseline = baseline.concat(blocosControle(s));
  if (/^variante-exemplo-com-correcao-e-interesse/.test(titulo)) variante = variante.concat(blocosControle(s));
}
const taxa = (a, f) => a.filter(f).length + '/' + a.length;
ok('as 3 rodadas do baseline do T011 estao na evidencia (n=9)', baseline.length === 9,
  'n=' + baseline.length);
ok('a variante do T012 esta na evidencia (n=9)', variante.length === 9, 'n=' + variante.length);
ok('baseline, regua estrita = 2/9', taxa(baseline, corrigiuVideoGamesAre) === '2/9',
  taxa(baseline, corrigiuVideoGamesAre));
ok('variante, regua estrita = 8/9', taxa(variante, corrigiuVideoGamesAre) === '8/9',
  taxa(variante, corrigiuVideoGamesAre));
ok('baseline, regua antiga saturava em 9/9', taxa(baseline, frouxa) === '9/9', taxa(baseline, frouxa));
ok('a regua antiga nao separava baseline de variante (9/9 vs 8/9)',
  taxa(baseline, frouxa) === '9/9' && taxa(variante, frouxa) === '8/9',
  taxa(baseline, frouxa) + ' vs ' + taxa(variante, frouxa));

console.log(fails ? '\nREPROVOU: ' + fails + ' asserção(oes)' : '\nPASSOU: detector do controle');
process.exit(fails ? 1 : 0);
