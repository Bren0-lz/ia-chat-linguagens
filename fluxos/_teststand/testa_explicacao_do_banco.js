// T008 — a explicacao do topico vem PRONTA do banco, com fallback para a geracao ao vivo.
//
// Roda offline: nao sobe n8n, nao abre o Postgres, nao chama modelo. O que ele faz e ler o
// fluxo, AVALIAR as expressoes dos nos novos (nao so procurar substring) e executar o jsCode
// fora do n8n, como o resto do _teststand.
//
// Os dois caminhos que ele prova:
//   COM linha  -> `Rota Explicação` manda para `Explicação do Banco`, que monta o `finalText`
//                 e sai pelo MESMO `Enviar Explicacao Prof` da geracao ao vivo. O
//                 `Agente Professor` NAO esta nesse caminho.
//   SEM linha  -> item vazio (ou erro do banco) cai na saida falsa, que vai para o
//                 `Agente Professor`. O aluno nunca fica sem explicacao — requisito duro.
//
// E a armadilha do T007, testada de proposito: o nivel da consulta tem de vir de
// `teacher_state_new.level` (o `lvl` normalizado do engine), NUNCA de `$json.level`, que vem do
// Roteador e pode estar minusculo ou invalido justamente quando o engine caiu no fallback A1.
//
// Uso:  node fluxos/_teststand/testa_explicacao_do_banco.js [caminho/do/fluxo.json]
// Reprova o v8 anterior de proposito: la os nos nao existem.
const fs = require('fs');
const path = require('path');
const FLOW = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_v8.json');
const flow = JSON.parse(fs.readFileSync(FLOW, 'utf8'));

const NO_BUSCA = 'Buscar Explicação';
const NO_ROTA = 'Rota Explicação';
const NO_BANCO = 'Explicação do Banco';
const NO_ENVIO = 'Enviar Explicacao Prof';
const NO_LLM = 'Agente Professor';

const code = {};
for (const n of flow.nodes) if (n.parameters && n.parameters.jsCode) code[n.name] = n.parameters.jsCode;
const byName = (nm) => flow.nodes.find((n) => n.name === nm);
const alvos = (nm, i) => {
  const c = flow.connections[nm];
  return ((c && c.main && c.main[i]) || []).map((x) => x.node);
};

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); }
function fim() {
  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)' : 'PASSOU: explicacao servida do banco, com fallback'));
  process.exit(fails ? 1 : 0);
}

// ---------------------------------------------------------------- avaliador de expressao n8n
// Reproduz o basico do resolvedor do n8n: `=` na frente, trechos `{{ ... }}` avaliados com
// `$json` e `$('No')` do contexto. Serve para testar o QUE a expressao devolve, e nao como ela
// esta escrita — comparar string de expressao passaria com o campo errado dentro.
function evalExpr(raw, ctx) {
  const src = String(raw).replace(/^=/, '');
  const partes = src.split(/(\{\{[\s\S]*?\}\})/g);
  const vals = [];
  let texto = '';
  for (const p of partes) {
    const m = p.match(/^\{\{([\s\S]*)\}\}$/);
    if (m) {
      const fn = new Function('$', '$json', '$now', 'return (' + m[1] + ');');
      const v = fn(ctx.$, ctx.$json, new Date());
      vals.push(v);
      texto += String(v == null ? '' : v);
    } else { texto += p; if (p) vals.push(p); }
  }
  return { texto: texto, vals: vals, partes: partes };
}
// Regra do no Postgres v2.5 para `queryReplacement`: cada resolvable e avaliado e passado por
// stringToArray (split por virgula + trim). O texto solto entre eles tambem vira valor.
function paramsDaConsulta(no, ctx) {
  const raw = String(no.parameters.options.queryReplacement).replace(/^=+/, '');
  const partes = raw.split(/(\{\{[\s\S]*?\}\})/g);
  const out = [];
  for (const p of partes) {
    const m = p.match(/^\{\{([\s\S]*)\}\}$/);
    let bruto;
    if (m) bruto = new Function('$', '$json', 'return (' + m[1] + ');')(ctx.$, ctx.$json);
    else bruto = p;
    String(bruto == null ? '' : bruto).split(',').filter((e) => e).forEach((e) => out.push(e.trim()));
  }
  return out;
}
// Avaliador do no If v2 para os operadores que este ramo usa.
function rodaIf(no, ctx) {
  const cfg = no.parameters.conditions;
  const res = cfg.conditions.map((c) => {
    const left = evalExpr(c.leftValue, ctx).vals[0];
    const op = c.operator;
    if (op.type === 'string' && op.operation === 'equals') return String(left) === String(c.rightValue);
    if (op.type === 'string' && op.operation === 'notEmpty') return String(left == null ? '' : left).length > 0;
    throw new Error('operador nao suportado no teste: ' + JSON.stringify(op));
  });
  return cfg.combinator === 'or' ? res.some(Boolean) : res.every(Boolean);
}

// ---------------------------------------------------------------- o engine, de verdade
// Mesmo padrao do testa_abre_alas_professor.js: executa o jsCode do `Professor Engine` fora do
// n8n para nao inventar o formato do estado.
const practice = [{ cefr_level: 'A1', prompt: 'Complete: I ___ happy.', answer: 'am', qtype: 'written' }];
function engine(sub, extra, ts) {
  const rm = Object.assign({
    userId: 222, name: 'Lucas', subroute: sub, teacher_state: ts,
    profile: { level: 'A1', persona: 'buddy' }, level: 'A1', text: '', callbackData: '',
    streak_count: 0, first_today: false,
  }, extra);
  const $ = () => ({ first: () => ({ json: rm }), all: () => practice.map((j) => ({ json: j })) });
  const $input = { item: { json: practice[0] }, all: () => practice.map((j) => ({ json: j })) };
  return new Function('$', '$input', '$json', code['Professor Engine'] + '\n')($, $input, practice[0]).json;
}
// contexto do ramo: `$json` e o item que chega ao no; `$('Professor Engine')` e o engine.
function ctx(eng, item) {
  return { $json: item === undefined ? eng : item, $: (nm) => ({ first: () => ({ json: nm === 'Professor Engine' ? eng : {} }) }) };
}

console.log('fluxo: ' + path.basename(FLOW));

// ---------------------------------------------------------------- 1. nos e fiacao
console.log('\n== Nos e fiacao ==');
const noBusca = byName(NO_BUSCA);
const noRota = byName(NO_ROTA);
const noBanco = byName(NO_BANCO);
ok(!!noBusca, 'no "' + NO_BUSCA + '" existe');
ok(!!noRota, 'no "' + NO_ROTA + '" existe');
ok(!!noBanco && !!code[NO_BANCO], 'no de codigo "' + NO_BANCO + '" existe');
if (!noBusca || !noRota || !noBanco || !code[NO_BANCO]) fim();

ok(noBusca.type === 'n8n-nodes-base.postgres', 'a busca e um no Postgres (veio ' + noBusca.type + ')');
ok(noBusca.credentials && noBusca.credentials.postgres && noBusca.credentials.postgres.id === '7yVoSD0b3u0DoK0D',
   'a busca usa a credencial "Banco Local" (a mesma dos outros 14 nos Postgres)');

const llm = alvos('Envio Professor', 0);
ok(llm.indexOf('Cabeçalho Tópico') === 0, 'abre-alas do T002 continua sendo o PRIMEIRO da saida "llm"');
ok(llm.indexOf(NO_BUSCA) > llm.indexOf('Cabeçalho Tópico'), 'a busca vem depois do abre-alas na ordem das conexoes');
ok(byName('Cabeçalho Tópico').position[1] < noBusca.position[1],
   'a busca esta ABAIXO do abre-alas no canvas (executionOrder v1 ordena os ramos pelo y, nao pelo connections)');
ok(alvos(NO_BUSCA, 0).join() === NO_ROTA, 'busca -> "' + NO_ROTA + '"');
ok(alvos(NO_ROTA, 0).join() === NO_BANCO, 'saida VERDADEIRA da rota -> "' + NO_BANCO + '" (caminho do banco)');
ok(alvos(NO_ROTA, 1).join() === NO_LLM, 'saida FALSA da rota -> "' + NO_LLM + '" (fallback ao vivo)');
ok(alvos(NO_BANCO, 0).join() === NO_ENVIO, 'explicacao do banco sai pelo MESMO "' + NO_ENVIO + '" da gerada');
ok(llm.indexOf(NO_LLM) < 0, 'o Envio Professor nao alimenta mais o Agente Professor direto: ele so roda depois da rota');

// nenhum no orfao entre os novos
for (const nm of [NO_BUSCA, NO_ROTA, NO_BANCO]) {
  const temEntrada = Object.keys(flow.connections).some((k) =>
    (flow.connections[k].main || []).some((saida) => (saida || []).some((l) => l.node === nm)));
  ok(temEntrada, 'no "' + nm + '" tem entrada em connections (nao ficou orfao)');
}

// ---------------------------------------------------------------- 2. o fallback duro
console.log('\n== Fallback duro: o aluno nunca fica sem explicacao ==');
ok(noBusca.alwaysOutputData === true,
   'busca com alwaysOutputData=true — sem isso, zero linhas MATA o ramo e o aluno fica em silencio');
ok(noBusca.onError === 'continueRegularOutput',
   'busca com onError=continueRegularOutput — banco fora do ar cai na geracao ao vivo, nao derruba o turno');

// ---------------------------------------------------------------- 3. a consulta
console.log('\n== A consulta ==');
const q = String(noBusca.parameters.query).replace(/\s+/g, ' ');
ok(/FROM topic_explanations/i.test(q), 'consulta a tabela topic_explanations');
ok(/cefr_level\s*=\s*\$1/i.test(q) && /topic_order\s*=\s*\$2/i.test(q), 'WHERE cefr_level = $1 AND topic_order = $2');
ok(/\bbody\b/.test(q), 'traz a coluna body');
ok(!/UPDATE|INSERT|DELETE|DROP/i.test(q), 'a consulta so le (nada de UPDATE/INSERT/DELETE)');

// ---------------------------------------------------------------- 4. A ARMADILHA: de onde vem o nivel
console.log('\n== Nivel vem de teacher_state_new.level, nao de $json.level ==');
// (a) caso normal: B1, topico 5
const eB1 = engine('intro', { profile: { level: 'B1', persona: 'buddy' }, level: 'B1' },
  { level: 'B1', idx: 4, phase: 'intro', streak: 0, answer: '', question: '', q_answered: false });
ok(eB1.teacher_state_new.level === 'B1' && eB1.topicNum === 5, 'pre-condicao: engine em B1, topico 5');
const pB1 = paramsDaConsulta(noBusca, ctx(eB1));
ok(pB1.length === 2, 'a consulta recebe exatamente 2 parametros (veio ' + JSON.stringify(pB1) + ')');
ok(pB1[0] === 'B1' && String(pB1[1]) === '5', 'B1/topico 5 -> ["B1","5"] (veio ' + JSON.stringify(pB1) + ')');

// (b) o caso que importa: o Roteador traz um nivel invalido e o engine cai no fallback A1.
//     `$json.level` continua sendo o lixo; `teacher_state_new.level` e o A1 normalizado.
const eLixo = engine('intro', { profile: {}, level: 'ingles basico' }, null);
ok(eLixo.level === 'ingles basico', 'pre-condicao: $json.level segue com o lixo do Roteador');
ok(eLixo.teacher_state_new.level === 'A1', 'pre-condicao: o engine normalizou para A1');
const pLixo = paramsDaConsulta(noBusca, ctx(eLixo));
ok(pLixo[0] === 'A1', 'nivel invalido -> consulta em A1, o mesmo topico que o engine vai explicar (veio ' + JSON.stringify(pLixo[0]) + ')');
ok(pLixo[0] !== eLixo.level, 'a consulta NAO usou $json.level — seria o "ingles basico" e falharia calada');
ok(String(pLixo[1]) === '1', 'topico 1 no fallback (veio ' + JSON.stringify(pLixo[1]) + ')');

// (c) nivel minusculo vindo do perfil: o engine sobe para maiuscula, a consulta acompanha
const eMin = engine('intro', { profile: { level: 'a2' }, level: 'a2' }, null);
ok(paramsDaConsulta(noBusca, ctx(eMin))[0] === 'A2', 'perfil "a2" -> consulta em "A2", que e como o banco grava');

// (d) avanco de topico: a consulta tem de pedir o topico NOVO
const eAv = engine('check', { text: 'am' }, { level: 'A1', idx: 0, phase: 'quiz', streak: 4, answer: 'am', question: 'Complete: I ___ ok.', q_answered: false });
ok(eAv.send_kind === 'advance' && eAv.llmTask === 'explain', 'pre-condicao: 5 acertos avancam o topico');
const pAv = paramsDaConsulta(noBusca, ctx(eAv));
ok(pAv[0] === 'A1' && String(pAv[1]) === '2', 'avanco pede o topico NOVO: ["A1","2"] (veio ' + JSON.stringify(pAv) + ')');
ok(String(pAv[1]) === String(eAv.topicNum), 'a ordem da consulta bate com o topicNum que o abre-alas anuncia');

// ---------------------------------------------------------------- 5. a rota: os dois caminhos
console.log('\n== Rota: com linha vai ao banco, sem linha cai no vivo ==');
const LINHA = { title: 'Cumprimentos', body: '<b>O QUE É</b>\nCumprimentos em ingles.' };
ok(rodaIf(noRota, ctx(eB1, LINHA)) === true, 'explicacao + linha no banco -> saida VERDADEIRA (serve do banco)');
ok(rodaIf(noRota, ctx(eB1, {})) === false, 'explicacao SEM linha (item vazio do alwaysOutputData) -> saida FALSA (gera ao vivo)');
ok(rodaIf(noRota, ctx(eB1, { title: 'x', body: '' })) === false, 'linha com body vazio -> saida FALSA (gera ao vivo)');
ok(rodaIf(noRota, ctx(eB1, { error: 'connect ECONNREFUSED ::1:5433' })) === false,
   'erro do banco -> saida FALSA (gera ao vivo, nao silencio)');

// as outras rotas do ramo "llm" nunca podem ser servidas do banco
const eQ = engine('start_quiz', {}, { level: 'A1', idx: 0, phase: 'intro', streak: 0, answer: '', question: '', q_answered: false });
ok(eQ.llmTask === 'question' && rodaIf(noRota, ctx(eQ, LINHA)) === false, 'questao: vai para o modelo mesmo com linha no banco');
const tsAberto = { level: 'A1', idx: 0, phase: 'quiz', streak: 1, answer: 'am', question: 'Complete: I ___ ok.', q_answered: false };
const eW = engine('check', { text: 'is' }, tsAberto);
ok(eW.llmTask === 'wrong' && rodaIf(noRota, ctx(eW, LINHA)) === false, 'correcao de erro: vai para o modelo mesmo com linha no banco');

// ---------------------------------------------------------------- 6. o texto servido do banco
console.log('\n== O texto que o aluno recebe, servido do banco ==');
function servido(eng, row) {
  const $ = (nm) => ({ first: () => ({ json: nm === 'Professor Engine' ? eng : {} }) });
  const $input = { first: () => ({ json: row }), all: () => [{ json: row }] };
  const out = new Function('$', '$input', '$json', code[NO_BANCO] + '\n')($, $input, row);
  return Array.isArray(out) ? out : [out];
}
const CORPO = '<b>O QUE É E QUANDO USAR</b>\nO verbo to be liga o sujeito ao que ele é.\n- <b>I am</b> (eu sou)';
const s1 = servido(eB1, { title: 'Verbo to be', body: CORPO });
ok(s1.length === 1, 'produz exatamente 1 item');
const t1 = s1[0].json.finalText;
ok(t1.indexOf(CORPO) >= 0, 'o corpo do banco vai INTEIRO no finalText');
ok(t1.indexOf('&lt;b&gt;') < 0, 'o HTML do banco NAO e escapado (as tags <b>/<i> tem de chegar renderizadas ao aluno)');
ok(t1.indexOf(eB1.feedback) === 0 && t1.indexOf('\n\n' + CORPO) > 0,
   'o feedback do engine vem antes do corpo, separado por linha em branco — igual ao Parse Professor');
ok(s1[0].json.pkind === 'explain', 'pkind=explain (o mesmo contrato do Parse Professor)');
ok(s1[0].json.explicacao_origem === 'banco', 'marca a origem como "banco" (para o T009 medir o ganho)');

// truncamento: o Telegram corta em 4096
const s2 = servido(eB1, { body: 'x'.repeat(6000) });
ok(s2[0].json.finalText.length <= 4096, 'texto gigante e truncado para caber no Telegram (veio ' + s2[0].json.finalText.length + ')');
ok(/…$/.test(s2[0].json.finalText), 'o truncamento termina com reticencias');

// nunca silencio: mesmo com corpo em branco (que a rota ja barra) sai texto
const s3 = servido(eB1, {});
ok(s3.length === 1 && String(s3[0].json.finalText).trim().length > 0, 'nem no caso impossivel o no devolve vazio');

// ---------------------------------------------------------------- 7. o envio, um so
console.log('\n== Um unico caminho de envio ==');
const env = byName(NO_ENVIO);
ok(String(env.parameters.text).indexOf("$('Parse Professor')") < 0,
   'o envio nao le mais $(\'Parse Professor\') — esse no nao existe no caminho servido do banco');
const doBanco = evalExpr(env.parameters.text, { $json: s1[0].json, $: () => ({ first: () => ({ json: {} }) }) });
ok(doBanco.texto === t1, 'com o item do banco, o envio manda exatamente o finalText do banco');
const parseRes = { pkind: 'explain', finalText: 'explicacao gerada ao vivo' };
const doVivo = evalExpr(env.parameters.text, { $json: parseRes, $: () => ({ first: () => ({ json: {} }) }) });
ok(doVivo.texto === 'explicacao gerada ao vivo', 'com o item do Parse Professor, o mesmo envio manda o texto gerado');
ok(env.parameters.additionalFields && env.parameters.additionalFields.parse_mode === 'HTML', 'o envio segue com parse_mode HTML');
const btns = ((((env.parameters.inlineKeyboard || {}).rows || [])[0] || {}).row || {}).buttons || [];
ok(btns.map((b) => b.additionalFields.callback_data).join() === 't_doubt,t_start',
   'os botoes t_doubt/t_start continuam nos dois caminhos');

fim();
