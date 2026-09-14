// Publica `fluxos/IAChat_Telegram_evento.json` no n8n em MODO ENSAIO, para a bateria rodar.
//
// POR QUE EXISTE UM SCRIPT SEPARADO: o `publica_v8.js` tem o alvo cravado no v8 e a trava 2
// RECUSA, por desenho, arquivo com `Gatilho Telegram` habilitado — que e exatamente o que o
// arquivo do evento tem, porque no dia ele e o bot de verdade. Adaptar aquele script seria
// afrouxar a trava que protege o v7.4. Entao o evento ganha o seu, com travas proprias.
//
// MODO ENSAIO (o unico que este script faz):
//   publica o fluxo do evento ATIVO, mas com o `Gatilho Telegram` FORCADO a disabled:true
//   NA COPIA ENVIADA (o arquivo local nao e tocado). E o mesmo arranjo do v8 hoje: ativo em
//   paralelo, sem disputar o `webhookId` telegram-iachat-webhook, com o `TEST Ingress`
//   respondendo em `iachat-test-evento`. O v7.4 continua atendendo o Telegram.
//
//   Workflow INATIVO nao registra webhook no n8n: por isso "publicar inativo" nao serve para
//   testar — a bateria bateria numa porta fechada e o 404 seria confundido com defeito.
//
// O QUE ESTE SCRIPT NAO FAZ, NUNCA: publicar o fluxo com o gatilho LIGADO. Isso e o corte do
// dia do evento, derruba o v7.4 e e decisao do Breno, com o runbook da E006 na mao.
//
// Uso:  node fluxos/_teststand/publica_evento.js
const fs = require('fs');
const path = require('path');

const V74_NO_AR = '9MA0o1XJjD33BnKc';   // o bot que atende usuarios reais
const V8 = 'PbwEf7L9xEXhJaCg';          // o fluxo de trabalho, tambem ativo em paralelo
const NOME_EVENTO = 'IAChat_Telegram_evento';
const INGRESS_ESPERADO = 'iachat-test-evento';
const ARQUIVO = path.join(__dirname, '..', 'IAChat_Telegram_evento.json');

const argsAlvo = process.argv.slice(2).filter(a => !a.startsWith('-'));
if (argsAlvo.length) {
  console.error('RECUSADO: este script nao aceita alvo por argumento. Ele publica o fluxo do'
    + ' evento, achado pelo nome ' + JSON.stringify(NOME_EVENTO) + '. Recebido: ' + JSON.stringify(argsAlvo));
  process.exit(1);
}
for (const v of ['N8N_WORKFLOW_ID', 'IACHAT_WORKFLOW_ID', 'WORKFLOW_ID']) {
  if (process.env[v]) {
    console.error('RECUSADO: ' + v + ' esta setada (' + process.env[v] + '). O alvo deste script'
      + ' e o fluxo do evento, nao um id arbitrario.');
    process.exit(1);
  }
}

const BASE = 'http://localhost:5678';
const API = BASE + '/api/v1';

function fromDotEnv(name) {
  try {
    const txt = fs.readFileSync(path.join(__dirname, '..', '..', '.env'), 'utf8');
    const m = txt.match(new RegExp('^' + name + '=(.+)$', 'm'));
    return m ? m[1].trim() : '';
  } catch (e) { return ''; }
}
const KEY = process.env.N8N_API_KEY || fromDotEnv('N8N_API_KEY');
if (!KEY) { console.error('N8N_API_KEY ausente (variavel de ambiente ou .env da raiz).'); process.exit(1); }

async function api(metodo, rota, corpo) {
  const r = await fetch(API + rota, {
    method: metodo,
    headers: { 'X-N8N-API-KEY': KEY, 'content-type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const txt = await r.text();
  let j = null;
  try { j = txt ? JSON.parse(txt) : null; } catch (e) { /* deixa j=null */ }
  return { status: r.status, ok: r.ok, json: j, txt };
}

(async () => {
  const fluxo = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));

  // --- trava 1: o arquivo e mesmo o do evento --------------------------------
  const gatilho = fluxo.nodes.find(n => n.name === 'Gatilho Telegram');
  const ingress = fluxo.nodes.find(n => n.name === 'TEST Ingress');
  const problemas = [];
  if (!gatilho) problemas.push('no `Gatilho Telegram` nao encontrado');
  if (!ingress) problemas.push('no `TEST Ingress` nao encontrado');
  else if (ingress.parameters.path !== INGRESS_ESPERADO)
    problemas.push('`TEST Ingress.path` = ' + JSON.stringify(ingress.parameters.path) + ', esperado ' + JSON.stringify(INGRESS_ESPERADO));
  // Ressalva do verifier: sem isto, mudar o campo `name` do JSON renomearia o workflow do
  // evento e quebraria a busca por nome nas execucoes seguintes (risco de duplicata).
  if (fluxo.name !== NOME_EVENTO)
    problemas.push('`name` do arquivo = ' + JSON.stringify(fluxo.name) + ', esperado ' + JSON.stringify(NOME_EVENTO));
  if (problemas.length) {
    console.error('ABORTADO SEM PUBLICAR:');
    for (const p of problemas) console.error('  - ' + p);
    process.exit(1);
  }

  // --- trava 2: o gatilho vai DESLIGADO na copia enviada ----------------------
  // O arquivo local mantem o gatilho habilitado (e o que vai ao ar no dia). Aqui ele e
  // desligado SO na copia que sobe, para nao disputar o webhookId com o v7.4.
  const enviados = JSON.parse(JSON.stringify(fluxo.nodes));
  const gEnviado = enviados.find(n => n.name === 'Gatilho Telegram');
  gEnviado.disabled = true;
  console.log('trava 2 ok: o `Gatilho Telegram` sobe DESABILITADO (modo ensaio) — o v7.4 nao e tocado');

  // --- acha ou cria o workflow do evento -------------------------------------
  const lista = await api('GET', '/workflows?limit=100');
  if (!lista.ok) { console.error('RECUSADO: nao consegui listar workflows (HTTP ' + lista.status + ')'); process.exit(1); }
  const achados = (lista.json.data || []).filter(w => w.name === NOME_EVENTO);
  if (achados.length > 1) {
    console.error('RECUSADO: ha ' + achados.length + ' workflows chamados ' + NOME_EVENTO
      + ' (' + achados.map(w => w.id).join(', ') + '). Resolva na interface antes.');
    process.exit(1);
  }
  if ([V74_NO_AR, V8].indexOf(achados[0] && achados[0].id) >= 0) {
    console.error('RECUSADO: o workflow achado tem o id do v7.4 ou do v8. Abortando por seguranca.');
    process.exit(1);
  }

  const corpo = { name: fluxo.name, nodes: enviados, connections: fluxo.connections, settings: fluxo.settings || {} };
  let alvo;
  if (!achados.length) {
    const post = await api('POST', '/workflows', corpo);
    if (!post.ok) { console.error('FALHOU o POST (HTTP ' + post.status + '): ' + post.txt.slice(0, 600)); process.exit(1); }
    alvo = post.json.id;
    console.log('criado: workflow ' + alvo + ' (' + (post.json.nodes || []).length + ' nos)');
  } else {
    alvo = achados[0].id;
    const put = await api('PUT', '/workflows/' + alvo, corpo);
    if (!put.ok) { console.error('FALHOU o PUT (HTTP ' + put.status + '): ' + put.txt.slice(0, 600)); process.exit(1); }
    console.log('atualizado: workflow ' + alvo + ' (' + (put.json && put.json.nodes ? put.json.nodes.length : '?') + ' nos)');
  }

  // --- ativa (sem o gatilho, so o ingress) -----------------------------------
  let depois = await api('GET', '/workflows/' + alvo);
  if (depois.ok && depois.json.active !== true) {
    const act = await api('POST', '/workflows/' + alvo + '/activate');
    if (!act.ok) console.error('AVISO: activate devolveu HTTP ' + act.status + ': ' + act.txt.slice(0, 400));
    depois = await api('GET', '/workflows/' + alvo);
  }

  // --- trava 3: o que subiu e o que se esperava, e o bot continua no ar -------
  const gPub = (depois.json.nodes || []).find(n => n.name === 'Gatilho Telegram');
  const gatilhoDesligado = !!(gPub && gPub.disabled === true);
  const eventoAtivo = !!(depois.ok && depois.json.active === true);
  const v74 = await api('GET', '/workflows/' + V74_NO_AR);
  const v74Ativo = !!(v74.ok && v74.json.active === true);
  console.log('evento (' + alvo + ') active=' + eventoAtivo + ' gatilho_desabilitado=' + gatilhoDesligado
    + ' | v7.4 (' + V74_NO_AR + ') active=' + v74Ativo);

  if (!v74Ativo) {
    console.error('');
    console.error('!!! O v7.4 NAO ESTA ATIVO — o bot esta fora do ar. Handoff §7: ativacao via API');
    console.error('!!! que falha desativa o workflow. Reative ' + V74_NO_AR + ' AGORA (interface do n8n).');
    process.exit(1);
  }
  if (!gatilhoDesligado) {
    console.error('REPROVOU: o gatilho subiu HABILITADO — desative o workflow ' + alvo + ' AGORA.');
    process.exit(1);
  }
  if (!eventoAtivo) { console.error('REPROVOU: o fluxo do evento nao ficou ativo (o v7.4 segue no ar).'); process.exit(1); }

  console.log('PASSOU: evento publicado e ativo em MODO ENSAIO; v7.4 intocado e no ar.');
  console.log('ingress: ' + BASE + '/webhook/' + INGRESS_ESPERADO);
  process.exit(0);
})().catch(e => { console.error('ERRO inesperado: ' + (e && e.message ? e.message : e)); process.exit(1); });
