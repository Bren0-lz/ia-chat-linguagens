// TESTE — o alvo da Fase A tem de ser SEMPRE o ingress do harness (IACHAT_TEST_PATH).
//
// Ate 06/09 `bateria_completa_a.js` montava a URL CRAVADA em tres lugares
// (linhas 193, 370 e 379: BASE + '/webhook/iachat-test'). Rodando "no v8", os testes
// A6, R3 e S1 batiam no v7.4 — o workflow que atende usuarios reais — e o relatorio
// dizia v8. E a armadilha no 13 do handoff: o instrumento medindo a coisa errada sem avisar.
//
// Este teste REPROVA a versao anterior: as tres URLs cravadas quebram a checagem 1.
//
//   node fluxos/_teststand/testa_alvo_bateria_a.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

let fails = 0;
function ok(cond, nome, detalhe) {
  if (cond) { console.log('  PASSOU  ' + nome); }
  else { fails++; console.log('  FALHOU  ' + nome + (detalhe ? ' — ' + detalhe : '')); }
}

const alvoDir = __dirname;
const src = fs.readFileSync(path.join(alvoDir, 'bateria_completa_a.js'), 'utf8');

// 1. Nenhuma URL de webhook cravada no codigo (comentarios nao contam).
{
  const linhasCodigo = src.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l));
  const cravadas = linhasCodigo.filter(l => /['"`][^'"`]*\/webhook\//.test(l));
  ok(cravadas.length === 0, 'nenhuma URL /webhook/ cravada em bateria_completa_a.js',
    cravadas.length + ' linha(s): ' + cravadas.map(l => l.trim().slice(0, 70)).join(' | '));
}

// 2. Toda chamada de fetch usa o WEBHOOK do harness.
{
  const alvosFetch = [...src.matchAll(/\bfetch\(\s*([A-Za-z_$][\w$]*)/g)].map(m => m[1]);
  ok(alvosFetch.length >= 3, 'ha pelo menos 3 chamadas diretas de fetch na Fase A',
    'encontradas ' + alvosFetch.length);
  ok(alvosFetch.every(v => v === 'WEBHOOK'), 'todas as chamadas de fetch usam WEBHOOK',
    'alvos: ' + JSON.stringify(alvosFetch));
  ok(/require\(['"]\.\/harness['"]\)/.test(src) && /\bWEBHOOK\b/.test(src.split('\n').find(l => /require\(['"]\.\/harness['"]\)/.test(l)) || ''),
    'WEBHOOK e importado do harness');
}

// 3. O harness resolve o ingress pelo env — v8 quando setado, iachat-test por default.
{
  const leWebhook = (env) => execFileSync(process.execPath,
    ['-e', "const h=require('./harness');process.stdout.write(h.WEBHOOK+'|'+h.TEST_PATH)"],
    { cwd: alvoDir, env: { ...process.env, IACHAT_TEST_PATH: env }, encoding: 'utf8' });
  const semEnv = { ...process.env }; delete semEnv.IACHAT_TEST_PATH;
  const padrao = execFileSync(process.execPath,
    ['-e', "const h=require('./harness');process.stdout.write(h.WEBHOOK+'|'+h.TEST_PATH)"],
    { cwd: alvoDir, env: semEnv, encoding: 'utf8' });

  const v8 = leWebhook('iachat-test-v8');
  ok(v8.endsWith('/webhook/iachat-test-v8|iachat-test-v8'), 'com IACHAT_TEST_PATH=iachat-test-v8 o WEBHOOK aponta ao v8', v8);
  ok(padrao.endsWith('/webhook/iachat-test|iachat-test'), 'sem a env o default continua iachat-test (v7.4 de proposito)', padrao);
}

// 4. A transcricao do v8 NAO sobrescreve a evidencia do v7.4.
{
  const { rotuloDe, transcricaoDe } = require('./alvo');
  ok(rotuloDe('iachat-test') === 'v7.4', 'rotulo do ingress default e v7.4');
  ok(rotuloDe('iachat-test-v8') === 'v8', 'rotulo do ingress do v8 e v8');
  ok(transcricaoDe('tr_bateria_a', 'iachat-test') === './tr_bateria_a.md',
    'v7.4 grava em tr_bateria_a.md');
  ok(transcricaoDe('tr_bateria_a', 'iachat-test-v8') === './tr_bateria_a_v8.md',
    'v8 grava em tr_bateria_a_v8.md (nao sobrescreve a evidencia do v7.4)');
}

console.log(fails === 0 ? '\nOK — o alvo da Fase A segue o IACHAT_TEST_PATH' : '\n' + fails + ' falha(s)');
process.exit(fails ? 1 : 0);
