// Publica `fluxos/IAChat_Telegram_v8.json` no workflow v8 do n8n e reativa se preciso.
//
// Este e o UNICO script do repositorio autorizado a publicar, e so no v8. O alvo e
// cravado no codigo: nao aceita id por argumento nem por variavel de ambiente.
//
// Tres travas, todas dentro do script:
//   1. alvo fixo `PbwEf7L9xEXhJaCg`. Qualquer outro alvo pedido = recusa.
//   2. antes de publicar, confere NO ARQUIVO LOCAL que `Gatilho Telegram` esta
//      disabled:true e que `TEST Ingress.path === 'iachat-test-v8'`. E a trava que
//      impede o v8 de roubar o bot: as duas versoes dividem o mesmo webhookId
//      (`telegram-iachat-webhook`), e um v8 com o gatilho ligado derruba o v7.4.
//   3. depois de publicar, confere que o v8 ficou active:true E que o v7.4
//      (`9MA0o1XJjD33BnKc`, o bot que esta no ar) continua active:true — handoff §7:
//      "ativacao via API que falha desativa o workflow". Se o v7.4 nao estiver ativo
//      ao fim, o script grita e sai 1.
//
// Uso: node fluxos/_teststand/publica_v8.js
const fs = require('fs');
const path = require('path');

// --- trava 1: alvo cravado ---------------------------------------------------
const ALVO_V8 = 'PbwEf7L9xEXhJaCg';
const V74_NO_AR = '9MA0o1XJjD33BnKc';

const argsAlvo = process.argv.slice(2).filter(a => !a.startsWith('-'));
if (argsAlvo.length) {
  console.error('RECUSADO: este script nao aceita alvo por argumento. O destino e '
    + ALVO_V8 + ' (v8), cravado no codigo. Recebido: ' + JSON.stringify(argsAlvo));
  process.exit(1);
}
for (const v of ['N8N_WORKFLOW_ID', 'IACHAT_WORKFLOW_ID', 'WORKFLOW_ID']) {
  if (process.env[v] && process.env[v] !== ALVO_V8) {
    console.error('RECUSADO: ' + v + ' aponta para outro workflow (' + process.env[v]
      + '). O destino e ' + ALVO_V8 + ' (v8), cravado no codigo.');
    process.exit(1);
  }
}

const BASE = 'http://localhost:5678';
const API = BASE + '/api/v1';
const ARQUIVO = path.join(__dirname, '..', 'IAChat_Telegram_v8.json');

function fromDotEnv(name) {
  try {
    const txt = fs.readFileSync(path.join(__dirname, '..', '..', '.env'), 'utf8');
    const m = txt.match(new RegExp('^' + name + '=(.+)$', 'm'));
    return m ? m[1].trim() : '';
  } catch (e) { return ''; }
}
const KEY = process.env.N8N_API_KEY || fromDotEnv('N8N_API_KEY');
if (!KEY) {
  console.error('N8N_API_KEY ausente (variavel de ambiente ou .env da raiz).');
  process.exit(1);
}

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

  // --- trava 2: o arquivo nao pode roubar o bot ------------------------------
  const gatilho = fluxo.nodes.find(n => n.name === 'Gatilho Telegram');
  const ingress = fluxo.nodes.find(n => n.name === 'TEST Ingress');
  const problemas = [];
  if (!gatilho) problemas.push('no `Gatilho Telegram` nao encontrado no arquivo');
  else if (gatilho.disabled !== true) problemas.push('`Gatilho Telegram` NAO esta disabled:true (esta ' + JSON.stringify(gatilho.disabled) + ')');
  if (!ingress) problemas.push('no `TEST Ingress` nao encontrado no arquivo');
  else if (ingress.parameters.path !== 'iachat-test-v8') problemas.push('`TEST Ingress.path` = ' + JSON.stringify(ingress.parameters.path) + ', esperado "iachat-test-v8"');
  if (problemas.length) {
    console.error('ABORTADO SEM PUBLICAR — o arquivo local roubaria o bot do v7.4:');
    for (const p of problemas) console.error('  - ' + p);
    process.exit(1);
  }
  console.log('trava 2 ok: Gatilho Telegram disabled + TEST Ingress em iachat-test-v8');

  // --- confere que o alvo existe e e mesmo o v8 -------------------------------
  const antes = await api('GET', '/workflows/' + ALVO_V8);
  if (!antes.ok) {
    console.error('RECUSADO: nao consegui ler o workflow ' + ALVO_V8 + ' (HTTP ' + antes.status + '). ' + antes.txt.slice(0, 300));
    process.exit(1);
  }
  console.log('alvo: ' + antes.json.name + ' (' + ALVO_V8 + '), active=' + antes.json.active
    + ', ' + (antes.json.nodes || []).length + ' nos');

  // --- publica ---------------------------------------------------------------
  const put = await api('PUT', '/workflows/' + ALVO_V8, {
    name: fluxo.name,
    nodes: fluxo.nodes,
    connections: fluxo.connections,
    settings: fluxo.settings || {},
  });
  if (!put.ok) {
    console.error('FALHOU o PUT (HTTP ' + put.status + '): ' + put.txt.slice(0, 600));
    process.exit(1);
  }
  console.log('publicado: ' + (put.json && put.json.nodes ? put.json.nodes.length : '?') + ' nos gravados');

  // --- reativa se preciso ------------------------------------------------------
  let depois = await api('GET', '/workflows/' + ALVO_V8);
  if (depois.ok && depois.json.active !== true) {
    console.log('v8 ficou inativo apos o PUT — reativando');
    const act = await api('POST', '/workflows/' + ALVO_V8 + '/activate');
    if (!act.ok) console.error('AVISO: activate devolveu HTTP ' + act.status + ': ' + act.txt.slice(0, 400));
    depois = await api('GET', '/workflows/' + ALVO_V8);
  }

  // --- trava 3: os dois no ar ---------------------------------------------------
  const v8Ativo = !!(depois.ok && depois.json.active === true);
  const v74 = await api('GET', '/workflows/' + V74_NO_AR);
  const v74Ativo = !!(v74.ok && v74.json.active === true);
  console.log('v8 (' + ALVO_V8 + ') active=' + v8Ativo + ' | v7.4 (' + V74_NO_AR + ') active=' + v74Ativo);

  if (!v74Ativo) {
    console.error('');
    console.error('!!! O v7.4 NAO ESTA ATIVO — o bot esta fora do ar. Handoff §7: ativacao via');
    console.error('!!! API que falha desativa o workflow. Reative ' + V74_NO_AR + ' AGORA (interface do n8n).');
    process.exit(1);
  }
  if (!v8Ativo) {
    console.error('REPROVOU: o v8 nao ficou ativo depois de publicar (o v7.4 segue no ar).');
    process.exit(1);
  }

  console.log('PASSOU: v8 publicado e ativo; v7.4 intocado e no ar.');
  process.exit(0);
})().catch(e => {
  console.error('ERRO inesperado: ' + (e && e.message ? e.message : e));
  process.exit(1);
});
