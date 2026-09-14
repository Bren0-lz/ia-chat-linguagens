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

// ---- 5. T17: a regua pergunta o que o produto decidiu (E012) ------------------------
// Ate 14/09 o T17 perguntava "o TOM difere entre as personas?" e saia sempre REVISAR. A
// pergunta contradizia a decisao de 10/09 (handoff §5.2 — o Professor NAO tem persona) e a
// propria regua offline (`testa_explicacao_sem_persona.js`, que exige texto IDENTICO entre as
// 5 personas). Na rodada de 14/09 o produto fez a coisa certa (DEBATER e BUDDY com o corpo
// identico) e a transcricao induzia quem lesse a marcar FALHOU.
//
// Duas coisas sao conferidas aqui, nas DUAS direcoes (§5.6): o veredito APROVA corpo igual e
// REPROVA corpo diferente; e ele concorda com `testa_explicacao_sem_persona.js` rodando sobre
// a saida do no de producao — as duas reguas nao podem pedir coisas opostas.
(function t17() {
  // Sem o veredito exportado — que e o caso da versao ANTERIOR da Fase B, onde o T17 saia
  // 'revisar' cravado — nao ha o que medir aqui: uma reprovacao limpa vale mais que um
  // TypeError no meio da suite.
  if (typeof B.vereditoT17 !== 'function' || typeof B.corpoProfessor !== 'function'
      || !B.RUBRICA_T17 || !B.RUBRICA) {
    ok(false, 'a Fase B expoe o veredito automatico do T17 (vereditoT17, corpoProfessor, RUBRICA_T17)',
      'versao anterior: T17 = REVISAR cravado, com a rubrica invertida (E012)');
    return;
  }
  ok(true, 'a Fase B expoe o veredito automatico do T17 (E012)');

  const NO_BANCO = 'Explicação do Banco';
  const RAN_BANCO = ['TEST Ingress', 'Carregar Aluno', 'Professor Engine', NO_BANCO];
  const FB = '📚 Modo Professor — nível B2. Vamos começar a trilha!';
  // Corpo copiado da evidencia de 14/09 (tr_bateria_b_evento_2026-09-14-3.md).
  const CORPO = [
    '<b>O QUE É E QUANDO USAR</b>',
    'Usamos o <i>Present Perfect Continuous</i> para falar de uma ação que começou no passado.',
    '',
    '<b>AS FORMAS</b>',
    'A estrutura é sempre <i>sujeito + have/has + been + verbo-ING</i>.',
  ].join('\n');
  // O `reply` do digest: [prof.feedback] + [PROFESSOR], e o proprio no prefixa o feedback ao corpo.
  const replyDe = (corpo, fb) => '[prof.feedback] ' + (fb === undefined ? FB : fb)
    + '\n[PROFESSOR] ' + (fb === undefined ? FB : fb) + '\n\n' + corpo;
  const saidaDe = (corpo, opts) => ({
    reply: replyDe(corpo, (opts || {}).fb),
    ran: (opts || {}).ran || RAN_BANCO,
  });

  // 5a. a pergunta que fica na transcricao
  // A pergunta velha so pode sobreviver em COMENTARIO (a memoria do defeito): o que conta e
  // a rubrica que vai para a transcricao e o codigo que a usa.
  ok(!/TOM difere/i.test(B.RUBRICA_T17) && !/TOM difere/i.test(linhasCodigo.join('\n')),
    'a rubrica do T17 nao pergunta mais se o TOM difere entre as personas',
    String(B.RUBRICA_T17).slice(0, 80));
  ok(/MESMA/.test(B.RUBRICA_T17) && /APROVA/.test(B.RUBRICA_T17) && /REPROVA/.test(B.RUBRICA_T17),
    'a rubrica diz o que aprovar e o que reprovar, em vez de so fazer uma pergunta',
    String(B.RUBRICA_T17).slice(0, 120));
  ok(B.RUBRICA.T17 === B.RUBRICA_T17, 'o mapa RUBRICA usa a mesma string (uma regua so)');

  // 5b. veredito automatico: aprova igual, reprova diferente
  const iguais = { debater: saidaDe(CORPO), buddy: saidaDe(CORPO) };
  const vIguais = B.vereditoT17(iguais);
  ok(vIguais.ok === true, 'explicacoes IGUAIS (a evidencia de 14/09) -> PASSOU', JSON.stringify(vIguais));
  ok(/MESMO corpo/.test(vIguais.detalhe), 'a linha do PASSOU diz que o corpo foi o mesmo');

  const adulterado = CORPO.replace('<b>O QUE É E QUANDO USAR</b>',
    'Fala, parceiro! Bora nessa 😎\n<b>O QUE É E QUANDO USAR</b>');
  const vDif = B.vereditoT17({ debater: saidaDe(CORPO), buddy: saidaDe(adulterado) });
  ok(vDif.ok === false, 'corpo adulterado por persona -> FALHOU', JSON.stringify(vDif).slice(0, 140));
  ok(/adulterado aluno a aluno/.test(vDif.detalhe) && /char \d+/.test(vDif.detalhe),
    'a linha do FALHOU diz o que houve e onde divergiu');

  // 5c. o que NAO entra no veredito: o feedback do engine e interface e pode variar
  const vFb = B.vereditoT17({
    debater: saidaDe(CORPO, { fb: '📚 Modo Professor — nível B2. Vamos começar a trilha!' }),
    buddy: saidaDe(CORPO, { fb: '📚 Tópico 3/10 — Present perfect continuous' }),
  });
  ok(vFb.ok === true, 'feedback do engine diferente, corpo igual -> ainda PASSOU', JSON.stringify(vFb).slice(0, 120));

  // 5d. explicacao que NAO veio do banco: texto do LLM varia por natureza, entao REVISAR
  const RAN_LLM = ['TEST Ingress', 'Carregar Aluno', 'Professor Engine', 'Agente Professor', 'Parse Professor'];
  const vLlm = B.vereditoT17({
    debater: saidaDe(CORPO, { ran: RAN_LLM }),
    buddy: saidaDe(adulterado, { ran: RAN_LLM }),
  });
  ok(vLlm.ok === 'revisar', 'explicacao escrita pelo LLM -> REVISAR, nao FALHOU', JSON.stringify(vLlm.ok));
  ok(/nao veio do banco/.test(vLlm.detalhe), 'e o motivo do REVISAR fica na linha');
  const vLlmIgual = B.vereditoT17({ debater: saidaDe(CORPO, { ran: RAN_LLM }), buddy: saidaDe(CORPO, { ran: RAN_LLM }) });
  ok(vLlmIgual.ok !== true, 'REVISAR nunca vira PASSOU nem quando os textos coincidem', JSON.stringify(vLlmIgual.ok));

  // 5e. ausencia de medida nao e aprovacao (armadilha n.1)
  ok(B.vereditoT17({ debater: saidaDe(CORPO) }).ok === null, 'uma persona so -> INCONCLUSIVO');
  ok(B.vereditoT17({}).ok === null, 'nenhuma saida -> INCONCLUSIVO');
  const vVazio = B.vereditoT17({
    debater: { reply: '[prof.feedback] ' + FB, ran: RAN_BANCO },
    buddy: { reply: '[prof.feedback] ' + FB, ran: RAN_BANCO },
  });
  ok(vVazio.ok === null, 'sem corpo para comparar -> INCONCLUSIVO, nao PASSOU', JSON.stringify(vVazio.ok));

  // 5f. o corpo isolado e mesmo o corpo: o feedback prefixado sai, o resto fica
  const corpoIsolado = B.corpoProfessor(replyDe(CORPO));
  ok(corpoIsolado === CORPO, 'corpoProfessor() devolve o corpo sem o feedback do engine',
    JSON.stringify(corpoIsolado.slice(0, 50)));

  // 5g. COERENCIA COM `testa_explicacao_sem_persona.js`: as duas reguas sobre a MESMA saida
  // do no de producao. Se uma aprovar o que a outra reprova, o defeito da E012 voltou.
  const fluxo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'IAChat_Telegram_v8.json'), 'utf8'));
  const noBanco = fluxo.nodes.find((n) => n.name === NO_BANCO);
  ok(!!noBanco, 'o no "' + NO_BANCO + '" existe no v8 (e quem serve o corpo revisado)');
  const rodaNo = (persona, corpo) => {
    const eng = { persona, topicNum: 1, topicTot: 10, name: 'Yuki', topicTitle: 'Present perfect continuous', feedback: FB };
    const $ = (n) => ({ first: () => ({ json: n === 'Professor Engine' ? eng : {} }) });
    const $input = { first: () => ({ json: { body: corpo } }) };
    return new Function('$', '$input', noBanco.parameters.jsCode)($, $input)[0].json.finalText;
  };
  const PERSONAS = ['buddy', 'coach', 'comedian', 'debater', 'formal'];
  // Regua do testa_explicacao_sem_persona.js: um unico texto distinto entre as personas.
  const reguaOffline = (textos) => new Set(textos).size === 1;
  const fonteOffline = fs.readFileSync(path.join(__dirname, 'testa_explicacao_sem_persona.js'), 'utf8');
  ok(/distintos === 1/.test(fonteOffline) && /MESMA explicacao/.test(fonteOffline),
    'a regua offline continua exigindo UMA unica versao (e o que esta secao espelha)');

  const reais = PERSONAS.map((p) => rodaNo(p, CORPO));
  const saidasReais = {};
  PERSONAS.forEach((p, i) => {
    saidasReais[p] = { reply: '[prof.feedback] ' + FB + '\n[PROFESSOR] ' + reais[i], ran: RAN_BANCO };
  });
  ok(reguaOffline(reais) === true && B.vereditoT17(saidasReais).ok === true,
    'produto de hoje: as duas reguas APROVAM a saida real do no',
    'offline=' + reguaOffline(reais) + ' T17=' + JSON.stringify(B.vereditoT17(saidasReais).ok));

  const adulteradas = PERSONAS.map((p) => rodaNo(p, 'Oi, ' + p + '! ' + CORPO));
  const saidasAdulteradas = {};
  PERSONAS.forEach((p, i) => {
    saidasAdulteradas[p] = { reply: '[prof.feedback] ' + FB + '\n[PROFESSOR] ' + adulteradas[i], ran: RAN_BANCO };
  });
  ok(reguaOffline(adulteradas) === false && B.vereditoT17(saidasAdulteradas).ok === false,
    'corpo variando por aluno: as duas reguas REPROVAM',
    'offline=' + reguaOffline(adulteradas) + ' T17=' + JSON.stringify(B.vereditoT17(saidasAdulteradas).ok));

  // 5h. a versao anterior da Fase B reprova isto: ela nao tinha veredito nenhum para o T17
  // (era `reg('T17', 'revisar', ...)` cravado) e a rubrica pedia o oposto do que o produto quer.
  ok(!/reg\('T17', 'revisar'/.test(src),
    'o T17 nao registra mais REVISAR cravado — o veredito sai da comparacao');
  ok(/vereditoT17\(saidas\)/.test(src), 'o bloco T17 da bateria usa o veredito automatico');
})();

console.log(fails === 0 ? '\nOK — instrumento da Fase B: alvo, N por teste e turno perdido' : '\n' + fails + ' falha(s)');
process.exit(fails ? 1 : 0);
