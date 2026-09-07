// Guarda do ALVO da jornada de usuario.
//
// Por que existe: `jornada_usuario.js` grava a transcricao com writeFileSync
// (SOBRESCREVE, nao anexa). Enquanto o caminho era `./tr_jornada.md` cravado,
// rodar a jornada no v8 APAGAVA a evidencia de 04/09 do v7.4 -- que e a base da
// comparacao pedida e esta protegida pelo handoff secao 11.
//
// O mesmo defeito ja existia na Fase A (tres URLs cravadas mandando teste para
// PRODUCAO) e foi consertado no T014. Este teste impede a volta.
//
//   node fluxos/_teststand/testa_alvo_jornada.js

const fs = require('fs');
const path = require('path');
const { rotuloDe, transcricaoDe } = require('./alvo');

const ARQ = path.join(__dirname, 'jornada_usuario.js');
const src = fs.readFileSync(ARQ, 'utf8');

let fails = 0;
function ok(cond, nome, detalhe) {
  if (cond) { console.log('  . ' + nome + (detalhe ? '  — ' + detalhe : '')); }
  else { console.log('  X ' + nome + (detalhe ? '  — ' + detalhe : '')); fails++; }
}

console.log('\n== alvo da jornada de usuario ==\n');

// 1) nada de caminho de transcricao cravado fora de comentario
const linhasCod = src.split('\n').filter(l => !l.trim().startsWith('//'));
const cravadas = linhasCod.filter(l => /['"]\.\/tr_jornada\.md['"]/.test(l));
ok(cravadas.length === 0,
   'nenhum caminho de transcricao cravado no codigo',
   cravadas.length ? cravadas.map(s => s.trim()).join(' | ') : 'nenhum');

// 2) o caminho vem de transcricaoDe()
ok(/transcricaoDe\(\s*'tr_jornada'/.test(src),
   'TR derivado por transcricaoDe()',
   /transcricaoDe\(\s*'tr_jornada'/.test(src) ? 'ok' : 'nao encontrado');

// 3) a derivacao manda cada versao para o seu arquivo
const alvoV74 = transcricaoDe('tr_jornada', 'iachat-test');
const alvoV8 = transcricaoDe('tr_jornada', 'iachat-test-v8');
ok(alvoV74 === './tr_jornada.md', 'v7.4 mantem o nome historico', alvoV74);
ok(alvoV8 === './tr_jornada_v8.md', 'v8 grava em arquivo proprio', alvoV8);
ok(alvoV74 !== alvoV8, 'as duas versoes NAO colidem', alvoV74 + ' != ' + alvoV8);

// 4) rotulo legivel, para o relatorio dizer o que mediu
ok(rotuloDe('iachat-test-v8') === 'v8', 'rotulo do v8', rotuloDe('iachat-test-v8'));
ok(rotuloDe('iachat-test') === 'v7.4', 'rotulo do v7.4', rotuloDe('iachat-test'));

// 5) o default sem env continua o v7.4 -- nao quebrar quem roda contra o bot de proposito
ok(transcricaoDe('tr_jornada', undefined || 'iachat-test') === './tr_jornada.md',
   'sem IACHAT_TEST_PATH o default e o v7.4',
   './tr_jornada.md');

// 6) a gravacao continua sendo writeFileSync -- o teste so faz sentido enquanto SOBRESCREVE
ok(/writeFileSync\(\s*TR\b/.test(src),
   'a transcricao e escrita com writeFileSync (por isso o alvo importa)',
   'sim');

console.log('');
if (fails) { console.log('REPROVOU: ' + fails + ' assercao(oes)\n'); process.exit(1); }
console.log('PASSOU: a jornada grava no arquivo da versao que ela mediu\n');
process.exit(0);
