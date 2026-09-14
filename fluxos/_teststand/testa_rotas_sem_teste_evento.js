// E004 — as rotas que sobraram sem teste, no arquivo do EVENTO.
//
// No evento nao existe teste de nivelamento (E002: escolher o nivel ja leva a personalidade).
// Sobraram seis gatilhos apontando para um fluxo que nao existe mais: `/nivel`, `/pausa`,
// `/continuar`, `pl_pause`, `pl_resume` e `ans_*`. Num evento com usuario real de pe, o pior
// resultado nao e um texto feio: e o SILENCIO — a pessoa acha que o bot travou e leva isso
// para o formulario de avaliacao. Por isso este teste cobra, para CADA gatilho:
//
//   - rota registrada pelo `Roteador Mestre` (armadilha no 3: nunca rotular pela ordem de
//     envio) e que essa rota seja uma saida existente do switch `Rota`;
//   - resposta NAO vazia produzida pelo no de codigo daquela rota (armadilha no 1: resposta
//     vazia nao e aprovacao);
//   - nenhum dos seis cai em `restart`, isto e, nenhum monta o teste de 10 questoes.
//
// Alem disso:
//   (a) `/nivel` REABRE a escolha de nivel: o mesmo convite (byte a byte) e o mesmo teclado de
//       seis botoes da E003, sem construir questao nenhuma;
//   (b) quem ja esta com o perfil completo troca de nivel SEM perder persona, interesses, modo
//       nem voltar ao cadastro (`onboarding` continua 'done'), e sem ser reperguntado sobre a
//       personalidade — o `Após Gabarito` para a cadeia quando o Placement Engine marca
//       `relevel`.
//
// DECISAO DECLARADA (herdada da E002, fechada aqui): o ramo `restart` do `Placement Engine` —
// que e o MOTOR ADAPTATIVO inteiro — continua no no do evento, mas nenhum gatilho do produto
// chega nele. A cobertura do motor (B1/B2/B3/B6) passa a entrar pela chamada DIRETA ao no com
// `subroute='restart'`, que e o que o `regressao_v7.4.js` ja faz (`plStart`/`ATALHO_EVENTO`).
// Nao se removeu caso de teste nenhum: o evento e temporario, e o teste volta depois.
// Este arquivo guarda a outra ponta da decisao — que NENHUM gatilho do evento monte questao.
//
// Contra a versao anterior do arquivo do evento ele tem de REPROVAR: la `/nivel` caia em
// `placement:restart` e montava "Questão 1/10", e `ans_*` caia na conversa.
//
// Roda offline: so le o JSON e executa jsCode fora do n8n.
// Uso:  node fluxos/_teststand/testa_rotas_sem_teste_evento.js [caminho/do/fluxo.json]
const fs = require('fs');
const path = require('path');

const FLOW = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_evento.json');
const flow = JSON.parse(fs.readFileSync(FLOW, 'utf8'));
const no = (nome) => flow.nodes.find(n => n.name === nome);
const code = {};
for (const n of flow.nodes) if (n.parameters && n.parameters.jsCode) code[n.name] = n.parameters.jsCode;

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  x ' + msg); } else console.log('  ok ' + msg); }
function fim() {
  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)'
    : 'PASSOU: nenhum gatilho do evento fica mudo, e /nivel reabre a escolha sem montar teste'));
  process.exit(fails ? 1 : 0);
}

console.log('Fluxo sob teste: ' + path.basename(FLOW));
for (const nome of ['Roteador Mestre', 'Mensagem Sistema', 'Etapa de Cadastro', 'Triagem de Nome',
                    'Placement Engine', 'Após Gabarito'])
  ok(!!code[nome], 'o fluxo tem o no de codigo "' + nome + '"');
for (const nome of ['Rota', 'Enviar Pergunta Nível', 'Tipo de Envio Cadastro'])
  ok(!!no(nome), 'o fluxo tem o no "' + nome + '"');
if (fails) fim();

// ---------------- infraestrutura: rodar os nos fora do n8n ----------------
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const exam = [];
let qid = 1;
for (const L of LEVELS) for (let i = 0; i < 10; i++)
  exam.push({ id: qid++, cefr_level: L, skill: 'grammar', qtype: i % 2 ? 'written' : 'mc',
    prompt: L + ' q' + i, options: i % 2 ? null : ['am', 'is', 'are', 'be'],
    answer: i % 2 ? 'are' : 'is', explanation: 'exp' });

function refFn(refs) {
  return (name) => ({
    first: () => ({ json: refs[name] }),
    all: () => (Array.isArray(refs[name]) ? refs[name] : [refs[name]]).map(j => ({ json: j })),
  });
}
function roda(nome, refs, item, all) {
  const $ = refFn(refs);
  const $input = { item: { json: item }, all: () => (all || [item]).map(j => ({ json: j })) };
  return new Function('$', '$input', '$json', code[nome] + '\n')($, $input, item);
}

// estado do aluno ja com o onboarding concluido (o caso do evento: escolheu nivel, persona e
// interesses, e esta conversando)
function alunoPronto(extra) {
  return Object.assign({
    userId: 990123456, name: 'Kaique', age: 24, onboarding: 'done', level: 'A2', mode: 'chat',
    profile: { level: 'A2', persona: 'coach', interests: ['games', 'music'],
               inferred_interests: ['futebol'], themes: {} },
    placement_state: null, teacher_state: null, prev_update_id: 10, xp: 30, streak_count: 2,
  }, extra || {});
}
// o que o `Normalizar` entrega
function update(o) {
  return Object.assign({ chatId: 990123456, userId: 990123456, updateId: 11, type: 'text',
    text: '', isCommand: false, command: '', callbackData: '', firstName: 'Kaique' }, o);
}
function comando(cmd) { return update({ type: 'text', text: cmd, isCommand: true, command: cmd }); }
function callback(cb) { return update({ type: 'callback', text: '', callbackData: cb }); }

function rotear(n, s) {
  return roda('Roteador Mestre', { 'Normalizar': n }, s).json;
}

// saidas declaradas do switch `Rota` — rota fora daqui e item perdido no n8n
const ROTAS = ((no('Rota').parameters.rules || {}).values || []).map(v => v.outputKey);

// Executa o no de codigo da rota e devolve o texto que o aluno receberia.
function respostaDa(d) {
  if (d.route === 'system_msg') return String(roda('Mensagem Sistema', {}, d).json.sysText || '');
  if (d.route === 'onboarding') {
    const t = roda('Triagem de Nome', {}, d).json;          // passa batido fora de awaiting_name
    return String(roda('Etapa de Cadastro', {}, t).json.reply || '');
  }
  if (d.route === 'placement') {
    const r = roda('Placement Engine', { 'Roteador Mestre': d }, exam[0], exam).json;
    return String(r.text || '') + String(r.gabarito || '');
  }
  if (d.route === 'conversa') return '';  // depende do LLM: aqui isso e reprovacao, nao aprovacao
  return '';
}

// ---------------- 1. os seis gatilhos: rota registrada e resposta nao vazia ----------------
console.log('\n== os seis gatilhos que sobraram sem teste ==');
const GATILHOS = [
  ['/nivel', comando('/nivel')],
  ['/pausa', comando('/pausa')],
  ['/continuar', comando('/continuar')],
  ['pl_pause', callback('pl_pause')],
  ['pl_resume', callback('pl_resume')],
  ['ans_A', callback('ans_A')],
];
for (const par of GATILHOS) {
  const nome = par[0];
  const d = rotear(par[1], alunoPronto());
  ok(!!d.route, nome + ': o Roteador registrou uma rota (foi ' + JSON.stringify(d.route) + ')');
  ok(ROTAS.indexOf(d.route) >= 0, nome + ': a rota "' + d.route + '" e uma saida do switch "Rota"');
  ok(d.route !== 'conversa', nome + ': nao cai na conversa (o LLM receberia um gatilho de teste)');
  ok(d.subroute !== 'restart', nome + ': NAO monta o teste de 10 questoes (subroute != restart)');
  const txt = respostaDa(d);
  ok(txt.trim().length > 0, nome + ': a resposta nao e vazia (armadilha no 1)');
  ok(!/Quest(ã|a)o\s*\d+\s*\/\s*\d+/i.test(txt), nome + ': nenhuma questao no que o aluno recebe');
  if (nome !== '/nivel') {
    ok(/n[ãa]o (tem|h[áa])/i.test(txt), nome + ': diz que nao ha teste em andamento — ' + JSON.stringify(txt.slice(0, 48)));
    ok(/\/nivel/.test(txt) || /mensagem/i.test(txt), nome + ': aponta o que fazer (conversar ou /nivel)');
    ok(txt.split('\n').filter(l => l.trim()).length === 1, nome + ': responde UMA linha');
  }
}

// ---------------- 2. /nivel reabre a escolha: mesmo convite, mesmos seis botoes ----------------
console.log('\n== /nivel reabre a escolha de nivel ==');
const dNivel = rotear(comando('/nivel'), alunoPronto());
ok(dNivel.route === 'onboarding' && dNivel.subroute === 'relevel',
   '/nivel roteia para onboarding:relevel (foi ' + dNivel.route + ':' + dNivel.subroute + ')');
const triado = roda('Triagem de Nome', {}, dNivel).json;
ok(!triado.nameCheck || triado.nameCheck.active === false,
   '/nivel: a triagem de nome nao se ativa (nao e cadastro)');
const cad = roda('Etapa de Cadastro', {}, triado).json;
ok(cad.sendKind === 'level_pick', '/nivel: sendKind e "level_pick" (foi ' + cad.sendKind + ')');
ok(cad.next === 'done', '/nivel de quem ja terminou: onboarding continua "done" (foi ' + cad.next + ')');
ok(/onboarding='done'/.test(String(cad.sql)), '/nivel: o SQL nao volta o aluno para o cadastro');
ok(!/name=/.test(String(cad.sql)) && !/age=/.test(String(cad.sql)), '/nivel: o SQL nao mexe em nome nem idade');
ok(!/profile=/.test(String(cad.sql)), '/nivel: o SQL nao mexe no profile (persona e interesses intactos)');

// o convite e o MESMO que o participante viu na primeira vez
const retomada = roda('Etapa de Cadastro', {},
  { userId: 990123456, onboarding: 'placement_intro', text: 'oi' }).json;
const depoisDaIdade = roda('Etapa de Cadastro', {},
  { userId: 990123456, onboarding: 'awaiting_age', text: '24' }).json;
ok(String(cad.reply) === String(retomada.reply),
   '/nivel mostra o MESMO convite da escolha de nivel (byte a byte)');
ok(String(depoisDaIdade.reply).indexOf(String(cad.reply)) >= 0,
   'o convite de /nivel e o mesmo texto oferecido logo apos a idade');
ok(String(cad.reply).indexOf('Questão') < 0, '/nivel: o convite nao traz questao');

// o teclado: o no que envia esse convite e o mesmo `Enviar Pergunta Nível` da E003
const envio = no('Enviar Pergunta Nível');
ok(/Etapa de Cadastro/.test(String(envio.parameters.text)),
   'o teclado de nivel mostra justamente a `reply` da `Etapa de Cadastro`');
const rows = ((envio.parameters.inlineKeyboard || {}).rows) || [];
const cbs = [];
for (const r of rows) for (const b of ((r.row && r.row.buttons) || []))
  cbs.push(String((b.additionalFields || {}).callback_data || ''));
ok(cbs.length === 6 && new Set(cbs).size === 6, '/nivel reabre com os SEIS botoes (tem ' + cbs.length + ')');
for (const L of LEVELS) ok(cbs.indexOf('pl_start_' + L) >= 0, 'o botao pl_start_' + L + ' esta la');
// e o switch que o alcanca aceita o sendKind que a Etapa de Cadastro produziu
const chavesCad = (((no('Tipo de Envio Cadastro').parameters.rules) || {}).values || []).map(v => v.outputKey);
const iCad = chavesCad.indexOf(String(cad.sendKind));
ok(iCad >= 0, 'o "Tipo de Envio Cadastro" tem a saida "' + cad.sendKind + '"');
const connCad = flow.connections['Tipo de Envio Cadastro'];
const destino = (iCad >= 0 && connCad && connCad.main && connCad.main[iCad] && connCad.main[iCad][0])
  ? connCad.main[iCad][0].node : null;
ok(destino === 'Enviar Pergunta Nível',
   'essa saida esta ligada ao "Enviar Pergunta Nível" (foi ' + destino + ')');

// ---------------- 3. trocar de nivel nao quebra o resto do perfil ----------------
console.log('\n== trocar de nivel com o perfil completo ==');
const antes = alunoPronto();
// o participante toca num botao depois do /nivel; o onboarding dele continua 'done'
const dBotao = rotear(callback('pl_start_C1'), antes);
ok(dBotao.route === 'placement' && dBotao.subroute === 'start',
   'pl_start_C1 com onboarding="done" chega ao atalho (foi ' + dBotao.route + ':' + dBotao.subroute + ')');
const pe = roda('Placement Engine', { 'Roteador Mestre': dBotao }, exam[0], exam).json;
const sql = String(pe.sql || '');
ok(/\blevel='C1'/.test(sql), 'grava o nivel novo (level=C1)');
ok(!/onboarding=/.test(sql), 'NAO volta o aluno para o cadastro (nenhum onboarding= no SQL)');
ok(!/INSERT INTO placement_attempts/i.test(sql), 'nao registra tentativa de teste');
ok(!/placement_state='/.test(sql), 'nao monta estado de teste');
const mProf = sql.match(/profile='(.*?)'::jsonb/s);
ok(!!mProf, 'o SQL regrava o profile');
if (mProf) {
  const prof = JSON.parse(mProf[1].replace(/''/g, "'"));
  ok(prof.persona === 'coach', 'a persona sobrevive a troca de nivel (foi ' + prof.persona + ')');
  ok(JSON.stringify(prof.interests) === JSON.stringify(['games', 'music']),
     'os interesses sobrevivem (foi ' + JSON.stringify(prof.interests) + ')');
  ok(JSON.stringify(prof.inferred_interests) === JSON.stringify(['futebol']),
     'os interesses inferidos sobrevivem');
  ok(prof.level === 'C1', 'o profile.level acompanha o nivel novo');
}
ok(!/mode=/.test(sql) && !/teacher_state=/.test(sql), 'modo e progresso do Professor ficam como estao');
const visivel = String(pe.text || '') + String(pe.gabarito || '');
ok(visivel.trim().length > 0, 'a confirmacao da troca nao e vazia');
ok(visivel.indexOf('C1') >= 0, 'a confirmacao cita o nivel novo');
ok(!/Quest(ã|a)o\s*\d+\s*\/\s*\d+/i.test(visivel), 'a troca nao monta questao');
ok(pe.relevel === true, 'o engine marca `relevel` (e o que segura a pergunta de personalidade)');

// o `Após Gabarito` para a cadeia: quem ja escolheu persona nao e perguntado de novo
const paraAqui = roda('Após Gabarito', { 'Placement Engine': pe }, pe);
ok(Array.isArray(paraAqui) && paraAqui.length === 0,
   'o "Após Gabarito" para a cadeia na troca de nivel (nao repergunta a personalidade)');
const conexao = flow.connections['Após Gabarito'];
ok(!!conexao && conexao.main[0].some(x => x.node === 'Enviar Pergunta Persona'),
   'e ele mesmo que alimenta o "Enviar Pergunta Persona" (por isso parar ali resolve)');

// e o caminho de quem ainda NAO tem persona continua funcionando
console.log('\n== o primeiro acesso continua indo para a personalidade ==');
const novato = { userId: 990123457, onboarding: 'placement_intro', profile: {}, placement_state: null };
const dNovato = rotear(callback('pl_start_B1'), novato);
ok(dNovato.route === 'placement' && dNovato.subroute === 'start', 'novato: pl_start_B1 vai ao atalho');
const peNovato = roda('Placement Engine', { 'Roteador Mestre': dNovato }, exam[0], exam).json;
ok(/onboarding='pick_persona'/.test(String(peNovato.sql)), 'novato: segue para a escolha de personalidade');
ok(peNovato.relevel !== true, 'novato: nao e troca de nivel');
const segue = roda('Após Gabarito', { 'Placement Engine': peNovato }, peNovato);
ok(Array.isArray(segue) && segue.length === 1, 'novato: o "Após Gabarito" deixa a cadeia seguir');

// ---------------- 4. os textos consertados da E003 ----------------
console.log('\n== os dois reparos de redacao herdados da E003 ==');
ok(/\/nivel/.test(String(cad.reply)), '(i) o convite cita o comando /nivel pelo nome');
const txtPersona = String((no('Enviar Pergunta Persona').parameters || {}).text || '');
ok(!/falta s[óo]/i.test(txtPersona), '(ii) a persona nao diz mais "falta so" (depois dela vem os interesses)');
ok(!/n[íi]vel registrado/i.test(txtPersona), '(ii) a persona nao repete o registro do nivel ("Nível anotado" ja disse)');
ok(/personalidade/i.test(txtPersona), '(ii) a persona continua pedindo a personalidade');
ok(!/\bteste\b|quest(ã|a)o|resultado|gabarito/i.test(txtPersona), '(ii) e continua sem promessa de prova');

// ---------------- 5. a outra ponta da decisao sobre o `restart` ----------------
console.log('\n== o motor adaptativo continua no no, mas fora do alcance do participante ==');
ok(/sub==='restart'/.test(code['Placement Engine']),
   'o ramo `restart` (motor adaptativo) continua no `Placement Engine` — a cobertura de B1/B2/B3/B6 entra por ele, chamado direto');
ok(!/subroute='restart'/.test(code['Roteador Mestre']),
   'e nenhum gatilho do evento roteia para `restart`');

fim();
