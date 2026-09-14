// TESTE — o alvo dos testes tem de ser SEMPRE o ingress do harness (IACHAT_TEST_PATH).
// Desde o E008 a varredura cobre TODO `.js` do _teststand, nao so a Fase A (checagens 6 e 7).
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

// 5. O fluxo do EVENTO tambem tem rotulo (E007).
//
// O ingress `iachat-test-evento` existe no `TEST Ingress` de IAChat_Telegram_evento.json
// (e o que `testa_arquivo_evento.js` cobra) e e por ele que a bateria do evento entra.
// Sem o mapa, `rotuloDe` caia no fallback e a transcricao nascia
// `tr_bateria_a_iachat-test-evento.md`: path cru no lugar do nome da versao, que e a
// armadilha no 23 do handoff ("rotulo errado em evidencia envenena igual a numero errado").
{
  const { rotuloDe, transcricaoDe, caminhoLivre } = require('./alvo');

  ok(rotuloDe('iachat-test-evento') === 'evento',
    'rotulo do ingress do evento e "evento"', rotuloDe('iachat-test-evento'));
  ok(transcricaoDe('tr_bateria_a', 'iachat-test-evento') === './tr_bateria_a_evento.md',
    'evento grava em tr_bateria_a_evento.md',
    transcricaoDe('tr_bateria_a', 'iachat-test-evento'));

  // os TRES convivem: nenhum par colide, em nenhuma das baterias
  for (const base of ['tr_bateria_a', 'tr_bateria_b', 'tr_jornada']) {
    const caminhos = ['iachat-test', 'iachat-test-v8', 'iachat-test-evento']
      .map(p => transcricaoDe(base, p));
    ok(new Set(caminhos).size === 3, base + ': v7.4, v8 e evento em arquivos distintos',
      caminhos.join(' | '));
    ok(caminhos[0] === './' + base + '.md' && caminhos[1] === './' + base + '_v8.md'
       && caminhos[2] === './' + base + '_evento.md',
      base + ': os nomes historicos ficam como estao e o evento ganha o seu',
      caminhos.join(' | '));
  }

  // o fallback nao pode sumir: ingress desconhecido continua caindo no path saneado
  ok(rotuloDe('iachat-test-nao-existe') === 'iachat-test-nao-existe',
    'ingress desconhecido continua devolvendo o proprio path',
    rotuloDe('iachat-test-nao-existe'));
  ok(transcricaoDe('tr_bateria_a', 'algum/ingress novo') === './tr_bateria_a_algum-ingress-novo.md',
    'ingress desconhecido continua saneado no nome do arquivo',
    transcricaoDe('tr_bateria_a', 'algum/ingress novo'));

  // a composicao com caminhoLivre (T031) vale para o evento tambem: nome ocupado -> datado,
  // e evidencia do v7.4/v8 ocupada NAO empurra o evento.
  const T0 = Date.UTC(2026, 8, 13, 12, 0, 0); // 2026-09-13, UTC
  const disco = new Set(['./tr_bateria_a.md', './tr_bateria_a_v8.md']);
  const existe = (p) => disco.has(p);
  const e1 = caminhoLivre(transcricaoDe('tr_bateria_a', 'iachat-test-evento'), existe, T0);
  ok(e1 === './tr_bateria_a_evento.md',
    'evidencia do v7.4/v8 ocupada nao empurra o evento para nome datado', e1);
  disco.add(e1);
  const e2 = caminhoLivre(transcricaoDe('tr_bateria_a', 'iachat-test-evento'), existe, T0);
  ok(e2 === './tr_bateria_a_evento_2026-09-13.md',
    '2a rodada do evento no mesmo dia ganha data', e2);
  disco.add(e2);
  const e3 = caminhoLivre(transcricaoDe('tr_bateria_a', 'iachat-test-evento'), existe, T0);
  ok(e3 === './tr_bateria_a_evento_2026-09-13-2.md',
    '3a rodada do evento ganha desempate', e3);
  ok(e1 !== e2 && e2 !== e3 && ![e1, e2, e3].includes('./tr_bateria_a.md')
     && ![e1, e2, e3].includes('./tr_bateria_a_v8.md'),
    'nenhuma rodada do evento cai sobre a evidencia do v7.4 ou do v8',
    [e1, e2, e3].join(' | '));
}

// 6. E008 - a varredura vale para o DIRETORIO INTEIRO, nao so para a Fase A.
//
// A checagem 1 assere um arquivo so. Em 14/09 o `teste_concorrencia.js` foi pego com
// `BASE + '/webhook/iachat-test'` na linha 25: mandava callbacks para o v7.4 - o bot NO AR -
// e ainda escrevia no Postgres. O guard existia e nao alcancava. Agora alcanca todo `.js`
// do _teststand, e as excecoes sao FECHADAS e justificadas uma a uma.
{
  // Excecao so vale para arquivo que NAO vai a rede: a assercao abaixo cobra isso de cada uma,
  // para que nenhuma vire porta de entrada quando alguem acrescentar um `fetch`.
  const EXCECOES = {
    'testa_alvo_bateria_a.js': 'este proprio guard: cita as URLs esperadas como valor de comparacao',
    'testa_bateria_b_n3.js': 'guard irmao da Fase B: cita a URL na mensagem do assert',
  };
  // Nao precisam de excecao: `publica_v8.js` (tem alvo cravado por desenho, mas e o ID do
  // workflow na API do n8n, nao um ingress), `set_telegram_commands.js` e
  // `audita_alvo_execucoes.js` - falam com a API do Telegram e do n8n, nunca com o webhook.

  const arquivos = fs.readdirSync(alvoDir).filter(n => n.endsWith('.js')).sort();
  ok(arquivos.length > 30, 'a varredura ve o diretorio inteiro', arquivos.length + ' arquivo(s)');

  const semComentario = (txt) => txt.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  const cravados = [];
  for (const nome of arquivos) {
    const txt = fs.readFileSync(path.join(alvoDir, nome), 'utf8');
    const ruins = [];
    txt.split('\n').forEach((l, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(l)) return;                 // comentario nao vai a rede
      if (/['"`][^'"`]*\/webhook\/[^'"`]/.test(l)) ruins.push((i + 1) + ': ' + l.trim().slice(0, 70));
    });
    if (!ruins.length) continue;
    if (EXCECOES[nome]) {
      ok(!/\bfetch\s*\(/.test(semComentario(txt)),
        'excecao "' + nome + '" continua sem ir a rede (' + EXCECOES[nome] + ')');
      continue;
    }
    cravados.push(nome + ' -> ' + ruins.join(' | '));
  }
  ok(cravados.length === 0, 'nenhum .js do _teststand com ingress cravado (fora as excecoes declaradas)',
    cravados.join(' ;; '));

  // E o alvo de todo `fetch` do diretorio e um identificador conhecido.
  const PERMITIDOS = new Set([
    'WEBHOOK', // ingress do harness - o unico caminho legitimo ate o fluxo
    'url',     // parametro de helper generico (harness.rfetch, audita_alvo_execucoes)
    'API',     // base da API do n8n / do Telegram; nunca o ingress
  ]);
  const alvosEstranhos = [];
  for (const nome of arquivos) {
    const txt = semComentario(fs.readFileSync(path.join(alvoDir, nome), 'utf8'));
    for (const m of txt.matchAll(/\bfetch\(\s*([A-Za-z_$][\w$]*)/g)) {
      if (!PERMITIDOS.has(m[1])) alvosEstranhos.push(nome + ' -> alvo de request: ' + m[1]);
    }
  }
  ok(alvosEstranhos.length === 0, 'todo fetch do _teststand sai por WEBHOOK/url/API',
    alvosEstranhos.join(' ;; '));
}

// 7. E008 - o `teste_concorrencia.js` deriva o ingress do env, como todo o resto.
//
// Ele escreve no Postgres e dispara 4 callbacks por ciclo: NAO se executa aqui. A prova e
// estatica + um subprocesso que apenas IMPORTA o modulo e imprime a URL - por isso o arquivo
// tem de proteger a execucao com `require.main === module`. Se essa protecao cair, a checagem
// estatica reprova ANTES do import, e nenhum trafego sai.
{
  const conc = fs.readFileSync(path.join(alvoDir, 'teste_concorrencia.js'), 'utf8');
  const codigo = conc.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');

  const importa = /const\s*\{[^}]*\bWEBHOOK\b[^}]*\}\s*=\s*require\(['"]\.\/harness['"]\)/.test(codigo);
  ok(importa, 'teste_concorrencia importa o WEBHOOK do harness (nao monta a URL)');
  const protegido = /require\.main\s*===\s*module/.test(codigo);
  ok(protegido, 'teste_concorrencia so vai a rede quando executado direto (require.main === module)');
  ok(/module\.exports\s*=\s*\{[^}]*\bWEBHOOK\b/.test(codigo),
    'teste_concorrencia expoe o WEBHOOK para inspecao');

  if (importa && protegido) {
    const leAlvo = (env) => {
      const e = { ...process.env };
      if (env === undefined) delete e.IACHAT_TEST_PATH; else e.IACHAT_TEST_PATH = env;
      return execFileSync(process.execPath,
        ['-e', "process.stdout.write(require('./teste_concorrencia').WEBHOOK)"],
        { cwd: alvoDir, env: e, encoding: 'utf8' }).trim();
    };
    const evento = leAlvo('iachat-test-evento');
    ok(evento.endsWith('/webhook/iachat-test-evento'),
      'com IACHAT_TEST_PATH=iachat-test-evento a concorrencia bate no evento', evento);
    const v8c = leAlvo('iachat-test-v8');
    ok(v8c.endsWith('/webhook/iachat-test-v8'),
      'com IACHAT_TEST_PATH=iachat-test-v8 a concorrencia bate no v8', v8c);
    const semEnvC = leAlvo(undefined);
    ok(semEnvC.endsWith('/webhook/iachat-test'),
      'sem a env o default documentado continua iachat-test', semEnvC);
  } else {
    fails++;
    console.log('  FALHOU  nao da para inspecionar teste_concorrencia sem dispara-lo - import pulado de proposito');
  }
}

console.log(fails === 0 ? '\nOK — o alvo da Fase A segue o IACHAT_TEST_PATH' : '\n' + fails + ' falha(s)');
process.exit(fails ? 1 : 0);
