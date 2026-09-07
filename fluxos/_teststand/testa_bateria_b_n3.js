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
  ok(B.TR === './tr_bateria_b_v8.md' || B.TR === './tr_bateria_b.md',
    'o modulo expoe o TR derivado do ingress corrente', String(B.TR));
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
