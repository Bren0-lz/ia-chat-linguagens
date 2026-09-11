// TESTE DO INSTRUMENTO — Fase B: alvo, nome da transcricao, N por teste e turno perdido.
//
// Escrito no T015, e cada checagem REPROVA a versao anterior do `bateria_completa_b.js`:
//
//   1. `const TR = './tr_bateria_b.md'` era CRAVADO. Rodar a Fase B no v8 sobrescreveria a
//      evidencia do v7.4 de 04/09, que o handoff §11 lista como nao-regeneravel. Agora o nome
//      sai de `alvo.js`, derivado do ingress.
//   2. Nao havia N por teste: tudo era "indicativo, N=1". Agora os 7 deterministicos medem
//      uma vez e os 22 qualitativos medem N vezes.
//   3. `llmRespondeu` deixava passar o TURNO PERDIDO. Quando o harness desiste, `postUpdate`
//      devolve null e `digest(null)` devolve `reply='(no runData)'` -- string NAO VAZIA. A
//      guarda antiga so olhava `!reply.trim()`, entao o turno perdido era julgado como se
//      fosse resposta: nos testes de NEGATIVA (C4, R5) isso vira PASSOU. Armadilha n.1.
//   4. `agregar` nao existia: 2 de 3 nao e PASSOU, e INSTAVEL.
//
//   node fluxos/_teststand/testa_bateria_b_n3.js
//   node fluxos/_teststand/testa_bateria_b_n3.js --estatico=<arquivo>   (so as checagens 1 e 2)
//
// O `--estatico` existe por uma razao aprendida da pior forma em 06/09: para PROVAR que este
// teste reprova a versao anterior, a tentativa obvia e copiar o arquivo antigo por cima e
// rodar. NAO FACA ISSO. A versao antiga executa a bateria ao ser REQUERIDA (a IIFE nao tinha
// guard `require.main`), e a primeira coisa que ela faz e `fs.writeFileSync(TR, ...)` com
// TR = './tr_bateria_b.md' -- ou seja, o proprio ato de testar apaga a evidencia de 04/09 que
// o handoff §11 protege. Aconteceu; o arquivo estava commitado e voltou por `git checkout`.
// Com `--estatico` a fonte antiga e LIDA, nunca carregada.
const fs = require('fs');
const path = require('path');

let fails = 0;
function ok(cond, nome, detalhe) {
  if (cond) console.log('  PASSOU  ' + nome);
  else { fails++; console.log('  FALHOU  ' + nome + (detalhe ? ' — ' + detalhe : '')); }
}

// O nome LEGITIMO de uma transcricao: o que `transcricaoDe` da para o ingress corrente,
// ou a variante datada (com desempate) que o `caminhoLivre` produz quando o base ja existe.
// Nada mais -- em especial, nao o nome de OUTRA versao.
function daFamilia(tr, base, testPath) {
  const canonico = require('./alvo').transcricaoDe(base, testPath);
  const semExt = canonico.replace(/\.md$/, '');
  const m = String(tr).match(/^(.*?)(?:_(\d{4})-(\d{2})-(\d{2})(?:-(\d+))?)?\.md$/);
  if (!m || m[1] !== semExt) return false;
  if (m[2] === undefined) return true;            // o proprio canonico
  const mes = Number(m[3]), dia = Number(m[4]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return false;
  return m[5] === undefined || Number(m[5]) >= 2; // desempate comeca em 2
}

const ESTATICO = (process.argv.find((a) => a.startsWith('--estatico=')) || '').split('=')[1] || '';
const src = fs.readFileSync(ESTATICO || path.join(__dirname, 'bateria_completa_b.js'), 'utf8');
if (ESTATICO) console.log('modo estatico — fonte analisada: ' + ESTATICO);
const linhasCodigo = src.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l));

// ---- 1. alvo e transcricao derivados do ingress -------------------------------------
{
  const cravadas = linhasCodigo.filter((l) => /['"`][^'"`]*\/webhook\//.test(l));
  ok(cravadas.length === 0, 'nenhuma URL /webhook/ cravada na Fase B',
    cravadas.map((l) => l.trim().slice(0, 70)).join(' | '));

  const trCravado = linhasCodigo.filter((l) => /['"`]\.?\/?tr_bateria_b[\w.-]*\.md['"`]/.test(l));
  ok(trCravado.length === 0, 'nenhum nome de transcricao cravado (o do v7.4 e evidencia)',
    trCravado.map((l) => l.trim().slice(0, 70)).join(' | '));

  ok(/transcricaoDe\(\s*'tr_bateria_b'\s*,\s*TEST_PATH\s*\)/.test(src),
    'a transcricao vem de alvo.js, derivada do IACHAT_TEST_PATH');

  const { rotuloDe, transcricaoDe } = require('./alvo');
  ok(transcricaoDe('tr_bateria_b', 'iachat-test') === './tr_bateria_b.md',
    'v7.4 -> tr_bateria_b.md (o nome historico de 04/09)');
  ok(transcricaoDe('tr_bateria_b', 'iachat-test-v8') === './tr_bateria_b_v8.md',
    'v8 -> tr_bateria_b_v8.md (nao sobrescreve a evidencia do v7.4)');
  ok(rotuloDe('iachat-test-v8') === 'v8', 'rotulo do ingress do v8 e v8');
}

// ---- 1b. o harness CARREGA sem credencial (T036) ------------------------------------
// Este teste entrou no `npm run gate`, e o gate tem de rodar em clone limpo. Enquanto o
// `harness.js` validava N8N_API_KEY/IACHAT_TEST_SECRET no TOPO, importa-lo para ler
// constantes matava o processo (`process.exit(1)`) em qualquer maquina sem `.env` --
// credencial exigida por um teste que nao faz uma requisicao sequer.
//
// A copia vai para um diretorio TEMPORARIO de proposito: o `fromDotEnv` procura o `.env`
// dois niveis acima do arquivo, entao so fora do repo a ausencia de credencial e real.
// Nada e escrito na raiz (a evidencia `tr_*.md` nao e regeneravel).
{
  const os = require('os');
  const { execFileSync } = require('child_process');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iachat-harness-'));
  try {
    const dir = path.join(tmp, 'fluxos', '_teststand');
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(path.join(__dirname, 'harness.js'), path.join(dir, 'harness.js'));
    const limpo = { ...process.env };
    delete limpo.N8N_API_KEY; delete limpo.IACHAT_TEST_SECRET;
    let saida = '', codigo = 0;
    try {
      saida = execFileSync(process.execPath,
        ['-e', "const h=require('./harness');console.log('CARREGOU ' + typeof h.digest)"],
        { cwd: dir, env: limpo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { codigo = e.status || 1; saida = String(e.stdout || '') + String(e.stderr || ''); }
    ok(codigo === 0 && /CARREGOU function/.test(saida),
      'sem N8N_API_KEY e sem .env, requerer o harness NAO mata o processo',
      'codigo=' + codigo + ' saida=' + saida.trim().slice(0, 90));

    // A outra direcao: quem vai a REDE sem credencial continua parando, com a mensagem.
    let saidaRede = '', codigoRede = 0;
    try {
      execFileSync(process.execPath,
        ['-e', "require('./harness').jget('http://127.0.0.1:1/x').then(()=>console.log('FOI'))"],
        { cwd: dir, env: limpo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { codigoRede = e.status || 1; saidaRede = String(e.stdout || '') + String(e.stderr || ''); }
    ok(codigoRede === 1 && /N8N_API_KEY ausente/.test(saidaRede),
      'ao primeiro uso de rede sem chave, o harness ainda para com a mensagem clara',
      'codigo=' + codigoRede + ' saida=' + saidaRede.trim().slice(0, 90));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ---- 2. N por teste, declarado e coerente -------------------------------------------
const TESTES = [
  'A5', 'PS1', 'C16', 'C17',
  'C1', 'C2', 'C3', 'C4', 'C7', 'C9', 'C10', 'C12', 'C14', 'C15',
  'R4', 'R5',
  'T1', 'T2', 'T3', 'T4', 'T6', 'T8', 'T9', 'T12', 'T13', 'T14', 'T15', 'T16', 'T17',
];
{
  ok(TESTES.length === 29, 'a Fase B tem 29 testes', 'lista com ' + TESTES.length);
  const ausentes = TESTES.filter((id) => !new RegExp("'" + id + "'").test(src));
  ok(ausentes.length === 0, 'os 29 ids aparecem no script', ausentes.join(','));
  ok(/const DETERMINISTICOS = \[/.test(src), 'o script declara quais testes sao deterministicos');
  ok(/N_POR_TESTE/.test(src), 'o script declara o N por teste');
  // Requerir o modulo NAO pode disparar a bateria nem gravar a transcricao.
  ok(/if \(require\.main === module\)/.test(src) && !/^\}\)\(\)\.catch/m.test(src),
    'a bateria so roda quando o arquivo E o script (nao ao ser requerido)');
  ok(/const MODO_SCRIPT = require\.main === module/.test(src),
    'escrever() so grava quando o arquivo e o script rodando');
}

if (ESTATICO) {
  console.log(fails === 0 ? '\nOK (estatico)' : '\n' + fails + ' falha(s) — modo estatico');
  process.exit(fails ? 1 : 0);
}

// A partir daqui o modulo e carregado: ele le o .env e o harness (que exige N8N_API_KEY).
// Requerido como modulo, `bateria_completa_b.js` NAO roda a bateria e NAO grava transcricao.
const B = require('./bateria_completa_b');
{
  const antesDeterministicos = ['A5', 'PS1', 'C16', 'C17', 'C12', 'T4', 'T14'];
  ok(JSON.stringify(B.DETERMINISTICOS) === JSON.stringify(antesDeterministicos),
    'os 7 deterministicos sao os que leem estado no banco', JSON.stringify(B.DETERMINISTICOS));
  ok(B.DETERMINISTICOS.every((id) => TESTES.includes(id)),
    'todo deterministico e um teste real da Fase B');
  ok(B.DETERMINISTICOS.every((id) => B.N_POR_TESTE(id) === 1),
    'deterministico mede N=1');
  const quali = TESTES.filter((id) => !B.DETERMINISTICOS.includes(id));
  ok(quali.length === 22, 'sobram 22 qualitativos', String(quali.length));
  ok(quali.every((id) => B.N_POR_TESTE(id) === 3),
    'qualitativo mede N=3 por default', JSON.stringify(quali.map((id) => id + '=' + B.N_POR_TESTE(id))));
  // O TR tem de pertencer a FAMILIA do ingress corrente -- canonico ou datado pelo
  // `caminhoLivre` (T031). Cravar os dois nomes historicos aqui reprovava o produto por
  // fazer a coisa certa: com `tr_bateria_b.md` ja no disco, o nome correto passa a ser
  // `tr_bateria_b_2026-09-11.md`. O que o assert continua protegendo (e o unico que
  // importa) e que o nome deriva do ingress: TR de OUTRA versao segue reprovando.
  const { transcricaoDe: tDe } = require('./alvo');
  const ingress = process.env.IACHAT_TEST_PATH || 'iachat-test';
  ok(daFamilia(B.TR, 'tr_bateria_b', ingress),
    'o TR exposto pertence a familia do ingress corrente (canonico ou datado)',
    String(B.TR) + ' vs familia de ' + tDe('tr_bateria_b', ingress));
}

// ---- 2b. a familia de nomes reprova o que tem de reprovar ---------------------------
// Detector novo se testa nas DUAS direcoes (handoff §5.6): aceitar o datado sem aceitar
// o nome de outra versao. Sem isto, "afrouxar o assert" e indistinguivel de conserta-lo.
{
  const aceita = (tr, ing) => daFamilia(tr, 'tr_bateria_b', ing);
  ok(aceita('./tr_bateria_b.md', 'iachat-test'), 'v7.4: aceita o nome historico');
  ok(aceita('./tr_bateria_b_2026-09-11.md', 'iachat-test'), 'v7.4: aceita o datado do T031');
  ok(aceita('./tr_bateria_b_2026-09-11-3.md', 'iachat-test'), 'v7.4: aceita o desempate');
  ok(aceita('./tr_bateria_b_v8.md', 'iachat-test-v8'), 'v8: aceita o nome do v8');
  ok(aceita('./tr_bateria_b_v8_2026-09-11.md', 'iachat-test-v8'), 'v8: aceita o datado do v8');
  ok(aceita('./tr_bateria_b_v8_2026-09-11-2.md', 'iachat-test-v8'), 'v8: aceita o desempate do v8');

  ok(!aceita('./tr_bateria_b.md', 'iachat-test-v8'),
    'rodando no v8, o TR do v7.4 REPROVA (era exatamente a armadilha n.22)');
  ok(!aceita('./tr_bateria_b_v8.md', 'iachat-test'),
    'rodando no v7.4, o TR do v8 REPROVA');
  ok(!aceita('./tr_bateria_b_v81.md', 'iachat-test-v8'),
    'nome de outra versao REPROVA mesmo parecendo o do v8');
  ok(!aceita('./tr_jornada_v8.md', 'iachat-test-v8'), 'transcricao de outra bateria REPROVA');
  ok(!aceita('./tr_bateria_b_2026-13-99.md', 'iachat-test'), 'sufixo que nao e data REPROVA');
  ok(!aceita('./tr_bateria_b_final.md', 'iachat-test'), 'sufixo livre REPROVA');
}

// ---- 3. turno perdido NAO e aprovacao -----------------------------------------------
{
  const { digest } = require('./harness');
  const perdido = digest(null); // exatamente o que sai de um postUpdate que desistiu
  ok(perdido.reply === '(no runData)',
    'digest(null) devolve uma string NAO VAZIA — e por isso que a guarda antiga passava',
    JSON.stringify(perdido.reply));

  const antes = B.turnos.perdidos;
  const r1 = B.llmRespondeu(perdido, 'TESTE_PERDIDO');
  ok(r1 === false, 'turno perdido -> llmRespondeu()=false (INCONCLUSIVO, nunca aprovacao)');
  ok(B.turnos.perdidos === antes + 1, 'turno perdido e CONTADO em turnos.perdidos');

  const antesVazios = B.turnos.vazios;
  const r2 = B.llmRespondeu({ ran: ['TEST Ingress', 'Carregar Aluno'], reply: '   ', errs: [] }, 'TESTE_VAZIO');
  ok(r2 === false, 'resposta vazia -> llmRespondeu()=false');
  ok(B.turnos.vazios === antesVazios + 1, 'turno vazio e CONTADO em turnos.vazios');

  const r3 = B.llmRespondeu({ ran: ['TEST Ingress', 'Agente Conversa'], reply: '[CONVERSA] hi there', errs: [] }, 'TESTE_OK');
  ok(r3 === true, 'resposta real -> llmRespondeu()=true');
}

// ---- 4. agregacao: 2 de 3 nao e PASSOU ----------------------------------------------
{
  const a = (v) => B.agregar(v.map((ok_, i) => ({ id: 'X', ok: ok_, rodada: i + 1 })))[0];
  ok(a([true, true, true]).veredito === 'PASSOU', '3/3 verdadeiro -> PASSOU');
  ok(a([false, false, false]).veredito === 'FALHOU', '0/3 -> FALHOU');
  ok(a([true, true, false]).veredito === 'INSTAVEL', '2 de 3 -> INSTAVEL, nao PASSOU');
  ok(a(['revisar', 'revisar', 'revisar']).veredito === 'REVISAR', '3 revisar -> REVISAR');
  ok(a([null, null, null]).veredito === 'INCONCLUSIVO', '3 inconclusivos -> INCONCLUSIVO');

  const m = a([true, true, false]);
  ok(Math.abs(m.media - 2 / 3) < 1e-9, 'media do binario = 2/3', String(m.media));
  ok(Math.abs(m.dp - Math.sqrt(2 / 9)) < 1e-9, 'desvio populacional = sqrt(2/9)', String(m.dp));

  // Rodada inconclusiva nao entra na media: ausencia de medida nao e zero.
  const p = a([true, null, true]);
  ok(p.media === 1 && p.n === 3 && p.incon === 1,
    'inconclusivo fica fora da media, mas aparece na contagem', JSON.stringify(p));
}

console.log(fails === 0 ? '\nOK — instrumento da Fase B: alvo, N por teste e turno perdido' : '\n' + fails + ' falha(s)');
process.exit(fails ? 1 : 0);
